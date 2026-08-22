import type { CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";
import { slugField } from "@/fields/slug";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    group: "Blog",
  },
  access: {
    read: () => true,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    { name: "title", type: "text", required: true },
    slugField("title"),
    { name: "description", type: "textarea" },
    {
      name: "posts",
      type: "join",
      collection: "blog",
      on: "categories",
      admin: { allowCreate: false },
    },
  ],
  timestamps: true,
};
