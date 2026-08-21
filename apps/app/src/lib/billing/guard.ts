import "server-only";

import { auth } from "@clerk/nextjs/server";

import { BillingError } from "./errors";

/**
 * The single entry gate for every billing mutation (checkout, portal,
 * top-ups, plan changes). `orgId` always comes from the session, never from
 * a request body or query param — accepting it as input would let any member
 * of any org buy for, or cancel, any other org.
 *
 * `org:billing:manage` is a custom permission (docs/billing-spec.md §1.2) —
 * create it on the admin role in the Clerk Dashboard.
 */
export async function requireBillingAdmin() {
  const { userId, orgId, has } = await auth();
  if (!userId || !orgId) throw new BillingError("NO_ORG");
  if (!has({ permission: "org:billing:manage" })) throw new BillingError("FORBIDDEN");
  return { userId, orgId };
}
