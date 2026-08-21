import { WebhookVerificationError, validateEvent } from "@polar-sh/sdk/webhooks";
import type { NextRequest } from "next/server";

import { planForProduct, topupCreditsForProduct } from "@/lib/billing/polar";
import { PLANS, type Plan } from "@/lib/billing/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Public route — excluded from proxy.ts's matcher, verifies its own signature.
// docs/billing-spec.md §5

type PolarEvent = ReturnType<typeof validateEvent>;

export async function POST(req: NextRequest) {
  const body = await req.text(); // raw body — re-serialized JSON fails verification

  let event: PolarEvent;
  try {
    event = validateEvent(
      body,
      {
        "webhook-id": req.headers.get("webhook-id") ?? "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": req.headers.get("webhook-signature") ?? "",
      },
      process.env.POLAR_WEBHOOK_SECRET!,
    );
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return Response.json({ received: false }, { status: 403 });
    }
    throw err;
  }

  // Dedupe on webhook-id: unique per delivery, reused across retries. NOT
  // event.data.id — that's the resource ID, shared by distinct events about
  // the same resource (order.created and order.paid carry the same one).
  const eventId = req.headers.get("webhook-id");
  if (!eventId) return Response.json({ received: false }, { status: 400 });

  // Claim: true on first delivery, or on retry of a previously FAILED event.
  // False only when a previous delivery already succeeded. docs/billing-spec.md §5.2
  const { data: claimed, error: claimError } = await supabaseAdmin.rpc("claim_webhook_event", {
    p_id: eventId,
    p_provider: "polar",
    p_type: event.type,
    p_payload: JSON.parse(body),
  });
  if (claimError) throw claimError;
  if (!claimed) return Response.json({ received: true });

  try {
    await handlePolarEvent(event, eventId);
    await supabaseAdmin
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString(), error: null })
      .eq("id", eventId);
  } catch (err) {
    await supabaseAdmin
      .from("webhook_events")
      .update({ error: String(err) })
      .eq("id", eventId);
    throw err; // non-2xx → Polar retries, and the claim above lets the retry through
  }

  return Response.json({ received: true });
}

async function handlePolarEvent(event: PolarEvent, eventId: string) {
  switch (event.type) {
    case "customer.state_changed":
      return onCustomerStateChanged(event.data);
    case "order.paid":
      return onOrderPaid(event.data);
    case "order.refunded":
      return onOrderRefunded(event.data, eventId);
    case "subscription.revoked":
      return onSubscriptionRevoked(event.data);
    default:
      return;
  }
}

/**
 * Complete state payload, so this is a pure idempotent write with no ordering
 * logic — whatever Polar says is true, wins. Also covers past_due: Polar has
 * no `subscription.past_due` webhook, the status arrives here instead.
 * Deliberately does NOT cut off a past_due org — see grant_monthly_credits().
 */
async function onCustomerStateChanged(state: {
  id: string;
  externalId: string | null;
  email: string;
  taxId?: Array<string | unknown | null> | null;
  activeSubscriptions: Array<{
    id: string;
    status: string;
    productId: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }>;
}) {
  const orgId = state.externalId;
  if (!orgId) return; // not one of ours

  // Never pick an arbitrary subscription: if a customer somehow holds more
  // than one, the org is entitled to the most generous of them, and index 0 is
  // whatever order Polar happened to serialise.
  const subscription = highestPlanSubscription(state.activeSubscriptions);
  let plan: Plan | null = null;
  if (subscription) {
    plan = planForProduct(subscription.productId);
    // An active subscription we can't map to a plan means our product-ID env
    // vars are wrong or incomplete. Writing "free" here would strip a paying
    // customer's entitlements on the spot; throwing leaves the row untouched
    // and lets Polar retry once the config is fixed.
    if (!plan) {
      throw new Error(
        `Polar webhook: active subscription ${subscription.id} has unmapped product ${subscription.productId}`,
      );
    }
  }
  const vatId = Array.isArray(state.taxId)
    ? (state.taxId.find((v) => typeof v === "string") as string | undefined)
    : undefined;

  const { error } = await supabaseAdmin
    .from("organizations")
    .update({
      polar_customer_id: state.id,
      billing_email: state.email,
      ...(vatId ? { vat_id: vatId } : {}),
      plan: plan ?? "free",
      status: subscription?.status === "past_due" ? "past_due" : "active",
      period_end: subscription?.currentPeriodEnd?.toISOString() ?? null,
      cancel_at_period_end: subscription?.cancelAtPeriodEnd ?? false,
      polar_subscription_id: subscription?.id ?? null,
    })
    .eq("clerk_org_id", orgId);
  if (error) throw error;
}

/**
 * The most generous of a customer's active subscriptions. Ranked by
 * monthlyCredits from the existing PLANS metadata rather than a second
 * hand-maintained ordering. Falls back to the first entry when none of them
 * map to a known plan — the caller throws on that case.
 */
