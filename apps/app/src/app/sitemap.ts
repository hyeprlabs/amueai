import type { MetadataRoute } from "next";

import { getPublishedLegalPages } from "@/lib/legal-pages";
import { absoluteUrl } from "@/lib/seo";

/** Rebuild the sitemap hourly so newly published CMS pages show up on their own. */
export const revalidate = 3600;

const marketingRoutes = [
  { pathname: "/", changeFrequency: "weekly", priority: 1 },
  { pathname: "/pricing", changeFrequency: "monthly", priority: 0.8 },
] as const;

/**
 * Legal pages live in Payload, which is unreachable during builds that run
 * without a database. Falling back to the static routes keeps the sitemap valid
 * instead of failing the build outright.
 */
async function getLegalRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const pages = await getPublishedLegalPages();

    return pages.map((page) => ({
      url: absoluteUrl(`/legal/${page.slug}`),
      lastModified: new Date(page.updatedAt),
      changeFrequency: "yearly",
      priority: 0.3,
    }));
  } catch (error) {
    console.error("[sitemap] Skipping legal pages, Payload could not be reached:", error);

    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No `lastModified` for the marketing routes: the only value available at
  // request time is "now", which crawlers rightly ignore. Legal pages carry a
  // real timestamp from the CMS.
  return [
    ...marketingRoutes.map(({ pathname, changeFrequency, priority }) => ({
      url: absoluteUrl(pathname),
      changeFrequency,
      priority,
    })),
    ...(await getLegalRoutes()),
  ];
}
