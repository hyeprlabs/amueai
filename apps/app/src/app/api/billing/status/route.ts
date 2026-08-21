import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";

import { polar } from "@/lib/billing/polar";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Read-only billing state for the calling org. Backs the /billing/processing
 * poll, and is safe for members as well as admins (docs/billing-spec.md §1.2 —
 * members must be able to SEE billing state, they just can't mutate it).
 */
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "NO_ORG" }, { status: 401 });
  }

  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("plan, status, plan_credits, topup_credits, period_end, cancel_at_period_end")
    .eq("clerk_org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();

  // A DB failure is not "this org is on the free plan". Reporting free here
  // makes the /billing/processing poll believe it has read a real state, so a
  // paid upgrade looks like it silently didn't happen.
  if (error) {
    console.error("billing status: failed to read organization", { orgId, error });
    return NextResponse.json({ error: "STATUS_UNAVAILABLE" }, { status: 503 });
  }

  // Genuinely no row yet (the organization.created webhook hasn't landed) is
  // the one case the free default is correct for.
  return NextResponse.json({
    plan: org?.plan ?? "free",
    status: org?.status ?? "active",
    planCredits: org?.plan_credits ?? 0,
    topupCredits: org?.topup_credits ?? 0,
    balance: (org?.plan_credits ?? 0) + (org?.topup_credits ?? 0),
    periodEnd: org?.period_end ?? null,
    cancelAtPeriodEnd: org?.cancel_at_period_end ?? false,
  });
}

/**
 * 30s fallback for /billing/processing: if the webhook still hasn't landed,
 * ask Polar directly rather than leaving the user staring at a spinner.
 * Never grants credits or entitlements — it only reports what Polar says,
 * and the webhook remains the sole writer. docs/billing-spec.md §5
 */
export async function POST() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "NO_ORG" }, { status: 401 });
  }

  try {
    const state = await polar.customers.getStateExternal({ externalId: orgId });
    return NextResponse.json({
      polarHasSubscription: state.activeSubscriptions.length > 0,
    });
  } catch (err) {
    // No Polar customer yet is a normal state for a free org, not an error —
    // but ONLY that documented case. A timeout or 500 from Polar reported as
    // "no subscription" tells a customer who just paid that we found nothing.
    if (err instanceof ResourceNotFound) {
      return NextResponse.json({ polarHasSubscription: false });
    }
    console.error("billing status: Polar customer lookup failed", { orgId, err });
    return NextResponse.json({ error: "STATUS_UNAVAILABLE" }, { status: 503 });
  }
}
