import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { MAX_MESSAGE_LENGTH, runStubChat } from "@/lib/billing/chat-stub";
import { requireModelAccess } from "@/lib/billing/enforce";
import { BillingError } from "@/lib/billing/errors";
import { supabaseAdmin } from "@/lib/supabase/admin";

// STUB — placeholder chat pipeline. There is no real chatbot/LLM product in
// this repo yet; this endpoint exists only to exercise the credit engine
// end-to-end per the Phase 2 done-criteria in docs/billing-spec.md. The
// actual model call and credit charging live in lib/billing/chat-stub.ts,
// shared with /api/widget so the two never drift.

export async function POST(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: chatbot } = await supabaseAdmin
    .from("chatbots")
    .select("id, org_id, model, fallback_message")
    .eq("id", botId)
    .single();
  if (!chatbot || chatbot.org_id !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  // §7 — Free plans are mini-only. Server-side gate; the picker's lock icon
  // is cosmetic.
  try {
    await requireModelAccess(chatbot.model);
  } catch (err) {
    if (err instanceof BillingError) {
      return NextResponse.json({ error: err.code, ...err.details }, { status: 403 });
    }
    throw err;
  }

  const { reply, creditsCharged } = await runStubChat(chatbot, message);

  // creditsCharged is null exactly when the org is out of credits — the
  // dashboard renders its "out of credits" CTA from this flag. §7a
  return NextResponse.json(
    creditsCharged === null ? { reply, outOfCredits: true } : { reply, creditsCharged },
  );
}
