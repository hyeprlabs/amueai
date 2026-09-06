import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@trigger.dev/sdk", () => ({
  task: (options: unknown) => options,
  logger: { log: vi.fn() },
}));

const crawlMock = vi.fn();
vi.mock("@/lib/firecrawl", () => ({
  getFirecrawlClient: () => ({ crawl: crawlMock }),
}));

const uploadMock = vi.fn();
vi.mock("@/lib/storage", () => ({
  files: { upload: (...args: unknown[]) => uploadMock(...args) },
}));

const batchTriggerAndWaitMock = vi.fn();
vi.mock("./process-markdown-source", () => ({
  processMarkdownSource: {
    batchTriggerAndWait: (...args: unknown[]) => batchTriggerAndWaitMock(...args),
  },
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: () => fakeSupabase,
}));

const { crawlWebsite } = await import("./crawl-website");

/** sources: update/eq/neq (claim + final update), upsert/select (child pages). */
function makeFakeSupabase(initialSources: Record<string, unknown>[]) {
  const sources = [...initialSources];
  let nextId = 1;

  function from(_table: "sources") {
    const filters: Array<[string, unknown]> = [];
    const negFilters: Array<[string, unknown]> = [];
    let op: "select" | "update" | "upsert" | undefined;
    let updatePayload: Record<string, unknown> | undefined;
    let upsertRows: Record<string, unknown>[] | undefined;

    function matches(row: Record<string, unknown>) {
      if (filters.some(([col, val]) => row[col] !== val)) return false;
      if (negFilters.some(([col, val]) => row[col] === val)) return false;
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
      update(payload: Record<string, unknown>) {
        op = "update";
        updatePayload = payload;
        return builder;
      },
      upsert(rows: Record<string, unknown>[], _opts?: { onConflict: string }) {
        op = "upsert";
        upsertRows = rows;
        return builder;
      },
      // oxlint-disable-next-line no-thenable
      then(onFulfilled: (result: { data: unknown; error: unknown }) => unknown) {
        const result = (() => {
          if (op === "upsert") {
            const newRows = (upsertRows ?? []).map((row) => {
              const existing = sources.find((s) => s.url === row.url);
              if (existing) {
                Object.assign(existing, row);
                return existing;
              }
              const created = { id: `child-${nextId++}`, ...row };
              sources.push(created);
              return created;
            });
            return { data: newRows, error: null };
          }
          if (op === "update") {
            const matched = sources.filter(matches);
            for (const row of matched) Object.assign(row, updatePayload);
            return { data: matched, error: null };
          }
          return { data: sources.filter(matches), error: null };
        })();
        return Promise.resolve(result).then(onFulfilled);
      },
    };

    return builder;
  }

  return { from, sources };
}

beforeEach(() => {
  crawlMock.mockReset();
  uploadMock.mockReset();
  batchTriggerAndWaitMock.mockReset();
  batchTriggerAndWaitMock.mockResolvedValue({ runs: [] });
});

describe("crawlWebsite", () => {
  it("upserts one child source per discovered page, uploads markdown, and marks the root ready", async () => {
    fakeSupabase = makeFakeSupabase([{ id: "root-1", status: "queued" }]);
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

    expect(fakeSupabase.sources).toHaveLength(3); // root + 2 children
    expect(uploadMock).toHaveBeenCalledTimes(2);
    expect(batchTriggerAndWaitMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ options: { tags: ["source:root-1"] } })]),
    );
    const root = fakeSupabase.sources.find((s) => s.id === "root-1");
    expect(root?.status).toBe("ready");
    expect(root?.last_crawled_at).toBeDefined();
  });

  it("skips pages Firecrawl returned with no markdown or source URL", async () => {
    fakeSupabase = makeFakeSupabase([{ id: "root-2", status: "queued" }]);
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
    fakeSupabase = makeFakeSupabase([{ id: "root-3", status: "queued" }]);
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
    fakeSupabase = makeFakeSupabase([{ id: "root-4", status: "crawling" }]);

    await (crawlWebsite as any).run({
      sourceId: "root-4",
      orgId: "org-1",
      agentId: "agent-1",
      url: "https://ex.com",
    });

    expect(crawlMock).not.toHaveBeenCalled();
  });

  it("onFailure marks the root source failed with the error message", async () => {
    fakeSupabase = makeFakeSupabase([{ id: "root-5", status: "crawling" }]);

    await (crawlWebsite as any).onFailure({
      payload: { sourceId: "root-5", orgId: "org-1", agentId: "agent-1", url: "https://ex.com" },
      error: new Error("timeout"),
    });

    expect(fakeSupabase.sources[0]).toMatchObject({ status: "failed", error_message: "timeout" });
  });
});
