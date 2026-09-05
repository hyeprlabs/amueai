import type React from "react";

/**
 * The brand mark: a chat bubble — since the product is a chat widget — with
 * a twist instead of the plain, generic version: a small four-point spark
 * punched out of the bubble itself (a hole, not a second competing glyph),
 * standing for the AI answering inside the conversation. One filled path
 * with an even-odd hole for the bubble+spark, plus a separate solid
 * triangle for the tail. No gradients or strokes, so it stays bold at very
 * small sizes and renders identically wherever it's used, including inside
 * the OG route's Satori-based image generation. Purely decorative — both
 * consumers already carry their own accessible name via a wrapping,
 * labeled `<Link>`.
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11 4 L19 4 A8 8 0 0 1 27 12 L27 14 A8 8 0 0 1 19 22 L11 22 A8 8 0 0 1 3 14 L3 12 A8 8 0 0 1 11 4 Z M15 8 L16.06 11.94 L20 13 L16.06 14.06 L15 18 L13.94 14.06 L10 13 L13.94 11.94 Z"
      fillRule="evenodd"
    />
    <path d="M5.3 19.7 L3 29 L8.3 21.5 Z" />
  </svg>
);

/**
 * The full lockup used in the header and footer: the same bubble mark next
 * to the "AmueAI" wordmark, both in a single viewBox. The icon fills most
 * of the lockup's height — bigger and more prominent than the text's
 * cap-height alone — with just enough of a gap before the wordmark to read
 * as one balanced unit. The wordmark is a plain `<text>` glyph in the app's
 * own sans font — safe here since, unlike `LogoIcon`, this only ever
 * renders in the browser.
 */
export const Logo = (props: React.ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 121 30"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M9 4 L17 4 A8 8 0 0 1 25 12 L25 14 A8 8 0 0 1 17 22 L9 22 A8 8 0 0 1 1 14 L1 12 A8 8 0 0 1 9 4 Z M13 8 L14.06 11.94 L18 13 L14.06 14.06 L13 18 L11.94 14.06 L8 13 L11.94 11.94 Z"
      fillRule="evenodd"
    />
    <path d="M3.3 19.7 L1 29 L6.3 21.5 Z" />
    <text
      dominantBaseline="central"
      fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="-0.5"
      x="31"
      y="15"
    >
      AmueAI
    </text>
  </svg>
);
