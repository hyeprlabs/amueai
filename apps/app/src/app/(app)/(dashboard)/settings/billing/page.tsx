import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Show } from "@clerk/nextjs";
import { Check, Info } from "lucide-react";

import { PortalButton, TopupButton, UpgradeButton } from "@/components/dashboard/billing-actions";
import { CreditMeter } from "@/components/dashboard/credit-meter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { featureLabel } from "@/lib/billing/feature-labels";
import { ANNUAL_DISCOUNT, PLANS, type Plan } from "@/lib/billing/plans";
import { TOPUP_PACKS, type TopupPackId } from "@/lib/billing/topups";
import { createMetadata } from "@/lib/seo";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = createMetadata({
  title: "Billing",
  description: "Manage your organization's plan and credits.",
  pathname: "/settings/billing",
  noIndex: true,
});

/** Paid plans a customer can move to, cheapest first. */
const UPGRADE_TARGETS = ["pro", "business"] as const;

const euro = (cents: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export default async function Page() {
  const { orgId } = await auth.protect();

  // No active organization, or a failed read, must NOT render as "you're on
  // the Free plan" — a paying customer would be shown upgrade buttons for a
  // plan they already have, and a member could act on state we never read.
  if (!orgId) return <BillingUnavailable reason="no-org" />;

  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("plan, status, plan_credits, topup_credits, period_end, cancel_at_period_end")
    .eq("clerk_org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("billing page: failed to read organization", { orgId, error });
    return <BillingUnavailable reason="error" />;
  }

  // A genuinely missing row is the expected pre-webhook state, and free is the
  // correct answer for it.
  const plan = (org?.plan as Plan | undefined) ?? "free";
  const planConfig = PLANS[plan];
  const status = org?.status ?? "active";

  return (
    <section className="max-w-4xl space-y-6">
      <header className="space-y-1">
        <h2 className="font-medium text-lg">Billing</h2>
        <p className="text-muted-foreground text-sm">
          Your plan and credits apply to this organization.
        </p>
      </header>

      {status === "past_due" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Payment failed</CardTitle>
            <CardDescription>
              We couldn&apos;t process your last payment. Your chatbots keep working — update your
              payment method to avoid interruption.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{planConfig.label}</CardTitle>
              <Badge variant={plan === "free" ? "secondary" : "default"}>
                {status === "past_due" ? "Past due" : "Current plan"}
              </Badge>
            </div>
            <CardDescription>
              {plan === "free"
                ? "Free forever — 100 credits every month."
                : `${euro(planConfig.monthlyCents)} per month, billed to this organization.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {org?.period_end && (
              <p className="text-muted-foreground text-sm">
                {org.cancel_at_period_end ? "Access ends" : "Renews"} on{" "}
                {new Date(org.period_end).toLocaleDateString("de-DE")}
              </p>
            )}

            <Show
              when={{ permission: "org:billing:manage" }}
              fallback={<AskAnAdminNotice action="change the plan" />}
            >
              <div className="space-y-3">
                {UPGRADE_TARGETS.filter((target) => target !== plan).map((target) => (
                  <div className="flex flex-wrap items-center gap-2" key={target}>
                    <UpgradeButton interval="month" plan={target}>
                      {PLANS[target].label} — {euro(PLANS[target].monthlyCents)}/month
                    </UpgradeButton>
                    <UpgradeButton interval="year" plan={target} variant="outline">
                      {PLANS[target].label} annual — {euro(PLANS[target].annualCents)}/year
                    </UpgradeButton>
                  </div>
                ))}
                {plan !== "business" && (
                  <p className="text-muted-foreground text-xs">
                    Annual billing saves {Math.round(ANNUAL_DISCOUNT * 100)}%. Credits are identical
                    on both intervals.
                  </p>
                )}
                {plan !== "free" && <PortalButton />}
              </div>
            </Show>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credits</CardTitle>
            <CardDescription>Usage for the current billing period.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreditMeter
              monthlyAllowance={planConfig.monthlyCredits}
              planCredits={org?.plan_credits ?? 0}
              topupCredits={org?.topup_credits ?? 0}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top up credits</CardTitle>
          <CardDescription>
            {plan === "free"
              ? "Top-ups are available on Pro and Business plans."
              : "Top-up credits never expire and are used after your monthly plan credits."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan === "free" ? (
            <p className="text-muted-foreground text-sm">
              Upgrade to Pro to buy additional credits.
            </p>
          ) : (
            <Show
              when={{ permission: "org:billing:manage" }}
              fallback={<AskAnAdminNotice action="buy credits" />}
            >
              <div className="flex flex-wrap gap-2">
                {(
                  Object.entries(TOPUP_PACKS) as [TopupPackId, (typeof TOPUP_PACKS)[TopupPackId]][]
                ).map(([id, pack]) => (
                  <TopupButton
                    key={id}
                    label={`${euro(pack.priceCents)} — ${pack.credits.toLocaleString("de-DE")} credits`}
                    pack={id}
                  />
                ))}
              </div>
            </Show>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What&apos;s included</CardTitle>
          <CardDescription>Your {planConfig.label} plan allowances.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {planConfig.features.map((feature) => (
            <div className="flex items-start gap-2 text-sm" key={feature}>
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{featureLabel(feature)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Prices are in EUR and exclude VAT, which is calculated at checkout. Invoices and payment
        methods are managed by our billing provider.
      </p>
    </section>
  );
}

/** Members can see billing state — they just can't mutate it. §1.2 */
function AskAnAdminNotice({ action }: { action: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">
        Ask an organization admin to {action}.{" "}
        <Link className="text-primary underline underline-offset-4" href="/settings/organization">
          View admins
        </Link>
      </p>
    </div>
  );
}

/**
 * Shown instead of the plan cards when we can't establish what the org
 * actually has. Rendering the Free card here would be a confident lie.
 */
function BillingUnavailable({ reason }: { reason: "no-org" | "error" }) {
  return (
    <section className="max-w-4xl space-y-6">
      <header className="space-y-1">
        <h2 className="font-medium text-lg">Billing</h2>
      </header>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>
            {reason === "no-org" ? "No organization selected" : "Couldn't load billing"}
          </CardTitle>
          <CardDescription>
            {reason === "no-org"
              ? "Plans and credits belong to an organization. Select or create one to manage billing."
              : "We couldn't read your plan and credits just now. Nothing has changed — please try again in a moment."}
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}
