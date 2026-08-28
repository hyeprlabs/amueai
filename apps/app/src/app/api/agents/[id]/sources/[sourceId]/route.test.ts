import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => fakeSupabase,
}));

const { DELETE } = await import("./route");

/**
 * A minimal in-memory stand-in for the exact supabase-js chain this route
 * uses: sources.delete({ count: "exact" }).eq(...).eq(...), awaited
 * directly (no .single()) for its {error, count} result.
 */
function makeFakeSupabase(initialSources: Record<string, unknown>[]) {
  const sources = [...initialSources];
  let forceError: string | null = null;

  function from(_table: "sources") {
    const filters: Array<[string, unknown]> = [];
    let deleteRequested = false;

    function matches(row: Record<string, unknown>) {
      return filters.every(([col, val]) => row[col] === val);
    }

    const builder = {
      delete(_opts?: { count?: string }) {
        deleteRequested = true;
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return builder;
      },
      // oxlint-disable-next-line no-thenable
      then(onFulfilled: (result: { error: unknown; count: number | null }) => unknown) {
        const result = (() => {
          if (!deleteRequested) return { error: null, count: null };
          if (forceError) {
            const message = forceError;
            forceError = null;
            return { error: { message }, count: null };
          }
          const matched = sources.filter(matches);
          const remaining = sources.filter((row) => !matches(row));
          sources.length = 0;
          sources.push(...remaining);
          return { error: null, count: matched.length };
        })();
        return Promise.resolve(result).then(onFulfilled);
      },
    };

    return builder;
  }

  return {
    from,
    sources,
    failNextDelete(message: string) {
      forceError = message;
    },
  };
}

beforeEach(() => {
  authMock.mockReset();
});

describe("DELETE /api/agents/[id]/sources/[sourceId]", () => {
  it("rejects an unauthenticated request", async () => {
    authMock.mockResolvedValue({ orgId: null });
    fakeSupabase = makeFakeSupabase([]);

    const res = await DELETE(new Request("http://localhost", { method: "DELETE" }), {
      params: Promise.resolve({ id: "agent-1", sourceId: "source-1" }),
    });

    expect(res.status).toBe(401);
  });

  it("deletes the source scoped to its agent and returns 204", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase = makeFakeSupabase([{ id: "source-1", agent_id: "agent-1" }]);

    const res = await DELETE(new Request("http://localhost", { method: "DELETE" }), {
      params: Promise.resolve({ id: "agent-1", sourceId: "source-1" }),
    });

    expect(res.status).toBe(204);
    expect(fakeSupabase.sources).toHaveLength(0);
  });

  it("returns 404 without deleting anything when no row matches both id and agent_id", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    // Belongs to a different agent - matching id() but not agent_id().eq()
    // must not delete it.
    fakeSupabase = makeFakeSupabase([{ id: "source-1", agent_id: "someone-elses-agent" }]);

    const res = await DELETE(new Request("http://localhost", { method: "DELETE" }), {
      params: Promise.resolve({ id: "agent-1", sourceId: "source-1" }),
    });

    expect(res.status).toBe(404);
    expect(fakeSupabase.sources).toHaveLength(1);
  });

  it("surfaces a database failure as a 500", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase = makeFakeSupabase([{ id: "source-1", agent_id: "agent-1" }]);
    fakeSupabase.failNextDelete("delete failed");

    const res = await DELETE(new Request("http://localhost", { method: "DELETE" }), {
      params: Promise.resolve({ id: "agent-1", sourceId: "source-1" }),
    });

    expect(res.status).toBe(500);
  });
});
