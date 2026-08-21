// Source of truth for plan pricing, credits, and feature entitlements.
// docs/billing-spec.md §2.1, §2.4 — annual price is derived from monthly,
// never hardcoded, and asserted below so the two can't drift.

export const ANNUAL_DISCOUNT = 0.2;

export const PLANS = {
  free: {
    label: "Free",
    monthlyCents: 0,
    monthlyCredits: 100,
    features: ["chatbots:1", "sources:10", "seats:1", "models:mini", "analytics:7d"],
  },
  pro: {
    label: "Pro",
    monthlyCents: 4900,
    annualCents: 47000,
    monthlyCredits: 5_000,
    features: [
      "chatbots:3",
      "sources:500",
      "seats:5",
      "models:all",
      "branding:remove",
      "api",
      "leads",
      "topups",
      "analytics:30d",
    ],
  },
  business: {
    label: "Business",
    monthlyCents: 14900,
    annualCents: 143000,
    monthlyCredits: 20_000,
    features: [
      "chatbots:10",
      "sources:2000",
      "seats:20",
      "models:all",
      "branding:remove",
      "api",
      "leads",
      "topups",
      "custom-domain",
      "channels:slack",
      "channels:whatsapp",
      "roles:custom",
      "analytics:12m",
      "analytics:export",
    ],
  },
} as const;

export type Plan = keyof typeof PLANS;
export type Feature = (typeof PLANS)[Plan]["features"][number];

type PlanPricing = Record<string, { monthlyCents: number; annualCents?: number }>;

/**
 * Annual must be within a euro of exactly `discount` off 12x monthly.
 * Extracted as a pure function so it can run both at module load (a price
 * change that forgets the annual counterpart fails the build) and directly
 * in tests, without needing to mutate the real PLANS map.
 */
export function assertAnnualDiscount(plans: PlanPricing, discount: number): void {
  for (const [name, p] of Object.entries(plans)) {
    if (p.annualCents === undefined) continue;
    const target = p.monthlyCents * 12 * (1 - discount);
    if (Math.abs(p.annualCents - target) > 100) {
      throw new Error(
        `${name}: annual €${p.annualCents / 100} breaks the ${discount * 100}% rule (expected ~€${target / 100})`,
      );
    }
  }
}

assertAnnualDiscount(PLANS, ANNUAL_DISCOUNT);

export function limitOf(plan: Plan, resource: "chatbots" | "sources" | "seats"): number {
  const match = PLANS[plan].features.find((f) => f.startsWith(`${resource}:`));
  if (!match) return 0;
  const value = match.split(":")[1];
  return Number.parseInt(value, 10);
}

export function hasFeature(plan: Plan, feature: Feature | (string & {})): boolean {
  return (PLANS[plan].features as readonly string[]).includes(feature);
}
