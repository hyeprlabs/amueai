import { featureLabels } from "@/lib/billing/feature-labels";
import { ANNUAL_DISCOUNT, PLANS } from "@/lib/billing/plans";
import { siteConfig } from "@/config/site";

/**
 * Plan catalogue shared by the pricing UI and the `Offer` structured data on
 * the pricing page, so what customers read and what crawlers index cannot drift.
 *
 * Prices and credit amounts are DERIVED from lib/billing/plans.ts — the same
 * map that drives entitlements and the annual-discount assertion — so the
 * marketing page can never advertise a price the billing system doesn't charge.
 */
export type Plan = {
  name: string;
  info: string;
  price: {
    monthly: number;
    yearly: number; // yearly, expressed per month
  };
  features: string[];
  btn: {
    text: string;
    href: string;
  };
};

/**
 * Effective per-month price of the annual plan, in whole euros. Derived from
 * the actual annualCents that Polar will charge whenever it is configured, so
 * the advertised figure is the real one; the discount formula is only a
 * fallback for a plan with no annual price yet.
 */
const yearlyPerMonth = (plan: { monthlyCents: number; annualCents?: number }) =>
  plan.annualCents === undefined
    ? Math.round((plan.monthlyCents * (1 - ANNUAL_DISCOUNT)) / 100)
    : Math.round(plan.annualCents / 12 / 100);

export const plans: Plan[] = [
  {
    name: PLANS.free.label,
    info: "Try AmueAI with no time limit",
    price: { monthly: 0, yearly: 0 },
    features: [
      `${PLANS.free.monthlyCredits} message credits per month`,
      ...featureLabels("free"),
      "Community support",
    ],
    btn: { text: "Start free", href: "/sign-up" },
  },
  {
    name: PLANS.pro.label,
    info: "For growing teams",
    price: {
      monthly: PLANS.pro.monthlyCents / 100,
      yearly: yearlyPerMonth(PLANS.pro),
    },
    features: [
      `${PLANS.pro.monthlyCredits.toLocaleString("de-DE")} message credits per month`,
      ...featureLabels("pro"),
      "Email support",
    ],
    btn: { text: "Get started", href: "/sign-up" },
  },
  {
    name: PLANS.business.label,
    info: "For companies running AmueAI at scale",
    price: {
      monthly: PLANS.business.monthlyCents / 100,
      yearly: yearlyPerMonth(PLANS.business),
    },
    features: [
      `${PLANS.business.monthlyCredits.toLocaleString("de-DE")} message credits per month`,
      ...featureLabels("business"),
      "Priority support and onboarding call",
    ],
    btn: { text: "Get started", href: "/sign-up" },
  },
];

export const contactEmail = siteConfig.email;
