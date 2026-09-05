import type React from "react";

/**
 * The four-point sparkle used as the brand mark — the standard AI-product
 * shorthand (Gemini, Perplexity, Notion AI, …). A slim, sharp-pointed star
 * (waist points sit close to the center) rather than a chunky pinwheel, for
 * a more polished, refined mark. Plain filled paths, no gradients or
 * strokes, so it stays legible at very small sizes and renders identically
 * wherever it's used, including inside the OG route's Satori-based image
 * generation. Purely decorative — both consumers already carry their own
 * accessible name via a wrapping, labeled `<Link>`.
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M16 2 L18.8 13.2 L30 16 L18.8 18.8 L16 30 L13.2 18.8 L2 16 L13.2 13.2 Z" />
  </svg>
);

/**
 * The full lockup used in the header and footer: the sparkle mark next to
 * the "AmueAI" wordmark, both in a single viewBox — sized and spaced so the
 * icon reads at the same visual weight as the text's cap-height, with just
 * enough of a gap between them to read as one balanced unit rather than two
 * separate elements. The wordmark is a plain `<text>` glyph in the app's own
 * sans font — safe here since, unlike `LogoIcon`, this only ever renders in
 * the browser.
 */
export const Logo = (props: React.ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 116 28"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M11 4.4 L12.9 12.1 L20.6 14 L12.9 15.9 L11 23.6 L9.1 15.9 L1.4 14 L9.1 12.1 Z" />
    <text
      dominantBaseline="central"
      fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="-0.5"
      x="27"
      y="15"
    >
      AmueAI
    </text>
  </svg>
);
