import type React from "react";

/**
 * The brand mark: an "A" monogram — not a generic AI glyph (sparkle, chat
 * bubble, circuit node, …) that any AI product could use — with one accent
 * that makes it ours: a single solid node resting in the counter, standing
 * for the one grounded answer your agent gives back. A ring plus a dot, so
 * it stays bold and legible at very small sizes. Plain filled paths, no
 * gradients or strokes, so it renders identically wherever it's used,
 * including inside the OG route's Satori-based image generation. Purely
 * decorative — both consumers already carry their own accessible name via a
 * wrapping, labeled `<Link>`.
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M16 3 L29 29 L3 29 Z M16 12 L21.5 24 L10.5 24 Z" fillRule="evenodd" />
    <circle cx="16" cy="20" r="2.6" />
  </svg>
);

/**
 * The full lockup used in the header and footer: the "A" monogram next to
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
    viewBox="0 0 114 28"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M11 5.1 L19.9 22.9 L2.1 22.9 Z M11 11.3 L14.8 19.5 L7.2 19.5 Z" fillRule="evenodd" />
    <circle cx="11" cy="16.8" r="1.8" />
    <text
      dominantBaseline="central"
      fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="-0.5"
      x="26"
      y="15"
    >
      AmueAI
    </text>
  </svg>
);
