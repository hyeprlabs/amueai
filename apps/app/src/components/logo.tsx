import type React from "react";

/**
 * Compact "A" mark used where there is no room for the full wordmark (the OG
 * image icon). Built from plain filled paths rather than `<text>`: this also
 * renders inside the OG route's Satori image generation, which has no access
 * to the app's fonts.
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M16 3 L29 29 L3 29 Z M16 13 L21 24 L11 24 Z" fillRule="evenodd" />
  </svg>
);

/**
 * The wordmark used in the header and footer. A plain `<text>` glyph in the
 * app's own sans font — this only ever renders in the browser, so (unlike
 * `LogoIcon`) it isn't constrained to font-free vector paths.
 */
export const Logo = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 92 28" xmlns="http://www.w3.org/2000/svg" {...props}>
    <text
      dominantBaseline="central"
      fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="-0.5"
      x="0"
      y="15"
    >
      AmueAI
    </text>
  </svg>
);
