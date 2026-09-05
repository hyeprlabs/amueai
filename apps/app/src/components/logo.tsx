import type React from "react";

/**
 * The brand mark: a chat bubble — since the product is a chat widget — with
 * a twist instead of the plain, generic version: a four-point spark punched
 * out of the bubble itself (a hole, not a second competing glyph), standing
 * for the AI answering inside the conversation. Sized large and bold, with
 * a short tail to the bottom-right (the reply direction, not the classic
 * bottom-left "someone else is talking" tail). One filled path with an
 * even-odd hole for the bubble+spark, plus a separate solid triangle for
 * the tail. No gradients or strokes, so it renders identically wherever
 * it's used, including inside the OG route's Satori-based image
 * generation. Purely decorative — both consumers already carry their own
 * accessible name via a wrapping, labeled `<Link>`.
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 33 30"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11 2 L21 2 A9 9 0 0 1 30 11 L30 15 A9 9 0 0 1 21 24 L11 24 A9 9 0 0 1 2 15 L2 11 A9 9 0 0 1 11 2 Z M16 5 L17.8 11.2 L24 13 L17.8 14.8 L16 21 L14.2 14.8 L8 13 L14.2 11.2 Z"
      fillRule="evenodd"
    />
    <path d="M27.4 21.4 L32 28 L24.1 23.5 Z" />
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
    viewBox="0 0 126 30"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M9 2 L19 2 A9 9 0 0 1 28 11 L28 15 A9 9 0 0 1 19 24 L9 24 A9 9 0 0 1 0 15 L0 11 A9 9 0 0 1 9 2 Z M14 5 L15.8 11.2 L22 13 L15.8 14.8 L14 21 L12.2 14.8 L6 13 L12.2 11.2 Z"
      fillRule="evenodd"
    />
    <path d="M25.4 21.4 L30 28 L22.1 23.5 Z" />
    <text
      dominantBaseline="central"
      fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="-0.5"
      x="36"
      y="15"
    >
      AmueAI
    </text>
  </svg>
);
