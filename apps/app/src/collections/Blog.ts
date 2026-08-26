import type { CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";
import { readPublishedOrLoggedIn } from "@/access/read-published";
import { faqField } from "@/fields/faq";
import { publishedAtField } from "@/fields/published-at";
import { readingTimeField } from "@/fields/reading-time";
import { slugField } from "@/fields/slug";
import { previewUrl } from "@/lib/preview";

/** The Blog. One document is a post, published at `/blog/[slug]`. */
export const Blog: CollectionConfig = {
  slug: "blog",
  labels: { singular: "Post", plural: "Blog" },
  typescript: { interface: "Post" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "publishedAt", "author"],
    group: "Blog",
    livePreview: { url: ({ data }) => previewUrl("blog", data?.slug) },
    preview: (data) => previewUrl("blog", data?.slug),
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
    publishedAtField(),
    {
      name: "content",
      type: "richText",
      required: true,
    },
    readingTimeField(),
    {
      name: "relatedPosts",
      type: "relationship",
      relationTo: "blog",
      hasMany: true,
      admin: { position: "sidebar" },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    faqField("Optional FAQ section rendered below the post content."),
  ],
  timestamps: true,
};
