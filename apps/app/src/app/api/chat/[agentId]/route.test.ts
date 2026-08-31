import { beforeEach, describe, expect, it, vi } from "vitest";

import { decodeRateLimitMessage, RATE_LIMIT_MESSAGE } from "@/lib/chat-errors";

const embedMock = vi.fn();
const streamTextMock = vi.fn();
const toUIMessageStreamMock = vi.fn((..._args: unknown[]) => ({}));
vi.mock("ai", () => ({
  embed: (...args: unknown[]) => embedMock(...args),
  streamText: (...args: unknown[]) => streamTextMock(...args),
  createUIMessageStream: ({
    execute,
    onError,
  }: {
    execute: (options: { writer: unknown }) => Promise<void>;
    onError?: (err: unknown) => string;
  }) => {
    const written: unknown[] = [];
    const writer = {
      write: (chunk: unknown) => written.push(chunk),
      merge: () => {},
    };
    const ready = execute({ writer });
    return { written, ready, onError };
  },
  createUIMessageStreamResponse: ({
    stream,
    headers,
  }: {
    stream: { written: unknown[]; ready: Promise<void>; onError?: (err: unknown) => string };
    headers?: Record<string, string>;
  }) => {
    const response = new Response(null, { status: 200, headers });
    // Expose what was written (and the onError handler) for assertions
    // without changing the Response API.
    (
      response as Response & { __written: unknown[]; __onError?: (err: unknown) => string }
    ).__written = stream.written;
    (response as Response & { __onError?: (err: unknown) => string }).__onError = stream.onError;
    return response;
  },
  toUIMessageStream: (...args: unknown[]) => toUIMessageStreamMock(...args),
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

const DEFAULT_FALLBACK_MESSAGE =
  "Sorry, I ran into a problem answering that. Please try again in a moment.";

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
  toUIMessageStreamMock.mockClear();
  checkChatRateLimitMock.mockReset();
  resolveAutoModelIdMock.mockReset();

  embedMock.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
  checkChatRateLimitMock.mockResolvedValue({ success: true, retryAt: undefined });
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

  it("returns 429 without calling the model when rate limited, with a plain-text body", async () => {
    checkChatRateLimitMock.mockResolvedValue({ success: false, retryAt: undefined });

    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(res.status).toBe(429);
    expect(streamTextMock).not.toHaveBeenCalled();
    // Plain text, not JSON: the AI SDK transport turns a non-ok response
    // into `new Error(await response.text())`, so a JSON body would show
    // up as a raw, unparsed blob in the chat UI's error bubble.
    expect(await res.text()).toBe(RATE_LIMIT_MESSAGE);
  });

  it("encodes the exact reset time into the 429 body when our own limiter knows one", async () => {
    checkChatRateLimitMock.mockResolvedValue({ success: false, retryAt: 1735699200000 });

    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(res.status).toBe(429);
    expect(decodeRateLimitMessage(await res.text())).toEqual({
      text: RATE_LIMIT_MESSAGE,
      retryAt: 1735699200000,
    });
  });

  it("distinguishes a Gateway rate limit from other generation failures via the stream's onError", async () => {
    const res = await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    const onError = (res as Response & { __onError?: (err: unknown) => string }).__onError;
    const rateLimitError = {
      name: "AI_RetryError",
      errors: [{ name: "GatewayRateLimitError", statusCode: 429 }],
    };
    const otherError = new Error("network blip");

    expect(onError?.(rateLimitError)).toBe(RATE_LIMIT_MESSAGE);
    expect(onError?.(otherError)).toBe(DEFAULT_FALLBACK_MESSAGE);
  });

  it("also passes the same rate-limit-aware onError to toUIMessageStream, not just createUIMessageStream", async () => {
    // Regression guard: a Gateway failure surfaces as an inline "error"
    // part on streamText's own stream, which toUIMessageStream converts
    // using ITS OWN onError (defaulting to the AI SDK's generic "An error
    // occurred.") - completely separate from createUIMessageStream's
    // onError, which only fires for a thrown/rejected execute(). Without
    // passing onError here too, every generation failure showed that
    // generic AI SDK default instead of the agent's fallback or the
    // rate-limit message, no matter what createUIMessageStream's onError
    // did.
    await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(toUIMessageStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({ onError: expect.any(Function) }),
    );
    const { onError } = toUIMessageStreamMock.mock.calls[0][0] as { onError: (e: unknown) => string };
    expect(onError({ statusCode: 429 })).toBe(RATE_LIMIT_MESSAGE);
    expect(onError(new Error("boom"))).toBe(DEFAULT_FALLBACK_MESSAGE);
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

  it("layers the agent's own system_prompt on top of the base grounding rules, never in place of them", async () => {
    await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    const system = streamTextMock.mock.calls[0][0].system as string;
    expect(system).toContain("Never fill gaps with outside knowledge");
    expect(system).toContain("Additional instructions from the business:");
    expect(system).toContain(agent.system_prompt);
    // The business's own instructions must appear after the base rules,
    // not replace or precede them.
    expect(system.indexOf("Never fill gaps with outside knowledge")).toBeLessThan(
      system.indexOf(agent.system_prompt),
    );
  });

  it("tells the model not to use em dashes", async () => {
    await POST(chatRequest({ message: "Hi", visitorId: "visitor-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(streamTextMock.mock.calls[0][0].system).toContain("Do not use em dashes");
  });

  it("still answers (from empty context) instead of failing the whole turn when retrieval throws", async () => {
    fakeSupabase = makeFakeSupabase({ agents: [agent] });
    embedMock.mockRejectedValueOnce(new Error("Gateway unavailable"));

    const res = await POST(chatRequest({ message: "What's your refund policy?", visitorId: "v-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(res.status).toBe(200);
    expect(streamTextMock).toHaveBeenCalled();
    expect(streamTextMock.mock.calls[0][0].system).toContain("(no matching context found)");
  });

  it("still answers (skipping the source lookup) when the match_chunks RPC throws", async () => {
    fakeSupabase = makeFakeSupabase({ agents: [agent] });
    fakeSupabase.rpc.mockRejectedValueOnce(new Error("RPC timed out"));

    const res = await POST(chatRequest({ message: "Hi", visitorId: "v-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(res.status).toBe(200);
    expect(streamTextMock).toHaveBeenCalled();
  });

  it("uses the agent's configured fallback message in the system prompt instead of leaving it unused", async () => {
    fakeSupabase = makeFakeSupabase({
      agents: [{ ...agent, fallback_message: "I don't have that info - try our support team!" }],
      chunks: [],
    });

    await POST(chatRequest({ message: "Hi", visitorId: "v-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    expect(streamTextMock.mock.calls[0][0].system).toContain(
      "I don't have that info - try our support team!",
    );
  });

  it("returns a friendly fallback (never a raw error) when the stream itself fails", async () => {
    fakeSupabase = makeFakeSupabase({ agents: [agent] });

    const res = await POST(chatRequest({ message: "Hi", visitorId: "v-1" }), {
      params: Promise.resolve({ agentId: "agent-1" }),
    });

    const onError = (res as Response & { __onError?: (err: unknown) => string }).__onError;
    expect(onError?.(new Error("boom"))).toBe(DEFAULT_FALLBACK_MESSAGE);
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
