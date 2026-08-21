import { WebhookVerificationError, validateEvent } from "@polar-sh/sdk/webhooks";
import type { NextRequest } from "next/server";

import { planForProduct, topupCreditsForProduct } from "@/lib/billing/polar";
import { PLANS } from "@/lib/billing/plans";
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
    await handlePolarEvent(event);
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

async function handlePolarEvent(event: PolarEvent) {
  switch (event.type) {
    case "customer.state_changed":
      return onCustomerStateChanged(event.data);
    case "order.paid":
      return onOrderPaid(event.data);
    case "order.refunded":
      return onOrderRefunded(event.data);
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

  const subscription = state.activeSubscriptions[0];
  const plan = subscription ? planForProduct(subscription.productId) : null;
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
 */
async function onOrderRefunded(order: {
  productId: string;
  customer: { externalId: string | null };
}) {
  const orgId = order.customer.externalId;
  if (!orgId) return;

  const credits = topupCreditsForProduct(order.productId);
  if (credits === null) return;

  const { error } = await supabaseAdmin.rpc("add_topup_credits", {
    p_org_id: orgId,
    p_amount: -credits,
  });
  if (error) throw error;
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
