import { beforeEach, describe, expect, it, vi } from "vitest";

class AbortTaskRunErrorMock extends Error {}
const triggerAndWaitMock = vi.fn();
const batchTriggerAndWaitMock = vi.fn();
vi.mock("@trigger.dev/sdk", () => ({
  task: (options: { id: string }) => ({
    ...options,
    triggerAndWait: (...args: unknown[]) => triggerAndWaitMock(options.id, ...args),
    batchTriggerAndWait: (...args: unknown[]) => batchTriggerAndWaitMock(options.id, ...args),
  }),
  logger: { log: vi.fn() },
  metadata: { set: vi.fn() },
  AbortTaskRunError: AbortTaskRunErrorMock,
}));

const embedManyMock = vi.fn();
vi.mock("ai", () => ({ embedMany: (...args: unknown[]) => embedManyMock(...args) }));

const downloadMock = vi.fn();
const uploadMock = vi.fn();
vi.mock("files-sdk", () => ({
  Files: class {
    download = (...args: unknown[]) => downloadMock(...args);
    upload = (...args: unknown[]) => uploadMock(...args);
  },
}));
vi.mock("files-sdk/supabase", () => ({ supabase: () => ({}) }));

const parseMock = vi.fn();
const crawlMock = vi.fn();
vi.mock("@/lib/firecrawl", () => ({
  getFirecrawlClient: () => ({ parse: parseMock, crawl: crawlMock }),
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: () => fakeSupabase,
}));

const {
  ingestSource,
  crawlWebsite,
  processMarkdownSource,
  embedChunkBatch,
  __private__: { chunkText, chunkArray },
} = await import("./tasks");

function makeFakeSupabase(initial: {
  sources?: Record<string, unknown>[];
  chunks?: Record<string, unknown>[];
}) {
  const tables = { sources: [...(initial.sources ?? [])], chunks: [...(initial.chunks ?? [])] };
  let nextId = 1;

  function from(table: "sources" | "chunks") {
    const rows = tables[table];
    const filters: Array<[string, unknown]> = [];
    const negFilters: Array<[string, unknown]> = [];
    let inFilter: [string, unknown[]] | undefined;
    let op: "select" | "update" | "insert" | "delete" | "upsert" | undefined;
    let updatePayload: Record<string, unknown> | undefined;
    let insertRows: Record<string, unknown>[] | undefined;
    let upsertRows: Record<string, unknown>[] | undefined;

    function matches(row: Record<string, unknown>) {
      if (filters.some(([col, val]) => row[col] !== val)) return false;
      if (negFilters.some(([col, val]) => row[col] === val)) return false;
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
      neq(col: string, val: unknown) {
        negFilters.push([col, val]);
        return builder;
      },
      in(col: string, vals: unknown[]) {
        op = "delete";
        inFilter = [col, vals];
        return builder;
      },
      update(payload: Record<string, unknown>) {
        op = "update";
        updatePayload = payload;
        return builder;
      },
      insert(rowsToInsert: Record<string, unknown>[]) {
        op = "insert";
        insertRows = rowsToInsert;
        return builder;
      },
      upsert(rows: Record<string, unknown>[], _opts?: { onConflict: string }) {
        op = "upsert";
        upsertRows = rows;
        return builder;
      },
      delete() {
        op = "delete";
        return builder;
      },
      // oxlint-disable-next-line no-thenable
      then(onFulfilled: (result: { data: unknown; error: unknown }) => unknown) {
        const result = (() => {
          if (op === "upsert") {
            const newRows = (upsertRows ?? []).map((row) => {
              const existing = rows.find((r) => r.url === row.url);
              if (existing) {
                Object.assign(existing, row);
                return existing;
              }
              const created = { id: `child-${nextId++}`, ...row };
              rows.push(created);
              return created;
            });
            return { data: newRows, error: null };
          }
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
  uploadMock.mockReset();
  parseMock.mockReset();
  crawlMock.mockReset();
  embedManyMock.mockReset();
  triggerAndWaitMock.mockReset();
  batchTriggerAndWaitMock.mockReset();
  triggerAndWaitMock.mockReturnValue({ unwrap: () => Promise.resolve() });
  batchTriggerAndWaitMock.mockResolvedValue({ runs: [] });
});

describe("chunkText", () => {
  it("returns one chunk per short paragraph", () => {
    expect(chunkText("First paragraph.\n\nSecond paragraph.")).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });

  it("drops blank paragraphs", () => {
    expect(chunkText("First.\n\n\n\nSecond.")).toEqual(["First.", "Second."]);
  });

  it("returns nothing for empty or whitespace-only input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("hard-wraps a paragraph longer than the chunk size with overlap", () => {
    const paragraph = "a".repeat(9000);
    const chunks = chunkText(paragraph);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 4000)).toBe(true);
    const combinedLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    expect(combinedLength).toBeGreaterThan(paragraph.length);
  });

  it("never produces an empty chunk for a non-empty source", () => {
    expect(chunkText("word ".repeat(2000)).every((chunk) => chunk.length > 0)).toBe(true);
  });
});

describe("chunkArray", () => {
  it("splits into groups of at most `size` items, preserving order", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns one batch when the array is smaller than the batch size", () => {
    expect(chunkArray(["a", "b"], 100)).toEqual([["a", "b"]]);
  });

  it("returns an empty array for an empty input", () => {
    expect(chunkArray([], 10)).toEqual([]);
  });
});

