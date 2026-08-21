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

export type LimitedResource = "chatbots" | "sources" | "seats";

/**
 * Numeric plan limits, typed. Enforcement reads these rather than re-parsing
 * the display strings in `features` — a feature renamed for copy reasons
 * shouldn't be able to silently turn a seat limit into NaN.
 */
export const PLAN_LIMITS: Record<Plan, Record<LimitedResource, number>> = {
  free: { chatbots: 1, sources: 10, seats: 1 },
  pro: { chatbots: 3, sources: 500, seats: 5 },
  business: { chatbots: 10, sources: 2000, seats: 20 },
};

/**
 * The feature strings still drive the UI copy, so the two must agree. Asserted
 * at module load: a limit changed in one place and not the other fails the
 * build rather than shipping a page that advertises a limit we don't enforce.
 */
function assertLimitsMatchFeatures(): void {
  for (const [name, limits] of Object.entries(PLAN_LIMITS) as [
    Plan,
    Record<LimitedResource, number>,
  ][]) {
    for (const [resource, limit] of Object.entries(limits) as [LimitedResource, number][]) {
      const match = (PLANS[name].features as readonly string[]).find((f) =>
        f.startsWith(`${resource}:`),
      );
      if (match !== `${resource}:${limit}`) {
        throw new Error(
          `${name}: PLAN_LIMITS.${resource} = ${limit} but features has "${match ?? "nothing"}"`,
        );
      }
    }
  }
}

assertLimitsMatchFeatures();

export function limitOf(plan: Plan, resource: LimitedResource): number {
  return PLAN_LIMITS[plan][resource];
}

export function hasFeature(plan: Plan, feature: Feature | (string & {})): boolean {
  return (PLANS[plan].features as readonly string[]).includes(feature);
}
