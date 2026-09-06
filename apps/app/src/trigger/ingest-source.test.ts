import { beforeEach, describe, expect, it, vi } from "vitest";

class AbortTaskRunErrorMock extends Error {}
vi.mock("@trigger.dev/sdk", () => ({
  task: (options: unknown) => options,
  logger: { log: vi.fn() },
  AbortTaskRunError: AbortTaskRunErrorMock,
}));

const downloadMock = vi.fn();
const uploadMock = vi.fn();
vi.mock("@/lib/storage", () => ({
  files: {
    download: (...args: unknown[]) => downloadMock(...args),
    upload: (...args: unknown[]) => uploadMock(...args),
  },
}));

const parseMock = vi.fn();
vi.mock("@/lib/firecrawl", () => ({
  getFirecrawlClient: () => ({ parse: parseMock }),
}));

const triggerAndWaitMock = vi.fn();
vi.mock("./process-markdown-source", () => ({
  processMarkdownSource: {
    triggerAndWait: (...args: unknown[]) => {
      triggerAndWaitMock(...args);
      return { unwrap: () => Promise.resolve() };
    },
  },
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: () => fakeSupabase,
}));

const { ingestSource } = await import("./ingest-source");

function makeFakeSupabase(sources: Record<string, unknown>[]) {
  function from(_table: "sources") {
    const filters: Array<[string, unknown]> = [];
    const negFilters: Array<[string, unknown]> = [];
    let op: "select" | "update" | undefined;
    let updatePayload: Record<string, unknown> | undefined;

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
      // oxlint-disable-next-line no-thenable
      then(onFulfilled: (result: { data: unknown; error: unknown }) => unknown) {
        const result = (() => {
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
  downloadMock.mockReset();
  uploadMock.mockReset();
  parseMock.mockReset();
  triggerAndWaitMock.mockReset();
});

describe("ingestSource", () => {
  it("wraps text content in a heading, uploads it, and hands off to processMarkdownSource", async () => {
    fakeSupabase = makeFakeSupabase([{ id: "src-1", status: "queued" }]);

    await (ingestSource as any).run({
      sourceId: "src-1",
      orgId: "org-1",
      agentId: "agent-1",
      type: "text",
      rawContent: "Hello world.",
      label: "My notes",
    });

    expect(fakeSupabase.sources[0]?.status).toBe("processing");
    expect(uploadMock).toHaveBeenCalledWith("org-1/agent-1/src-1.md", "# My notes\n\nHello world.");
    expect(triggerAndWaitMock).toHaveBeenCalledWith(
      { sourceId: "src-1", orgId: "org-1", markdownPath: "org-1/agent-1/src-1.md" },
      { tags: ["source:src-1"] },
    );
  });

  it("joins qa pairs into markdown headings", async () => {
    fakeSupabase = makeFakeSupabase([{ id: "src-2", status: "queued" }]);

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
    fakeSupabase = makeFakeSupabase([{ id: "src-3", status: "queued" }]);
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
    fakeSupabase = makeFakeSupabase([{ id: "src-4", status: "processing" }]);

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
    expect(fakeSupabase.sources[0]?.status).toBe("processing");
  });

  it("onFailure marks the source failed with the error message", async () => {
    fakeSupabase = makeFakeSupabase([{ id: "src-5", status: "processing" }]);

    await (ingestSource as any).onFailure({
      payload: {
        sourceId: "src-5",
        orgId: "org-1",
        agentId: "agent-1",
        type: "text",
        rawContent: "x",
        label: "x",
      },
      error: new Error("Firecrawl returned no content"),
    });

    expect(fakeSupabase.sources[0]).toMatchObject({
      status: "failed",
      error_message: "Firecrawl returned no content",
    });
  });
});
