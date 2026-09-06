-- Critical fix found during the Phase 11 RLS audit: a prior migration on
-- this project (billing_harden_revoke_anon_grants) revoked ALL base
-- table grants for anon/authenticated on organizations, chatbots, and
-- messages - not just anon. That's a coarser lock than RLS: Postgres
-- checks table-level GRANTs before RLS policies ever run, so every
-- dashboard read/write against these three tables via the
-- Clerk-token-scoped client (the whole point of this stack - see the
-- skill's "Already in place" section) has been failing with
-- "permission denied for table ..." since Phase 2, even though the RLS
-- policies themselves are correct. sources/chunks/conversations never
-- had this problem - they picked up Supabase's normal default grants
-- when created.
--
-- RLS remains the actual security boundary: these grants only restore
-- the ability to attempt a query, which RLS then scopes to the caller's
-- own org_id exactly as before.
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.chatbots to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
