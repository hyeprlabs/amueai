import "server-only";

import { headers } from "next/headers";

import { getEntitlements } from "./entitlements";
import { BillingError } from "./errors";
import { requireBillingAdmin } from "./guard";
import { hasFeature } from "./plans";
import { SUBSCRIPTION_PRODUCTS, polar, topupProductId } from "./polar";
import { isTopupPackId } from "./topups";
import { siteConfig } from "@/config/site";

/**
 * The one implementation of every billing mutation. Both the Route Handlers
 * (/api/billing/*) and the Server Actions (settings/billing/actions.ts) call
 * these — so there is exactly ONE admin gate and ONE checkout construction to
 * audit, rather than two copies that can drift apart.
 *
 * docs/billing-spec.md §6
 */

export async function createSubscriptionCheckout(
  plan: unknown,
  interval: unknown,
): Promise<string> {
  const { userId, orgId } = await requireBillingAdmin();

  // Never trust the caller: Server Actions and Route Handlers both receive
  // arbitrary runtime input regardless of their TypeScript signatures.
  const planKey = plan === "pro" || plan === "business" ? plan : null;
  const intervalKey = interval === "month" || interval === "year" ? interval : null;
  if (!planKey || !intervalKey) throw new BillingError("PLAN_LIMIT", { reason: "unknown_product" });

  const productId = SUBSCRIPTION_PRODUCTS[planKey][intervalKey];
  if (!productId) throw new BillingError("PLAN_LIMIT", { reason: "unconfigured_product" });

  return createCheckout(productId, orgId, userId);
}

export async function createTopupCheckout(pack: unknown): Promise<string> {
  const { userId, orgId } = await requireBillingAdmin();

  if (!isTopupPackId(pack)) throw new BillingError("PLAN_LIMIT", { reason: "unknown_product" });

  // Top-ups require Pro or above (§2.1) — if free users can buy credits,
  // credits stop being a reason to upgrade and become a way to avoid it.
  const { plan } = await getEntitlements();
  if (!hasFeature(plan, "topups")) throw new BillingError("FEATURE_LOCKED", { feature: "topups" });

  const productId = topupProductId(pack);
  if (!productId) throw new BillingError("PLAN_LIMIT", { reason: "unconfigured_product" });

  return createCheckout(productId, orgId, userId);
}

export async function createPortalSession(): Promise<string> {
  const { orgId } = await requireBillingAdmin();
  const session = await polar.customerSessions.create({
    externalCustomerId: orgId,
    returnUrl: `${siteConfig.url}/settings/billing`,
  });
  return session.customerPortalUrl;
}

async function createCheckout(productId: string, orgId: string, userId: string): Promise<string> {
  const headerList = await headers();
  const checkout = await polar.checkouts.create({
    products: [productId],
    // orgId comes from auth(), never from the request. §6
    externalCustomerId: orgId,
    // Polar derives presentment currency from the IP of whoever creates the
    // session — without this, a Munich customer can be priced in USD. §2.3
    customerIpAddress: headerList.get("x-forwarded-for")?.split(",")[0]?.trim(),
    metadata: { clerk_org_id: orgId, purchased_by: userId },
    successUrl: `${siteConfig.url}/billing/processing?checkout={CHECKOUT_ID}`,
  });
  return checkout.url;
}
