import type { Access, CollectionConfig } from "payload";
import slugify from "slug";

import { isLoggedIn } from "@/access/is-logged-in";

/** Anyone can read published pages; logged-in admin users can also see drafts. */
const readPublishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: "published" } };
};

export const LegalPages: CollectionConfig = {
  slug: "legal-pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "createdAt"],
  },
  access: {
    read: readPublishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
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
