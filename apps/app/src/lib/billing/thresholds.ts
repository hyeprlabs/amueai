/**
 * Single source of truth for the 80% / 100% credit thresholds
 * (docs/billing-spec.md §7a, §8).
 *
 * Used by BOTH the dashboard credit meter and the alert emails, so the banner
 * a customer sees and the email they receive can never disagree.
 *
 * Measured against TOTAL balance (plan + top-up), not plan credits alone:
 * the question these thresholds answer is "am I about to stop being able to
 * answer messages", and an org sitting on 40,000 top-up credits is not.
 */
export type CreditAlertLevel = 0 | 80 | 100;

export function creditAlertLevel(
  planCredits: number,
  topupCredits: number,
  monthlyAllowance: number,
): CreditAlertLevel {
  const balance = planCredits + topupCredits;
  if (balance <= 0) return 100;
  if (monthlyAllowance <= 0) return 0;
  if (balance / monthlyAllowance <= 0.2) return 80;
  return 0;
}

/** Percentage of the monthly allowance consumed, clamped to 0–100 for display. */
export function percentConsumed(
  planCredits: number,
  topupCredits: number,
  monthlyAllowance: number,
): number {
  if (monthlyAllowance <= 0) return 0;
  const balance = planCredits + topupCredits;
  return Math.min(100, Math.max(0, Math.round((1 - balance / monthlyAllowance) * 100)));
}
