import { beforeEach, describe, expect, it, vi } from "vitest";

const embedManyMock = vi.fn();
vi.mock("ai", () => ({ embedMany: (...args: unknown[]) => embedManyMock(...args) }));
vi.mock("@trigger.dev/sdk", () => ({
  task: (options: unknown) => options,
}));

const { embedChunkBatch } = await import("./embed-chunk-batch");

beforeEach(() => {
  embedManyMock.mockReset();
});

describe("embedChunkBatch", () => {
  it("embeds every value in the batch through the AI Gateway model", async () => {
    embedManyMock.mockResolvedValue({
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
    });

    const result = await (embedChunkBatch as any).run({ values: ["a", "b"] });

    expect(embedManyMock).toHaveBeenCalledWith({
      model: "openai/text-embedding-3-small",
      values: ["a", "b"],
    });
    expect(result).toEqual({
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
    });
  });
});
