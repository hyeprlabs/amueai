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
import { Tags } from "./collections/Tags";
import { Authors } from "./collections/Authors";
import { LegalPages } from "./collections/LegalPages";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Blog, Categories, Tags, Authors, LegalPages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  sharp,
  jobs: {
    // Powers Blog's `versions.drafts.schedulePublish`. Next.js on Vercel has no
    // long-running process to run an in-process cron, so scheduled jobs are
    // instead drained by hitting GET /api/payload-jobs/run — see vercel.json.
    // That cron runs once daily (Vercel Hobby plan caps crons at daily), so a
    // scheduled publish/unpublish can land up to ~24h after its target time.
    // Upgrading to Vercel Pro unlocks more frequent crons (e.g. every 5 min).
    access: {
      run: ({ req }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret) return false;
        return req.headers.get("authorization") === `Bearer ${secret}`;
      },
    },
  },
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
    seoPlugin({
      collections: ["blog"],
      uploadsCollection: "media",
      generateTitle: ({ doc }) => `${doc.title} | ${siteUrl.replace(/^https?:\/\//, "")}`,
      generateDescription: ({ doc }) => doc.excerpt,
      generateImage: ({ doc }) => doc.featuredImage,
      generateURL: ({ doc }) => `${siteUrl}/blog/${doc.slug}`,
    }),
    searchPlugin({
      collections: ["blog"],
      syncDrafts: false,
      searchOverrides: {
        admin: { group: "Blog" },
      },
      defaultPriorities: {
        blog: 10,
      },
    }),
  ],
});
