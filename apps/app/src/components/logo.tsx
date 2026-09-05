import type React from "react";

/**
 * The brand mark: two overlapping rounded squares — a bigger one and a
 * smaller one riding its bottom-right corner, the shape modern SaaS app
 * icons use (Linear, Raycast, Vercel, …), not a letterform or a generic AI
 * glyph (sparkle, chat bubble, circuit node, …). Reads as many sources
 * resolving into one small, precise answer. Two solid rounded rects, no
 * gradients or strokes, so it stays bold at very small sizes and renders
 * identically wherever it's used, including inside the OG route's
 * Satori-based image generation. Purely decorative — both consumers already
 * carry their own accessible name via a wrapping, labeled `<Link>`.
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect height="22" rx="7" width="22" x="2" y="3" />
    <rect height="13" rx="4.5" width="13" x="15" y="16" />
  </svg>
);

/**
 * The full lockup used in the header and footer: the mark next to the
 * "AmueAI" wordmark, both in a single viewBox. The icon is sized to fill
 * most of the lockup's height — bigger and more prominent than the text's
 * cap-height alone — with just enough of a gap before the wordmark to read
 * as one balanced unit. The wordmark is a plain `<text>` glyph in the app's
 * own sans font — safe here since, unlike `LogoIcon`, this only ever
 * renders in the browser.
 */
export const Logo = (props: React.ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 120 28"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect height="20" rx="6.5" width="20" x="1" y="2" />
    <rect height="11" rx="4" width="11" x="13" y="14" />
    <text
      dominantBaseline="central"
      fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="-0.5"
      x="30"
      y="15"
    >
      AmueAI
    </text>
  </svg>
);
