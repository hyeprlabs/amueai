import { beforeEach, describe, expect, it, vi } from "vitest";

// getFirecrawlClient() only checks that this is set - the client itself is
// mocked below, so the value doesn't matter.
process.env.FIRECRAWL_API_KEY ??= "test-key";

const embedManyMock = vi.fn();
vi.mock("ai", () => ({
  embedMany: (...args: unknown[]) => embedManyMock(...args),
}));

const scrapeMock = vi.fn();
vi.mock("@mendable/firecrawl-js", () => ({
  default: class FirecrawlMock {
    scrape(...args: unknown[]) {
      return scrapeMock(...args);
    }
  },
}));

const { runIngestion } = await import("./ingestion");

/**
 * A minimal in-memory stand-in for the exact supabase-js chains
 * runIngestion uses (select/eq/neq/single, update/select, insert,
 * delete/in) - enough to exercise the real extract -> chunk -> embed ->
 * store control flow end to end without a live Supabase project.
 */
function makeFakeSupabase(initialSources: Record<string, unknown>[]) {
  const tables = {
    sources: [...initialSources],
    chunks: [] as Record<string, unknown>[],
  };

  function from(table: "sources" | "chunks") {
    const rows = tables[table];
    const state: {
      filters: Array<[string, unknown]>;
      negFilters: Array<[string, unknown]>;
      inFilter?: [string, unknown[]];
      op?: "select" | "update" | "insert" | "delete";
      updatePayload?: Record<string, unknown>;
      insertRows?: Record<string, unknown>[];
      selected?: boolean;
    } = { filters: [], negFilters: [] };

    function matches(row: Record<string, unknown>) {
      if (state.filters.some(([col, val]) => row[col] !== val)) return false;
      if (state.negFilters.some(([col, val]) => row[col] === val)) return false;
      if (state.inFilter && !state.inFilter[1].includes(row[state.inFilter[0]] as unknown))
        return false;
      return true;
    }

    function execute() {
      if (state.op === "insert") {
        const newRows = (state.insertRows ?? []).map((row, i) => ({
          id: row.id ?? `${table}-${rows.length + i}`,
          ...row,
        }));
        rows.push(...newRows);
        return { data: newRows, error: null };
      }

      if (state.op === "delete") {
        const remaining = rows.filter((row) => !matches(row));
        const removedCount = rows.length - remaining.length;
        rows.length = 0;
        rows.push(...remaining);
        return { data: null, error: removedCount > 0 ? null : null };
      }

      if (state.op === "update") {
        const matched = rows.filter(matches);
        for (const row of matched) Object.assign(row, state.updatePayload);
        return { data: state.selected ? matched : null, error: null };
      }

      // select
      const matched = rows.filter(matches);
      return { data: matched, error: null };
    }

    const builder = {
      select(_cols?: string) {
        state.op ??= "select";
        state.selected = true;
        return builder;
      },
      eq(col: string, val: unknown) {
        state.filters.push([col, val]);
        return builder;
      },
      neq(col: string, val: unknown) {
        state.negFilters.push([col, val]);
        return builder;
      },
      in(col: string, vals: unknown[]) {
        state.op = "delete";
        state.inFilter = [col, vals];
        return builder;
      },
      update(payload: Record<string, unknown>) {
        state.op = "update";
        state.updatePayload = payload;
        return builder;
      },
      insert(insertRows: Record<string, unknown>[] | Record<string, unknown>) {
        state.op = "insert";
        state.insertRows = Array.isArray(insertRows) ? insertRows : [insertRows];
        return builder;
      },
      delete() {
        state.op = "delete";
        return builder;
      },
      single() {
        const { data } = execute();
        const row = (data as Record<string, unknown>[] | null)?.[0];
        return Promise.resolve(
          row ? { data: row, error: null } : { data: null, error: { message: "not found" } },
        );
      },
      // Deliberately thenable: runIngestion awaits several of these
      // builders directly (no .single()/.select() terminal call), matching
      // real supabase-js query builder behavior.
      // oxlint-disable-next-line no-thenable
      then(onFulfilled: (result: { data: unknown; error: unknown }) => unknown) {
        return Promise.resolve(execute()).then(onFulfilled);
      },
    };

    return builder;
  }

  return { from, tables };
}

