import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ogImageDescriptor } from "@/lib/og-image";

/** Resolves a route to an absolute URL, e.g. `/pricing` -> `https://amue.ai/pricing`. */
export function absoluteUrl(pathname: string): string {
  return new URL(pathname, siteConfig.url).toString();
}

type CreateMetadataOptions = {
  /**
   * Page title without the site suffix — the root layout template appends it.
   * Pass `{ absolute }` to opt out of the template entirely.
   */
  title: string | { absolute: string };
  description: string;
  /** Route of the page, used for the canonical and Open Graph URL. */
  pathname: string;
  /** Keeps the page out of search results. Use for auth, app and error routes. */
  noIndex?: boolean;
  /** Publishes the page as an Open Graph article instead of a website. */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
  };
};

/**
 * Builds page metadata on top of the defaults declared in the root layout.
 *
 * `metadataBase` and the title template are inherited; everything nested is
 * restated because Next merges metadata objects shallowly.
 */
export function createMetadata({
  title,
  description,
  pathname,
  noIndex = false,
  article,
}: CreateMetadataOptions): Metadata {
  // Every page restates the social fields: Next merges metadata shallowly, so a
  // partial `openGraph` or `twitter` object replaces the root layout's instead of
  // extending it.
  const images = [ogImageDescriptor(typeof title === "string" ? title : undefined)];
  const shared = {
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: pathname,
    title,
    description,
    images,
  };

  return {
    title,
    description,
    alternates: { canonical: pathname },
    openGraph: article
      ? { type: "article", ...shared, ...article }
      : { type: "website", ...shared },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      title,
      description,
      images,
    },
    ...(noIndex && {
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    }),
  };
}

/**
 * Path of a paginated list page, e.g. `/blog?category=guides&page=2`.
 *
 * Shared by the pager links and each page's canonical so a filtered or deeper
 * page is one URL everywhere — a list that canonicalises to page 1 tells search
 * engines the rest of the list is not worth keeping.
 */
export function listPathname(
  basePath: string,
  page: number,
  /** Non-pagination filters (e.g. category) that belong in the same URL. */
  params?: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Collapses whitespace and clips text to a length search engines will display. */
export function truncateForDescription(text: string, maxLength = 155): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  const trimmed = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;

  return `${trimmed.replace(/[,.;:]$/, "")}…`;
}
