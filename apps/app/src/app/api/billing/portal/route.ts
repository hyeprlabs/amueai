import { NextResponse } from "next/server";

import { createPortalSession } from "@/lib/billing/checkout";
import { BillingError } from "@/lib/billing/errors";

/**
 * Opens the Polar customer portal (invoices, payment methods, plan changes
 * with proration). Shares its admin gate with the Server Actions via
 * lib/billing/checkout.ts. Returns the URL rather than the session token —
 * the OAT must never be exposed client-side. docs/billing-spec.md §6
 */
export async function POST() {
  try {
    return NextResponse.json({ url: await createPortalSession() });
  } catch (err) {
    if (err instanceof BillingError) {
      return NextResponse.json(
        { error: err.code },
        { status: err.code === "FORBIDDEN" ? 403 : 401 },
      );
    }
    console.error("portal route failed:", err);
    return NextResponse.json({ error: "UNEXPECTED" }, { status: 500 });
  }
}
