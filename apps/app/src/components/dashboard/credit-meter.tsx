import { AlertTriangle } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { creditAlertLevel, percentConsumed } from "@/lib/billing/thresholds";
import { cn } from "@/lib/utils";

/**
 * Credit balance meter. Members see this exactly as admins do — a member who
 * hits an empty balance and sees a generic error files a support ticket, so
 * §1.2/§7a require showing them the real reason and who to ask.
 */
export function CreditMeter({
  planCredits,
  topupCredits,
  monthlyAllowance,
}: {
  planCredits: number;
  topupCredits: number;
  monthlyAllowance: number;
}) {
  const balance = planCredits + topupCredits;
  const percentUsed = percentConsumed(planCredits, topupCredits, monthlyAllowance);

  // Same thresholds that drive the alert emails — one source of truth.
  const level = creditAlertLevel(planCredits, topupCredits, monthlyAllowance);
  const isOut = level === 100;
  const isNearLimit = level === 80;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className={cn("font-medium text-2xl tabular-nums", isOut && "text-destructive")}>
          {balance.toLocaleString("de-DE")}
        </span>
        <span className="text-muted-foreground text-sm">credits remaining</span>
      </div>

      <Progress value={percentUsed} />

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Plan credits</dt>
          <dd className="tabular-nums">
            {planCredits.toLocaleString("de-DE")} / {monthlyAllowance.toLocaleString("de-DE")}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Top-up credits</dt>
          <dd className="tabular-nums">{topupCredits.toLocaleString("de-DE")}</dd>
        </div>
      </dl>

      <p className="text-muted-foreground text-xs">
        Plan credits refresh monthly and don&apos;t roll over. Top-up credits never expire and are
        used only once plan credits run out.
      </p>

      {(isOut || isNearLimit) && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border p-3 text-sm",
            isOut
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-border bg-muted/40",
          )}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            {isOut
              ? "You're out of credits. Your chatbots are showing their fallback message instead of answering."
              : `You've used ${percentUsed}% of this month's credits.`}
          </p>
        </div>
      )}
    </div>
  );
}
