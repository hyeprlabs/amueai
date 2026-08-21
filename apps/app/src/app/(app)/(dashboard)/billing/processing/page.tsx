import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { BillingProcessing } from "@/components/dashboard/billing-processing";
import { buttonVariants } from "@/components/ui/button";
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
  if (!orgId) return <BillingUnavailable />;

  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("plan, plan_credits, topup_credits")
    .eq("clerk_org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();

  // The baseline this page hands to BillingProcessing is the thing the poll
  // compares against. A failed read that defaults to free/0 makes an already
  // completed upgrade look like a change, so the page would declare success
  // without a webhook ever landing. Refuse to guess.
  if (error || !org) {
    console.error("billing processing: failed to read organization", { orgId, error });
    return <BillingUnavailable />;
  }

  return (
    <BillingProcessing
      initialBalance={(org.plan_credits ?? 0) + (org.topup_credits ?? 0)}
      initialPlan={org.plan}
    />
  );
}

function BillingUnavailable() {
  return (
    <section className="flex min-h-[60svh] max-w-md flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-medium text-lg">We couldn&apos;t load your billing details</h1>
      <p className="text-muted-foreground text-sm">
        If you just completed checkout, your payment is safe — we simply can&apos;t confirm it right
        now. Try again in a moment.
      </p>
      <Link className={buttonVariants({ variant: "outline" })} href="/settings/billing">
        Go to billing
      </Link>
    </section>
  );
}
