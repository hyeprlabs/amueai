import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import type { Changelog } from "@/payload-types";

const ENTRIES_PER_PAGE = 15;

const publishedOnly = { _status: { equals: "published" } } as const;

/** Paginated, published changelog entries, newest first. */
export async function getChangelogEntries({
  page = 1,
  limit = ENTRIES_PER_PAGE,
}: { page?: number; limit?: number } = {}) {
  const payload = await getPayload({ config });

  return payload.find({
    collection: "changelog",
    where: publishedOnly,
    sort: "-publishedAt",
    page,
    limit,
    depth: 1,
  });
}

/**
 * Most recent published entry, for the app sidebar's "latest update" widget.
 *
 * Cached per request since the sidebar renders on every dashboard route.
 */
export const getLatestChangelogEntry = cache(async (): Promise<Changelog | undefined> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "changelog",
    where: publishedOnly,
    sort: "-publishedAt",
    limit: 1,
    depth: 0,
  });

  return docs[0];
});

/** Every published entry's slug + updatedAt, used to build the sitemap `lastModified`. */
export async function getLatestChangelogUpdate(): Promise<string | undefined> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "changelog",
    where: publishedOnly,
    pagination: false,
    sort: "-updatedAt",
    limit: 1,
    depth: 0,
    select: { updatedAt: true },
  });

  return docs[0]?.updatedAt;
}
