import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import type { Change } from "@/payload-types";

const CHANGES_PER_PAGE = 15;

const publishedOnly = { _status: { equals: "published" } } as const;

/** Paginated, published changes, newest first. */
export async function getChanges({
  page = 1,
  limit = CHANGES_PER_PAGE,
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
 * Most recent published change, for the app sidebar's "latest update" widget.
 *
 * Cached per request since the sidebar renders on every dashboard route.
 */
export const getLatestChange = cache(async (): Promise<Change | undefined> => {
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

/** When the changelog last changed, used for the sitemap's `lastModified`. */
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
