import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

const triggerIngestionMock = vi.fn();
vi.mock("@/lib/trigger", () => ({
  triggerIngestion: (...args: unknown[]) => triggerIngestionMock(...args),
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => fakeSupabase,
}));

const { POST } = await import("./route");

/**
 * A minimal in-memory stand-in for the exact supabase-js chains this route
 * uses across "agents" and "sources" (select/eq/single, insert/select/single) -
 * enough to exercise the real auth/validation/insert/enqueue control flow
 * without a live Supabase project.
 */
function makeFakeSupabase(seed: {
  agents?: Record<string, unknown>[];
  sources?: Record<string, unknown>[];
}) {
  const tables = {
    agents: [...(seed.agents ?? [])],
    sources: [...(seed.sources ?? [])],
  };
  let forceInsertError: string | null = null;

  function from(table: "agents" | "sources") {
    const rows = tables[table];
    const state: {
      filters: Array<[string, unknown]>;
      op?: "select" | "insert";
      insertRow?: Record<string, unknown>;
    } = { filters: [] };

    function matches(row: Record<string, unknown>) {
      return state.filters.every(([col, val]) => row[col] === val);
    }

    function execute() {
      if (state.op === "insert") {
        if (forceInsertError) {
          const message = forceInsertError;
          forceInsertError = null;
          return { data: null, error: { message } };
        }
        const row = { id: `${table}-${rows.length + 1}`, status: "queued", ...state.insertRow };
        rows.push(row);
        return { data: [row], error: null };
      }
      return { data: rows.filter(matches), error: null };
    }

    const builder = {
      select(_cols?: string) {
        state.op ??= "select";
        return builder;
      },
      eq(col: string, val: unknown) {
        state.filters.push([col, val]);
        return builder;
      },
      insert(row: Record<string, unknown>) {
        state.op = "insert";
        state.insertRow = row;
        return builder;
      },
      single() {
        const { data, error } = execute();
        const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
        return Promise.resolve(
          row
            ? { data: row, error: null }
            : { data: null, error: error ?? { message: "not found" } },
        );
      },
    };

    return builder;
  }

  return {
    from,
    tables,
    failNextInsert(message: string) {
      forceInsertError = message;
    },
  };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/agents/agent-1/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  authMock.mockReset();
  triggerIngestionMock.mockReset();
  triggerIngestionMock.mockResolvedValue({ tag: "source:x", publicAccessToken: "pat_1" });
  fakeSupabase = makeFakeSupabase({ agents: [{ id: "agent-1" }] });
});

describe("POST /api/agents/[id]/sources", () => {
  it("rejects an unauthenticated request", async () => {
    authMock.mockResolvedValue({ orgId: null });

    const res = await POST(
      jsonRequest({ type: "url", label: "Docs", url: "https://example.com" }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );

    expect(res.status).toBe(401);
    expect(triggerIngestionMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed URL with a 400 before touching the database", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(jsonRequest({ type: "url", label: "Docs", url: "not-a-url" }), {
      params: Promise.resolve({ id: "agent-1" }),
    });

    expect(res.status).toBe(400);
    expect(fakeSupabase.tables.sources).toHaveLength(0);
  });

  it("rejects a file source with no storagePath", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(jsonRequest({ type: "file", label: "Handbook", storagePath: "" }), {
      params: Promise.resolve({ id: "agent-1" }),
    });

    expect(res.status).toBe(400);
    expect(fakeSupabase.tables.sources).toHaveLength(0);
  });

  it("rejects a text source with empty content", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(jsonRequest({ type: "text", label: "Notes", content: "" }), {
      params: Promise.resolve({ id: "agent-1" }),
    });

    expect(res.status).toBe(400);
    expect(fakeSupabase.tables.sources).toHaveLength(0);
  });

  it("rejects a qa source with no pairs", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(jsonRequest({ type: "qa", label: "FAQ", pairs: [] }), {
      params: Promise.resolve({ id: "agent-1" }),
    });

    expect(res.status).toBe(400);
    expect(fakeSupabase.tables.sources).toHaveLength(0);
  });

  it("returns 404 when the agent doesn't exist or isn't visible to this org", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase = makeFakeSupabase({ agents: [] });

    const res = await POST(
      jsonRequest({ type: "url", label: "Docs", url: "https://example.com" }),
      { params: Promise.resolve({ id: "missing-agent" }) },
    );

    expect(res.status).toBe(404);
  });

  it("creates a url source, dispatches to crawl-website, and returns it queued", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(
      jsonRequest({ type: "url", label: "Docs", url: "https://example.com/docs" }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.source.status).toBe("queued");
    expect(triggerIngestionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: body.source.id,
        orgId: "org-1",
        agentId: "agent-1",
        type: "url",
        url: "https://example.com/docs",
      }),
    );
    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      org_id: "org-1",
      agent_id: "agent-1",
      type: "url",
      label: "Docs",
      url: "https://example.com/docs",
      raw_content: null,
      storage_path: null,
    });
  });

  it("creates a file source, dispatches to ingest-source, and returns it queued", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(
      jsonRequest({ type: "file", label: "Handbook", storagePath: "org-1/agent-1/handbook.pdf" }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.source.status).toBe("queued");
    expect(triggerIngestionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: body.source.id,
        type: "file",
        storagePath: "org-1/agent-1/handbook.pdf",
      }),
    );
    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      org_id: "org-1",
      agent_id: "agent-1",
      type: "file",
      label: "Handbook",
      url: null,
      raw_content: null,
      storage_path: "org-1/agent-1/handbook.pdf",
    });
  });

  it("creates a text source with raw_content and dispatches to ingest-source", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(jsonRequest({ type: "text", label: "Notes", content: "Hello there." }), {
      params: Promise.resolve({ id: "agent-1" }),
    });

    expect(res.status).toBe(201);
    expect(triggerIngestionMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "text", rawContent: "Hello there." }),
    );
    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      type: "text",
      raw_content: "Hello there.",
      url: null,
      storage_path: null,
    });
  });

  it("creates a qa source with pairs serialized into raw_content", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(
      jsonRequest({ type: "qa", label: "FAQ", pairs: [{ q: "Refunds?", a: "30 days." }] }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );

    expect(res.status).toBe(201);
    expect(triggerIngestionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "qa",
        rawContent: JSON.stringify([{ q: "Refunds?", a: "30 days." }]),
      }),
    );
  });

  it("surfaces an insert failure as a 500", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.failNextInsert("insert failed");

    const res = await POST(
      jsonRequest({ type: "url", label: "Docs", url: "https://example.com" }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );

    expect(res.status).toBe(500);
    expect(triggerIngestionMock).not.toHaveBeenCalled();
  });
});