beforeEach(() => {
  embedManyMock.mockReset();
  scrapeMock.mockReset();
});

describe("runIngestion", () => {
  it("embeds and stores chunks for a text source, then marks it ready", async () => {
    const supabase = makeFakeSupabase([
      {
        id: "src-1",
        org_id: "org-1",
        type: "text",
        raw_content: "First paragraph.\n\nSecond paragraph.",
        storage_path: null,
        status: "queued",
      },
    ]);
    embedManyMock.mockResolvedValue({
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
    });

    await runIngestion(supabase as any, "src-1");

    expect(embedManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/text-embedding-3-small",
        values: ["First paragraph.", "Second paragraph."],
      }),
    );

    const source = supabase.tables.sources.find((s) => s.id === "src-1");
    expect(source?.status).toBe("ready");
    expect(source?.error_message).toBeNull();

    expect(supabase.tables.chunks).toHaveLength(2);
    expect(supabase.tables.chunks.map((c) => c.content)).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
    expect(supabase.tables.chunks.every((c) => c.org_id === "org-1")).toBe(true);
    expect(supabase.tables.chunks.every((c) => typeof c.embedding === "string")).toBe(true);
  });

  it("scrapes with Firecrawl, embeds, and stores chunks for a url source", async () => {
    const supabase = makeFakeSupabase([
      {
        id: "src-2",
        org_id: "org-1",
        type: "url",
        raw_content: "https://example.com/docs",
        storage_path: null,
        status: "queued",
      },
    ]);
    scrapeMock.mockResolvedValue({ markdown: "# Docs\n\nSome scraped content." });
    embedManyMock.mockResolvedValue({ embeddings: [[0.1], [0.2]] });

    await runIngestion(supabase as any, "src-2");

    expect(scrapeMock).toHaveBeenCalledWith(
      "https://example.com/docs",
      expect.objectContaining({ formats: ["markdown"], onlyMainContent: true }),
    );

    const source = supabase.tables.sources.find((s) => s.id === "src-2");
    expect(source?.status).toBe("ready");
    expect(supabase.tables.chunks).toHaveLength(2);
  });

  it("marks the source failed with an error message when embedding throws", async () => {
    const supabase = makeFakeSupabase([
      {
        id: "src-3",
        org_id: "org-1",
        type: "text",
        raw_content: "Some content.",
        storage_path: null,
        status: "queued",
      },
    ]);
    embedManyMock.mockRejectedValue(new Error("Gateway is down"));

    await expect(runIngestion(supabase as any, "src-3")).rejects.toThrow("Gateway is down");

    const source = supabase.tables.sources.find((s) => s.id === "src-3");
    expect(source?.status).toBe("failed");
    expect(source?.error_message).toBe("Gateway is down");
    expect(supabase.tables.chunks).toHaveLength(0);
  });

  it("leaves prior chunks in place when a retrain fails", async () => {
    const supabase = makeFakeSupabase([
      {
        id: "src-4",
        org_id: "org-1",
        type: "text",
        raw_content: "New content that will fail to embed.",
        storage_path: null,
        status: "ready",
      },
    ]);
    supabase.tables.chunks.push({
      id: "chunk-old",
      org_id: "org-1",
      source_id: "src-4",
      content: "Old content.",
      embedding: "[0.9]",
    });
    embedManyMock.mockRejectedValue(new Error("Gateway is down"));

    await expect(runIngestion(supabase as any, "src-4")).rejects.toThrow();

    expect(supabase.tables.chunks).toHaveLength(1);
    expect(supabase.tables.chunks[0]?.id).toBe("chunk-old");
    const source = supabase.tables.sources.find((s) => s.id === "src-4");
    expect(source?.status).toBe("failed");
  });

  it("refuses to run twice concurrently on the same source", async () => {
    const supabase = makeFakeSupabase([
      {
        id: "src-5",
        org_id: "org-1",
        type: "text",
        raw_content: "Content.",
        storage_path: null,
        status: "processing",
      },
    ]);

    await expect(runIngestion(supabase as any, "src-5")).rejects.toThrow("already being processed");
    expect(embedManyMock).not.toHaveBeenCalled();
  });
});
