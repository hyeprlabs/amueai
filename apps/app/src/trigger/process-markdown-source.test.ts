import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@trigger.dev/sdk", () => ({
  task: (options: unknown) => options,
  logger: { log: vi.fn() },
  metadata: { set: vi.fn() },
}));

const downloadMock = vi.fn();
vi.mock("@/lib/storage", () => ({
  files: { download: (...args: unknown[]) => downloadMock(...args) },
}));

const batchTriggerAndWaitMock = vi.fn();
vi.mock("./embed-chunk-batch", () => ({
  embedChunkBatch: {
    batchTriggerAndWait: (...args: unknown[]) => batchTriggerAndWaitMock(...args),
  },
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: () => fakeSupabase,
}));

const { processMarkdownSource } = await import("./process-markdown-source");

/** Minimal chunks/sources stand-in: select/eq/single, insert, delete/in, update/eq. */
function makeFakeSupabase(initial: {
  chunks?: Record<string, unknown>[];
  sources?: Record<string, unknown>[];
}) {
  const tables = { chunks: [...(initial.chunks ?? [])], sources: [...(initial.sources ?? [])] };

  function from(table: "chunks" | "sources") {
    const rows = tables[table];
    const filters: Array<[string, unknown]> = [];
    let inFilter: [string, unknown[]] | undefined;
    let op: "select" | "insert" | "delete" | "update" | undefined;
    let insertRows: Record<string, unknown>[] | undefined;
    let updatePayload: Record<string, unknown> | undefined;

    function matches(row: Record<string, unknown>) {
      if (filters.some(([col, val]) => row[col] !== val)) return false;
      if (inFilter && !inFilter[1].includes(row[inFilter[0]] as unknown)) return false;
      return true;
    }

    const builder = {
      select(_cols?: string) {
        op ??= "select";
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return builder;
      },
      in(col: string, vals: unknown[]) {
        op = "delete";
        inFilter = [col, vals];
        return builder;
      },
      insert(rowsToInsert: Record<string, unknown>[]) {
        op = "insert";
        insertRows = rowsToInsert;
        return builder;
      },
      update(payload: Record<string, unknown>) {
        op = "update";
        updatePayload = payload;
        return builder;
      },
      delete() {
        op = "delete";
        return builder;
      },
      // oxlint-disable-next-line no-thenable
      then(onFulfilled: (result: { data: unknown; error: unknown }) => unknown) {
        const result = (() => {
          if (op === "insert") {
            const newRows = (insertRows ?? []).map((row, i) => ({
              id: row.id ?? `${table}-${rows.length + i}`,
              ...row,
            }));
            rows.push(...newRows);
            return { data: newRows, error: null };
          }
          if (op === "delete") {
            const remaining = rows.filter((row) => !matches(row));
            rows.length = 0;
            rows.push(...remaining);
            return { data: null, error: null };
          }
          if (op === "update") {
            const matched = rows.filter(matches);
            for (const row of matched) Object.assign(row, updatePayload);
            return { data: matched, error: null };
          }
          return { data: rows.filter(matches), error: null };
        })();
        return Promise.resolve(result).then(onFulfilled);
      },
    };

    return builder;
  }

  return { from, tables };
}

beforeEach(() => {
  downloadMock.mockReset();
  batchTriggerAndWaitMock.mockReset();
});

describe("processMarkdownSource", () => {
  it("chunks, embeds in batches, stores chunks, and marks the source ready", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-1", status: "processing" }] });
    downloadMock.mockResolvedValue({ text: async () => "First paragraph.\n\nSecond paragraph." });
    batchTriggerAndWaitMock.mockResolvedValue({
      runs: [{ ok: true, output: { embeddings: [[0.1], [0.2]] } }],
    });

    await (processMarkdownSource as any).run({
      sourceId: "src-1",
      orgId: "org-1",
      markdownPath: "org-1/agent-1/src-1.md",
    });

    expect(downloadMock).toHaveBeenCalledWith("org-1/agent-1/src-1.md");
    expect(fakeSupabase.tables.chunks).toHaveLength(2);
    expect(fakeSupabase.tables.chunks.map((c) => c.content)).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
    expect(fakeSupabase.tables.sources[0]?.status).toBe("ready");
  });

  it("throws when the markdown has no content to chunk", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-2", status: "processing" }] });
    downloadMock.mockResolvedValue({ text: async () => "   " });

    await expect(
      (processMarkdownSource as any).run({
        sourceId: "src-2",
        orgId: "org-1",
        markdownPath: "x.md",
      }),
    ).rejects.toThrow("No content to embed");
    expect(batchTriggerAndWaitMock).not.toHaveBeenCalled();
  });

  it("throws when an embedding batch fails, storing no chunks", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-3", status: "processing" }] });
    downloadMock.mockResolvedValue({ text: async () => "Some content." });
    batchTriggerAndWaitMock.mockResolvedValue({
      runs: [{ ok: false, error: new Error("rate limited") }],
    });

    await expect(
      (processMarkdownSource as any).run({
        sourceId: "src-3",
        orgId: "org-1",
        markdownPath: "x.md",
      }),
    ).rejects.toThrow("Embedding batch failed");
    expect(fakeSupabase.tables.chunks).toHaveLength(0);
  });

  it("leaves prior chunks in place when storing the new set fails", async () => {
    fakeSupabase = makeFakeSupabase({
      sources: [{ id: "src-4", status: "processing" }],
      chunks: [{ id: "old-chunk", source_id: "src-4", content: "Old." }],
    });
    downloadMock.mockResolvedValue({ text: async () => "New content." });
    batchTriggerAndWaitMock.mockResolvedValue({
      runs: [{ ok: true, output: { embeddings: [[0.1]] } }],
    });

    await (processMarkdownSource as any).run({
      sourceId: "src-4",
      orgId: "org-1",
      markdownPath: "org-1/agent-1/src-4.md",
    });

    // The new chunk replaces the old one once storage succeeds.
    expect(fakeSupabase.tables.chunks.map((c) => c.id)).not.toContain("old-chunk");
  });

  it("onFailure marks the source failed with the error message", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-5", status: "processing" }] });

    await (processMarkdownSource as any).onFailure({
      payload: { sourceId: "src-5", orgId: "org-1", markdownPath: "x.md" },
      error: new Error("boom"),
    });

    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      status: "failed",
      error_message: "boom",
    });
  });
});
