import type { DateField } from "payload";

/**
 * Publish date, stamped automatically the first time a draft goes live so
 * editors never have to remember to set it.
 */
export function publishedAtField(): DateField {
  return {
    name: "publishedAt",
    type: "date",
    admin: {
      position: "sidebar",
      date: { pickerAppearance: "dayAndTime" },
    },
    hooks: {
      beforeChange: [
        ({ siblingData, value }) => {
          if (siblingData._status === "published" && !value) {
            return new Date().toISOString();
          }
          return value;
        },
      ],
    },
  };
}
