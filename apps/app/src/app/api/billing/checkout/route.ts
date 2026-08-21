import { NextResponse, type NextRequest } from "next/server";

import { createSubscriptionCheckout, createTopupCheckout } from "@/lib/billing/checkout";
import { BillingError } from "@/lib/billing/errors";

/**
 * Programmatic checkout. Shares its admin gate and checkout construction with
 * the Server Actions via lib/billing/checkout.ts — one implementation, so the
 * two entry points cannot drift apart. docs/billing-spec.md §6
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  try {
    const url =
      body.kind === "topup"
        ? await createTopupCheckout(body.pack)
        : await createSubscriptionCheckout(body.plan, body.interval);

    return NextResponse.json({ url });
  } catch (err) {
    return toResponse(err);
  }
}

function toResponse(err: unknown): NextResponse {
  if (err instanceof BillingError) {
    const status = err.code === "FORBIDDEN" || err.code === "FEATURE_LOCKED" ? 403 : 400;
    return NextResponse.json({ error: err.code }, { status: err.code === "NO_ORG" ? 401 : status });
  }
  console.error("checkout route failed:", err);
  return NextResponse.json({ error: "UNEXPECTED" }, { status: 500 });
}
