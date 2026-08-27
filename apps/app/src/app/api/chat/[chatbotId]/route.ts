import { NextResponse } from "next/server";
import { embed, streamText } from "ai";
import { z } from "zod";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

// Public, unauthenticated route - the widget and the dashboard test-chat
// panel both call this. No Clerk session, so RLS provides no protection
// here: every query below does its own explicit org_id/chatbot_id
// matching against the service-role client.
const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().optional(),
  visitorId: z.string().min(1),
});

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatbotId: string }> },
) {
  const { chatbotId } = await params;

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { message, visitorId } = parsed.data;
  let { conversationId } = parsed.data;

  const supabase = createServiceRoleSupabaseClient();

  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("id, org_id, system_prompt, model, temperature, fallback_message")
    .eq("id", chatbotId)
    .single();

  if (!chatbot) {
    return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
  }

  // TODO(Phase 10): rate-limit by IP + chatbotId via Upstash before this
  // point - RLS provides no protection on this public route.

  const { data: org } = await supabase
    .from("organizations")
    .select("messages_used, message_limit")
    .eq("clerk_org_id", chatbot.org_id)
    .single();

  if (org && org.messages_used >= org.message_limit) {
    return NextResponse.json(
      { error: "This chatbot has reached its message limit for now." },
      { status: 429 },
    );
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
      .eq("chatbot_id", chatbot.id)
      .single();

    if (!existing) {
      const { error: conversationError } = await supabase.from("conversations").insert({
        id: conversationId,
        org_id: chatbot.org_id,
        chatbot_id: chatbot.id,
        visitor_id: visitorId,
      });
      if (conversationError) {
        return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
      }
    }
  } else {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({ org_id: chatbot.org_id, chatbot_id: chatbot.id, visitor_id: visitorId })
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
    match_chatbot_id: chatbot.id,
    match_count: 6,
  });

  const context = (chunks ?? []).map((chunk) => chunk.content).join("\n---\n");

  const system = `${chatbot.system_prompt}

Context:
---
${context || "(no matching context found)"}
---

Answer the user's question using only the context above. If the context doesn't contain the answer, say you don't have that information.`;

  const conversationIdForClosure = conversationId;

  const result = streamText({
    model: chatbot.model,
    temperature: chatbot.temperature,
    system,
    prompt: message,
    onFinish: async ({ text }) => {
      await supabase.from("messages").insert([
        {
          org_id: chatbot.org_id,
          chatbot_id: chatbot.id,
          conversation_id: conversationIdForClosure,
          role: "user",
          content: message,
        },
        {
          org_id: chatbot.org_id,
          chatbot_id: chatbot.id,
          conversation_id: conversationIdForClosure,
          role: "assistant",
          content: text,
        },
      ]);

      await supabase.rpc("increment_message_usage", { p_org_id: chatbot.org_id });
    },
  });

  return result.toUIMessageStreamResponse({
    headers: { "X-Conversation-Id": conversationId },
  });
}
