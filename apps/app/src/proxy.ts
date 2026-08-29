import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { waitlistFlag } from "@/lib/flags";

/**
 * Everything that must stay reachable while `waitlist` is on: the landing
 * page itself (it's the waitlist form), the legal pages it links to, the
 * meta/crawler and OG-image routes nothing else depends on, the Payload
 * admin + its API so the team can keep running the site, and Clerk's own
 * frontend API routes (required for `useWaitlist` and auth to function at
 * all, including inside the Payload admin).
 *
 * Everything not matched here — dashboard, sign-in/sign-up, blog, pricing,
 * features, competitors, changelog, about, contact, vs/* — redirects home.
 */
const isAllowedDuringWaitlist = createRouteMatcher([
  "/",
  "/legal(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/og(.*)",
  "/admin(.*)",
  "/api(.*)",
  "/__clerk(.*)",
  "/.well-known(.*)",
]);

export default clerkMiddleware(async (_auth, req) => {
  if ((await waitlistFlag()) && !isAllowedDuringWaitlist(req)) {
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
