import type { MetadataRoute } from "next";

import { getLatestChangelogUpdate } from "@/lib/changelog";
import { getPublishedPostSlugs } from "@/lib/blog";
import { getPublishedLegalPages } from "@/lib/legal-pages";
import { absoluteUrl } from "@/lib/seo";

/** Rebuild the sitemap hourly so newly published CMS pages show up on their own. */
export const revalidate = 3600;

const marketingRoutes = [
  { pathname: "/", changeFrequency: "weekly", priority: 1 },
  { pathname: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { pathname: "/blog", changeFrequency: "daily", priority: 0.8 },
] as const;

/**
 * Changelog content lives in Payload, which is unreachable during builds that run
 * without a database. Falling back to no `lastModified` keeps the sitemap valid
 * instead of failing the build outright.
 */
async function getChangelogRoute(): Promise<MetadataRoute.Sitemap> {
  try {
    const lastModified = await getLatestChangelogUpdate();

    return [
      {
        url: absoluteUrl("/changelog"),
        ...(lastModified && { lastModified: new Date(lastModified) }),
        changeFrequency: "weekly",
        priority: 0.7,
      },
    ];
  } catch (error) {
    console.error("[sitemap] Skipping changelog route, Payload could not be reached:", error);

    return [{ url: absoluteUrl("/changelog"), changeFrequency: "weekly", priority: 0.7 }];
  }
}

/**
 * Blog content lives in Payload, which is unreachable during builds that run
 * without a database. Falling back to the static routes keeps the sitemap valid
 * instead of failing the build outright.
 */
async function getBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await getPublishedPostSlugs();

    return posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[sitemap] Skipping blog routes, Payload could not be reached:", error);

    return [];
  }
}

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
    ...(await getBlogRoutes()),
    ...(await getChangelogRoute()),
  ];
}
