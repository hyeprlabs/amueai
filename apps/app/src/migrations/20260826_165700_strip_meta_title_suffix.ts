import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Drops the site host off stored SEO titles.
 *
 * The SEO plugin used to generate meta titles as `<title> | amueai.com`, which
 * the root layout's title template then suffixed again — pages rendered as
 * "Post | amueai.com | AmueAI". The plugin now generates the bare title; this
 * clears the suffix out of titles editors already generated.
 */
const TITLE_COLUMNS = [
  { table: "blog", column: "meta_title" },
  { table: "_blog_v", column: "version_meta_title" },
  { table: "changelog", column: "meta_title" },
  { table: "_changelog_v", column: "version_meta_title" },
  { table: "competitors", column: "meta_title" },
  { table: "_competitors_v", column: "version_meta_title" },
] as const;

/** Host of the deployment, e.g. `amueai.com` — the exact suffix that was appended. */
function siteHost(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim();
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const host = siteHost();

  // Without a configured host there is no suffix to match, and a looser pattern
  // risks eating a title that legitimately ends in a domain.
  if (!host) {
    payload.logger.warn(
      "[migration] NEXT_PUBLIC_SITE_URL is not set — leaving stored meta titles alone.",
    );
    return;
  }

  const suffix = ` | ${host}`;

  for (const { table, column } of TITLE_COLUMNS) {
    // One statement per call: Postgres allows no parameters in a multi-statement query.
    await db.execute(sql`
      UPDATE "payload".${sql.raw(`"${table}"`)}
         SET ${sql.raw(`"${column}"`)} = rtrim(
               left(${sql.raw(`"${column}"`)}, length(${sql.raw(`"${column}"`)}) - length(${suffix}))
             )
       WHERE ${sql.raw(`"${column}"`)} LIKE ${`%${suffix}`}
    `);
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Nothing to restore: which titles carried the suffix is not recorded, and
  // re-appending it to every title would corrupt ones that never had it.
  payload.logger.info("[migration] Meta title suffixes are not restored on down.");
}
