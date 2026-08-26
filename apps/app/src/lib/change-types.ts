/** Shared between the Changelog collection config and the front-end display of a change. */
export const CHANGE_TYPES = [
  { label: "Feature", value: "feature" },
  { label: "Improvement", value: "improvement" },
  { label: "Fix", value: "fix" },
  { label: "Breaking change", value: "breaking" },
] as const;
