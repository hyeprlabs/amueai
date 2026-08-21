import type { TextField } from "payload";
import slugify from "slug";

/**
 * A URL slug auto-derived from `sourceField` when left blank, editable in the
 * sidebar so editors can override it.
 */
export function slugField(sourceField: string): TextField {
  return {
    name: "slug",
    type: "text",
    required: true,
    unique: true,
    index: true,
    admin: { position: "sidebar" },
    hooks: {
      beforeValidate: [
        ({ value, siblingData }) =>
          value || slugify((siblingData as Record<string, unknown>)[sourceField] as string),
      ],
    },
  };
}
