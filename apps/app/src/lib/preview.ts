/** Collections whose documents can be opened in Draft Mode from the admin panel. */
export type PreviewCollection = "blog" | "competitors";

/** Public route a previewable document is served from once Draft Mode is on. */
export const PREVIEW_ROUTES: Record<PreviewCollection, string> = {
  blog: "/blog",
  competitors: "/vs",
};

/**
 * Admin "Preview" link for a document.
 *
 * Points at `/api/preview`, which validates the secret, enables Draft Mode and
 * redirects to the document's public route.
 */
export function previewUrl(collection: PreviewCollection, slug: unknown): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const params = new URLSearchParams({
    secret: process.env.PAYLOAD_PREVIEW_SECRET || "",
    collection,
    slug: typeof slug === "string" ? slug : "",
  });

  return `${siteUrl}/api/preview?${params}`;
}
