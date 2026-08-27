import type { Media } from "@/payload-types";

/** Resolves a Payload upload relationship into an `<img>`/`<Image>`-ready src + alt pair. */
export function resolveMedia(
  media: number | Media | null | undefined,
  size?: "thumbnail" | "card" | "og",
): { src: string; alt: string } | undefined {
  if (!media || typeof media !== "object") return undefined;

  const sized = size ? media.sizes?.[size] : undefined;
  const src = sized?.url ?? media.url;
  if (!src) return undefined;

  return { src, alt: media.alt };
}
