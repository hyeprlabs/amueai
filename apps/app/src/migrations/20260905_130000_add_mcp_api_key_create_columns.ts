import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * `categories` and `media` were expanded to `enabled: { create: true, find: true }`
 * in payload.config.ts (commit 1221ba1) but the `payload_mcp_api_keys` table was
 * never given the matching `categories_create`/`media_create` columns. Payload's
 * generated schema for that collection has queried those columns ever since, so
 * every request presenting a Bearer token (valid or not) to /api/mcp failed with
 * a Postgres "column does not exist" error surfaced as a 500.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "categories_create" boolean DEFAULT false;
   --> statement-breakpoint
   ALTER TABLE "payload"."payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "media_create" boolean DEFAULT false;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payload_mcp_api_keys" DROP COLUMN IF EXISTS "categories_create";
   --> statement-breakpoint
   ALTER TABLE "payload"."payload_mcp_api_keys" DROP COLUMN IF EXISTS "media_create";
  `);
}
