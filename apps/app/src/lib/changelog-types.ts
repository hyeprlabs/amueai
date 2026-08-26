/** Shared between the Changelog collection config and its front-end display. */
export const CHANGELOG_TYPES = [
  { label: "Feature", value: "feature" },
  { label: "Improvement", value: "improvement" },
  { label: "Fix", value: "fix" },
  { label: "Breaking change", value: "breaking" },
] as const;
