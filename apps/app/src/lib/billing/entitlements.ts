import "server-only";

import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/admin";

import { BillingError } from "./errors";
import { type Feature, type Plan, hasFeature } from "./plans";

export type Entitlements = {
  orgId: string;
  plan: Plan;
  status: string;
};

/**
 * Reads the calling Organization's plan straight from Postgres. Falls back to
 * `free` if the row doesn't exist yet (e.g. a race before the
 * `organization.created` webhook lands) — never blocks the request on that.
 */
export async function getEntitlements(): Promise<Entitlements> {
  const { orgId } = await auth();
  if (!orgId) throw new BillingError("NO_ORG");

  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("plan, status")
    .eq("clerk_org_id", orgId)
    .is("deleted_at", null)
    .single();
  // A missing row is expected (webhook hasn't landed yet) and falls back to
  // free below; anything else (network, DB) shouldn't fail silently.
  if (error && error.code !== "PGRST116") {
    console.error("getEntitlements: failed to read organization", { orgId, error });
    // Defaulting to `free` on a network/DB failure would silently downgrade a
    // paying org and lock them out of features they've paid for. Only the
    // expected no-row case (PGRST116) falls through to the free default.
    throw error;
  }

  return {
    orgId,
    plan: (data?.plan as Plan | undefined) ?? "free",
    status: data?.status ?? "active",
  };
}

/** Throws BillingError("FEATURE_LOCKED") if the org's plan doesn't include `feature`. */
export async function requireFeature(feature: Feature | (string & {})): Promise<Entitlements> {
  const entitlements = await getEntitlements();
  if (!hasFeature(entitlements.plan, feature)) {
    throw new BillingError("FEATURE_LOCKED", { feature });
  }
  return entitlements;
}
