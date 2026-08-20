import { siteConfig } from "@/config/site";

/** Card size X, LinkedIn and Slack all render without cropping. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** Longest headline the card lays out cleanly. */
export const OG_TITLE_MAX_LENGTH = 100;

/** URL of the social card, rendered on demand by `app/og`. */
export function ogImageUrl(title?: string): string {
  if (!title) {
    return "/og";
  }

  return `/og?${new URLSearchParams({ title: title.slice(0, OG_TITLE_MAX_LENGTH) })}`;
}

/**
 * Full image descriptor for `openGraph.images` and `twitter.images`.
 *
 * Next merges metadata shallowly, so every page has to declare its images
 * rather than inheriting them from the root layout.
 */
export function ogImageDescriptor(title?: string) {
  return {
    url: ogImageUrl(title),
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    alt: title ? `${title} — ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`,
  };
}
