import type { Theme } from "@c15t/nextjs";

/**
 * Maps c15t's theme tokens onto this app's shadcn/Tailwind CSS variables
 * (see `globals.css`) instead of shipping c15t's default palette.
 *
 * These are CSS variable references, not resolved colors, so the banner and
 * dialog pick up dark mode automatically through the same `.dark` class
 * `next-themes` toggles on `<html>` — no separate `dark` override needed.
 */
export const consentManagerTheme: Theme = {
  colors: {
    primary: "var(--primary)",
    primaryHover: "var(--primary)",
    surface: "var(--popover)",
    surfaceHover: "var(--accent)",
    border: "var(--border)",
    borderHover: "var(--ring)",
    text: "var(--popover-foreground)",
    textMuted: "var(--muted-foreground)",
    textOnPrimary: "var(--primary-foreground)",
    overlay: "color-mix(in oklab, var(--foreground) 40%, transparent)",
    switchTrack: "var(--input)",
    switchTrackActive: "var(--primary)",
    switchThumb: "var(--background)",
  },
  typography: {
    fontFamily: "var(--font-sans)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    full: "9999px",
  },
};
