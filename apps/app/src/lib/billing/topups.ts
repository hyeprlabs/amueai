/**
 * Top-up pack catalogue — labels, prices, and credit amounts only.
 *
 * Deliberately kept free of `server-only` and of Polar product IDs so the
 * billing UI (including Client Components) can import it without ever
 * touching lib/billing/polar.ts, which instantiates the Polar client with
 * POLAR_ACCESS_TOKEN. Product IDs live there and never cross to the client.
 *
 * docs/billing-spec.md §2.2
 */
export const TOPUP_PACKS = {
  small: { label: "Small", credits: 2_000, priceCents: 1900 },
  medium: { label: "Medium", credits: 10_000, priceCents: 6900 },
  large: { label: "Large", credits: 40_000, priceCents: 19900 },
} as const;

export type TopupPackId = keyof typeof TOPUP_PACKS;

export function isTopupPackId(value: unknown): value is TopupPackId {
  return typeof value === "string" && value in TOPUP_PACKS;
}
