import type { NextRequest } from "next/server";

import { runStubChat } from "@/lib/billing/chat-stub";
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

  const { data: bot } = await supabaseAdmin
    .from("chatbots")
    .select("id, org_id, allowed_origins, fallback_message, model")
    .eq("id", botId)
    .single();

  if (!bot) {
    return new Response("Not found", { status: 404 });
  }
  if (!isOriginAllowed(origin, bot.allowed_origins)) {
    return new Response("Origin not allowed", { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message : "";

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

  const { data: bot } = await supabaseAdmin
    .from("chatbots")
    .select("allowed_origins")
    .eq("id", botId)
    .single();

  if (!bot || !isOriginAllowed(origin, bot.allowed_origins)) {
    return new Response("Origin not allowed", { status: 403 });
  }

  return new Response(null, { status: 204, headers: corsHeaders(origin!) });
}

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
