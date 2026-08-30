import { beforeEach, describe, expect, it, vi } from "vitest";

const embedMock = vi.fn();
const streamTextMock = vi.fn();
vi.mock("ai", () => ({
  embed: (...args: unknown[]) => embedMock(...args),
  streamText: (...args: unknown[]) => streamTextMock(...args),
  createUIMessageStream: ({
    execute,
  }: {
    execute: (options: { writer: unknown }) => Promise<void>;
  }) => {
    const written: unknown[] = [];
    const writer = {
      write: (chunk: unknown) => written.push(chunk),
      merge: () => {},
    };
    const ready = execute({ writer });
    return { written, ready };
  },
  createUIMessageStreamResponse: ({
    stream,
    headers,
  }: {
    stream: { written: unknown[]; ready: Promise<void> };
    headers?: Record<string, string>;
  }) => {
    const response = new Response(null, { status: 200, headers });
    // Expose what was written for assertions without changing the Response API.
    (response as Response & { __written: unknown[] }).__written = stream.written;
    return response;
  },
  toUIMessageStream: () => ({}),
}));

const checkChatRateLimitMock = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  checkChatRateLimit: (...args: unknown[]) => checkChatRateLimitMock(...args),
}));

const resolveAutoModelIdMock = vi.fn();
vi.mock("@/lib/gateway-models", () => ({
  AUTO_MODEL_ID: "auto",
  resolveAutoModelId: (...args: unknown[]) => resolveAutoModelIdMock(...args),
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: () => fakeSupabase,
}));

const { POST } = await import("./route");

/**
 * A minimal in-memory stand-in for the exact supabase-js chains this route
 * uses across agents/conversations/messages plus the match_chunks RPC -
 * enough to exercise the real rate-limit/lookup/conversation/retrieval
 * control flow without a live Supabase project.
 */
