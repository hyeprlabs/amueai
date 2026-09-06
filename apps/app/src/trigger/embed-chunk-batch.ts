import { embedMany } from "ai";
import { task } from "@trigger.dev/sdk";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

/**
 * One embedMany() call per batch, fanned out via processMarkdownSource's
 * batchTriggerAndWait. Its own queue with a concurrency cap protects the AI
 * Gateway's rate limit across every org's ingestion running at once - a
 * large full-site crawl fans out dozens of these without starving other
 * orgs' embedding calls.
 */
export const embedChunkBatch = task({
  id: "embed-chunk-batch",
  queue: { name: "embeddings", concurrencyLimit: 10 },
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000 },
  run: async (payload: { values: string[] }) => {
    const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: payload.values });
    return { embeddings };
  },
});
