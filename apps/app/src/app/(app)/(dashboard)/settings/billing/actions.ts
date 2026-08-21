"use server";

import {
  createPortalSession,
  createSubscriptionCheckout,
  createTopupCheckout,
} from "@/lib/billing/checkout";
import { BillingError } from "@/lib/billing/errors";

/**
 * Server Actions are public endpoints invoked by ID, not by path — a proxy
 * matcher never sees them, so the gate must live in the resource. Each of
 * these delegates to lib/billing/checkout.ts, which calls
 * requireBillingAdmin() before doing anything. docs/billing-spec.md §1.1, §6
 */

export type ActionResult = { url: string } | { error: string };

export async function startSubscriptionCheckout(
  plan: "pro" | "business",
  interval: "month" | "year",
): Promise<ActionResult> {
  try {
    return { url: await createSubscriptionCheckout(plan, interval) };
  } catch (err) {
    return toError(err);
  }
}

export async function startTopupCheckout(pack: string): Promise<ActionResult> {
  try {
    return { url: await createTopupCheckout(pack) };
  } catch (err) {
    return toError(err);
  }
}

export async function openCustomerPortal(): Promise<ActionResult> {
  try {
    return { url: await createPortalSession() };
  } catch (err) {
    return toError(err);
  }
}

function toError(err: unknown): { error: string } {
  if (err instanceof BillingError) return { error: err.code };
  // Never leak provider internals to the client.
  console.error("billing action failed:", err);
  return { error: "UNEXPECTED" };
}
