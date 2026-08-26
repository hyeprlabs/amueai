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
    defaultColumns: ["name", "_status", "publishedAt"],
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
        description: `The competitor's product name on its own, e.g. "Intercom". Drives the /vs/ URL and every "${siteConfig.name} vs. Intercom" heading.`,
      },
    },
    slugField("name"),
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 300,
      admin: {
        description:
          "One or two sentences summarising the comparison. Shown on /competitors and used as the default meta description.",
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
        description: `Who this competitor suits best, e.g. "Large support teams with an existing helpdesk".`,
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
        description: "The competitor's logo.",
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
          "The side-by-side table rendered at the top of the page: one row per aspect. Use checkbox rows for features or string rows for metrics. Order rows to lead with what makes " +
          `${siteConfig.name} win.`,
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          admin: { description: 'The aspect being compared, e.g. "Live on WhatsApp" or "Seats".' },
        },
        {
          name: "competitorSupported",
          type: "checkbox",
          label: "Competitor Support",
          defaultValue: false,
          admin: { description: "Does the competitor support this feature?", width: "30%" },
        },
        {
          name: "usSupported",
          type: "checkbox",
          label: `${siteConfig.name} Support`,
          defaultValue: true,
          admin: { description: `Does ${siteConfig.name} support this feature?`, width: "30%" },
        },
        {
          name: "competitorValue",
          type: "text",
          admin: {
            description:
              "For metrics (not features), the competitor value. E.g. '0' or 'Limited'. Leave empty for checkbox-style rows.",
            width: "30%",
          },
        },
        {
          name: "usValue",
          type: "text",
          admin: {
            description:
              `For metrics (not features), the ${siteConfig.name} value. E.g. '10' or 'Full'. Leave empty for checkbox-style rows.`,
            width: "30%",
          },
        },
      ],
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
