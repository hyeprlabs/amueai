import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Baseline schema.
 *
 * The collections that predate this file were first created with Payload's dev
 * `push`, so the migration chain had no starting point and a fresh database
 * could not be built from migrations alone. This migration is that starting
 * point: it creates the full schema as of the Changelog release, and every
 * statement is conditional so it is a no-op on databases that already carry it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE SCHEMA IF NOT EXISTS "payload";
  DO $$ BEGIN
    CREATE TYPE "payload"."enum_blog_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum__blog_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum_authors_social_links_platform" AS ENUM('x', 'linkedin', 'github', 'website');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum_legal_pages_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum__legal_pages_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum_changelog_type" AS ENUM('feature', 'improvement', 'fix', 'breaking');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum_changelog_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum__changelog_v_version_type" AS ENUM('feature', 'improvement', 'fix', 'breaking');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "payload"."enum__changelog_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE TABLE IF NOT EXISTS "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  CREATE TABLE IF NOT EXISTS "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  CREATE TABLE IF NOT EXISTS "payload"."blog_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  CREATE TABLE IF NOT EXISTS "payload"."blog" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
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
  	"_status" "payload"."enum_blog_status" DEFAULT 'draft'
  );
  CREATE TABLE IF NOT EXISTS "payload"."blog_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"blog_id" integer
  );
  CREATE TABLE IF NOT EXISTS "payload"."_blog_v_version_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  CREATE TABLE IF NOT EXISTS "payload"."_blog_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
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
  	"version__status" "payload"."enum__blog_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  CREATE TABLE IF NOT EXISTS "payload"."_blog_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"blog_id" integer
  );
  CREATE TABLE IF NOT EXISTS "payload"."categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload"."authors_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_authors_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload"."authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"avatar_id" integer,
  	"title" varchar,
  	"bio" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload"."legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_legal_pages_status" DEFAULT 'draft'
  );
  CREATE TABLE IF NOT EXISTS "payload"."_legal_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_content" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__legal_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  CREATE TABLE IF NOT EXISTS "payload"."changelog" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"short_description" varchar,
  	"type" "payload"."enum_changelog_type" DEFAULT 'feature',
  	"version" varchar,
  	"published_at" timestamp(3) with time zone,
  	"featured_image_id" integer,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_changelog_status" DEFAULT 'draft'
  );
  CREATE TABLE IF NOT EXISTS "payload"."_changelog_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_short_description" varchar,
  	"version_type" "payload"."enum__changelog_v_version_type" DEFAULT 'feature',
  	"version_version" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_featured_image_id" integer,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__changelog_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  CREATE TABLE IF NOT EXISTS "payload"."search" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"priority" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload"."search_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"blog_id" integer,
  	"changelog_id" integer
  );
  CREATE TABLE IF NOT EXISTS "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"blog_id" integer,
  	"categories_id" integer,
  	"authors_id" integer,
  	"legal_pages_id" integer,
  	"changelog_id" integer,
  	"search_id" integer
  );
  CREATE TABLE IF NOT EXISTS "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  CREATE TABLE IF NOT EXISTS "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  DO $$ BEGIN
    ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."blog_faq_items" ADD CONSTRAINT "blog_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."blog"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."blog" ADD CONSTRAINT "blog_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."blog" ADD CONSTRAINT "blog_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."blog" ADD CONSTRAINT "blog_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."blog_rels" ADD CONSTRAINT "blog_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."blog"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."blog_rels" ADD CONSTRAINT "blog_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."blog_rels" ADD CONSTRAINT "blog_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "payload"."blog"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v_version_faq_items" ADD CONSTRAINT "_blog_v_version_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v" ADD CONSTRAINT "_blog_v_parent_id_blog_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."blog"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v" ADD CONSTRAINT "_blog_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v" ADD CONSTRAINT "_blog_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v" ADD CONSTRAINT "_blog_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v_rels" ADD CONSTRAINT "_blog_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v_rels" ADD CONSTRAINT "_blog_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_blog_v_rels" ADD CONSTRAINT "_blog_v_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "payload"."blog"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."authors_social_links" ADD CONSTRAINT "authors_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."authors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."authors" ADD CONSTRAINT "authors_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_legal_pages_v" ADD CONSTRAINT "_legal_pages_v_parent_id_legal_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."legal_pages"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."changelog" ADD CONSTRAINT "changelog_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."changelog" ADD CONSTRAINT "changelog_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_changelog_v" ADD CONSTRAINT "_changelog_v_parent_id_changelog_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."changelog"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_changelog_v" ADD CONSTRAINT "_changelog_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."_changelog_v" ADD CONSTRAINT "_changelog_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."search_rels" ADD CONSTRAINT "search_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."search"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."search_rels" ADD CONSTRAINT "search_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "payload"."blog"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."search_rels" ADD CONSTRAINT "search_rels_changelog_fk" FOREIGN KEY ("changelog_id") REFERENCES "payload"."changelog"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "payload"."blog"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "payload"."authors"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_legal_pages_fk" FOREIGN KEY ("legal_pages_id") REFERENCES "payload"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_changelog_fk" FOREIGN KEY ("changelog_id") REFERENCES "payload"."changelog"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_fk" FOREIGN KEY ("search_id") REFERENCES "payload"."search"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "payload"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_og_sizes_og_filename_idx" ON "payload"."media" USING btree ("sizes_og_filename");
  CREATE INDEX IF NOT EXISTS "blog_faq_items_order_idx" ON "payload"."blog_faq_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "blog_faq_items_parent_id_idx" ON "payload"."blog_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "blog_slug_idx" ON "payload"."blog" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "blog_featured_image_idx" ON "payload"."blog" USING btree ("featured_image_id");
  CREATE INDEX IF NOT EXISTS "blog_author_idx" ON "payload"."blog" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "blog_meta_meta_image_idx" ON "payload"."blog" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "blog_updated_at_idx" ON "payload"."blog" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "blog_created_at_idx" ON "payload"."blog" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "blog__status_idx" ON "payload"."blog" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "blog_rels_order_idx" ON "payload"."blog_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "blog_rels_parent_idx" ON "payload"."blog_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "blog_rels_path_idx" ON "payload"."blog_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "blog_rels_categories_id_idx" ON "payload"."blog_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "blog_rels_blog_id_idx" ON "payload"."blog_rels" USING btree ("blog_id");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_faq_items_order_idx" ON "payload"."_blog_v_version_faq_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_faq_items_parent_id_idx" ON "payload"."_blog_v_version_faq_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_blog_v_parent_idx" ON "payload"."_blog_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_version_slug_idx" ON "payload"."_blog_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_version_featured_image_idx" ON "payload"."_blog_v" USING btree ("version_featured_image_id");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_version_author_idx" ON "payload"."_blog_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_meta_version_meta_image_idx" ON "payload"."_blog_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_version_updated_at_idx" ON "payload"."_blog_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_version_created_at_idx" ON "payload"."_blog_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_blog_v_version_version__status_idx" ON "payload"."_blog_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_blog_v_created_at_idx" ON "payload"."_blog_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_blog_v_updated_at_idx" ON "payload"."_blog_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_blog_v_latest_idx" ON "payload"."_blog_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_blog_v_rels_order_idx" ON "payload"."_blog_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_blog_v_rels_parent_idx" ON "payload"."_blog_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_blog_v_rels_path_idx" ON "payload"."_blog_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_blog_v_rels_categories_id_idx" ON "payload"."_blog_v_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "_blog_v_rels_blog_id_idx" ON "payload"."_blog_v_rels" USING btree ("blog_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "payload"."categories" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "categories_updated_at_idx" ON "payload"."categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "categories_created_at_idx" ON "payload"."categories" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "authors_social_links_order_idx" ON "payload"."authors_social_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "authors_social_links_parent_id_idx" ON "payload"."authors_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "authors_slug_idx" ON "payload"."authors" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "authors_avatar_idx" ON "payload"."authors" USING btree ("avatar_id");
  CREATE INDEX IF NOT EXISTS "authors_updated_at_idx" ON "payload"."authors" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "authors_created_at_idx" ON "payload"."authors" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "legal_pages_slug_idx" ON "payload"."legal_pages" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "legal_pages_updated_at_idx" ON "payload"."legal_pages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "legal_pages_created_at_idx" ON "payload"."legal_pages" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "legal_pages__status_idx" ON "payload"."legal_pages" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_legal_pages_v_parent_idx" ON "payload"."_legal_pages_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_legal_pages_v_version_version_slug_idx" ON "payload"."_legal_pages_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_legal_pages_v_version_version_updated_at_idx" ON "payload"."_legal_pages_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_legal_pages_v_version_version_created_at_idx" ON "payload"."_legal_pages_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_legal_pages_v_version_version__status_idx" ON "payload"."_legal_pages_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_legal_pages_v_created_at_idx" ON "payload"."_legal_pages_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_legal_pages_v_updated_at_idx" ON "payload"."_legal_pages_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_legal_pages_v_latest_idx" ON "payload"."_legal_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX IF NOT EXISTS "changelog_slug_idx" ON "payload"."changelog" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "changelog_featured_image_idx" ON "payload"."changelog" USING btree ("featured_image_id");
  CREATE INDEX IF NOT EXISTS "changelog_meta_meta_image_idx" ON "payload"."changelog" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "changelog_updated_at_idx" ON "payload"."changelog" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "changelog_created_at_idx" ON "payload"."changelog" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "changelog__status_idx" ON "payload"."changelog" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_changelog_v_parent_idx" ON "payload"."_changelog_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_changelog_v_version_version_slug_idx" ON "payload"."_changelog_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_changelog_v_version_version_featured_image_idx" ON "payload"."_changelog_v" USING btree ("version_featured_image_id");
  CREATE INDEX IF NOT EXISTS "_changelog_v_version_meta_version_meta_image_idx" ON "payload"."_changelog_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_changelog_v_version_version_updated_at_idx" ON "payload"."_changelog_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_changelog_v_version_version_created_at_idx" ON "payload"."_changelog_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_changelog_v_version_version__status_idx" ON "payload"."_changelog_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_changelog_v_created_at_idx" ON "payload"."_changelog_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_changelog_v_updated_at_idx" ON "payload"."_changelog_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_changelog_v_latest_idx" ON "payload"."_changelog_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "search_updated_at_idx" ON "payload"."search" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "search_created_at_idx" ON "payload"."search" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "search_rels_order_idx" ON "payload"."search_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "search_rels_parent_idx" ON "payload"."search_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "search_rels_path_idx" ON "payload"."search_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "search_rels_blog_id_idx" ON "payload"."search_rels" USING btree ("blog_id");
  CREATE INDEX IF NOT EXISTS "search_rels_changelog_id_idx" ON "payload"."search_rels" USING btree ("changelog_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_blog_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("blog_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_authors_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_legal_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("legal_pages_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_changelog_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("changelog_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_search_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("search_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "payload"."users_sessions" CASCADE;
  DROP TABLE IF EXISTS "payload"."users" CASCADE;
  DROP TABLE IF EXISTS "payload"."media" CASCADE;
  DROP TABLE IF EXISTS "payload"."blog_faq_items" CASCADE;
  DROP TABLE IF EXISTS "payload"."blog" CASCADE;
  DROP TABLE IF EXISTS "payload"."blog_rels" CASCADE;
  DROP TABLE IF EXISTS "payload"."_blog_v_version_faq_items" CASCADE;
  DROP TABLE IF EXISTS "payload"."_blog_v" CASCADE;
  DROP TABLE IF EXISTS "payload"."_blog_v_rels" CASCADE;
  DROP TABLE IF EXISTS "payload"."categories" CASCADE;
  DROP TABLE IF EXISTS "payload"."authors_social_links" CASCADE;
  DROP TABLE IF EXISTS "payload"."authors" CASCADE;
  DROP TABLE IF EXISTS "payload"."legal_pages" CASCADE;
  DROP TABLE IF EXISTS "payload"."_legal_pages_v" CASCADE;
  DROP TABLE IF EXISTS "payload"."changelog" CASCADE;
  DROP TABLE IF EXISTS "payload"."_changelog_v" CASCADE;
  DROP TABLE IF EXISTS "payload"."search" CASCADE;
  DROP TABLE IF EXISTS "payload"."search_rels" CASCADE;
  DROP TABLE IF EXISTS "payload"."payload_kv" CASCADE;
  DROP TABLE IF EXISTS "payload"."payload_locked_documents" CASCADE;
  DROP TABLE IF EXISTS "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE IF EXISTS "payload"."payload_preferences" CASCADE;
  DROP TABLE IF EXISTS "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE IF EXISTS "payload"."payload_migrations" CASCADE;
  DROP TYPE IF EXISTS "payload"."enum_blog_status";
  DROP TYPE IF EXISTS "payload"."enum__blog_v_version_status";
  DROP TYPE IF EXISTS "payload"."enum_authors_social_links_platform";
  DROP TYPE IF EXISTS "payload"."enum_legal_pages_status";
  DROP TYPE IF EXISTS "payload"."enum__legal_pages_v_version_status";
  DROP TYPE IF EXISTS "payload"."enum_changelog_type";
  DROP TYPE IF EXISTS "payload"."enum_changelog_status";
  DROP TYPE IF EXISTS "payload"."enum__changelog_v_version_type";
  DROP TYPE IF EXISTS "payload"."enum__changelog_v_version_status";
  `);
}
