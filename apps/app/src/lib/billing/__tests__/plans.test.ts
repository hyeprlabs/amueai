import { describe, expect, it } from "vitest";

import { ANNUAL_DISCOUNT, PLANS, assertAnnualDiscount } from "@/lib/billing/plans";

describe("assertAnnualDiscount", () => {
  it("passes for the real PLANS map (proves pro/business are exactly 20% off)", () => {
    expect(() => assertAnnualDiscount(PLANS, ANNUAL_DISCOUNT)).not.toThrow();
  });

  it("passes when annual is within €1 of exactly 20% off 12x monthly", () => {
    const plans = { pro: { monthlyCents: 4900, annualCents: 47000 } }; // 4900*12*0.8 = 47040
    expect(() => assertAnnualDiscount(plans, 0.2)).not.toThrow();
  });

  it("throws when annual drifts from the 20% rule by more than a euro", () => {
    const plans = { pro: { monthlyCents: 4900, annualCents: 45000 } }; // way below 20% off
    expect(() => assertAnnualDiscount(plans, 0.2)).toThrow(/breaks the 20% rule/);
  });

  it("throws when a price bump forgets to update the annual price", () => {
    // Monthly raised to €59 but annual left at the old €470 — the exact
    // "forgot to update it" scenario the guard exists to catch.
    const plans = { pro: { monthlyCents: 5900, annualCents: 47000 } };
    expect(() => assertAnnualDiscount(plans, 0.2)).toThrow();
  });

  it("skips plans with no annualCents (e.g. free)", () => {
    const plans = { free: { monthlyCents: 0 } };
    expect(() => assertAnnualDiscount(plans, 0.2)).not.toThrow();
  });
});
