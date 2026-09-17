import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Drops the leftover `autosave` column from `_blog_v`.
 *
 * Blog's `versions.drafts` was simplified from `{ autosave, schedulePublish }`
 * to `true` when the AI auto-posting pipeline was removed, but no migration
 * ever dropped the column that autosave had added — it's been dead ever
 * since (every existing version row has it `null`), and its presence makes
 * every dev-mode schema push warn about "deleting" it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."_blog_v" DROP COLUMN IF EXISTS "autosave";
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."_blog_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
  `);
}
