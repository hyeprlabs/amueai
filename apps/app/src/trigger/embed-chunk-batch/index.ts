import { embedMany } from "ai";
import { task } from "@trigger.dev/sdk";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export const embedChunkBatch = task({
  id: "embed-chunk-batch",
  queue: { name: "embeddings", concurrencyLimit: 10 },
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000 },
  run: async (payload: { values: string[] }) => {
    const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: payload.values });
    return { embeddings };
  },
});
