import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "payload"."blog_faq_items" (
   	"_order" integer NOT NULL,
   	"_parent_id" integer NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"question" varchar NOT NULL,
   	"answer" varchar NOT NULL
   );
   --> statement-breakpoint
   CREATE TABLE IF NOT EXISTS "payload"."_blog_v_version_faq_items" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"_order" integer NOT NULL,
   	"_parent_id" integer NOT NULL,
   	"_uuid" varchar,
   	"question" varchar,
   	"answer" varchar
   );
   --> statement-breakpoint
   ALTER TABLE "payload"."blog" ADD COLUMN IF NOT EXISTS "faq_enabled" boolean DEFAULT false;
   --> statement-breakpoint
   ALTER TABLE "payload"."blog" ADD COLUMN IF NOT EXISTS "faq_title" varchar DEFAULT 'Frequently asked questions';
   --> statement-breakpoint
   ALTER TABLE "payload"."blog" ADD COLUMN IF NOT EXISTS "faq_description" varchar;
   --> statement-breakpoint
   ALTER TABLE "payload"."_blog_v" ADD COLUMN IF NOT EXISTS "version_faq_enabled" boolean DEFAULT false;
   --> statement-breakpoint
   ALTER TABLE "payload"."_blog_v" ADD COLUMN IF NOT EXISTS "version_faq_title" varchar DEFAULT 'Frequently asked questions';
   --> statement-breakpoint
   ALTER TABLE "payload"."_blog_v" ADD COLUMN IF NOT EXISTS "version_faq_description" varchar;
   --> statement-breakpoint
   DO $$ BEGIN
    ALTER TABLE "payload"."blog_faq_items" ADD CONSTRAINT "blog_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."blog"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   --> statement-breakpoint
   DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v_version_faq_items" ADD CONSTRAINT "_blog_v_version_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "blog_faq_items_order_idx" ON "payload"."blog_faq_items" USING btree ("_order");
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "blog_faq_items_parent_id_idx" ON "payload"."blog_faq_items" USING btree ("_parent_id");
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "_blog_v_version_faq_items_order_idx" ON "payload"."_blog_v_version_faq_items" USING btree ("_order");
   --> statement-breakpoint
   CREATE INDEX IF NOT EXISTS "_blog_v_version_faq_items_parent_id_idx" ON "payload"."_blog_v_version_faq_items" USING btree ("_parent_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."blog_faq_items" DROP CONSTRAINT IF EXISTS "blog_faq_items_parent_id_fk";
   --> statement-breakpoint
   ALTER TABLE "payload"."_blog_v_version_faq_items" DROP CONSTRAINT IF EXISTS "_blog_v_version_faq_items_parent_id_fk";
   --> statement-breakpoint
   DROP TABLE IF EXISTS "payload"."blog_faq_items";
   --> statement-breakpoint
   DROP TABLE IF EXISTS "payload"."_blog_v_version_faq_items";
   --> statement-breakpoint
   ALTER TABLE "payload"."blog" DROP COLUMN IF EXISTS "faq_enabled";
   --> statement-breakpoint
   ALTER TABLE "payload"."blog" DROP COLUMN IF EXISTS "faq_title";
   --> statement-breakpoint
   ALTER TABLE "payload"."blog" DROP COLUMN IF EXISTS "faq_description";
   --> statement-breakpoint
   ALTER TABLE "payload"."_blog_v" DROP COLUMN IF EXISTS "version_faq_enabled";
   --> statement-breakpoint
   ALTER TABLE "payload"."_blog_v" DROP COLUMN IF EXISTS "version_faq_title";
   --> statement-breakpoint
   ALTER TABLE "payload"."_blog_v" DROP COLUMN IF EXISTS "version_faq_description";
  `);
}
