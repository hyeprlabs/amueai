import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";

import { getFirecrawlClient } from "@/lib/firecrawl";
import { files } from "@/lib/storage";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { processMarkdownSource } from "./process-markdown-source";

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

/**
 * Normalizes a text/qa/file source to a single canonical markdown document,
 * then hands off to processMarkdownSource - the one and only chunk/embed/
 * store path, shared with crawl-website's per-page runs. Runs outside any
 * Clerk session, so it uses the service-role client throughout - the
 * source/chunk rows are already stamped with org_id explicitly, not
 * defaulted from a JWT that doesn't exist in this context.
 */
export const ingestSource = task({
  id: "ingest-source",
  queue: { name: "ingestion", concurrencyLimit: 5 },
  retry: { maxAttempts: 4, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 20000 },
  run: async (payload: IngestSourcePayload) => {
    const supabase = createServiceRoleSupabaseClient();

    // Claims the source for this run: only flips to "processing" if it
    // isn't already there. Without this, two overlapping runs (a
    // double-clicked Retrain, a retried trigger) would each snapshot the
    // same "previous chunks" in processMarkdownSource and only delete that
    // snapshot, leaving both runs' new chunk sets coexisting. The loser
    // exits quietly rather than throwing - onFailure would otherwise mark
    // this source "failed" even though the winning run is still legitimately
    // in flight and will set the real final status itself.
    const { data: claimed } = await supabase
      .from("sources")
      .update({ status: "processing" })
      .eq("id", payload.sourceId)
      .neq("status", "processing")
      .select("id");
    if (!claimed || claimed.length === 0) {
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
  onFailure: async ({ payload, error }) => {
    const supabase = createServiceRoleSupabaseClient();
    const message = error instanceof Error ? error.message : "Unknown ingestion error";
    await supabase
      .from("sources")
      .update({ status: "failed", error_message: message })
      .eq("id", payload.sourceId);
  },
});
