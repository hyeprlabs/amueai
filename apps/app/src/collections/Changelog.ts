import type { CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";
import { readPublishedOrLoggedIn } from "@/access/read-published";
import { publishedAtField } from "@/fields/published-at";
import { slugField } from "@/fields/slug";
import { CHANGE_TYPES } from "@/lib/change-types";

/** The Changelog. One document is a change, listed at `/changelog#[slug]`. */
export const Changelog: CollectionConfig = {
  slug: "changelog",
  labels: { singular: "Change", plural: "Changelog" },
  typescript: { interface: "Change" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "_status", "publishedAt"],
    group: "Changelog",
  },
  access: {
    read: readPublishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
  fields: [
    { name: "title", type: "text", required: true },
    slugField("title"),
    {
      name: "shortDescription",
      type: "text",
      required: true,
      maxLength: 140,
      admin: {
        description:
          "One short line (max 140 characters). Shown in the app sidebar's latest-update widget and used as the default meta description.",
      },
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "feature",
      options: [...CHANGE_TYPES],
      admin: { position: "sidebar" },
    },
    {
      name: "version",
      type: "text",
      admin: {
        position: "sidebar",
        description: "Optional version tag, e.g. v1.4.0",
      },
    },
    publishedAtField(),
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
        description: "Optional image shown with this change and used as its social card.",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
  ],
  timestamps: true,
};
