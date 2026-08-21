"use client";

import { useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import {
  openCustomerPortal,
  startSubscriptionCheckout,
  startTopupCheckout,
} from "@/app/(app)/(dashboard)/settings/billing/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
// Imported from topups.ts, never from polar.ts — polar.ts instantiates the
// Polar client with POLAR_ACCESS_TOKEN and must never be reachable from a
// Client Component, even via a type-only import that happens to be erased.
import type { TopupPackId } from "@/lib/billing/topups";

type ActionResult = { url: string } | { error: string };

function useBillingAction() {
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>) => {
    startTransition(async () => {
      const result = await action();
      if ("url" in result) {
        window.location.href = result.url;
        return;
      }
      toast.add({
        title: "Couldn't continue to checkout",
        description: errorCopy(result.error),
        type: "error",
      });
    });
  };

  return { pending, run };
}

function errorCopy(code: string): string {
  switch (code) {
    case "FORBIDDEN":
      return "Only organization admins can manage billing.";
    case "NO_ORG":
      return "You need an active organization to manage billing.";
    case "FEATURE_LOCKED":
      return "Top-ups are available on Pro and Business plans.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function UpgradeButton({
  plan,
  interval,
  children,
  variant = "default",
}: {
  plan: "pro" | "business";
  interval: "month" | "year";
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const { pending, run } = useBillingAction();

  return (
    <Button
      disabled={pending}
      onClick={() => run(() => startSubscriptionCheckout(plan, interval))}
      variant={variant}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function TopupButton({ pack, label }: { pack: TopupPackId; label: string }) {
  const { pending, run } = useBillingAction();

  return (
    <Button
      disabled={pending}
      onClick={() => run(() => startTopupCheckout(pack))}
      variant="outline"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

export function PortalButton() {
  const { pending, run } = useBillingAction();

  return (
    <Button disabled={pending} onClick={() => run(openCustomerPortal)} variant="outline">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
      Manage subscription &amp; invoices
    </Button>
  );
}
