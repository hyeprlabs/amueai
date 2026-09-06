import "server-only";

import { Files } from "files-sdk";
import { supabase } from "files-sdk/supabase";

/**
 * The ONLY file that knows which storage backend is active. Every server-side
 * read/write of an original upload or a source's canonical markdown goes
 * through `files` from here - never `supabase.storage.*` directly.
 *
 * Path convention (identical regardless of adapter):
 * - `{org_id}/{agent_id}/{source_id}/original.{ext}` for uploads
 * - `{org_id}/{agent_id}/{source_id}.md` for the canonical markdown
 *
 * The Supabase adapter's own env-var fallbacks (SUPABASE_SERVICE_ROLE_KEY,
 * SUPABASE_URL) don't match this project's actual names (SUPABASE_SECRET_KEY,
 * NEXT_PUBLIC_SUPABASE_URL) - passed explicitly rather than relying on them.
 *
 * files-sdk also ships an R2 adapter (`files-sdk/r2`) for a future
 * Cloudflare R2 migration, but it statically imports `@aws-sdk/client-s3`,
 * `@aws-sdk/s3-presigned-post`, and `@aws-sdk/s3-request-presigner` - none
 * of which this project has installed, and Trigger.dev's bundler resolves
 * every import at build time regardless of which branch runs, so importing
 * it unconditionally breaks the build. Not wired up until R2 is actually
 * needed: `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-presigned-post
 * @aws-sdk/s3-request-presigner`, then import `r2` from `files-sdk/r2` and
 * branch on `process.env.STORAGE_PROVIDER === "r2"` the same way this file
 * already does for Supabase.
 */
export const files = new Files({
  adapter: supabase({
    bucket: "sources",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SECRET_KEY!,
  }),
});
