import type { CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";
import { slugField } from "@/fields/slug";

export const Authors: CollectionConfig = {
  slug: "authors",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
    group: "Blog",
  },
  access: {
    read: () => true,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    { name: "name", type: "text", required: true },
    slugField("name"),
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
    },
    { name: "title", type: "text", admin: { description: "e.g. Head of Marketing" } },
    { name: "bio", type: "textarea" },
    {
      name: "socialLinks",
      type: "array",
      admin: { position: "sidebar" },
      fields: [
        {
          name: "platform",
          type: "select",
          required: true,
          options: [
            { label: "X (Twitter)", value: "x" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "GitHub", value: "github" },
            { label: "Website", value: "website" },
          ],
        },
        { name: "url", type: "text", required: true },
      ],
    },
    {
      name: "posts",
      type: "join",
      collection: "blog",
      on: "author",
      admin: { allowCreate: false },
    },
  ],
  timestamps: true,
};
