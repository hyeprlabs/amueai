import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_changelog_type" AS ENUM('feature', 'improvement', 'fix', 'breaking');
  CREATE TYPE "payload"."enum_changelog_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__changelog_v_version_type" AS ENUM('feature', 'improvement', 'fix', 'breaking');
  CREATE TYPE "payload"."enum__changelog_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."changelog" (
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
  
  CREATE TABLE "payload"."_changelog_v" (
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
  
  ALTER TABLE "payload"."search_rels" ADD COLUMN "changelog_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "changelog_id" integer;
  ALTER TABLE "payload"."changelog" ADD CONSTRAINT "changelog_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."changelog" ADD CONSTRAINT "changelog_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_changelog_v" ADD CONSTRAINT "_changelog_v_parent_id_changelog_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."changelog"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_changelog_v" ADD CONSTRAINT "_changelog_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_changelog_v" ADD CONSTRAINT "_changelog_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "changelog_slug_idx" ON "payload"."changelog" USING btree ("slug");
  CREATE INDEX "changelog_featured_image_idx" ON "payload"."changelog" USING btree ("featured_image_id");
  CREATE INDEX "changelog_meta_meta_image_idx" ON "payload"."changelog" USING btree ("meta_image_id");
  CREATE INDEX "changelog_updated_at_idx" ON "payload"."changelog" USING btree ("updated_at");
  CREATE INDEX "changelog_created_at_idx" ON "payload"."changelog" USING btree ("created_at");
  CREATE INDEX "changelog__status_idx" ON "payload"."changelog" USING btree ("_status");
  CREATE INDEX "_changelog_v_parent_idx" ON "payload"."_changelog_v" USING btree ("parent_id");
  CREATE INDEX "_changelog_v_version_version_slug_idx" ON "payload"."_changelog_v" USING btree ("version_slug");
  CREATE INDEX "_changelog_v_version_version_featured_image_idx" ON "payload"."_changelog_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_changelog_v_version_meta_version_meta_image_idx" ON "payload"."_changelog_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_changelog_v_version_version_updated_at_idx" ON "payload"."_changelog_v" USING btree ("version_updated_at");
  CREATE INDEX "_changelog_v_version_version_created_at_idx" ON "payload"."_changelog_v" USING btree ("version_created_at");
  CREATE INDEX "_changelog_v_version_version__status_idx" ON "payload"."_changelog_v" USING btree ("version__status");
  CREATE INDEX "_changelog_v_created_at_idx" ON "payload"."_changelog_v" USING btree ("created_at");
  CREATE INDEX "_changelog_v_updated_at_idx" ON "payload"."_changelog_v" USING btree ("updated_at");
  CREATE INDEX "_changelog_v_latest_idx" ON "payload"."_changelog_v" USING btree ("latest");
  ALTER TABLE "payload"."search_rels" ADD CONSTRAINT "search_rels_changelog_fk" FOREIGN KEY ("changelog_id") REFERENCES "payload"."changelog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_changelog_fk" FOREIGN KEY ("changelog_id") REFERENCES "payload"."changelog"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_rels_changelog_id_idx" ON "payload"."search_rels" USING btree ("changelog_id");
  CREATE INDEX "payload_locked_documents_rels_changelog_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("changelog_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."changelog" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_changelog_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."changelog" CASCADE;
  DROP TABLE "payload"."_changelog_v" CASCADE;
  ALTER TABLE "payload"."search_rels" DROP CONSTRAINT "search_rels_changelog_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_changelog_fk";
  
  DROP INDEX "payload"."search_rels_changelog_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_changelog_id_idx";
  ALTER TABLE "payload"."search_rels" DROP COLUMN "changelog_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "changelog_id";
  DROP TYPE "payload"."enum_changelog_type";
  DROP TYPE "payload"."enum_changelog_status";
  DROP TYPE "payload"."enum__changelog_v_version_type";
  DROP TYPE "payload"."enum__changelog_v_version_status";`);
}
