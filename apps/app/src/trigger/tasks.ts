import { embedMany } from "ai";
import { AbortTaskRunError, logger, metadata, task } from "@trigger.dev/sdk";
import { Files } from "files-sdk";
import { supabase as supabaseStorageAdapter } from "files-sdk/supabase";

import { getFirecrawlClient } from "@/lib/firecrawl";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const files = new Files({
  adapter: supabaseStorageAdapter({
    bucket: "sources",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SECRET_KEY!,
  }),
});

const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 400;
const EMBED_BATCH_SIZE = 100;
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= CHUNK_SIZE) {
      chunks.push(paragraph);
      continue;
    }
    let start = 0;
    while (start < paragraph.length) {
      const end = Math.min(start + CHUNK_SIZE, paragraph.length);
      chunks.push(paragraph.slice(start, end));
      if (end === paragraph.length) break;
      start = end - CHUNK_OVERLAP;
    }
  }
  return chunks;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

async function claim(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  sourceId: string,
  status: "processing" | "crawling",
) {
  const { data } = await supabase
    .from("sources")
    .update({ status })
    .eq("id", sourceId)
    .neq("status", status)
    .select("id");
  return (data?.length ?? 0) > 0;
}

async function markFailed(sourceId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  await createServiceRoleSupabaseClient()
    .from("sources")
    .update({ status: "failed", error_message: message })
    .eq("id", sourceId);
}

type IngestSourcePayload =
  | {
      sourceId: string;
      orgId: string;
      agentId: string;
      type: "text" | "qa";
      rawContent: string;
      label: string;
    }
  | {
      sourceId: string;
      orgId: string;
      agentId: string;
      type: "file";
      storagePath: string;
      label: string;
    };

export const ingestSource = task({
  id: "ingest-source",
  queue: { name: "ingestion", concurrencyLimit: 5 },
  retry: { maxAttempts: 4, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 20000 },
  run: async (payload: IngestSourcePayload) => {
    const supabase = createServiceRoleSupabaseClient();
    if (!(await claim(supabase, payload.sourceId, "processing"))) {
      logger.log("Source already being processed, skipping", { sourceId: payload.sourceId });
      return;
    }

    let markdown: string;
    if (payload.type === "text") {
      markdown = `# ${payload.label}\n\n${payload.rawContent}`;
    } else if (payload.type === "qa") {
      const pairs = JSON.parse(payload.rawContent) as { q: string; a: string }[];
      markdown = pairs.map((pair) => `## ${pair.q}\n\n${pair.a}`).join("\n\n");
    } else if (payload.type === "file") {
      const stored = await files.download(payload.storagePath);
      const blob = await stored.blob();
      const document = await getFirecrawlClient().parse(
        { data: blob, filename: stored.name, contentType: stored.type || undefined },
        { formats: ["markdown"] },
      );
      if (!document.markdown) {
        throw new Error(`Firecrawl returned no content for ${payload.storagePath}`);
      }
      markdown = document.markdown;
    } else {
      throw new AbortTaskRunError(
        `Unsupported type for ingest-source: ${(payload as { type: string }).type}`,
      );
    }

    const markdownPath = `${payload.orgId}/${payload.agentId}/${payload.sourceId}.md`;
    await files.upload(markdownPath, markdown);
    await supabase
      .from("sources")
      .update({ markdown_path: markdownPath, raw_content: null })
      .eq("id", payload.sourceId);

    await processMarkdownSource
      .triggerAndWait(
        { sourceId: payload.sourceId, orgId: payload.orgId, markdownPath },
        { tags: [`source:${payload.sourceId}`] },
      )
      .unwrap();
  },
  onFailure: async ({ payload, error }) => markFailed(payload.sourceId, error),
});

