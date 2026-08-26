import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "payload"."enum_competitors_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum__competitors_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE TABLE IF NOT EXISTS "payload"."competitors_comparison" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"feature" varchar,
  	"us" varchar,
  	"them" varchar
  );

  CREATE TABLE IF NOT EXISTS "payload"."competitors_strengths" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"point" varchar
  );

  CREATE TABLE IF NOT EXISTS "payload"."competitors_limitations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"point" varchar
  );

  CREATE TABLE IF NOT EXISTS "payload"."competitors_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "payload"."competitors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"title" varchar,
  	"excerpt" varchar,
  	"verdict" varchar,
  	"best_for" varchar,
  	"website" varchar,
  	"logo_id" integer,
  	"featured_image_id" integer,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"content" jsonb,
  	"faq_enabled" boolean DEFAULT false,
  	"faq_title" varchar DEFAULT 'Frequently asked questions',
  	"faq_description" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_competitors_status" DEFAULT 'draft'
  );

  CREATE TABLE IF NOT EXISTS "payload"."competitors_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"competitors_id" integer
  );

  CREATE TABLE IF NOT EXISTS "payload"."_competitors_v_version_comparison" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"feature" varchar,
  	"us" varchar,
  	"them" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "payload"."_competitors_v_version_strengths" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"point" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "payload"."_competitors_v_version_limitations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"point" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "payload"."_competitors_v_version_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "payload"."_competitors_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_verdict" varchar,
  	"version_best_for" varchar,
  	"version_website" varchar,
  	"version_logo_id" integer,
  	"version_featured_image_id" integer,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_content" jsonb,
  	"version_faq_enabled" boolean DEFAULT false,
  	"version_faq_title" varchar DEFAULT 'Frequently asked questions',
  	"version_faq_description" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__competitors_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );

  CREATE TABLE IF NOT EXISTS "payload"."_competitors_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"competitors_id" integer
  );

  ALTER TABLE "payload"."search_rels" ADD COLUMN IF NOT EXISTS "competitors_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "competitors_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors_comparison" ADD CONSTRAINT "competitors_comparison_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors_strengths" ADD CONSTRAINT "competitors_strengths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors_limitations" ADD CONSTRAINT "competitors_limitations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors_faq_items" ADD CONSTRAINT "competitors_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors" ADD CONSTRAINT "competitors_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors" ADD CONSTRAINT "competitors_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors" ADD CONSTRAINT "competitors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors" ADD CONSTRAINT "competitors_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors_rels" ADD CONSTRAINT "competitors_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."competitors_rels" ADD CONSTRAINT "competitors_rels_competitors_fk" FOREIGN KEY ("competitors_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v_version_comparison" ADD CONSTRAINT "_competitors_v_version_comparison_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_competitors_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v_version_strengths" ADD CONSTRAINT "_competitors_v_version_strengths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_competitors_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v_version_limitations" ADD CONSTRAINT "_competitors_v_version_limitations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_competitors_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v_version_faq_items" ADD CONSTRAINT "_competitors_v_version_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_competitors_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v" ADD CONSTRAINT "_competitors_v_parent_id_competitors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."competitors"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v" ADD CONSTRAINT "_competitors_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v" ADD CONSTRAINT "_competitors_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v" ADD CONSTRAINT "_competitors_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v" ADD CONSTRAINT "_competitors_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v_rels" ADD CONSTRAINT "_competitors_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_competitors_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_competitors_v_rels" ADD CONSTRAINT "_competitors_v_rels_competitors_fk" FOREIGN KEY ("competitors_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "competitors_comparison_order_idx" ON "payload"."competitors_comparison" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "competitors_comparison_parent_id_idx" ON "payload"."competitors_comparison" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "competitors_strengths_order_idx" ON "payload"."competitors_strengths" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "competitors_strengths_parent_id_idx" ON "payload"."competitors_strengths" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "competitors_limitations_order_idx" ON "payload"."competitors_limitations" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "competitors_limitations_parent_id_idx" ON "payload"."competitors_limitations" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "competitors_faq_items_order_idx" ON "payload"."competitors_faq_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "competitors_faq_items_parent_id_idx" ON "payload"."competitors_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "competitors_slug_idx" ON "payload"."competitors" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "competitors_logo_idx" ON "payload"."competitors" USING btree ("logo_id");
  CREATE INDEX IF NOT EXISTS "competitors_featured_image_idx" ON "payload"."competitors" USING btree ("featured_image_id");
  CREATE INDEX IF NOT EXISTS "competitors_author_idx" ON "payload"."competitors" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "competitors_meta_meta_image_idx" ON "payload"."competitors" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "competitors_updated_at_idx" ON "payload"."competitors" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "competitors_created_at_idx" ON "payload"."competitors" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "competitors__status_idx" ON "payload"."competitors" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "competitors_rels_order_idx" ON "payload"."competitors_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "competitors_rels_parent_idx" ON "payload"."competitors_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "competitors_rels_path_idx" ON "payload"."competitors_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "competitors_rels_competitors_id_idx" ON "payload"."competitors_rels" USING btree ("competitors_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_comparison_order_idx" ON "payload"."_competitors_v_version_comparison" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_comparison_parent_id_idx" ON "payload"."_competitors_v_version_comparison" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_strengths_order_idx" ON "payload"."_competitors_v_version_strengths" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_strengths_parent_id_idx" ON "payload"."_competitors_v_version_strengths" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_limitations_order_idx" ON "payload"."_competitors_v_version_limitations" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_limitations_parent_id_idx" ON "payload"."_competitors_v_version_limitations" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_faq_items_order_idx" ON "payload"."_competitors_v_version_faq_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_faq_items_parent_id_idx" ON "payload"."_competitors_v_version_faq_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_parent_idx" ON "payload"."_competitors_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_version_slug_idx" ON "payload"."_competitors_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_version_logo_idx" ON "payload"."_competitors_v" USING btree ("version_logo_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_version_featured_image_idx" ON "payload"."_competitors_v" USING btree ("version_featured_image_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_version_author_idx" ON "payload"."_competitors_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_meta_version_meta_image_idx" ON "payload"."_competitors_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_version_updated_at_idx" ON "payload"."_competitors_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_version_created_at_idx" ON "payload"."_competitors_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_competitors_v_version_version__status_idx" ON "payload"."_competitors_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_competitors_v_created_at_idx" ON "payload"."_competitors_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_competitors_v_updated_at_idx" ON "payload"."_competitors_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_competitors_v_latest_idx" ON "payload"."_competitors_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_competitors_v_rels_order_idx" ON "payload"."_competitors_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_competitors_v_rels_parent_idx" ON "payload"."_competitors_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_competitors_v_rels_path_idx" ON "payload"."_competitors_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_competitors_v_rels_competitors_id_idx" ON "payload"."_competitors_v_rels" USING btree ("competitors_id");
  DO $$ BEGIN
    ALTER TABLE "payload"."search_rels" ADD CONSTRAINT "search_rels_competitors_fk" FOREIGN KEY ("competitors_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_competitors_fk" FOREIGN KEY ("competitors_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "search_rels_competitors_id_idx" ON "payload"."search_rels" USING btree ("competitors_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_competitors_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("competitors_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."competitors_comparison" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."competitors_strengths" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."competitors_limitations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."competitors_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."competitors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."competitors_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_competitors_v_version_comparison" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_competitors_v_version_strengths" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_competitors_v_version_limitations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_competitors_v_version_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_competitors_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_competitors_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "payload"."competitors_comparison" CASCADE;
  DROP TABLE IF EXISTS "payload"."competitors_strengths" CASCADE;
  DROP TABLE IF EXISTS "payload"."competitors_limitations" CASCADE;
  DROP TABLE IF EXISTS "payload"."competitors_faq_items" CASCADE;
  DROP TABLE IF EXISTS "payload"."competitors" CASCADE;
  DROP TABLE IF EXISTS "payload"."competitors_rels" CASCADE;
  DROP TABLE IF EXISTS "payload"."_competitors_v_version_comparison" CASCADE;
  DROP TABLE IF EXISTS "payload"."_competitors_v_version_strengths" CASCADE;
  DROP TABLE IF EXISTS "payload"."_competitors_v_version_limitations" CASCADE;
  DROP TABLE IF EXISTS "payload"."_competitors_v_version_faq_items" CASCADE;
  DROP TABLE IF EXISTS "payload"."_competitors_v" CASCADE;
  DROP TABLE IF EXISTS "payload"."_competitors_v_rels" CASCADE;
  ALTER TABLE "payload"."search_rels" DROP CONSTRAINT IF EXISTS "search_rels_competitors_fk";

  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_competitors_fk";

  DROP INDEX IF EXISTS "payload"."search_rels_competitors_id_idx";
  DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_competitors_id_idx";
  ALTER TABLE "payload"."search_rels" DROP COLUMN IF EXISTS "competitors_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "competitors_id";
  DROP TYPE IF EXISTS "payload"."enum_competitors_status";
  DROP TYPE IF EXISTS "payload"."enum__competitors_v_version_status";`);
}
