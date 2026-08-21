import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

import { BillingError } from "./errors";

// docs/billing-spec.md §4.5 — credits are priced against marginal COGS, not
// "one message." Model prices are USD; plans are EUR — convert explicitly so
// FX drift never silently changes what a credit is worth.
export const USD_PER_EUR = 1.08; // reviewed quarterly, deliberately conservative
export const EUR_PER_CREDIT = 0.0018; // 1 credit ≈ €0.0018 of COGS (~10% buffer)

export const MODEL_WEIGHTS = {
  // USD per 1M tokens
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10.0 },
  "claude-sonnet": { in: 3.0, out: 15.0 },
} as const;

export type ModelName = keyof typeof MODEL_WEIGHTS;
export type Usage = { inputTokens: number; outputTokens: number };

export function creditsFor(model: ModelName, usage: Usage): number {
  const w = MODEL_WEIGHTS[model];
  const usd = (usage.inputTokens * w.in + usage.outputTokens * w.out) / 1_000_000;
  const eur = usd / USD_PER_EUR;
  return Math.max(1, Math.ceil(eur / EUR_PER_CREDIT));
}

/**
 * Gate on read, charge after the call (docs/billing-spec.md §4.1–§4.3).
 * You can't know an LLM call's cost until it finishes: check there's a
 * positive balance, run the call, then charge the actual amount. Never
 * charges for a failed generation — if `fn` throws, spend_credits() is
 * never reached.
 */
export async function withCredits<T>(
  orgId: string,
  fn: () => Promise<{ result: T; actualCredits: number }>,
): Promise<T> {
  const { data: org, error: readError } = await supabaseAdmin
    .from("organizations")
    .select("plan_credits, topup_credits")
    .eq("clerk_org_id", orgId)
    .is("deleted_at", null) // a deleted org's chatbots must stop answering, balance aside
    .maybeSingle();
  // A dependency failure is not "no credits": swallowing it here would charge
  // nothing, serve the fallback message, and look identical to an exhausted
  // balance. Fail loudly instead so the caller can 5xx and the delivery retry.
  if (readError) {
    console.error("withCredits: failed to read balance", { orgId, readError });
    throw readError;
  }
  if (!org) throw new BillingError("NO_ORG");

  const balance = (org.plan_credits ?? 0) + (org.topup_credits ?? 0);
  if (balance <= 0) throw new BillingError("INSUFFICIENT_CREDITS");

  const { result, actualCredits } = await fn();

  const { data: remaining, error } = await supabaseAdmin.rpc("spend_credits", {
    p_org_id: orgId,
    p_amount: actualCredits,
  });
  if (error) throw error;
  if (remaining !== null && remaining < 0) {
    console.warn("credit overdraft", { orgId, remaining });
  }

  return result;
}
