import type { MetadataRoute } from "next";

import { getPublishedPostSlugs } from "@/lib/blog";
import { getLatestChangelogUpdate } from "@/lib/changelog";
import { getLatestCompetitorUpdate, getPublishedCompetitorSlugs } from "@/lib/competitors";
import { getPublishedLegalPages } from "@/lib/legal-pages";
import { absoluteUrl } from "@/lib/seo";

/** Rebuild the sitemap hourly so newly published CMS pages show up on their own. */
export const revalidate = 3600;

const marketingRoutes = [
  { pathname: "/", changeFrequency: "weekly", priority: 1 },
  { pathname: "/features/agent", changeFrequency: "monthly", priority: 0.9 },
  { pathname: "/features/channels", changeFrequency: "monthly", priority: 0.8 },
  { pathname: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { pathname: "/blog", changeFrequency: "daily", priority: 0.8 },
  { pathname: "/about", changeFrequency: "monthly", priority: 0.6 },
  { pathname: "/contact", changeFrequency: "monthly", priority: 0.6 },
] as const;

/**
 * CMS content is unreachable during builds that run without a database, so
 * every lookup falls back rather than failing the build outright. ISR fills the
 * real entries in once the deploy is live.
 */
async function safely<T>(label: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error(`[sitemap] Skipping ${label}, Payload could not be reached:`, error);
    return fallback;
  }
}

/** An index page whose `lastModified` is the newest timestamp among its entries. */
async function indexRoute(
  label: string,
  pathname: string,
  getLastModified: () => Promise<string | undefined>,
  { changeFrequency, priority }: { changeFrequency: "weekly"; priority: number },
): Promise<MetadataRoute.Sitemap> {
  const lastModified = await safely(label, getLastModified, undefined);

  return [
    {
      url: absoluteUrl(pathname),
      ...(lastModified && { lastModified: new Date(lastModified) }),
      changeFrequency,
      priority,
    },
  ];
}

async function getBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  const posts = await safely("blog routes", getPublishedPostSlugs, []);

  return posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

async function getCompetitorRoutes(): Promise<MetadataRoute.Sitemap> {
  const competitors = await safely("competitor routes", getPublishedCompetitorSlugs, []);

  return competitors.map((competitor) => ({
    url: absoluteUrl(`/vs/${competitor.slug}`),
    lastModified: new Date(competitor.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}

async function getLegalRoutes(): Promise<MetadataRoute.Sitemap> {
  const pages = await safely("legal pages", getPublishedLegalPages, []);

  return pages.map((page) => ({
    url: absoluteUrl(`/legal/${page.slug}`),
    lastModified: new Date(page.updatedAt),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No `lastModified` for the marketing routes: the only value available at
  // request time is "now", which crawlers rightly ignore. CMS-backed routes
  // carry a real timestamp.
  const [legal, posts, competitors, changelog, competitorsIndex] = await Promise.all([
    getLegalRoutes(),
    getBlogRoutes(),
    getCompetitorRoutes(),
    indexRoute("changelog", "/changelog", getLatestChangelogUpdate, {
      changeFrequency: "weekly",
      priority: 0.7,
    }),
    indexRoute("competitors index", "/competitors", getLatestCompetitorUpdate, {
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  ]);

  return [
    ...marketingRoutes.map(({ pathname, changeFrequency, priority }) => ({
      url: absoluteUrl(pathname),
      changeFrequency,
      priority,
    })),
    ...competitorsIndex,
    ...legal,
    ...posts,
    ...competitors,
    ...changelog,
  ];
}
