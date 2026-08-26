import type { CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";
import { readPublishedOrLoggedIn } from "@/access/read-published";
import { slugField } from "@/fields/slug";

/** Legal Pages. One document is a page, published at `/legal/[slug]`. */
export const LegalPages: CollectionConfig = {
  slug: "legal-pages",
  labels: { singular: "Page", plural: "Legal Pages" },
  typescript: { interface: "LegalPage" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "createdAt"],
    group: "Legal Pages",
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
    slugField("title"),
    { name: "content", type: "richText", required: true },
  ],
  timestamps: true,
};
