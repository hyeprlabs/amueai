import type { CollectionConfig } from "payload";
import slugify from "slug";

export const Blog: CollectionConfig = {
  slug: "blog",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "createdAt"],
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { position: "sidebar" },
      hooks: {
        beforeValidate: [({ value, siblingData }) => value || slugify(siblingData.title)],
      },
    },
    { name: "content", type: "richText", required: true },
  ],
  timestamps: true,
};
