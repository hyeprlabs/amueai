import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Replaces the comparison table's free-text `us`/`them` columns with a
 * boolean pair per row.
 *
 * Every /vs/ page now renders a single supported/not-supported table at the
 * top of the article — Competitor on the left, AmueAI on the right — instead
 * of two paragraphs of prose per row. No data existed under the old shape to
 * migrate: the collection had just shipped with zero published rows.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."competitors_comparison" DROP COLUMN IF EXISTS "us";
    ALTER TABLE "payload"."competitors_comparison" DROP COLUMN IF EXISTS "them";
    ALTER TABLE "payload"."competitors_comparison" ADD COLUMN IF NOT EXISTS "competitor_supported" boolean DEFAULT false;
    ALTER TABLE "payload"."competitors_comparison" ADD COLUMN IF NOT EXISTS "us_supported" boolean DEFAULT true;

    ALTER TABLE "payload"."_competitors_v_version_comparison" DROP COLUMN IF EXISTS "us";
    ALTER TABLE "payload"."_competitors_v_version_comparison" DROP COLUMN IF EXISTS "them";
    ALTER TABLE "payload"."_competitors_v_version_comparison" ADD COLUMN IF NOT EXISTS "competitor_supported" boolean DEFAULT false;
    ALTER TABLE "payload"."_competitors_v_version_comparison" ADD COLUMN IF NOT EXISTS "us_supported" boolean DEFAULT true;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."competitors_comparison" DROP COLUMN IF EXISTS "competitor_supported";
    ALTER TABLE "payload"."competitors_comparison" DROP COLUMN IF EXISTS "us_supported";
    ALTER TABLE "payload"."competitors_comparison" ADD COLUMN IF NOT EXISTS "us" varchar;
    ALTER TABLE "payload"."competitors_comparison" ADD COLUMN IF NOT EXISTS "them" varchar;

    ALTER TABLE "payload"."_competitors_v_version_comparison" DROP COLUMN IF EXISTS "competitor_supported";
    ALTER TABLE "payload"."_competitors_v_version_comparison" DROP COLUMN IF EXISTS "us_supported";
    ALTER TABLE "payload"."_competitors_v_version_comparison" ADD COLUMN IF NOT EXISTS "us" varchar;
    ALTER TABLE "payload"."_competitors_v_version_comparison" ADD COLUMN IF NOT EXISTS "them" varchar;
  `);
}
