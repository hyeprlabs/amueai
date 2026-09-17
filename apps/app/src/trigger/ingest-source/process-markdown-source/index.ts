import { task } from "@trigger.dev/sdk";

import { embedChunkBatch } from "../embed-chunk-batch";
import { chunkArray, chunkText } from "../shared/chunk";
import { db, markFailed, updateSource, type SourceRef } from "../shared/source";
import { files, markdownKey } from "../shared/storage";

const EMBED_BATCH_SIZE = 100;

export const processMarkdownSource = task({
  id: "process-markdown-source",
  run: async (ref: SourceRef) => {
    const file = await files.download(markdownKey(ref));
    const chunks = chunkText(await file.text());
    if (chunks.length === 0) throw new Error(`Nothing to embed for source ${ref.sourceId}`);

    const batches = await embedChunkBatch.batchTriggerAndWait(
      chunkArray(chunks, EMBED_BATCH_SIZE).map((values) => ({ payload: { values } })),
    );
    const embeddings = batches.runs.flatMap((run) => {
      if (!run.ok) throw new Error(`Embedding failed for source ${ref.sourceId}`);
      return run.output.embeddings;
    });

    const { data: stale } = await db().from("chunks").select("id").eq("source_id", ref.sourceId);
    const { error } = await db()
      .from("chunks")
      .insert(
        chunks.map((content, i) => ({
          org_id: ref.orgId,
          source_id: ref.sourceId,
          content,
          embedding: JSON.stringify(embeddings[i]),
        })),
      );
    if (error) throw new Error(`Failed to store chunks: ${error.message}`);

    if (stale?.length) {
      await db()
        .from("chunks")
        .delete()
        .in(
          "id",
          stale.map((chunk) => chunk.id),
        );
    }

    await updateSource(ref.sourceId, { status: "ready", error_message: null });
  },
  onFailure: ({ payload, error }) => markFailed(payload.sourceId, error),
});
