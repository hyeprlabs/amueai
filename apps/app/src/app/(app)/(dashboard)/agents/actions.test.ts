import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const getGatewayChatModelsMock = vi.fn();
vi.mock("@/lib/gateway-models", () => ({
  getGatewayChatModels: (...args: unknown[]) => getGatewayChatModelsMock(...args),
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => fakeSupabase,
}));

const { createAgent, updateAgent, deleteAgent } = await import("./actions");

/**
 * A minimal in-memory stand-in for the exact supabase-js chains actions.ts
 * uses against the "agents" table (insert/select/single, select/eq/single,
 * update/eq, delete/eq) - enough to exercise the real auth/validation/
 * model-allowlist control flow without a live Supabase project.
 */
function makeFakeSupabase(initialAgents: Record<string, unknown>[]) {
  const agents = [...initialAgents];
  // Keyed by op so a forced failure targets, e.g., only the final update
  // and not the select that runs before it in the same function - updateAgent
  // issues a select (to read the current model) before its update, and a
  // plain "fail the next query" flag would wrongly trip on the select.
  let forcedError: { op: string; message: string } | null = null;

  function from(_table: "agents") {
    const state: {
      filters: Array<[string, unknown]>;
      op?: "select" | "update" | "insert" | "delete";
      updatePayload?: Record<string, unknown>;
      insertRow?: Record<string, unknown>;
    } = { filters: [] };

    function matches(row: Record<string, unknown>) {
      return state.filters.every(([col, val]) => row[col] === val);
    }

    function execute() {
      if (forcedError && forcedError.op === state.op) {
        const error = forcedError;
        forcedError = null;
        return { data: null, error };
      }

      if (state.op === "insert") {
        const row = { id: `agent-${agents.length + 1}`, ...state.insertRow };
        agents.push(row);
        return { data: [row], error: null };
      }

      if (state.op === "update") {
        const matched = agents.filter(matches);
        for (const row of matched) Object.assign(row, state.updatePayload);
        return { data: null, error: null };
      }

      if (state.op === "delete") {
        const remaining = agents.filter((row) => !matches(row));
        agents.length = 0;
        agents.push(...remaining);
        return { data: null, error: null };
      }

      // select
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
      insert(row: Record<string, unknown>) {
        state.op = "insert";
        state.insertRow = row;
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
      // oxlint-disable-next-line no-thenable
      then(onFulfilled: (result: { data: unknown; error: unknown }) => unknown) {
        return Promise.resolve(execute()).then(onFulfilled);
      },
    };

    return builder;
  }

  return {
    from,
    agents,
    failNextQuery(op: "select" | "update" | "insert" | "delete", message: string) {
      forcedError = { op, message };
    },
  };
}

beforeEach(() => {
  authMock.mockReset();
  redirectMock.mockReset();
  getGatewayChatModelsMock.mockReset();
  fakeSupabase = makeFakeSupabase([]);
});

describe("createAgent", () => {
  it("throws when there's no active organization", async () => {
    authMock.mockResolvedValue({ orgId: null });

    const formData = new FormData();
    formData.set("name", "Acme Support");

    await expect(createAgent(formData)).rejects.toThrow("No active organization");
  });

  it("rejects an empty name before ever touching the database", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const formData = new FormData();
    formData.set("name", "");

    await expect(createAgent(formData)).rejects.toThrow();
    expect(fakeSupabase.agents).toHaveLength(0);
  });

  it("creates the agent scoped to the active org and redirects to its sources tab", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });

    const formData = new FormData();
    formData.set("name", "Acme Support");

    await createAgent(formData);

    expect(fakeSupabase.agents).toHaveLength(1);
    expect(fakeSupabase.agents[0]).toMatchObject({ org_id: "org-1", name: "Acme Support" });
    expect(redirectMock).toHaveBeenCalledWith(
      `/agents/${(fakeSupabase.agents[0] as { id: string }).id}/sources`,
    );
  });

  it("surfaces a database failure as a plain Error", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.failNextQuery("insert", "insert failed");

    const formData = new FormData();
    formData.set("name", "Acme Support");

    await expect(createAgent(formData)).rejects.toThrow("Failed to create agent");
  });
});

describe("updateAgent", () => {
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

  it("throws when there's no active organization", async () => {
    authMock.mockResolvedValue({ orgId: null });

    await expect(updateAgent("agent-1", validInput)).rejects.toThrow("No active organization");
  });

  it("rejects a malformed payload before checking the model or writing anything", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();

    await expect(updateAgent("agent-1", { name: "" })).rejects.toThrow();
    expect((fakeSupabase.agents[0] as { name: string }).name).toBe("Acme Support");
  });

  it("accepts a model that's live in the Gateway catalog", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();
    getGatewayChatModelsMock.mockResolvedValue([
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    ]);

    const saved = await updateAgent("agent-1", validInput);

    expect(saved).toEqual(validInput);
    expect(fakeSupabase.agents[0]).toMatchObject(validInput);
  });

  it("accepts the agent's own already-stored model even if it's since been removed from the Gateway catalog", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent({ model: "openai/gpt-4-deprecated" });
    getGatewayChatModelsMock.mockResolvedValue([
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    ]);

    const saved = await updateAgent("agent-1", { ...validInput, model: "openai/gpt-4-deprecated" });

    expect(saved.model).toBe("openai/gpt-4-deprecated");
  });

  it("rejects a model that's neither live nor the agent's current model - a forged request", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();
    getGatewayChatModelsMock.mockResolvedValue([
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    ]);

    await expect(
      updateAgent("agent-1", { ...validInput, model: "some-made-up-model" }),
    ).rejects.toThrow("Unknown model: some-made-up-model");

    // The forged model must never reach the database.
    expect((fakeSupabase.agents[0] as { model: string }).model).toBe("openai/gpt-4o-mini");
  });

  it("surfaces a database failure as a plain Error", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    seedAgent();
    getGatewayChatModelsMock.mockResolvedValue([
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
    ]);

    fakeSupabase.failNextQuery("update", "update failed");
    await expect(updateAgent("agent-1", validInput)).rejects.toThrow("Failed to update agent");
  });
});

describe("deleteAgent", () => {
  it("throws when there's no active organization", async () => {
    authMock.mockResolvedValue({ orgId: null });

    await expect(deleteAgent("agent-1")).rejects.toThrow("No active organization");
  });

  it("deletes the agent and redirects to the agents list", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.agents.push({ id: "agent-1", org_id: "org-1", name: "Acme Support" });

    await deleteAgent("agent-1");

    expect(fakeSupabase.agents).toHaveLength(0);
    expect(redirectMock).toHaveBeenCalledWith("/agents");
  });

  it("surfaces a database failure as a plain Error", async () => {
    authMock.mockResolvedValue({ orgId: "org-1" });
    fakeSupabase.agents.push({ id: "agent-1", org_id: "org-1", name: "Acme Support" });
    fakeSupabase.failNextQuery("delete", "delete failed");

    await expect(deleteAgent("agent-1")).rejects.toThrow("Failed to delete agent");
  });
});
