import type { Metadata } from "next";
import { Check, CreditCard, HelpCircle, LockKeyhole, RefreshCw } from "lucide-react";

import { BillingPlans } from "@/components/dashboard/billing-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Billing",
  description: "Manage your plan and subscription.",
  pathname: "/settings/billing",
  noIndex: true,
});

export default function Page() {
  return (
    <section className="max-w-5xl space-y-8">
      <header className="space-y-1">
        <h2 className="font-medium text-lg">Billing</h2>
        <p className="text-muted-foreground text-sm">
          Choose the plan that fits your needs. Your subscription applies to this personal account.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CreditCard className="mb-2 size-5 text-primary" />
            <CardTitle>Simple billing</CardTitle>
            <CardDescription>One clear price, billed on a predictable schedule.</CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <RefreshCw className="mb-2 size-5 text-primary" />
            <CardTitle>Change anytime</CardTitle>
            <CardDescription>
              Upgrade, downgrade, or cancel without contacting support.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <LockKeyhole className="mb-2 size-5 text-primary" />
            <CardTitle>Secure checkout</CardTitle>
            <CardDescription>
              Your payment details stay with our secure billing provider.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>
            Compare plans and manage your subscription securely through our billing provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingPlans />
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Every plan includes</CardTitle>
            <CardDescription>
              Start with the essentials and add more room as your work grows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "A secure workspace for your account",
              "Access to product updates and improvements",
              "Reliable data handling and account controls",
              "Help when you need it",
            ].map((item) => (
              <div className="flex items-start gap-2 text-sm" key={item}>
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <HelpCircle className="mb-2 size-5 text-primary" />
            <CardTitle>Billing questions</CardTitle>
            <CardDescription>Useful details before you choose a plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">When does a change take effect?</p>
              <p className="text-muted-foreground">
                Upgrades are available immediately. Downgrades usually apply at the end of the
                current billing period.
              </p>
            </div>
            <div>
              <p className="font-medium">Can I cancel?</p>
              <p className="text-muted-foreground">
                Yes. Cancel from this page and keep access until your current period ends.
              </p>
            </div>
            <div>
              <p className="font-medium">Where are invoices?</p>
              <p className="text-muted-foreground">
                After checkout, your billing provider keeps your invoices and payment history
                available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-center text-muted-foreground text-xs">
        Prices are shown in the currency configured for your account. Taxes may be calculated at
        checkout.
      </p>
    </section>
  );
}
