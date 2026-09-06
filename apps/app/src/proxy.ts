import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { BLOG_VISITOR_COOKIE } from "@/lib/blog-visitor-cookie";
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

  const response = NextResponse.next();

  // Sticky bucketing for the `/blog` A/B test: assign a visitor id on first
  // visit so `blogSectionFlag` keeps returning the same variant afterwards.
  if (!req.cookies.get(BLOG_VISITOR_COOKIE)) {
    response.cookies.set(BLOG_VISITOR_COOKIE, crypto.randomUUID(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
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