function highestPlanSubscription<T extends { productId: string }>(
  subscriptions: readonly T[],
): T | undefined {
  let best: T | undefined;
  let bestRank = Number.NEGATIVE_INFINITY;

  for (const subscription of subscriptions) {
    const plan = planForProduct(subscription.productId);
    const rank = plan ? PLANS[plan].monthlyCredits : Number.NEGATIVE_INFINITY;
    if (!best || rank > bestRank) {
      best = subscription;
      bestRank = rank;
    }
  }

  return best;
}

/**
 * Top-up fulfilment ONLY. Plan credits deliberately do NOT come from here —
 * an annual subscriber produces one order.paid per year but is owed credits
 * every month, so those come from grant_monthly_credits() on a cron instead.
 * docs/billing-spec.md §5.1
 */
async function onOrderPaid(order: { productId: string; customer: { externalId: string | null } }) {
  const orgId = order.customer.externalId;
  if (!orgId) return;

  // Credits come from the server-side allowlist, never from product metadata.
  const credits = topupCreditsForProduct(order.productId);
  if (credits === null) return; // a plan order, or an unknown product — nothing to fulfil

  const { error } = await supabaseAdmin.rpc("add_topup_credits", {
    p_org_id: orgId,
    p_amount: credits,
  });
  if (error) throw error;
}

/**
 * Claw back refunded top-up credits. Allowed to go negative — usage stays
 * blocked until the balance recovers. docs/billing-spec.md §5
 *
 * `refundedAmount` is CUMULATIVE across every refund on the order, not the
 * amount of this one refund. Two things follow, and the old code got both
 * wrong by always subtracting the whole pack:
 *   - A partial refund must remove only the proportional share of credits.
 *   - A second partial refund reports the running total, so applying it as-is
 *     would claw back the first refund's credits all over again. We subtract
 *     what previous *successfully processed* refund events already took.
 */
async function onOrderRefunded(
  order: {
    id: string;
    productId: string;
    netAmount: number;
    refundedAmount: number;
    customer: { externalId: string | null };
  },
  eventId: string,
) {
  const orgId = order.customer.externalId;
  if (!orgId) return;

  const packCredits = topupCreditsForProduct(order.productId);
  if (packCredits === null) return; // a plan order, or an unknown product

  if (!order.netAmount || order.netAmount <= 0) return; // nothing to pro-rate against

  const totalClawback = creditsForRefund(packCredits, order.refundedAmount, order.netAmount);
  const alreadyClawedBack = creditsForRefund(
    packCredits,
    await previouslyRefundedAmount(order.id, eventId),
    order.netAmount,
  );

  const amount = totalClawback - alreadyClawedBack;
  if (amount <= 0) return; // fully accounted for by an earlier delivery

  const { error } = await supabaseAdmin.rpc("add_topup_credits", {
    p_org_id: orgId,
    p_amount: -amount,
  });
  if (error) throw error;
}

/** Credits corresponding to `refundedAmount` cents of a `netAmount` order. */
function creditsForRefund(packCredits: number, refundedAmount: number, netAmount: number): number {
  const ratio = Math.min(1, Math.max(0, refundedAmount / netAmount));
  return Math.round(packCredits * ratio);
}

/**
 * Highest cumulative refundedAmount already applied for this order, read from
 * the webhook_events rows the route writes. Only rows marked processed count —
 * a delivery that failed never applied its clawback, so it must not suppress
 * the retry. `payload` is the raw Polar JSON, hence snake_case.
 */
async function previouslyRefundedAmount(orderId: string, eventId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("webhook_events")
    .select("id, payload")
    .eq("provider", "polar")
    .eq("type", "order.refunded")
    .eq("payload->data->>id", orderId)
    .not("processed_at", "is", null);
  if (error) throw error;

  let highest = 0;
  for (const row of data ?? []) {
    if (row.id === eventId) continue;
    const amount = Number(
      (row.payload as { data?: { refunded_amount?: unknown } } | null)?.data?.refunded_amount ?? 0,
    );
    if (Number.isFinite(amount) && amount > highest) highest = amount;
  }
  return highest;
}

/**
 * Back to free. Top-up credits are explicitly left untouched — the customer
 * paid for those. docs/billing-spec.md §5
 */
async function onSubscriptionRevoked(subscription: { customer: { externalId: string | null } }) {
  const orgId = subscription.customer.externalId;
  if (!orgId) return;

  const { error } = await supabaseAdmin
    .from("organizations")
    .update({
      plan: "free",
      status: "canceled",
      plan_credits: PLANS.free.monthlyCredits,
      polar_subscription_id: null,
      cancel_at_period_end: false,
    })
    .eq("clerk_org_id", orgId);
  if (error) throw error;
}
