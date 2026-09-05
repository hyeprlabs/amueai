import type React from "react";

/**
 * The four-point sparkle used as the brand mark — the standard AI-product
 * shorthand (Gemini, Perplexity, Notion AI, …). Plain filled paths, no
 * gradients or strokes, so it stays legible at very small sizes and renders
 * identically wherever it's used, including inside the OG route's
 * Satori-based image generation.
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M16 2 L20.2 11.8 L30 16 L20.2 20.2 L16 30 L11.8 20.2 L2 16 L11.8 11.8 Z" />
  </svg>
);

/**
 * The full lockup used in the header and footer: the sparkle mark next to
 * the "AmueAI" wordmark, both in a single viewBox so they scale together as
 * one unit. The wordmark is a plain `<text>` glyph in the app's own sans
 * font — safe here since, unlike `LogoIcon`, this only ever renders in the
 * browser.
 */
export const Logo = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 118 28" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M11 3 L13.6 11.4 L22 14 L13.6 16.6 L11 25 L8.4 16.6 L0 14 L8.4 11.4 Z" />
    <text
      dominantBaseline="central"
      fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="-0.5"
      x="28"
      y="15"
    >
      AmueAI
    </text>
  </svg>
);
