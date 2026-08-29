import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { waitlistFlag } from "@/lib/flags";

/**
 * The `(dashboard)` route group — everything under it, not the marketing
 * site. Marketing pages stay open during waitlist mode; only the app itself
 * is gated for now.
 */
const isDashboardRoute = createRouteMatcher([
  "/overview(.*)",
  "/analytics(.*)",
  "/settings(.*)",
  "/profile(.*)",
]);

export default clerkMiddleware(async (_auth, req) => {
  if ((await waitlistFlag()) && isDashboardRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
