import type { GroupField } from "payload";

/**
 * Optional FAQ block, shared by every collection whose articles render one.
 *
 * The field names are part of the database schema, so they stay identical
 * across collections — only the admin description changes per usage.
 */
export function faqField(description: string): GroupField {
  return {
    name: "faq",
    type: "group",
    label: "FAQ",
    admin: { description },
    fields: [
      {
        name: "enabled",
        type: "checkbox",
        defaultValue: false,
        admin: { description: "Show a FAQ section on this page." },
      },
      {
        name: "title",
        type: "text",
        defaultValue: "Frequently asked questions",
        admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
      },
      {
        name: "description",
        type: "textarea",
        admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
      },
      {
        name: "items",
        type: "array",
        labels: { singular: "Question", plural: "Questions" },
        admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
        fields: [
          { name: "question", type: "text", required: true },
          { name: "answer", type: "textarea", required: true },
        ],
      },
    ],
  };
}
