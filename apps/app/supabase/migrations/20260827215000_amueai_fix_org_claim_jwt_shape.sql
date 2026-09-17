-- Fix: every RLS policy compared org_id/clerk_org_id against
-- auth.jwt()->>'org_id', which only exists on Clerk's *legacy* flat
-- session token shape. Clerk's currently-issued (v2/"compact") session
-- tokens nest the active org under `o.id` instead
-- (see @clerk/shared's JwtPayload: `{ v: 2, o: { id, slg, rol, per } }`),
-- so that top-level claim was silently NULL for every request - passing
-- through empty SELECTs unnoticed, but hard-failing every INSERT's
-- WITH CHECK ("new row violates row-level security policy").
--
-- Fixed by reading whichever shape is present via COALESCE, so this
-- keeps working regardless of which token version Clerk issues for
-- this instance (or if that ever changes again).
create or replace function public.clerk_org_id() returns text
language sql stable
set search_path = ''
as $$
  select coalesce(
    (select auth.jwt()->>'org_id'),
    (select auth.jwt()->'o'->>'id')
  );
$$;

-- organizations
drop policy if exists "Org members can view their own org row" on public.organizations;
drop policy if exists "Org members can create their own org row" on public.organizations;

create policy "Org members can view their own org row"
on public.organizations for select to authenticated
using ( public.clerk_org_id() = clerk_org_id );

create policy "Org members can create their own org row"
on public.organizations for insert to authenticated
with check ( public.clerk_org_id() = clerk_org_id );

-- agents
drop policy if exists "Org members can view their org's agents" on public.agents;
drop policy if exists "Org members can insert agents for their org" on public.agents;
drop policy if exists "Org members can update their org's agents" on public.agents;
drop policy if exists "Org members can delete their org's agents" on public.agents;

create policy "Org members can view their org's agents"
on public.agents for select to authenticated
using ( public.clerk_org_id() = org_id );

create policy "Org members can insert agents for their org"
on public.agents for insert to authenticated
with check ( public.clerk_org_id() = org_id );

create policy "Org members can update their org's agents"
on public.agents for update to authenticated
using ( public.clerk_org_id() = org_id )
with check ( public.clerk_org_id() = org_id );

create policy "Org members can delete their org's agents"
on public.agents for delete to authenticated
using ( public.clerk_org_id() = org_id );

-- sources
drop policy if exists "Org members can view their org's sources" on public.sources;
drop policy if exists "Org members can insert sources for their org" on public.sources;
drop policy if exists "Org members can update their org's sources" on public.sources;
drop policy if exists "Org members can delete their org's sources" on public.sources;

create policy "Org members can view their org's sources"
on public.sources for select to authenticated
using ( public.clerk_org_id() = org_id );

create policy "Org members can insert sources for their org"
on public.sources for insert to authenticated
with check ( public.clerk_org_id() = org_id );

create policy "Org members can update their org's sources"
on public.sources for update to authenticated
using ( public.clerk_org_id() = org_id )
with check ( public.clerk_org_id() = org_id );

create policy "Org members can delete their org's sources"
on public.sources for delete to authenticated
using ( public.clerk_org_id() = org_id );

-- chunks
drop policy if exists "Org members can view their org's chunks" on public.chunks;
drop policy if exists "Org members can insert chunks for their org" on public.chunks;
drop policy if exists "Org members can update their org's chunks" on public.chunks;
drop policy if exists "Org members can delete their org's chunks" on public.chunks;

create policy "Org members can view their org's chunks"
on public.chunks for select to authenticated
using ( public.clerk_org_id() = org_id );

create policy "Org members can insert chunks for their org"
on public.chunks for insert to authenticated
with check ( public.clerk_org_id() = org_id );

create policy "Org members can update their org's chunks"
on public.chunks for update to authenticated
using ( public.clerk_org_id() = org_id )
with check ( public.clerk_org_id() = org_id );

create policy "Org members can delete their org's chunks"
on public.chunks for delete to authenticated
using ( public.clerk_org_id() = org_id );

-- conversations
drop policy if exists "Org members can view their org's conversations" on public.conversations;
drop policy if exists "Org members can insert conversations for their org" on public.conversations;
drop policy if exists "Org members can update their org's conversations" on public.conversations;
drop policy if exists "Org members can delete their org's conversations" on public.conversations;

create policy "Org members can view their org's conversations"
on public.conversations for select to authenticated
using ( public.clerk_org_id() = org_id );

create policy "Org members can insert conversations for their org"
on public.conversations for insert to authenticated
with check ( public.clerk_org_id() = org_id );

create policy "Org members can update their org's conversations"
on public.conversations for update to authenticated
using ( public.clerk_org_id() = org_id )
with check ( public.clerk_org_id() = org_id );

create policy "Org members can delete their org's conversations"
on public.conversations for delete to authenticated
using ( public.clerk_org_id() = org_id );

-- messages
drop policy if exists "Org members can view their org's messages" on public.messages;
drop policy if exists "Org members can insert messages for their org" on public.messages;
drop policy if exists "Org members can update their org's messages" on public.messages;
drop policy if exists "Org members can delete their org's messages" on public.messages;

create policy "Org members can view their org's messages"
on public.messages for select to authenticated
using ( public.clerk_org_id() = org_id );

create policy "Org members can insert messages for their org"
on public.messages for insert to authenticated
with check ( public.clerk_org_id() = org_id );

create policy "Org members can update their org's messages"
on public.messages for update to authenticated
using ( public.clerk_org_id() = org_id )
with check ( public.clerk_org_id() = org_id );

create policy "Org members can delete their org's messages"
on public.messages for delete to authenticated
using ( public.clerk_org_id() = org_id );
