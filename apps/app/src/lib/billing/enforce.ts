import "server-only";

import { getEntitlements } from "./entitlements";
import { BillingError } from "./errors";
import { hasFeature } from "./plans";

/**
 * Server-side gates for docs/billing-spec.md §7. Client-side `has()` only
 * decides whether to render a lock icon — this is the actual enforcement.
 *
 * Only requireModelAccess is wired to a real endpoint today (the stub chat
 * pipeline). Chatbot/source/seat count limits (§7a: "enforce at CREATION
 * only, never retroactively") have no product surface to enforce yet — no
 * chatbot-creation UI, no sources table — so add those gates alongside the
 * features that create those resources, following this same shape:
 * getEntitlements() -> limitOf(plan, resource) -> compare to a live count.
 */

/**
 * Model picker gate — §7 "Select a model: Free is mini-only".
 * Free plans may only use the mini model; every other plan has models:all.
 */
export async function requireModelAccess(model: string): Promise<void> {
  const { plan } = await getEntitlements();
  if (hasFeature(plan, "models:all")) return;
  if (model === "gpt-4o-mini") return;
  throw new BillingError("FEATURE_LOCKED", { feature: "models:all", model });
}
