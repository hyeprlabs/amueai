-- "Perfect basic" RLS: rebuild every org-scoped policy from a single
-- canonical pattern now that Clerk<->Supabase third-party auth is
-- actually connected. Logic is unchanged from before (org-scoped via
-- (select auth.jwt()->>'org_id')), this just guarantees every table's
-- policies are consistent and current after the agents rename.

-- organizations: select + insert only. No update/delete policy for
-- authenticated - billing fields (plan, credits, polar_*) stay
-- writable only by service-role code, not by any dashboard client.
drop policy if exists "Org members can view their own org row" on public.organizations;
drop policy if exists "Org members can create their own org row" on public.organizations;

create policy "Org members can view their own org row"
on public.organizations for select to authenticated
using ( (select auth.jwt()->>'org_id') = clerk_org_id );

create policy "Org members can create their own org row"
on public.organizations for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = clerk_org_id );

-- sources: full CRUD, org-scoped.
drop policy if exists "Org members can view their org's sources" on public.sources;
drop policy if exists "Org members can insert sources for their org" on public.sources;
drop policy if exists "Org members can update their org's sources" on public.sources;
drop policy if exists "Org members can delete their org's sources" on public.sources;

create policy "Org members can view their org's sources"
on public.sources for select to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can insert sources for their org"
on public.sources for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can update their org's sources"
on public.sources for update to authenticated
using ( (select auth.jwt()->>'org_id') = org_id )
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can delete their org's sources"
on public.sources for delete to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

-- chunks: full CRUD, org-scoped.
drop policy if exists "Org members can view their org's chunks" on public.chunks;
drop policy if exists "Org members can insert chunks for their org" on public.chunks;
drop policy if exists "Org members can update their org's chunks" on public.chunks;
drop policy if exists "Org members can delete their org's chunks" on public.chunks;

create policy "Org members can view their org's chunks"
on public.chunks for select to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can insert chunks for their org"
on public.chunks for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can update their org's chunks"
on public.chunks for update to authenticated
using ( (select auth.jwt()->>'org_id') = org_id )
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can delete their org's chunks"
on public.chunks for delete to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

-- conversations: full CRUD, org-scoped.
drop policy if exists "Org members can view their org's conversations" on public.conversations;
drop policy if exists "Org members can insert conversations for their org" on public.conversations;
drop policy if exists "Org members can update their org's conversations" on public.conversations;
drop policy if exists "Org members can delete their org's conversations" on public.conversations;

create policy "Org members can view their org's conversations"
on public.conversations for select to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can insert conversations for their org"
on public.conversations for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can update their org's conversations"
on public.conversations for update to authenticated
using ( (select auth.jwt()->>'org_id') = org_id )
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can delete their org's conversations"
on public.conversations for delete to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

-- messages: full CRUD, org-scoped.
drop policy if exists "Org members can view their org's messages" on public.messages;
drop policy if exists "Org members can insert messages for their org" on public.messages;
drop policy if exists "Org members can update their org's messages" on public.messages;
drop policy if exists "Org members can delete their org's messages" on public.messages;

create policy "Org members can view their org's messages"
on public.messages for select to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can insert messages for their org"
on public.messages for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can update their org's messages"
on public.messages for update to authenticated
using ( (select auth.jwt()->>'org_id') = org_id )
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can delete their org's messages"
on public.messages for delete to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

-- Confirm the authenticated-role table grants from the Phase 11 fix are
-- still in place (idempotent - re-running a GRANT is a no-op if already
-- granted).
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.agents to authenticated;
grant select, insert, update, delete on public.sources to authenticated;
grant select, insert, update, delete on public.chunks to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
