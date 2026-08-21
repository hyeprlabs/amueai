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

/** Effective per-month price of the annual plan, in whole euros. */
const yearlyPerMonth = (monthlyCents: number) =>
  Math.round((monthlyCents * (1 - ANNUAL_DISCOUNT)) / 100);

export const plans: Plan[] = [
  {
    name: PLANS.free.label,
    info: "Try AmueAI with no time limit",
    price: { monthly: 0, yearly: 0 },
    features: [
      `${PLANS.free.monthlyCredits} message credits per month`,
      "1 chatbot",
      "10 sources",
      "1 team member",
      "Mini model",
      "7-day analytics retention",
      "Community support",
    ],
    btn: { text: "Start free", href: "/sign-up" },
  },
  {
    name: PLANS.pro.label,
    info: "For growing teams",
    price: {
      monthly: PLANS.pro.monthlyCents / 100,
      yearly: yearlyPerMonth(PLANS.pro.monthlyCents),
    },
    features: [
      `${PLANS.pro.monthlyCredits.toLocaleString("de-DE")} message credits per month`,
      "3 chatbots",
      "500 sources per chatbot",
      "5 team members",
      "All AI models",
      "Remove AmueAI branding",
      "API access and lead capture",
      "Credit top-ups",
      "30-day analytics retention",
      "Email support",
    ],
    btn: { text: "Get started", href: "/sign-up" },
  },
  {
    name: PLANS.business.label,
    info: "For companies running AmueAI at scale",
    price: {
      monthly: PLANS.business.monthlyCents / 100,
      yearly: yearlyPerMonth(PLANS.business.monthlyCents),
    },
    features: [
      `${PLANS.business.monthlyCredits.toLocaleString("de-DE")} message credits per month`,
      "10 chatbots",
      "2,000 sources per chatbot",
      "20 team members",
      "Custom widget domain",
      "Slack and WhatsApp channels",
      "Custom roles and permissions",
      "12-month analytics retention with CSV export",
      "Priority support and onboarding call",
    ],
    btn: { text: "Get started", href: "/sign-up" },
  },
];

export const contactEmail = siteConfig.email;
