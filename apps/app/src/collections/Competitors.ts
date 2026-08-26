import type { CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";
import { readPublishedOrLoggedIn } from "@/access/read-published";
import { faqField } from "@/fields/faq";
import { publishedAtField } from "@/fields/published-at";
import { readingTimeField } from "@/fields/reading-time";
import { slugField } from "@/fields/slug";
import { previewUrl } from "@/lib/preview";
import { siteConfig } from "@/config/site";

/**
 * Competitors. One document is a competitor, published at `/vs/[slug]`.
 *
 * Every document is a head-to-head comparison page, so the schema is built
 * around what those pages need to rank: one focused headline, a short verdict
 * that can be lifted into a snippet, a structured feature table, and an FAQ.
 */
export const Competitors: CollectionConfig = {
  slug: "competitors",
  labels: { singular: "Competitor", plural: "Competitors" },
  typescript: { interface: "Competitor" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "title", "_status", "publishedAt"],
    group: "Competitors",
    livePreview: { url: ({ data }) => previewUrl("competitors", data?.slug) },
    preview: (data) => previewUrl("competitors", data?.slug),
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
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: `The competitor's product name on its own, e.g. "Intercom". Drives the /vs/ URL and every "${siteConfig.name} vs …" heading.`,
      },
    },
    slugField("name"),
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: `Page headline and default meta title, e.g. "${siteConfig.name} vs Intercom: which AI support agent should you pick?". Lead with the comparison — it is the query people search.`,
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: {
        description:
          "One or two sentences summarising the comparison. Shown on /competition and used as the default meta description.",
      },
    },
    {
      name: "verdict",
      type: "textarea",
      required: true,
      maxLength: 600,
      admin: {
        description:
          "The short answer, rendered directly under the headline. Written to stand on its own so search engines and AI answers can quote it.",
      },
    },
    {
      name: "bestFor",
      type: "text",
      admin: {
        description: `Who this competitor suits best, e.g. "Large support teams with an existing helpdesk". Shown next to the entry on /competition.`,
      },
    },
    {
      name: "website",
      type: "text",
      admin: {
        position: "sidebar",
        description: "The competitor's homepage. Used in the structured data describing them.",
      },
      validate: (value: string | null | undefined) => {
        if (!value) return true;
        return (
          /^https?:\/\/\S+$/.test(value) || "Enter a full URL starting with http:// or https://"
        );
      },
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
        description: "The competitor's logo, shown beside their entry on /competition.",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: { description: "Social card for this comparison." },
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "authors",
      required: true,
      admin: { position: "sidebar" },
    },
    publishedAtField(),
    {
      name: "comparison",
      type: "array",
      labels: { singular: "Row", plural: "Rows" },
      admin: {
        description:
          "The side-by-side table rendered at the top of the page: one row per aspect, each side marked as supported or not. Order rows to lead with what makes " +
          `${siteConfig.name} win.`,
      },
      fields: [
        {
          name: "feature",
          type: "text",
          required: true,
          admin: { description: 'The aspect being compared, e.g. "Live on WhatsApp".' },
        },
        {
          name: "competitorSupported",
          type: "checkbox",
          label: "Competitor",
          defaultValue: false,
          admin: { description: "Does the competitor support this?", width: "30%" },
        },
        {
          name: "usSupported",
          type: "checkbox",
          label: siteConfig.name,
          defaultValue: true,
          admin: { description: `Does ${siteConfig.name} support this?`, width: "30%" },
        },
      ],
    },
    {
      name: "strengths",
      type: "array",
      labels: { singular: "Strength", plural: "Strengths" },
      admin: { description: "Where the competitor genuinely wins. Credibility is what ranks." },
      fields: [{ name: "point", type: "text", required: true }],
    },
    {
      name: "limitations",
      type: "array",
      labels: { singular: "Limitation", plural: "Limitations" },
      admin: { description: "Where the competitor falls short for the reader." },
      fields: [{ name: "point", type: "text", required: true }],
    },
    {
      name: "content",
      type: "richText",
      required: true,
      admin: { description: "The long-form comparison, rendered below the table." },
    },
    readingTimeField(),
    {
      name: "relatedCompetitors",
      type: "relationship",
      relationTo: "competitors",
      hasMany: true,
      admin: { position: "sidebar" },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    faqField(
      "Optional FAQ section rendered below the comparison, published as FAQ structured data.",
    ),
  ],
  timestamps: true,
};