describe("ingestSource", () => {
  it("wraps text content in a heading, uploads it, and hands off to processMarkdownSource", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-1", status: "queued" }] });

    await (ingestSource as any).run({
      sourceId: "src-1",
      orgId: "org-1",
      agentId: "agent-1",
      type: "text",
      rawContent: "Hello world.",
      label: "My notes",
    });

    expect(fakeSupabase.tables.sources[0]?.status).toBe("processing");
    expect(uploadMock).toHaveBeenCalledWith("org-1/agent-1/src-1.md", "# My notes\n\nHello world.");
    expect(triggerAndWaitMock).toHaveBeenCalledWith(
      "process-markdown-source",
      { sourceId: "src-1", orgId: "org-1", markdownPath: "org-1/agent-1/src-1.md" },
      { tags: ["source:src-1"] },
    );
  });

  it("joins qa pairs into markdown headings", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-2", status: "queued" }] });

    await (ingestSource as any).run({
      sourceId: "src-2",
      orgId: "org-1",
      agentId: "agent-1",
      type: "qa",
      rawContent: JSON.stringify([{ q: "Refunds?", a: "Within 30 days." }]),
      label: "FAQ",
    });

    expect(uploadMock).toHaveBeenCalledWith(
      "org-1/agent-1/src-2.md",
      "## Refunds?\n\nWithin 30 days.",
    );
  });

  it("parses an uploaded file via Firecrawl and uploads the resulting markdown", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-3", status: "queued" }] });
    const fakeBlob = { type: "application/pdf" };
    downloadMock.mockResolvedValue({
      name: "handbook.pdf",
      type: "application/pdf",
      blob: async () => fakeBlob,
    });
    parseMock.mockResolvedValue({ markdown: "Handbook contents." });

    await (ingestSource as any).run({
      sourceId: "src-3",
      orgId: "org-1",
      agentId: "agent-1",
      type: "file",
      storagePath: "org-1/agent-1/src-3/original.pdf",
      label: "Handbook",
    });

    expect(downloadMock).toHaveBeenCalledWith("org-1/agent-1/src-3/original.pdf");
    expect(parseMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: fakeBlob, filename: "handbook.pdf" }),
      expect.objectContaining({ formats: ["markdown"] }),
    );
    expect(uploadMock).toHaveBeenCalledWith("org-1/agent-1/src-3.md", "Handbook contents.");
  });

  it("skips quietly, without touching status, when the source is already being processed", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-4", status: "processing" }] });

    await (ingestSource as any).run({
      sourceId: "src-4",
      orgId: "org-1",
      agentId: "agent-1",
      type: "text",
      rawContent: "x",
      label: "x",
    });

    expect(uploadMock).not.toHaveBeenCalled();
    expect(triggerAndWaitMock).not.toHaveBeenCalled();
    expect(fakeSupabase.tables.sources[0]?.status).toBe("processing");
  });

  it("onFailure marks the source failed with the error message", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-5", status: "processing" }] });

    await (ingestSource as any).onFailure({
      payload: { sourceId: "src-5" },
      error: new Error("Firecrawl returned no content"),
    });

    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      status: "failed",
      error_message: "Firecrawl returned no content",
    });
  });
});

