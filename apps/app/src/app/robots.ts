import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * Only the Payload REST and GraphQL endpoints are blocked here.
 *
 * Every private *page* — the Payload admin, the dashboard and the Clerk auth
 * flows — carries a `noindex` meta tag instead. Blocking those in robots.txt
 * would stop crawlers from ever reading that tag, which is what actually keeps
 * a linked URL out of the index.
 */
const disallowedPaths = ["/api/"] as const;

/**
 * `/api/v1/*` is the public, read-only content API — it needs to stay
 * crawlable despite the broader `/api/` disallow above. Longest-prefix-wins
 * is how every major crawler (Google, Bing, and the AI bots this exists for)
 * resolves an allow/disallow overlap, so this more specific rule takes
 * precedence over `Disallow: /api/` for anything under it.
 */
const allowedPaths = ["/", "/api/v1/"] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [...allowedPaths],
      disallow: [...disallowedPaths],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
