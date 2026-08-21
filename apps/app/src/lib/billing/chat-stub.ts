import "server-only";

import { maybeSendCreditAlert } from "./alerts";
import { MODEL_WEIGHTS, creditsFor, withCredits, type ModelName } from "./credits";
import { BillingError } from "./errors";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type StubChatbot = {
  id: string;
  org_id: string;
  model: string;
  fallback_message: string;
};

/**
 * Upper bound on a single inbound chat message. Lives here, next to
 * runStubChat, so /api/chat and /api/widget validate against the same number
 * instead of each inventing their own (or neither doing it at all).
 */
export const MAX_MESSAGE_LENGTH = 4_000;

/** The cheapest supported model — the safe fallback for an unrecognised one. */
const FALLBACK_MODEL: ModelName = "gpt-4o-mini";

function isModelName(value: string): value is ModelName {
  return Object.hasOwn(MODEL_WEIGHTS, value);
}

/**
 * STUB completion — fakes a model response so the credit engine
 * (withCredits/spend_credits) can be exercised end-to-end per the Phase 2
 * done-criteria in docs/billing-spec.md. There is no real chatbot/LLM product
 * in this repo yet. Shared by /api/chat (dashboard) and /api/widget (public)
 * so the two entry points can't drift apart — swap the fake call for a real
 * one later; nothing about the billing wiring here should need to change.
 *
 * Returns `creditsCharged: null` when the org is out of credits — the
 * fallback message is still a normal reply, never a thrown error.
 */
export async function runStubChat(
  bot: StubChatbot,
  message: string,
): Promise<{ reply: string; creditsCharged: number | null }> {
  try {
    const { reply, creditsCharged } = await withCredits(bot.org_id, async () => {
      const inputTokens = Math.ceil(message.length / 4);
      const outputTokens = 50;
      // A chatbot row can hold any string in `model`. Casting it straight to
      // ModelName would index MODEL_WEIGHTS with a missing key and throw on
      // `w.in` — charge the cheapest supported model instead of crashing.
      if (!isModelName(bot.model)) {
        console.warn("chat-stub: unknown model, falling back", {
          chatbotId: bot.id,
          model: bot.model,
        });
      }
      const model = isModelName(bot.model) ? bot.model : FALLBACK_MODEL;
      const actualCredits = creditsFor(model, { inputTokens, outputTokens });

      return {
        result: { reply: `Echo: ${message}`, creditsCharged: actualCredits },
        actualCredits,
      };
    });

    // The credits are already spent at this point — losing the message row
    // silently would leave the ledger and the transcript disagreeing.
    const { error: insertError } = await supabaseAdmin.from("messages").insert({
      chatbot_id: bot.id,
      org_id: bot.org_id,
      credits_charged: creditsCharged,
    });
    if (insertError) {
      console.error("chat-stub: failed to record message", {
        chatbotId: bot.id,
        orgId: bot.org_id,
        insertError,
      });
      throw insertError;
    }

    void maybeSendCreditAlert(bot.org_id);
    return { reply, creditsCharged };
  } catch (err) {
    if (err instanceof BillingError && err.code === "INSUFFICIENT_CREDITS") {
      void maybeSendCreditAlert(bot.org_id);
      // The chatbot's configured fallback — never a stack trace, never a
      // generic error, and never anything that reveals the customer's
      // billing state to their website visitors. docs/billing-spec.md §7a
      return { reply: bot.fallback_message, creditsCharged: null };
    }
    throw err;
  }
}
