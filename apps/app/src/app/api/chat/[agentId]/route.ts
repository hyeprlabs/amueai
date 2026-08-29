import { NextResponse } from "next/server";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  embed,
  streamText,
  toUIMessageStream,
} from "ai";
import { z } from "zod";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { checkChatRateLimit } from "@/lib/rate-limit";

// Public, unauthenticated route - the widget and the dashboard test-chat
// panel both call this. No Clerk session, so RLS provides no protection
// here: every query below does its own explicit org_id/agent_id
// matching against the service-role client.
const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().optional(),
  visitorId: z.string().min(1),
});

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { message, visitorId } = parsed.data;
  let { conversationId } = parsed.data;

  const supabase = createServiceRoleSupabaseClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("id, org_id, system_prompt, model, temperature, fallback_message")
    .eq("id", agentId)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await checkChatRateLimit(ip, agent.id);
  if (!allowed) {
    return NextResponse.json({ error: "Too many messages - please slow down." }, { status: 429 });
  }

  if (conversationId) {
    // The client (dashboard test-chat, widget) generates its own id up
    // front so it can send it on the very first message - create the row
    // on first use rather than requiring a separate "start conversation"
    // round trip.
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("agent_id", agent.id)
      .eq("visitor_id", visitorId)
      .single();

    if (!existing) {
      const { error: conversationError } = await supabase.from("conversations").insert({
        id: conversationId,
        org_id: agent.org_id,
        agent_id: agent.id,
        visitor_id: visitorId,
      });
      if (conversationError) {
        return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
      }
    }
  } else {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({ org_id: agent.org_id, agent_id: agent.id, visitor_id: visitorId })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
    }
    conversationId = conversation.id;
  }

  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: message });

  const { data: chunks } = await supabase.rpc("match_chunks", {
    query_embedding: JSON.stringify(embedding),
    match_agent_id: agent.id,
    match_count: 6,
  });

  const context = (chunks ?? []).map((chunk) => chunk.content).join("\n---\n");

  const sourceIds = [...new Set((chunks ?? []).map((chunk) => chunk.source_id))];
  const { data: sourceRows } =
    sourceIds.length > 0
      ? await supabase.from("sources").select("id, label, raw_content").in("id", sourceIds)
      : { data: [] };

  const system = `${agent.system_prompt}

Context:
---
${context || "(no matching context found)"}
---

Answer the user's question using only the context above. Never use outside knowledge, even if you're confident it's correct. If the context doesn't contain the answer, say plainly that you don't have that information - don't guess, and don't apologize at length.`;

  const conversationIdForClosure = conversationId;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      for (const source of sourceRows ?? []) {
        writer.write({
          type: "source-url",
          sourceId: source.id,
          url: source.raw_content ?? "",
          title: source.label,
        });
      }

      const result = streamText({
        model: agent.model,
        temperature: agent.temperature,
        system,
        prompt: message,
        // Ties Gateway usage/cost back to the org for observability via `user`
        // (end-user identifier for spend tracking) and `tags`, not
        // `quotaEntityId` - that requires a quota entity pre-provisioned in the
        // Vercel dashboard, and sending an arbitrary Clerk org_id that was never
        // registered there makes the Gateway 400 every request with
        // "Quota entity ... was provided but no quota exists."
        providerOptions: { gateway: { user: agent.org_id, tags: [`org:${agent.org_id}`] } },
        onFinish: async ({ text }) => {
          await supabase.from("messages").insert([
            {
              org_id: agent.org_id,
              agent_id: agent.id,
              conversation_id: conversationIdForClosure,
              role: "user",
              content: message,
            },
            {
              org_id: agent.org_id,
              agent_id: agent.id,
              conversation_id: conversationIdForClosure,
              role: "assistant",
              content: text,
            },
          ]);
        },
      });

      writer.merge(toUIMessageStream({ stream: result.stream }));
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: { "X-Conversation-Id": conversationId },
  });
}
