import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { PLANS, type Plan, limitOf } from "@/lib/billing/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Public route — excluded from proxy.ts's matcher. Verifies its own signature.
// docs/billing-spec.md §1.3

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  const svixId = req.headers.get("svix-id");
  if (!svixId) return new Response("Missing svix-id", { status: 400 });

  // Claim rather than insert-then-handle. The old insert consumed the id
  // before the handler ran, so a handler that threw left a row that made every
  // Svix retry look like an already-handled duplicate — the event was dropped
  // forever with nothing to show for it. claim_webhook_event returns true on
  // first delivery AND on retry of a previously FAILED event, and false only
  // once a delivery has actually succeeded. Matches the Polar route.
  // docs/billing-spec.md §5.2
  const { data: claimed, error: claimError } = await supabaseAdmin.rpc("claim_webhook_event", {
    p_id: svixId,
    p_provider: "clerk",
    p_type: evt.type,
    p_payload: evt,
  });
  if (claimError) throw claimError;
  if (!claimed) return new Response("OK", { status: 200 }); // already processed successfully

  try {
    await handleClerkEvent(evt);
    await supabaseAdmin
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString(), error: null })
      .eq("id", svixId);
  } catch (err) {
    console.error(`Clerk webhook handler failed for ${evt.type}:`, err);
    await supabaseAdmin
      .from("webhook_events")
      .update({ error: String(err) })
      .eq("id", svixId);
    // Non-2xx → Svix retries, and the claim above lets the retry through.
    return new Response("Handler failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

async function handleClerkEvent(evt: Awaited<ReturnType<typeof verifyWebhook>>) {
  switch (evt.type) {
    case "organization.created":
      return onOrganizationCreated(evt.data);
    case "organization.deleted":
      if (!evt.data.id) return;
      return onOrganizationDeleted({ id: evt.data.id });
    case "organizationMembership.created":
      return onMembershipCreated(evt.data);
    case "organizationMembership.deleted":
      return onMembershipDeleted(evt.data);
    default:
      return;
  }
}

/**
 * Every user gets an Organization automatically — Clerk creates it on signup
 * and enforces membership, so this app does none of that provisioning itself.
 * This handler's only job is inserting the billing row for whatever org
 * Clerk just created.
 */
async function onOrganizationCreated(data: { id: string; name: string }) {
  // ignoreDuplicates is critical: a redelivered or dashboard-replayed
  // organization.created must NEVER overwrite billing state. An upsert here
  // would reset a paying Business org back to free/100 credits.
  const { error } = await supabaseAdmin.from("organizations").upsert(
    {
      clerk_org_id: data.id,
      name: data.name,
      plan: "free",
      status: "active",
      plan_credits: PLANS.free.monthlyCredits,
      credits_period: currentPeriod(),
    },
    { onConflict: "clerk_org_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

async function onOrganizationDeleted(data: { id: string }) {
  // Do NOT delete the row or the Polar customer — order history stays for accounting.
  // Polar subscription cancellation is wired up in Phase 3.
  const { error } = await supabaseAdmin
    .from("organizations")
    .update({ status: "canceled", deleted_at: new Date().toISOString() })
    .eq("clerk_org_id", data.id);
  if (error) throw error;
}

async function onMembershipCreated(data: {
  organization: { id: string };
  public_user_data: { user_id: string };
}) {
  const orgId = data.organization.id;
  const joinedUserId = data.public_user_data.user_id;

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("plan")
    .eq("clerk_org_id", orgId)
    .single();
  if (!org) return;

  // limitOf() indexes PLANS[plan] — an unrecognised value (a hand-edited row,
  // a plan renamed in code but not in the DB) would throw, or worse resolve to
  // a limit of 0 and evict a member who is entitled to their seat. Do not
  // enforce a limit we can't actually determine.
  if (!isPlan(org.plan)) {
    console.error("seat enforcement skipped: unknown plan", { orgId, plan: org.plan });
    return;
  }

  const clerk = await clerkClient();
  const { totalCount } = await clerk.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 1,
  });

  const seatLimit = limitOf(org.plan, "seats");
  if (totalCount <= seatLimit) return;

  // Over the seat limit: revoke the membership from THIS event. Never pick a
  // member by list offset — ordering isn't guaranteed, so that could remove a
  // long-standing member (or an admin) instead of the person who just joined.
  await clerk.organizations.deleteOrganizationMembership({
    organizationId: orgId,
    userId: joinedUserId,
  });
}

async function onMembershipDeleted(data: {
  organization: { id: string };
  public_user_data: { user_id: string };
}) {
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("billing_email")
    .eq("clerk_org_id", data.organization.id)
    .single();
  if (!org?.billing_email) return;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(data.public_user_data.user_id);
  const removedEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (removedEmail && removedEmail === org.billing_email) {
    // Spec (§1.3) says "flag the org" but doesn't define storage for the flag.
    // No column exists for this yet — log for now so it isn't silently lost;
    // revisit if/when this needs to surface in the dashboard.
    // Deliberately does NOT log the address itself — this line lands in a
    // general-purpose log sink, and the billing email is customer PII that
    // nothing here needs in order to act on the flag.
    console.warn("Billing email owner removed from org", {
      orgId: data.organization.id,
      userId: data.public_user_data.user_id,
    });
  }
}

function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && Object.hasOwn(PLANS, value);
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
