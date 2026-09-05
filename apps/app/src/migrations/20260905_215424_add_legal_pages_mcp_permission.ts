import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "legal_pages_find" boolean DEFAULT false;
  ALTER TABLE "payload"."payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "legal_pages_update" boolean DEFAULT false;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payload_mcp_api_keys" DROP COLUMN IF EXISTS "legal_pages_find";
  ALTER TABLE "payload"."payload_mcp_api_keys" DROP COLUMN IF EXISTS "legal_pages_update";`);
}
