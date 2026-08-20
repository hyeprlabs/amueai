import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * `clerkMiddleware()` alone verifies nothing — it just makes auth state
 * available to the app. Every route that must require a signed-in user has to
 * opt in explicitly via `auth.protect()`, which is what actually blocks
 * unauthenticated requests.
 */
const isProtectedRoute = createRouteMatcher(["/overview(.*)", "/analytics(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
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
