"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 1500;
const FALLBACK_AFTER_MS = 30_000;

type Phase = "polling" | "confirmed" | "slow";
type FallbackResult = { polarHasSubscription: boolean } | null;

/**
 * Polls our own DB (never the checkout redirect params) until the Polar
 * webhook has written the new plan. After 30s, falls back to asking Polar
 * directly — still read-only; the webhook stays the only writer.
 * docs/billing-spec.md §5
 *
 * `initialPlan`/`initialBalance` come from the server component's own query,
 * taken as early in the post-checkout flow as possible — see the page for why.
 */
export function BillingProcessing({
  initialPlan,
  initialBalance,
}: {
  initialPlan: string;
  initialBalance: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("polling");
  const [fallback, setFallback] = useState<FallbackResult>(null);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      if (cancelled) return;

      try {
        const res = await fetch("/api/billing/status", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { plan: string; balance: number };

          if (data.plan !== initialPlan || data.balance !== initialBalance) {
            if (!cancelled) {
              setPhase("confirmed");
              router.replace("/settings/billing");
              router.refresh();
            }
            return;
          }
        }
      } catch {
        // Transient network error — keep polling.
      }

      if (Date.now() - startedAt > FALLBACK_AFTER_MS) {
        // Our DB still shows the old state — ask Polar directly. This never
        // writes anything; the webhook is still the only writer. It only
        // changes what we tell the user while they wait for it to arrive.
        const result = await fetch("/api/billing/status", { method: "POST" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        if (!cancelled) {
          setFallback(result);
          setPhase("slow");
        }
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    let timer = setTimeout(poll, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router, initialPlan, initialBalance]);

  return (
    <section className="flex min-h-[60svh] max-w-md flex-col items-center justify-center gap-4 text-center">
      {phase === "slow" ? (
        <>
          <h1 className="font-medium text-lg">This is taking longer than usual</h1>
          <p className="text-muted-foreground text-sm">
            {fallback?.polarHasSubscription
              ? "Your payment is confirmed. We're still syncing it to your account — your plan will update automatically, usually within a few minutes."
              : "We haven't been able to confirm your payment yet. If you completed checkout, this should resolve shortly — otherwise, no charge was made."}
          </p>
          <Button onClick={() => router.push("/settings/billing")} variant="outline">
            Go to billing
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <h1 className="font-medium text-lg">Completing your purchase</h1>
          <p className="text-muted-foreground text-sm">
            Confirming your payment with our billing provider. This usually takes a couple of
            seconds.
          </p>
        </>
      )}
    </section>
  );
}
