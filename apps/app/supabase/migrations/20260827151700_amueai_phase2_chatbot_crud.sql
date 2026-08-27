-- Phase 2: chatbot CRUD.
--
-- chatbots already existed on this project (pre-dating this build) with
-- id/org_id/name/created_at/allowed_origins/fallback_message/model/
-- remove_branding but no system_prompt/temperature and no RLS policies
-- (RLS was enabled with zero policies, i.e. fail-closed for everyone).
alter table public.chatbots
  add column if not exists system_prompt text not null default 'You are a helpful assistant. Only answer using the provided context. If the answer isn''t in the context, say you don''t know.',
  add column if not exists temperature real not null default 0.3;

alter table public.chatbots
  add constraint chatbots_temperature_range check (temperature >= 0 and temperature <= 2);

-- organizations is the Clerk-org metadata/billing mirror already on this
-- project (not a separate "workspace" concept - Clerk Organizations are
-- the workspace). There's no org.created webhook yet, so the row is
-- lazily upserted by the authenticated client the first time a member
-- touches their org. Select + insert only: no update/delete policy, so
-- billing fields (plan, credits, polar_*) stay writable only by
-- service-role code once that's built (post-MVP).
drop policy if exists "Org members can view their own org row" on public.organizations;
create policy "Org members can view their own org row"
on public.organizations for select to authenticated
using ( (select auth.jwt()->>'org_id') = clerk_org_id );

drop policy if exists "Org members can create their own org row" on public.organizations;
create policy "Org members can create their own org row"
on public.organizations for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = clerk_org_id );

drop policy if exists "Org members can view their org's chatbots" on public.chatbots;
create policy "Org members can view their org's chatbots"
on public.chatbots for select to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

drop policy if exists "Org members can insert chatbots for their org" on public.chatbots;
create policy "Org members can insert chatbots for their org"
on public.chatbots as permissive for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = org_id );

drop policy if exists "Org members can update their org's chatbots" on public.chatbots;
create policy "Org members can update their org's chatbots"
on public.chatbots for update to authenticated
using ( (select auth.jwt()->>'org_id') = org_id )
with check ( (select auth.jwt()->>'org_id') = org_id );

drop policy if exists "Org members can delete their org's chatbots" on public.chatbots;
create policy "Org members can delete their org's chatbots"
on public.chatbots for delete to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );
