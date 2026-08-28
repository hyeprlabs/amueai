import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

const runIngestionMock = vi.fn();
vi.mock("@/lib/ingestion", () => ({
  runIngestion: (...args: unknown[]) => runIngestionMock(...args),
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => fakeSupabase,
}));

const { POST } = await import("./route");

/** select("id").eq("id", sourceId).eq("agent_id", agentId).single() only. */
function makeFakeSupabase(sources: Record<string, unknown>[]) {
  function from(_table: "sources") {
    const filters: Array<[string, unknown]> = [];

    const builder = {
      select(_cols?: string) {
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return builder;
      },
      single() {
        const row = sources.find((source) => filters.every(([col, val]) => source[col] === val));
        return Promise.resolve(
          row ? { data: row, error: null } : { data: null, error: { message: "not found" } },
        );
      },
    };

    return builder;
  }

  return { from };
}

beforeEach(() => {
  authMock.mockReset();
  runIngestionMock.mockReset();
});

describe("POST /api/agents/[id]/sources/[sourceId]/retrain", () => {
  it("rejects an unauthenticated request", async () => {
    authMock.mockResolvedValue({ orgId: null });
    fakeSupabase = makeFakeSupabase([]);

    const res = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: "agent-1", sourceId: "source-1" }),
    });

    expect(res.status).toBe(401);
    expect(runIngestionMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the source doesn't belong to this agent", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase = makeFakeSupabase([{ id: "source-1", agent_id: "someone-elses-agent" }]);

    const res = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: "agent-1", sourceId: "source-1" }),
    });

    expect(res.status).toBe(404);
    expect(runIngestionMock).not.toHaveBeenCalled();
  });

  it("re-runs ingestion for the matched source and reports ok regardless of outcome", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase = makeFakeSupabase([{ id: "source-1", agent_id: "agent-1" }]);
    runIngestionMock.mockResolvedValue(undefined);

    const res = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: "agent-1", sourceId: "source-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(runIngestionMock).toHaveBeenCalledWith(fakeSupabase, "source-1");
  });

  it("still returns ok when ingestion rejects - the source's own status already reflects the failure", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase = makeFakeSupabase([{ id: "source-1", agent_id: "agent-1" }]);
    runIngestionMock.mockRejectedValue(new Error("Firecrawl returned no content"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: "agent-1", sourceId: "source-1" }),
    });

    expect(res.status).toBe(200);
    consoleErrorSpy.mockRestore();
  });
});
