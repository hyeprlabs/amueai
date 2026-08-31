import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

const triggerIngestSourceMock = vi.fn();
vi.mock("@/lib/trigger", () => ({
  triggerIngestSource: (...args: unknown[]) => triggerIngestSourceMock(...args),
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
  triggerIngestSourceMock.mockReset();
  triggerIngestSourceMock.mockResolvedValue({ id: "run_1", publicAccessToken: "pat_1" });
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
    expect(triggerIngestSourceMock).not.toHaveBeenCalled();
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

  it("returns 404 when the agent doesn't exist or isn't visible to this org", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase = makeFakeSupabase({ agents: [] });

    const res = await POST(
      jsonRequest({ type: "url", label: "Docs", url: "https://example.com" }),
      { params: Promise.resolve({ id: "missing-agent" }) },
    );

    expect(res.status).toBe(404);
  });

  it("creates a url source, enqueues the ingest-source task, and returns it queued", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(
      jsonRequest({ type: "url", label: "Docs", url: "https://example.com/docs" }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.source.status).toBe("queued");
    expect(triggerIngestSourceMock).toHaveBeenCalledWith(body.source.id);
    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      org_id: "org-1",
      agent_id: "agent-1",
      type: "url",
      label: "Docs",
      raw_content: "https://example.com/docs",
      storage_path: null,
    });
  });

  it("creates a file source, enqueues the ingest-source task, and returns it queued", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(
      jsonRequest({ type: "file", label: "Handbook", storagePath: "org-1/agent-1/handbook.pdf" }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.source.status).toBe("queued");
    expect(triggerIngestSourceMock).toHaveBeenCalledWith(body.source.id);
    expect(fakeSupabase.tables.sources[0]).toMatchObject({
      org_id: "org-1",
      agent_id: "agent-1",
      type: "file",
      label: "Handbook",
      raw_content: null,
      storage_path: "org-1/agent-1/handbook.pdf",
    });
  });

  it("surfaces an insert failure as a 500", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.failNextInsert("insert failed");

    const res = await POST(
      jsonRequest({ type: "url", label: "Docs", url: "https://example.com" }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );

    expect(res.status).toBe(500);
    expect(triggerIngestSourceMock).not.toHaveBeenCalled();
  });
});
