import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import { siteConfig } from "@/config/site";
import type { Competitor } from "@/payload-types";

const COMPETITORS_PER_PAGE = 20;

const publishedOnly = { _status: { equals: "published" } } as const;

/** The page headline and default meta title for a competitor: always computed, never freeform. */
export function competitorPageTitle(name: string): string {
  return `${siteConfig.name} vs. ${name}`;
}

/**
 * Loads a single competitor by slug.
 *
 * Cached per request so the page body and its `generateMetadata` share one
 * query. Pass `draft: true` from a route with Draft Mode enabled to read the
 * latest unpublished revision instead.
 */
export const getCompetitorBySlug = cache(
  async (
    slug: string,
    { draft = false }: { draft?: boolean } = {},
  ): Promise<Competitor | undefined> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "competitors",
      where: draft
        ? { slug: { equals: slug } }
        : { and: [{ slug: { equals: slug } }, publishedOnly] },
      draft,
      limit: 1,
      depth: 2,
    });

    return docs[0];
  },
);

/**
 * Paginated, published competitors.
 *
 * Sorted by name so `/competitors` reads like a directory and its ordering
 * stays stable as comparisons are added. A moving list would keep changing
 * what each paginated URL contains.
 */
export async function getCompetitors({
  page = 1,
  limit = COMPETITORS_PER_PAGE,
}: { page?: number; limit?: number } = {}) {
  const payload = await getPayload({ config });

  return payload.find({
    collection: "competitors",
    where: publishedOnly,
    sort: "name",
    page,
    limit,
    depth: 1,
  });
}

/** Every published competitor's slug and updatedAt, used to build the sitemap. */
export async function getPublishedCompetitorSlugs(): Promise<
  Pick<Competitor, "slug" | "updatedAt">[]
> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "competitors",
    where: publishedOnly,
    pagination: false,
    sort: "slug",
    depth: 0,
    select: { slug: true, updatedAt: true },
  });

  return docs as Pick<Competitor, "slug" | "updatedAt">[];
}

/**
 * Related comparisons: the curated list, falling back to the next competitors
 * by name so every article links on to its siblings.
 */
export async function getRelatedCompetitors(
  competitor: Competitor,
  limit = 3,
): Promise<Competitor[]> {
  const curated = (competitor.relatedCompetitors ?? []).filter(
    (related): related is Competitor => typeof related === "object",
  );
  if (curated.length > 0) return curated.slice(0, limit);

  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "competitors",
    where: { and: [publishedOnly, { id: { not_equals: competitor.id } }] },
    sort: "name",
    limit,
    depth: 1,
  });

  return docs;
}

/** When the competitors index last changed. Used for the sitemap's `lastModified`. */
export async function getLatestCompetitorUpdate(): Promise<string | undefined> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "competitors",
    where: publishedOnly,
    pagination: false,
    sort: "-updatedAt",
    limit: 1,
    depth: 0,
    select: { updatedAt: true },
  });

  return docs[0]?.updatedAt;
}
