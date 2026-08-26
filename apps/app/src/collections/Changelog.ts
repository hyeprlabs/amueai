import type { Access, CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";
import { slugField } from "@/fields/slug";
import { CHANGELOG_TYPES } from "@/lib/changelog-types";

/** Anyone can read published entries; logged-in admin users can also see drafts. */
const readPublishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: "published" } };
};

export const Changelog: CollectionConfig = {
  slug: "changelog",
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
      options: [...CHANGELOG_TYPES],
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
    {
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
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
        description: "Optional image shown with this entry and used as its social card.",
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
