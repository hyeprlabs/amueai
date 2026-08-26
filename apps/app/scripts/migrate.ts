import nextEnv from "@next/env";
import { sql } from "@payloadcms/db-postgres";
import { getPayload } from "payload";

/**
 * Applies pending Payload migrations, unattended.
 *
 * `payload migrate` cannot be used from a build: when it finds the marker row a
 * dev-mode schema push leaves behind (`batch = -1`) it stops and waits for an
 * interactive confirmation, which nothing answers in CI — the command hangs
 * until the build times out, and the schema silently never reaches the
 * database.
 *
 * That warning guards against a pushed schema having drifted from what the
 * migrations produce. It cannot have drifted here: `20260101_000000_init` was
 * generated from the same schema push builds, and every migration in this repo
 * is written to be re-runnable, so replaying the chain over a pushed database
 * does nothing until it reaches the first migration that database is missing.
 * So the marker is dropped and the chain runs.
 */

// Same env loading as Payload's own CLI, so `pnpm db:migrate` picks up
// `.env.local` exactly like `next dev` does.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

if (!process.env.DATABASE_URL) {
  console.warn("[migrate] DATABASE_URL is not set — skipping migrations.");
  process.exit(0);
}

// Keeps `getPayload` from pushing the schema instead of migrating it.
process.env.PAYLOAD_MIGRATING = "true";

const { default: config } = await import("../src/payload.config.js");

const payload = await getPayload({ config });

await payload.db.drizzle.execute(sql`
  DO $$ BEGIN
    DELETE FROM "payload"."payload_migrations" WHERE batch = -1;
  EXCEPTION WHEN undefined_table THEN null;
  END $$;
`);

await payload.db.migrate();

process.exit(0);
