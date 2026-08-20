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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...disallowedPaths],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
