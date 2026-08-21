import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and routes that verify themselves
    // (webhooks: signature check; widget: Origin allowlist) — clerkMiddleware
    // must never run on these. docs/billing-spec.md §1.1, §8
    "/((?!_next|api/webhooks|api/widget|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API routes, excluding webhooks and widget
    "/(api(?!/webhooks|/widget)|trpc)(.*)",
    // Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