export const crawlWebsite = task({
  id: "crawl-website",
  queue: { name: "crawling", concurrencyLimit: 3 },
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 2000, maxTimeoutInMs: 60000 },
  run: async (payload: { sourceId: string; orgId: string; agentId: string; url: string }) => {
    const supabase = createServiceRoleSupabaseClient();
    if (!(await claim(supabase, payload.sourceId, "crawling"))) {
      logger.log("Source already crawling, skipping", { sourceId: payload.sourceId });
      return;
    }

    const result = await getFirecrawlClient().crawl(payload.url, {
      limit: 200,
      maxDiscoveryDepth: 5,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    });
    if (result.status === "failed") throw new Error(`Firecrawl crawl failed for ${payload.url}`);

    const pages = result.data.filter(
      (page): page is typeof page & { markdown: string; metadata: { sourceURL: string } } =>
        !!page.markdown && !!page.metadata?.sourceURL,
    );

    const { data: upserted, error: upsertError } = await supabase
      .from("sources")
      .upsert(
        pages.map((page) => ({
          org_id: payload.orgId,
          agent_id: payload.agentId,
          parent_source_id: payload.sourceId,
          type: "url" as const,
          label: page.metadata.title ?? page.metadata.sourceURL,
          url: page.metadata.sourceURL,
          status: "processing" as const,
        })),
        { onConflict: "agent_id,url" },
      )
      .select("id, url");
    if (upsertError || !upserted) {
      throw new Error(`Failed to store discovered pages: ${upsertError?.message}`);
    }

    await Promise.all(
      pages.map(async (page) => {
        const child = upserted.find((row) => row.url === page.metadata.sourceURL);
        if (!child) return;
        const markdownPath = `${payload.orgId}/${payload.agentId}/${child.id}.md`;
        await files.upload(markdownPath, page.markdown);
        await supabase.from("sources").update({ markdown_path: markdownPath }).eq("id", child.id);
      }),
    );

    await processMarkdownSource.batchTriggerAndWait(
      upserted.map((child) => ({
        payload: {
          sourceId: child.id,
          orgId: payload.orgId,
          markdownPath: `${payload.orgId}/${payload.agentId}/${child.id}.md`,
        },
        options: { tags: [`source:${payload.sourceId}`] },
      })),
    );

    await supabase
      .from("sources")
      .update({ status: "ready", last_crawled_at: new Date().toISOString() })
      .eq("id", payload.sourceId);
  },
  onFailure: async ({ payload, error }) => markFailed(payload.sourceId, error),
});

export const processMarkdownSource = task({
  id: "process-markdown-source",
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000 },
  run: async (payload: { sourceId: string; orgId: string; markdownPath: string }) => {
    metadata.set("stage", "chunking");
    const markdownFile = await files.download(payload.markdownPath);
    const markdown = await markdownFile.text();
    const chunks = chunkText(markdown);
    if (chunks.length === 0) {
      throw new Error(`No content to embed for source ${payload.sourceId} after chunking`);
    }
    metadata.set("chunkCount", chunks.length);

    metadata.set("stage", "embedding");
    const batches = chunkArray(chunks, EMBED_BATCH_SIZE);
    const embedResults = await embedChunkBatch.batchTriggerAndWait(
      batches.map((values) => ({ payload: { values } })),
    );
    const embeddings: number[][] = [];
    for (const run of embedResults.runs) {
      if (!run.ok) throw new Error(`Embedding batch failed for source ${payload.sourceId}`);
      embeddings.push(...run.output.embeddings);
    }

    metadata.set("stage", "storing");
    const supabase = createServiceRoleSupabaseClient();
    const { data: previousChunks } = await supabase
      .from("chunks")
      .select("id")
      .eq("source_id", payload.sourceId);
    const { error: insertError } = await supabase.from("chunks").insert(
      chunks.map((content, i) => ({
        org_id: payload.orgId,
        source_id: payload.sourceId,
        content,
        embedding: JSON.stringify(embeddings[i]),
      })),
    );
    if (insertError) throw new Error(`Failed to store chunks: ${insertError.message}`);

    const previousChunkIds = previousChunks?.map((chunk) => chunk.id) ?? [];
    if (previousChunkIds.length > 0) {
      await supabase.from("chunks").delete().in("id", previousChunkIds);
    }

    await supabase
      .from("sources")
      .update({ status: "ready", error_message: null })
      .eq("id", payload.sourceId);
  },
  onFailure: async ({ payload, error }) => markFailed(payload.sourceId, error),
});

export const embedChunkBatch = task({
  id: "embed-chunk-batch",
  queue: { name: "embeddings", concurrencyLimit: 10 },
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000 },
  run: async (payload: { values: string[] }) => {
    const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: payload.values });
    return { embeddings };
  },
});

export const __private__ = { chunkText, chunkArray };
