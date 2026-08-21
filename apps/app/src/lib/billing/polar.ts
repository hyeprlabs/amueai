import "server-only";

import { Polar } from "@polar-sh/sdk";

import type { Plan } from "./plans";
import { TOPUP_PACKS, type TopupPackId } from "./topups";

/**
 * Polar client. POLAR_ACCESS_TOKEN is server-only and must never reach a
 * client bundle — the `server-only` import above enforces that at build time.
 */
const accessToken = process.env.POLAR_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error("POLAR_ACCESS_TOKEN is not set — the Polar client cannot be created.");
}

// Defaults to sandbox: an unset value must never silently mean production.
const server = process.env.POLAR_SERVER ?? "sandbox";
if (server !== "sandbox" && server !== "production") {
  throw new Error(`POLAR_SERVER must be "sandbox" or "production", got "${server}".`);
}

export const polar = new Polar({ accessToken, server });

/**
 * Every Polar product ID comes from env — IDs differ between sandbox and
 * production, so a literal here would silently break one environment
 * (docs/billing-spec.md §2). `string | undefined` on purpose — callers must
 * handle an unconfigured product rather than passing "undefined" to Polar.
 *
 * The billing interval affects only what Polar charges, never what the org
 * can do or how many credits it gets — both intervals map to the same plan.
 */
export const SUBSCRIPTION_PRODUCTS: Record<
  "pro" | "business",
  Record<"month" | "year", string | undefined>
> = {
  pro: {
    month: process.env.POLAR_PRODUCT_PRO_MONTHLY,
    year: process.env.POLAR_PRODUCT_PRO_YEARLY,
  },
  business: {
    month: process.env.POLAR_PRODUCT_BUSINESS_MONTHLY,
    year: process.env.POLAR_PRODUCT_BUSINESS_YEARLY,
  },
};

// The reverse lookup a webhook needs (productId -> plan), derived from
// SUBSCRIPTION_PRODUCTS rather than re-listing each env var — one source for
// which product ID maps to which plan, so the two can't drift apart. Unset
// env vars are filtered out: a naive `!`-asserted object would collapse every
// unconfigured ID to the literal key "undefined", mapping a bogus product
// onto a paid plan.
export const PLAN_BY_PRODUCT: Record<string, Plan> = Object.fromEntries(
  Object.entries(SUBSCRIPTION_PRODUCTS).flatMap(([plan, intervals]) =>
    Object.values(intervals)
      .filter((id): id is string => Boolean(id))
      .map((id) => [id, plan as Plan]),
  ),
);

/** Plan for a subscription product ID, or null if it isn't a known plan product. */
export function planForProduct(productId: string): Plan | null {
  return PLAN_BY_PRODUCT[productId] ?? null;
}

/**
 * Server-side allowlist mapping top-up packs to their Polar product IDs
 * (docs/billing-spec.md §2.2). Product metadata carries the credit amount
 * too, but metadata is a convenience, not authority — fulfilment reads
 * credits from TOPUP_PACKS, so a tampered or mis-keyed product can never
 * mint credits.
 */
const TOPUP_PRODUCT_IDS: Record<TopupPackId, string | undefined> = {
  small: process.env.POLAR_PRODUCT_TOPUP_SMALL,
  medium: process.env.POLAR_PRODUCT_TOPUP_MEDIUM,
  large: process.env.POLAR_PRODUCT_TOPUP_LARGE,
};

export function topupProductId(pack: TopupPackId): string | undefined {
  return TOPUP_PRODUCT_IDS[pack];
}

/**
 * Credits for a top-up product ID, or null if it isn't a known top-up pack.
 * Guards against unconfigured env vars: an undefined product ID must never
 * match an incoming webhook's productId.
 */
export function topupCreditsForProduct(productId: string): number | null {
  for (const [pack, id] of Object.entries(TOPUP_PRODUCT_IDS)) {
    if (id && id === productId) return TOPUP_PACKS[pack as TopupPackId].credits;
  }
  return null;
}
