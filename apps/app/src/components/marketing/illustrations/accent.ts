/**
 * Accent colours for the agent illustrations.
 *
 * The app's own theme is deliberately monochrome (every `--chart-*` token is a
 * grey), so the illustrations carry their own small palette rather than
 * inventing new theme tokens. Each entry pairs a text colour with a matching
 * tint and border, chosen to hold up on both the light and dark surface.
 */
export const accents = {
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    tint: "bg-blue-500/10",
    border: "border-blue-500/30",
    fill: "bg-blue-500",
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    tint: "bg-violet-500/10",
    border: "border-violet-500/30",
    fill: "bg-violet-500",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    tint: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    fill: "bg-emerald-500",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    tint: "bg-amber-500/10",
    border: "border-amber-500/30",
    fill: "bg-amber-500",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    tint: "bg-rose-500/10",
    border: "border-rose-500/30",
    fill: "bg-rose-500",
  },
} as const;

export type AccentName = keyof typeof accents;