function makeFakeSupabase(seed: {
  agents?: Record<string, unknown>[];
  conversations?: Record<string, unknown>[];
  chunks?: { content: string; source_id: string; similarity: number }[];
  sources?: Record<string, unknown>[];
}) {
  const tables = {
    agents: [...(seed.agents ?? [])],
    conversations: [...(seed.conversations ?? [])],
    messages: [] as Record<string, unknown>[],
    sources: [...(seed.sources ?? [])],
  };
  let forceConversationInsertError: string | null = null;

  function from(table: "agents" | "conversations" | "messages" | "sources") {
    const rows = tables[table];
    const state: {
      filters: Array<[string, unknown]>;
      inFilters: Array<[string, unknown[]]>;
      op?: "select" | "insert";
      insertRows?: Record<string, unknown>[];
    } = { filters: [], inFilters: [] };

    function matches(row: Record<string, unknown>) {
      return (
        state.filters.every(([col, val]) => row[col] === val) &&
        state.inFilters.every(([col, vals]) => vals.includes(row[col]))
      );
    }

    function execute() {
      if (state.op === "insert") {
        if (table === "conversations" && forceConversationInsertError) {
          const message = forceConversationInsertError;
          forceConversationInsertError = null;
          return { data: null, error: { message } };
        }
        const newRows = (state.insertRows ?? []).map((row, i) => ({
          id: row.id ?? `${table}-${rows.length + i + 1}`,
          ...row,
        }));
        rows.push(...newRows);
        return { data: newRows, error: null };
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
      in(col: string, vals: unknown[]) {
        state.inFilters.push([col, vals]);
        return builder;
      },
      insert(row: Record<string, unknown> | Record<string, unknown>[]) {
        state.op = "insert";
        state.insertRows = Array.isArray(row) ? row : [row];
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
    tables,
    rpc: vi.fn((_fn: string, _args: Record<string, unknown>) =>
      Promise.resolve({ data: seed.chunks ?? [], error: null }),
    ),
    failNextConversationInsert(message: string) {
      forceConversationInsertError = message;
    },
  };
}

function chatRequest(body: unknown) {
  return new Request("http://localhost/api/chat/agent-1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const agent = {
  id: "agent-1",
  org_id: "org-1",
  system_prompt: "You are a helpful assistant. Only answer from the provided context.",
  model: "openai/gpt-4o-mini",
  temperature: 0.3,
  fallback_message: null,
};

beforeEach(() => {
  embedMock.mockReset();
  streamTextMock.mockReset();
  checkChatRateLimitMock.mockReset();
  resolveAutoModelIdMock.mockReset();

  embedMock.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
  checkChatRateLimitMock.mockResolvedValue(true);
  streamTextMock.mockReturnValue({ stream: {} });
  fakeSupabase = makeFakeSupabase({ agents: [agent] });
});

describe("POST /api/chat/[agentId]", () => {
  it("rejects an invalid body with a 400", async () => {
    const res = await POST(chatRequest({ message: "" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(res.status).toBe(400);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the agent doesn't exist", async () => {
    fakeSupabase = makeFakeSupabase({ agents: [] });

    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "missing-agent" }),
    });

    expect(res.status).toBe(404);
    expect(checkChatRateLimitMock).not.toHaveBeenCalled();
  });

  describe("allowed_origins", () => {
    function originRequest(origin?: string) {
      return new Request("http://localhost/api/chat/agent-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(origin ? { origin } : {}),
        },
        body: JSON.stringify({ message: "Hi", visitorId: "visitor-1" }),
      });
    }

    it("stays open when no origins are configured", async () => {
      fakeSupabase = makeFakeSupabase({ agents: [{ ...agent, allowed_origins: [] }] });

      const res = await POST(originRequest("https://anywhere.example"), {
        params: Promise.resolve({ agentId: "agent-1" }),
      });

      expect(res.status).toBe(200);
    });

    it("allows a configured origin", async () => {
      fakeSupabase = makeFakeSupabase({
        agents: [{ ...agent, allowed_origins: ["https://acme.com"] }],
      });

      const res = await POST(originRequest("https://acme.com"), {
        params: Promise.resolve({ agentId: "agent-1" }),
      });

      expect(res.status).toBe(200);
    });

    it("blocks another site embedding this agent, before spending any model credits", async () => {
      fakeSupabase = makeFakeSupabase({
        agents: [{ ...agent, allowed_origins: ["https://acme.com"] }],
      });

      const res = await POST(originRequest("https://evil.example"), {
        params: Promise.resolve({ agentId: "agent-1" }),
      });

      expect(res.status).toBe(403);
      expect(streamTextMock).not.toHaveBeenCalled();
      expect(embedMock).not.toHaveBeenCalled();
    });

    it("blocks a request with no Origin header once origins are configured", async () => {
      fakeSupabase = makeFakeSupabase({
        agents: [{ ...agent, allowed_origins: ["https://acme.com"] }],
      });

      const res = await POST(originRequest(), {
        params: Promise.resolve({ agentId: "agent-1" }),
      });

      expect(res.status).toBe(403);
      expect(streamTextMock).not.toHaveBeenCalled();
    });
  });

  it("returns 429 without calling the model when rate limited", async () => {
    checkChatRateLimitMock.mockResolvedValue(false);

    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(res.status).toBe(429);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("rate-limits by IP and agent id together", async () => {
    await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
      // no x-forwarded-for header
    });

    expect(checkChatRateLimitMock).toHaveBeenCalledWith("unknown", "agent-1");
  });

  it("starts a new conversation when no conversationId is given, and returns its id in a header", async () => {
    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(fakeSupabase.tables.conversations).toHaveLength(1);
    expect(fakeSupabase.tables.conversations[0]).toMatchObject({
      org_id: "org-1",
      agent_id: "agent-1",
      visitor_id: "visitor-1",
    });
    expect(res.headers.get("X-Conversation-Id")).toBe(fakeSupabase.tables.conversations[0].id);
  });

  it("reuses an existing conversation instead of creating a duplicate", async () => {
    fakeSupabase = makeFakeSupabase({
      agents: [agent],
      conversations: [
        { id: "conv-1", agent_id: "agent-1", visitor_id: "visitor-1", org_id: "org-1" },
      ],
    });

    const res = await POST(
      chatRequest({ message: "Hi", conversationId: "conv-1", visitorId: "visitor-1" }),
      { params: Promise.resolve({ agentId: "agent-1" }) },
    );

    expect(fakeSupabase.tables.conversations).toHaveLength(1);
    expect(res.headers.get("X-Conversation-Id")).toBe("conv-1");
  });

  it("creates the row when a client-generated conversationId isn't known yet", async () => {
    await POST(chatRequest({ message: "Hi", conversationId: "conv-new", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(fakeSupabase.tables.conversations).toHaveLength(1);
    expect(fakeSupabase.tables.conversations[0]).toMatchObject({
      id: "conv-new",
      org_id: "org-1",
      agent_id: "agent-1",
      visitor_id: "visitor-1",
    });
  });

  it("returns 500 when starting a conversation fails", async () => {
    fakeSupabase.failNextConversationInsert("insert failed");

    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(res.status).toBe(500);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("embeds the message and retrieves matching chunks to build the system prompt", async () => {
    fakeSupabase = makeFakeSupabase({
      agents: [agent],
      chunks: [
        { content: "Refunds are available within 30 days.", source_id: "src-1", similarity: 0.9 },
      ],
    });

    await POST(chatRequest({ message: "What's your refund policy?", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(embedMock).toHaveBeenCalledWith(
      expect.objectContaining({ value: "What's your refund policy?" }),
    );
    expect(fakeSupabase.rpc).toHaveBeenCalledWith(
      "match_chunks",
      expect.objectContaining({ match_agent_id: "agent-1", match_count: 6 }),
    );

    const call = streamTextMock.mock.calls[0][0];
    expect(call.system).toContain("Refunds are available within 30 days.");
  });

  it("says plainly that no context was found rather than falling back to outside knowledge", async () => {
    fakeSupabase = makeFakeSupabase({ agents: [agent], chunks: [] });

    await POST(chatRequest({ message: "What's your refund policy?", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    const call = streamTextMock.mock.calls[0][0];
    expect(call.system).toContain("(no matching context found)");
  });

  it("writes source-url parts for the sources behind the retrieved chunks", async () => {
    fakeSupabase = makeFakeSupabase({
      agents: [agent],
      chunks: [
        { content: "Refunds are available within 30 days.", source_id: "src-1", similarity: 0.9 },
        { content: "Refunds require a receipt.", source_id: "src-1", similarity: 0.8 },
        { content: "Exchanges are handled separately.", source_id: "src-2", similarity: 0.7 },
      ],
      sources: [
        { id: "src-1", label: "Refund Policy", raw_content: "https://example.com/refunds" },
        { id: "src-2", label: "Exchange Policy", raw_content: "https://example.com/exchanges" },
      ],
    });

    const res = await POST(
      chatRequest({ message: "What's your refund policy?", visitorId: "visitor-1" }),
      { params: Promise.resolve({ agentId: "agent-1" }) },
    );

    const written = (res as Response & { __written: unknown[] }).__written;
    expect(written).toEqual([
      {
        type: "source-url",
        sourceId: "src-1",
        url: "https://example.com/refunds",
        title: "Refund Policy",
      },
      {
        type: "source-url",
        sourceId: "src-2",
        url: "https://example.com/exchanges",
        title: "Exchange Policy",
      },
    ]);
  });

  it("writes no source-url parts when no chunks matched", async () => {
    fakeSupabase = makeFakeSupabase({ agents: [agent], chunks: [] });

    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    const written = (res as Response & { __written: unknown[] }).__written;
    expect(written).toEqual([]);
  });

  it("calls the Gateway with the agent's own model/temperature and user/tags, never quotaEntityId", async () => {
    await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    const call = streamTextMock.mock.calls[0][0];
    expect(call.model).toBe("openai/gpt-4o-mini");
    expect(call.temperature).toBe(0.3);
    // Regression guard: quotaEntityId requires a quota entity
    // pre-provisioned in the Vercel dashboard - sending an arbitrary
    // Clerk org_id there makes the Gateway 400 every request (see
    // lib/ingestion history). user/tags are the safe substitute.
    expect(call.providerOptions.gateway).not.toHaveProperty("quotaEntityId");
    expect(call.providerOptions.gateway.user).toBe("org-1");
    expect(call.providerOptions.gateway.tags).toContain("org:org-1");
  });

  it("resolves the 'auto' sentinel to a real model id before calling the Gateway", async () => {
    fakeSupabase = makeFakeSupabase({ agents: [{ ...agent, model: "auto" }] });
    resolveAutoModelIdMock.mockResolvedValue("anthropic/claude-3-5-haiku");

    await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(streamTextMock.mock.calls[0][0].model).toBe("anthropic/claude-3-5-haiku");
  });

  it("returns a 503 instead of calling the Gateway with an invalid model when 'auto' can't be resolved", async () => {
    fakeSupabase = makeFakeSupabase({ agents: [{ ...agent, model: "auto" }] });
    resolveAutoModelIdMock.mockResolvedValue(undefined);

    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(res.status).toBe(503);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("persists both the user and assistant turns once the stream finishes", async () => {
    await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    const call = streamTextMock.mock.calls[0][0];
    await call.onFinish({ text: "Hello! How can I help?" });

    expect(fakeSupabase.tables.messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: "Hi",
        org_id: "org-1",
        agent_id: "agent-1",
      }),
      expect.objectContaining({
        role: "assistant",
        content: "Hello! How can I help?",
        org_id: "org-1",
        agent_id: "agent-1",
      }),
    ]);
  });
});
