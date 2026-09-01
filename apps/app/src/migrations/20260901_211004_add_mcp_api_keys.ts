import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Adds the `payload-mcp-api-keys` collection (from @payloadcms/plugin-mcp)
 * and the `payload_mcp_api_keys_id` column that Payload's own preferences and
 * locked-documents tables need once a second auth-enabled collection exists.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "payload"."payload_mcp_api_keys" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"user_id" integer NOT NULL,
   	"label" varchar,
   	"description" varchar,
   	"blog_find" boolean DEFAULT false,
   	"blog_create" boolean DEFAULT false,
   	"blog_update" boolean DEFAULT false,
   	"authors_find" boolean DEFAULT false,
   	"categories_find" boolean DEFAULT false,
   	"media_find" boolean DEFAULT false,
   	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   	"enable_a_p_i_key" boolean,
   	"api_key" varchar,
   	"api_key_index" varchar
   );
   --> statement-breakpoint
   ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "payload_mcp_api_keys_id" integer;
   --> statement-breakpoint
   ALTER TABLE "payload"."payload_preferences_rels" ADD COLUMN IF NOT EXISTS "payload_mcp_api_keys_id" integer;
   --> statement-breakpoint
   DO $$ BEGIN
    ALTER TABLE "payload"."payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   --> statement-breakpoint
   DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "payload"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   --> statement-breakpoint
   DO $$ BEGIN
    ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "payload"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_user_idx" ON "payload"."payload_mcp_api_keys" USING btree ("user_id");
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_updated_at_idx" ON "payload"."payload_mcp_api_keys" USING btree ("updated_at");
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_created_at_idx" ON "payload"."payload_mcp_api_keys" USING btree ("created_at");
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload"."payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_fk";
   --> statement-breakpoint
   ALTER TABLE "payload"."payload_preferences_rels" DROP CONSTRAINT IF EXISTS "payload_preferences_rels_payload_mcp_api_keys_fk";
   --> statement-breakpoint
   DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
   --> statement-breakpoint
   DROP INDEX IF EXISTS "payload"."payload_preferences_rels_payload_mcp_api_keys_id_idx";
   --> statement-breakpoint
   ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
   --> statement-breakpoint
   ALTER TABLE "payload"."payload_preferences_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
   --> statement-breakpoint
   DROP TABLE IF EXISTS "payload"."payload_mcp_api_keys";
  `);
}
