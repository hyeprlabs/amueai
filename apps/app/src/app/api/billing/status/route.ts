import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("plan, status, plan_credits, topup_credits, period_end, cancel_at_period_end")
    .eq("clerk_org_id", orgId)
    .is("deleted_at", null)
    .single();

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
  } catch {
    // No Polar customer yet is a normal state for a free org, not an error.
    return NextResponse.json({ polarHasSubscription: false });
  }
}
