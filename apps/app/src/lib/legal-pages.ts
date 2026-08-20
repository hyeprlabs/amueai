import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import type { LegalPage } from "@/payload-types";

/** Drafts must stay out of both the public pages and the sitemap. */
const publishedOnly = { _status: { equals: "published" } };

/**
 * Loads a single legal page.
 *
 * Cached per request so the page body and its `generateMetadata` share one query
 * instead of hitting Payload twice.
 */
export const getLegalPage = cache(async (slug: string): Promise<LegalPage | undefined> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "legal-pages",
    where: { and: [{ slug: { equals: slug } }, publishedOnly] },
    limit: 1,
  });

  return docs[0];
});

/** Every published legal page, ordered by slug — used to build the sitemap. */
export async function getPublishedLegalPages(): Promise<LegalPage[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "legal-pages",
    where: publishedOnly,
    pagination: false,
    sort: "slug",
  });

  return docs;
}
