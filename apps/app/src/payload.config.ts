import { postgresAdapter } from "@payloadcms/db-postgres";
import { mcpPlugin } from "@payloadcms/plugin-mcp";
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

const payloadSecret = process.env.PAYLOAD_SECRET;
if (!payloadSecret) {
  // An empty secret would let Payload sign auth/session tokens with a
  // predictable value, so fail loudly instead of silently running insecure.
  throw new Error(
    "PAYLOAD_SECRET is required — set it in the environment before starting Payload.",
  );
}

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
    components: {
      graphics: {
        Logo: "/components/admin/brand#AdminLogo",
        Icon: "/components/admin/brand#AdminIcon",
      },
    },
  },
  collections: [Users, Media, Blog, Categories, Authors, LegalPages, Changelog, Competitors],
  editor: lexicalEditor(),
  secret: payloadSecret,
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
    // Lets MCP clients (e.g. a Claude Code Routine) draft blog posts through
    // POST /api/mcp. No delete access, and only the collections a
    // post-writing workflow needs to read, create, or update; access still
    // requires a per-key grant issued from the "API Keys" (MCP) group in
    // /admin.
    mcpPlugin({
      collections: {
        blog: {
          description:
            "Blog posts shown at /blog/[slug]. Create as a draft (draft: true) so a human reviews and publishes it in the admin UI. Link `categories` and set `featuredImage`/`meta.image` to a media document.",
          enabled: { create: true, find: true, update: true },
        },
        authors: {
          description: "Author profiles a blog post's `author` relationship points to.",
          enabled: { find: true },
        },
        categories: {
          description:
            "Categories a blog post's `categories` relationship points to. Create new ones as needed, then link them to a post.",
          enabled: { create: true, find: true },
        },
        media: {
          description:
            "Uploaded images available for a blog post's `featuredImage` and `meta.image`. Create one by passing a web image `url` (fetched server-side via pasteURL) along with `alt` text, then reference the resulting document's id.",
          enabled: { create: true, find: true },
        },
      },
      mcp: {
        serverOptions: {
          serverInfo: { name: "AmueAI Payload MCP", version: "1.0.0" },
        },
      },
    }),
  ],
});
