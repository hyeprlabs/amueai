import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Drops `title` (the page title is now always computed from `name`, never
 * freeform) and the `strengths`/`limitations` arrays (their only consumer, the
 * page section that rendered them, was removed) from the Competitors
 * collection.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."competitors" DROP COLUMN IF EXISTS "title";
    ALTER TABLE "payload"."_competitors_v" DROP COLUMN IF EXISTS "version_title";

    DROP TABLE IF EXISTS "payload"."competitors_strengths" CASCADE;
    DROP TABLE IF EXISTS "payload"."competitors_limitations" CASCADE;
    DROP TABLE IF EXISTS "payload"."_competitors_v_version_strengths" CASCADE;
    DROP TABLE IF EXISTS "payload"."_competitors_v_version_limitations" CASCADE;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."competitors" ADD COLUMN IF NOT EXISTS "title" varchar;
    ALTER TABLE "payload"."_competitors_v" ADD COLUMN IF NOT EXISTS "version_title" varchar;

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
    CREATE TABLE IF NOT EXISTS "payload"."_competitors_v_version_strengths" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_uuid" varchar,
      "point" varchar
    );
    CREATE TABLE IF NOT EXISTS "payload"."_competitors_v_version_limitations" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_uuid" varchar,
      "point" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "payload"."competitors_strengths" ADD CONSTRAINT "competitors_strengths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "payload"."competitors_limitations" ADD CONSTRAINT "competitors_limitations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."competitors"("id") ON DELETE cascade ON UPDATE no action;
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

    CREATE INDEX IF NOT EXISTS "competitors_strengths_order_idx" ON "payload"."competitors_strengths" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "competitors_strengths_parent_id_idx" ON "payload"."competitors_strengths" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "competitors_limitations_order_idx" ON "payload"."competitors_limitations" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "competitors_limitations_parent_id_idx" ON "payload"."competitors_limitations" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_competitors_v_version_strengths_order_idx" ON "payload"."_competitors_v_version_strengths" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_competitors_v_version_strengths_parent_id_idx" ON "payload"."_competitors_v_version_strengths" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_competitors_v_version_limitations_order_idx" ON "payload"."_competitors_v_version_limitations" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_competitors_v_version_limitations_parent_id_idx" ON "payload"."_competitors_v_version_limitations" USING btree ("_parent_id");
  `);
}
