import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isMarkdownEligiblePath, prefersMarkdown } from "@/lib/accept-negotiation";

/**
 * acceptmarkdown.com-style content negotiation, layered onto the Clerk
 * proxy rather than a separate one — Next only runs a single proxy/middleware
 * file per app. A GET request with `Accept: text/markdown` to a page that has
 * a markdown rendition (`src/lib/markdown-render.ts`) is rewritten to the
 * matching `/api/markdown/*` route instead of receiving the HTML page.
 *
 * `Vary: Accept, Accept-Encoding` is set on every response for an eligible
 * path — negotiated or not — so a CDN caches the HTML and markdown variants
 * separately instead of serving whichever one filled the cache first
 * regardless of what a given request actually asked for.
 */
export default clerkMiddleware((_auth, request) => {
  const { pathname } = request.nextUrl;
  if (request.method !== "GET" || !isMarkdownEligiblePath(pathname)) return undefined;

  if (prefersMarkdown(request.headers.get("accept"))) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/markdown${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("Vary", "Accept, Accept-Encoding");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Vary", "Accept, Accept-Encoding");
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
