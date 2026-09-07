import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => authMock(...args) }));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

const getGatewayChatModelsMock = vi.fn();
vi.mock("@/lib/gateway-models", () => ({
  AUTO_MODEL_ID: "auto",
  getGatewayChatModels: (...args: unknown[]) => getGatewayChatModelsMock(...args),
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => fakeSupabase,
}));

const { GET, PATCH, DELETE } = await import("./route");

function makeFakeSupabase(initialAgents: Record<string, unknown>[], activeOrgId?: string) {
  const agents = [...initialAgents];
  let forcedError: { op: string; message: string } | null = null;

  function from(_table: "agents") {
    const state: {
      filters: Array<[string, unknown]>;
      op?: "select" | "update" | "delete";
      updatePayload?: Record<string, unknown>;
    } = { filters: [] };

    function matches(row: Record<string, unknown>) {
      if (activeOrgId !== undefined && row.org_id !== undefined && row.org_id !== activeOrgId) {
        return false;
      }
      return state.filters.every(([col, val]) => row[col] === val);
    }

    function execute() {
      if (forcedError && forcedError.op === state.op) {
        const error = forcedError;
        forcedError = null;
        return { data: null, error };
      }
      if (state.op === "update") {
        const matched = agents.filter(matches);
        for (const row of matched) Object.assign(row, state.updatePayload);
        return { data: matched, error: null };
      }
      if (state.op === "delete") {
        const matched = agents.filter(matches);
        const remaining = agents.filter((row) => !matches(row));
        agents.length = 0;
        agents.push(...remaining);
        return { data: matched, error: null };
      }
      return { data: agents.filter(matches), error: null };
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
      update(payload: Record<string, unknown>) {
        state.op = "update";
        state.updatePayload = payload;
        return builder;
      },
      delete() {
        state.op = "delete";
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
      maybeSingle() {
        const { data, error } = execute();
        const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
        return Promise.resolve({ data: row ?? null, error });
      },
    };

    return builder;
  }

  return {
    from,
    agents,
    failNextQuery(op: "select" | "update" | "delete", message: string) {
      forcedError = { op, message };
    },
  };
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function request(body?: unknown) {
  return new Request("http://localhost/api/agents/agent-1", {
    method: body ? "PATCH" : "GET",
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  authMock.mockReset();
  revalidatePathMock.mockReset();
  getGatewayChatModelsMock.mockReset();
  fakeSupabase = makeFakeSupabase([]);
});

describe("GET /api/agents/:id", () => {
  it("returns the agent scoped to the active org", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.agents.push({ id: "agent-1", org_id: "org-1", name: "Acme Support" });

    const res = await GET(request(), params("agent-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ id: "agent-1", name: "Acme Support" });
  });

  it("404s when RLS excludes the row (another org, or deleted)", async () => {
    authMock.mockResolvedValue({ orgId: "org-2" });
    fakeSupabase = makeFakeSupabase([{ id: "agent-1", org_id: "org-1" }], "org-2");

    const res = await GET(request(), params("agent-1"));

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/agents/:id", () => {
  function seedAgent(overrides: Record<string, unknown> = {}) {
    fakeSupabase.agents.push({
      id: "agent-1",
      org_id: "org-1",
      name: "Acme Support",
      system_prompt: "Be helpful.",
      model: "openai/gpt-4o-mini",
      temperature: 0.3,
      ...overrides,
    });
  }

  const validInput = {
    name: "Acme Support",
    system_prompt: "Be helpful.",
    model: "openai/gpt-4o-mini",
    temperature: 0.5,
  };

  it("rejects when there's no active organization", async () => {
    authMock.mockResolvedValue({ orgId: null });

    const res = await PATCH(request(validInput), params("agent-1"));

    expect(res.status).toBe(401);
  });

  it("rejects a malformed payload before checking the model or writing anything", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();

    const res = await PATCH(request({ name: "" }), params("agent-1"));

    expect(res.status).toBe(400);
    expect((fakeSupabase.agents[0] as { name: string }).name).toBe("Acme Support");
  });

  it("accepts a model that's live in the Gateway catalog", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();
    getGatewayChatModelsMock.mockResolvedValue([
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    ]);

    const res = await PATCH(request(validInput), params("agent-1"));

    expect(res.status).toBe(200);
    expect(fakeSupabase.agents[0]).toMatchObject(validInput);
  });

  it("accepts the 'auto' sentinel even though it's never in the Gateway catalog", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();
    getGatewayChatModelsMock.mockResolvedValue([
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    ]);

    const res = await PATCH(request({ ...validInput, model: "auto" }), params("agent-1"));
    const body = await res.json();

    expect(body.model).toBe("auto");
  });

  it("rejects a model that's neither live nor the agent's current model", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();
    getGatewayChatModelsMock.mockResolvedValue([
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    ]);

    const res = await PATCH(
      request({ ...validInput, model: "some-made-up-model" }),
      params("agent-1"),
    );

    expect(res.status).toBe(400);
    expect((fakeSupabase.agents[0] as { model: string }).model).toBe("openai/gpt-4o-mini");
  });

  it("saves a partial payload without touching untouched fields", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();

    const res = await PATCH(request({ name: "Renamed", temperature: 1 }), params("agent-1"));
    const body = await res.json();

    expect(body).toEqual({ name: "Renamed", temperature: 1 });
    expect(fakeSupabase.agents[0]).toMatchObject({ model: "openai/gpt-4o-mini" });
    expect(getGatewayChatModelsMock).not.toHaveBeenCalled();
  });

  it("404s instead of silently no-op'ing when RLS excludes every row", async () => {
    authMock.mockResolvedValue({ orgId: "org-2" });
    fakeSupabase = makeFakeSupabase(
      [{ id: "agent-1", org_id: "org-1", name: "Acme Support" }],
      "org-2",
    );

    const res = await PATCH(request({ name: "Renamed" }), params("agent-1"));

    expect(res.status).toBe(404);
    expect((fakeSupabase.agents[0] as { name: string }).name).toBe("Acme Support");
  });

  it("surfaces a database failure with a 500", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();
    getGatewayChatModelsMock.mockResolvedValue([
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    ]);
    fakeSupabase.failNextQuery("update", "update failed");

    const res = await PATCH(request(validInput), params("agent-1"));

    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/agents/:id", () => {
  it("rejects when there's no active organization", async () => {
    authMock.mockResolvedValue({ orgId: null });

    const res = await DELETE(request(), params("agent-1"));

    expect(res.status).toBe(401);
  });

  it("deletes the agent and revalidates the dashboard layout", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.agents.push({ id: "agent-1", org_id: "org-1", name: "Acme Support" });

    const res = await DELETE(request(), params("agent-1"));

    expect(res.status).toBe(204);
    expect(fakeSupabase.agents).toHaveLength(0);
    expect(revalidatePathMock).toHaveBeenCalledWith("/agents", "layout");
  });

  it("404s instead of silently no-op'ing when RLS excludes every row", async () => {
    authMock.mockResolvedValue({ orgId: "org-2" });
    fakeSupabase = makeFakeSupabase([{ id: "agent-1", org_id: "org-1" }], "org-2");

    const res = await DELETE(request(), params("agent-1"));

    expect(res.status).toBe(404);
    expect(fakeSupabase.agents).toHaveLength(1);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("surfaces a database failure with a 500", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.agents.push({ id: "agent-1", org_id: "org-1" });
    fakeSupabase.failNextQuery("delete", "delete failed");

    const res = await DELETE(request(), params("agent-1"));

    expect(res.status).toBe(500);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
