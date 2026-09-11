-- Payload CMS's own tables (schema `payload`) have RLS enabled with zero
-- policies, which the advisor flags as "RLS Enabled No Policy" on every one
-- of them (INFO level). In practice this already denies anon/authenticated
-- access outright - Postgres treats "RLS on, no policy" as deny-all for any
-- role other than the table owner/BYPASSRLS - and the `payload` schema was
-- never exposed to PostgREST (pgrst.db_schemas defaults to "public" only,
-- confirmed empty here), so there's no live path for the anon/publishable
-- key to reach it.
--
-- Payload itself never goes through PostgREST or these roles either - it
-- connects with its own Postgres role via DATABASE_URL and manages the
-- schema directly, bypassing RLS as any normal superuser/table-owner
-- connection would.
--
-- Still, anon/authenticated hold full table grants on every payload.*
-- table with nothing that actually needs them, mirroring the same leftover
-- asymmetry the public.sources/chunks/conversations revoke (see
-- 20260828000000) already cleaned up. Removing it here too is least
-- privilege, not a fix for an exploitable gap: matches "RLS is the real
-- tenant boundary, not application code" - don't lean on RLS alone when
-- the grant can simply not exist.
do $$
declare
  payload_table record;
begin
  for payload_table in
    select tablename from pg_tables where schemaname = 'payload'
  loop
    execute format('revoke all on payload.%I from anon, authenticated', payload_table.tablename);
  end loop;
end $$;

-- Also strip the schema-level USAGE grant and default privileges so a
-- future Payload migration that creates a new table doesn't silently
-- re-grant anon/authenticated access to it.
revoke usage on schema payload from anon, authenticated;
alter default privileges in schema payload revoke all on tables from anon, authenticated;
