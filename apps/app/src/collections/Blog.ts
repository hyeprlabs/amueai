import type { Access, CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";
import { slugField } from "@/fields/slug";
import { richTextToPlainText } from "@/lib/rich-text";

const WORDS_PER_MINUTE = 200;

/** Anyone can read published posts; logged-in admin users can also see drafts. */
const readPublishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: "published" } };
};

export const Blog: CollectionConfig = {
  slug: "blog",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "publishedAt", "author"],
    group: "Blog",
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/preview?secret=${process.env.PAYLOAD_PREVIEW_SECRET || ""}&slug=${data?.slug}`,
    },
    preview: (data) =>
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/preview?secret=${process.env.PAYLOAD_PREVIEW_SECRET || ""}&slug=${data?.slug}`,
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
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: {
        description:
          "Short summary shown on the blog index and used as the default meta description.",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "authors",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: { position: "sidebar" },
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
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "readingTime",
      type: "number",
      virtual: true,
      admin: {
        position: "sidebar",
        description: "Estimated reading time in minutes, computed from the content.",
        readOnly: true,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            const content = siblingData?.content as { root?: { children?: unknown } } | undefined;
            if (!content) return 0;
            const words = richTextToPlainText(content).split(/\s+/).filter(Boolean).length;
            return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
          },
        ],
      },
    },
    {
      name: "relatedPosts",
      type: "relationship",
      relationTo: "blog",
      hasMany: true,
      admin: { position: "sidebar" },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
  ],
  timestamps: true,
};
