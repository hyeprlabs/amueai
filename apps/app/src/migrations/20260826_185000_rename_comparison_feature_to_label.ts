import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Rename the `feature` column to `label` and add `competitor_value` and `us_value`
 * columns to support both checkbox rows (features) and string value rows (metrics).
 * Also renames the corresponding versioning table columns.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."competitors_comparison" RENAME COLUMN "feature" TO "label";
    ALTER TABLE "payload"."competitors_comparison" ADD COLUMN IF NOT EXISTS "competitor_value" varchar;
    ALTER TABLE "payload"."competitors_comparison" ADD COLUMN IF NOT EXISTS "us_value" varchar;

    ALTER TABLE "payload"."_competitors_v_version_comparison" RENAME COLUMN "feature" TO "label";
    ALTER TABLE "payload"."_competitors_v_version_comparison" ADD COLUMN IF NOT EXISTS "competitor_value" varchar;
    ALTER TABLE "payload"."_competitors_v_version_comparison" ADD COLUMN IF NOT EXISTS "us_value" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."competitors_comparison" RENAME COLUMN "label" TO "feature";
    ALTER TABLE "payload"."competitors_comparison" DROP COLUMN IF EXISTS "competitor_value";
    ALTER TABLE "payload"."competitors_comparison" DROP COLUMN IF EXISTS "us_value";

    ALTER TABLE "payload"."_competitors_v_version_comparison" RENAME COLUMN "label" TO "feature";
    ALTER TABLE "payload"."_competitors_v_version_comparison" DROP COLUMN IF EXISTS "competitor_value";
    ALTER TABLE "payload"."_competitors_v_version_comparison" DROP COLUMN IF EXISTS "us_value";
  `);
}
