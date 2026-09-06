import { logger, metadata, task } from "@trigger.dev/sdk";

import { chunkArray, chunkText } from "@/lib/chunk";
import { files } from "@/lib/storage";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { embedChunkBatch } from "./embed-chunk-batch";

const EMBED_BATCH_SIZE = 100;

/**
 * The one and only chunk -> embed -> store path, shared by every source
 * type (text, qa, file, url) and every page a full-site crawl discovers.
 * Everything upstream of this - ingest-source, crawl-website - only has to
 * produce a markdown document at a storage key and hand it here. Never
 * leaves a source `ready` on partial success, and never touches its prior
 * chunks until the new set is fully stored (a failed retrain or recrawl
 * doesn't blank out a working source).
 */
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
    logger.log("Chunked markdown", { sourceId: payload.sourceId, chunkCount: chunks.length });

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

    // Capture the chunks this source had *before* this run so a failed
    // retrain/recrawl leaves them in place - they're only deleted once the
    // new set has been inserted successfully.
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
  onFailure: async ({ payload, error }) => {
    const supabase = createServiceRoleSupabaseClient();
    const message = error instanceof Error ? error.message : "Unknown processing error";
    await supabase
      .from("sources")
      .update({ status: "failed", error_message: message })
      .eq("id", payload.sourceId);
  },
});
