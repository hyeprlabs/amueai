import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => authMock(...args) }));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => fakeSupabase,
}));

const { POST } = await import("./route");

function makeFakeSupabase() {
  const agents: Record<string, unknown>[] = [];
  let forcedError: string | null = null;

  function from(_table: "agents") {
    return {
      insert(row: Record<string, unknown>) {
        return {
          select: () => ({
            single: async () => {
              if (forcedError) return { data: null, error: { message: forcedError } };
              const created = { id: `agent-${agents.length + 1}`, ...row };
              agents.push(created);
              return { data: created, error: null };
            },
          }),
        };
      },
    };
  }

  return {
    from,
    agents,
    failNextInsert(message: string) {
      forcedError = message;
    },
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/agents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  authMock.mockReset();
  fakeSupabase = makeFakeSupabase();
});

describe("POST /api/agents", () => {
  it("rejects when there's no active organization", async () => {
    authMock.mockResolvedValue({ orgId: null });

    const res = await POST(request({ name: "Acme Support" }));

    expect(res.status).toBe(401);
  });

  it("rejects an empty name before touching the database", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(request({ name: "" }));

    expect(res.status).toBe(400);
    expect(fakeSupabase.agents).toHaveLength(0);
  });

  it("creates the agent scoped to the active org and returns its id", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const res = await POST(request({ name: "Acme Support" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(fakeSupabase.agents[0]).toMatchObject({ org_id: "org-1", name: "Acme Support" });
    expect(body).toMatchObject({ id: (fakeSupabase.agents[0] as { id: string }).id });
  });

  it("surfaces a database failure with a 500", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.failNextInsert("insert failed");

    const res = await POST(request({ name: "Acme Support" }));

    expect(res.status).toBe(500);
  });
});
