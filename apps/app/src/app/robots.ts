import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * Routes that must never reach a search index: the Payload admin and API, the
 * authenticated app and the Clerk auth flows.
 */
const disallowedPaths = [
  "/admin",
  "/api/",
  "/analytics",
  "/overview",
  "/sign-in",
  "/sign-up",
] as const;

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
