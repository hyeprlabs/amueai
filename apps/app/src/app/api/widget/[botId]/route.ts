import type { NextRequest } from "next/server";

import { MAX_MESSAGE_LENGTH, runStubChat, type StubChatbot } from "@/lib/billing/chat-stub";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Public widget endpoint — embedded on customers' own websites, so there is
 * no Clerk session here. Excluded from proxy.ts's matcher and does its own
 * verification: an Origin allowlist per chatbot (docs/billing-spec.md §8).
 *
 * This stops the realistic attack — someone lifting a customer's embed code
 * onto their own site to spend that customer's credits. Per-IP and
 * per-session rate limiting are deliberately out of scope (§11); the hard
 * credit cap already bounds the damage to one month's credits.
 *
 * The model call and credit charging live in lib/billing/chat-stub.ts,
 * shared with /api/chat so the two entry points never drift.
 */

export async function POST(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const origin = req.headers.get("origin");

  const authorized = await authorizeWidgetRequest(botId, origin);
  if ("response" in authorized) return authorized.response;
  const { bot } = authorized;

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return new Response("Invalid message", { status: 400, headers: corsHeaders(origin!) });
  }

  const { reply } = await runStubChat(bot, message);

  return Response.json({ reply }, { headers: corsHeaders(origin!) });
}

/** CORS preflight — same allowlist decision as the POST. */
export async function OPTIONS(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  const { botId } = await params;
  const origin = req.headers.get("origin");

  const bot = await authorizeWidgetRequest(botId, origin);
  if ("response" in bot) return bot.response;

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin!),
      // Lets browsers skip the preflight for a day. Safe because the allowlist
      // is per-chatbot config, not per-request state.
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * The lookup-and-allowlist decision both handlers must make identically. If
 * POST and OPTIONS could ever disagree, the browser would preflight
 * successfully and then get a 403 on the real request (or worse, the reverse).
 * Returns the chatbot row, or the rejection Response to send as-is.
 */
async function authorizeWidgetRequest(
  botId: string,
  origin: string | null,
): Promise<{ bot: WidgetChatbot } | { response: Response }> {
  const { data: bot } = await supabaseAdmin
    .from("chatbots")
    .select("id, org_id, allowed_origins, fallback_message, model")
    .eq("id", botId)
    .single();

  if (!bot) return { response: new Response("Not found", { status: 404 }) };
  if (!isOriginAllowed(origin, bot.allowed_origins)) {
    return { response: new Response("Origin not allowed", { status: 403 }) };
  }
  return { bot };
}

type WidgetChatbot = StubChatbot & { allowed_origins: string[] | null };

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function isOriginAllowed(origin: string | null, allowed: string[] | null): boolean {
  if (!origin || !allowed || allowed.length === 0) return false;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  return allowed.includes(host);
}
