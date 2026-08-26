import { postgresAdapter } from "@payloadcms/db-postgres";
import { searchPlugin } from "@payloadcms/plugin-search";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Blog } from "./collections/Blog";
import { Categories } from "./collections/Categories";
import { Authors } from "./collections/Authors";
import { LegalPages } from "./collections/LegalPages";
import { Changelog } from "./collections/Changelog";
import { Competitors } from "./collections/Competitors";
import { siteConfig } from "./config/site";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Collections whose documents get the SEO tab, and the public URL each one is served from. */
const seoCollections = {
  blog: (slug: string) => `${siteUrl}/blog/${slug}`,
  changelog: (slug: string) => `${siteUrl}/changelog#${slug}`,
  competitors: (slug: string) => `${siteUrl}/vs/${slug}`,
} satisfies Record<string, (slug: string) => string>;

type SeoCollection = keyof typeof seoCollections;

const isSeoCollection = (slug?: string): slug is SeoCollection =>
  Boolean(slug && slug in seoCollections);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Blog, Categories, Authors, LegalPages, Changelog, Competitors],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    // Keep every Payload-managed table out of `public` and in its own schema.
    schemaName: "payload",
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
    seoPlugin({
      collections: Object.keys(seoCollections),
      uploadsCollection: "media",
      // Just the document title: the app's root metadata template appends
      // "| AmueAI" at render time, so adding a suffix here would double it.
      // Competitors has no `title` field of its own. The page title is
      // always computed from its name, never freeform.
      generateTitle: ({ collectionSlug, doc }) =>
        collectionSlug === "competitors" ? `${siteConfig.name} vs. ${doc.name}` : doc.title,
      // Each collection names its summary field differently; fall back through
      // them rather than guessing from the shape of the document.
      generateDescription: ({ doc }) => doc.excerpt || doc.shortDescription || "",
      generateImage: ({ doc }) => doc.featuredImage,
      generateURL: ({ collectionSlug, doc }) =>
        isSeoCollection(collectionSlug) ? seoCollections[collectionSlug](doc.slug) : siteUrl,
    }),
    searchPlugin({
      collections: ["blog", "changelog", "competitors"],
      syncDrafts: false,
      searchOverrides: {
        admin: { group: "Search" },
      },
      defaultPriorities: {
        blog: 10,
        competitors: 9,
        changelog: 8,
      },
    }),
  ],
});