describe("crawlWebsite", () => {
  it("upserts one child source per discovered page, uploads markdown, and marks the root ready", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "root-1", status: "queued" }] });
    crawlMock.mockResolvedValue({
      status: "completed",
      data: [
        { markdown: "Home content.", metadata: { title: "Home", sourceURL: "https://ex.com/" } },
        {
          markdown: "About content.",
          metadata: { title: "About", sourceURL: "https://ex.com/about" },
        },
      ],
    });

    await (crawlWebsite as any).run({
      sourceId: "root-1",
      orgId: "org-1",
      agentId: "agent-1",
      url: "https://ex.com",
    });

    expect(fakeSupabase.tables.sources).toHaveLength(3);
    expect(uploadMock).toHaveBeenCalledTimes(2);
    expect(batchTriggerAndWaitMock).toHaveBeenCalledWith(
      "process-markdown-source",
      expect.arrayContaining([expect.objectContaining({ options: { tags: ["source:root-1"] } })]),
    );
    const root = fakeSupabase.tables.sources.find((s) => s.id === "root-1");
    expect(root?.status).toBe("ready");
    expect(root?.last_crawled_at).toBeDefined();
  });

  it("skips pages Firecrawl returned with no markdown or source URL", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "root-2", status: "queued" }] });
    crawlMock.mockResolvedValue({
      status: "completed",
      data: [
        { markdown: "Has content.", metadata: { sourceURL: "https://ex.com/" } },
        { markdown: "", metadata: { sourceURL: "https://ex.com/empty" } },
        { markdown: "No URL.", metadata: {} },
      ],
    });

    await (crawlWebsite as any).run({
      sourceId: "root-2",
      orgId: "org-1",
      agentId: "agent-1",
      url: "https://ex.com",
    });

    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("throws when Firecrawl reports the crawl failed", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "root-3", status: "queued" }] });
    crawlMock.mockResolvedValue({ status: "failed", data: [] });

    await expect(
      (crawlWebsite as any).run({
        sourceId: "root-3",
        orgId: "org-1",
        agentId: "agent-1",
        url: "https://ex.com",
      }),
    ).rejects.toThrow("Firecrawl crawl failed");
  });

  it("skips quietly when the root source is already crawling", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "root-4", status: "crawling" }] });

    await (crawlWebsite as any).run({
      sourceId: "root-4",
      orgId: "org-1",
      agentId: "agent-1",
      url: "https://ex.com",
    });

    expect(crawlMock).not.toHaveBeenCalled();
  });

  it("onFailure marks the root source failed with the error message", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "root-5", status: "crawling" }] });

    await (crawlWebsite as any).onFailure({
      payload: { sourceId: "root-5" },
      error: new Error("timeout"),
    });

    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      status: "failed",
      error_message: "timeout",
    });
  });
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
    expect(batchTriggerAndWaitMock).not.toHaveBeenCalledWith(
      "embed-chunk-batch",
      expect.anything(),
    );
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

    expect(fakeSupabase.tables.chunks.map((c) => c.id)).not.toContain("old-chunk");
  });

  it("onFailure marks the source failed with the error message", async () => {
    fakeSupabase = makeFakeSupabase({ sources: [{ id: "src-5", status: "processing" }] });

    await (processMarkdownSource as any).onFailure({
      payload: { sourceId: "src-5" },
      error: new Error("boom"),
    });

    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      status: "failed",
      error_message: "boom",
    });
  });
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
