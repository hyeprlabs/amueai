import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { BillingProcessing } from "@/components/dashboard/billing-processing";
import { createMetadata } from "@/lib/seo";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = createMetadata({
  title: "Completing your purchase",
  description: "Confirming your payment.",
  pathname: "/billing/processing",
  noIndex: true,
});

/**
 * Post-checkout landing page. The `?checkout=...` param proves nothing —
 * anyone can navigate here — so this page grants NOTHING. It polls our own
 * DB until the Polar webhook lands (typically <2s), which is the only thing
 * that ever writes entitlements. docs/billing-spec.md §5 "success-redirect rule"
 *
 * The pre-checkout plan/balance is read here, server-side, rather than from
 * the client's first poll: capturing it here is as early as the flow allows,
 * which shrinks (does not eliminate) the window where a very fast webhook
 * could land before any baseline is taken, making a real change look like no
 * change at all.
 */
export default async function BillingProcessingPage() {
  const { orgId } = await auth.protect();

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("plan, plan_credits, topup_credits")
    .eq("clerk_org_id", orgId)
    .is("deleted_at", null)
    .single();

  return (
    <BillingProcessing
      initialBalance={(org?.plan_credits ?? 0) + (org?.topup_credits ?? 0)}
      initialPlan={org?.plan ?? "free"}
    />
  );
}
