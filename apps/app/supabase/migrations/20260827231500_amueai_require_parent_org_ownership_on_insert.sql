-- Every insert/update policy so far only checked the child row's own
-- org_id column, never that the parent it points at (agent_id/source_id/
-- conversation_id) actually belongs to that same org. Since agent ids are
-- public (every embed widget script carries one in plain sight), any
-- authenticated member of ANY org could insert a `sources`/`chunks` row
-- tagged with their own org_id but pointing agent_id/source_id at a
-- different org's real agent - poisoning that agent's live RAG context
-- for other people's site visitors. Requiring the referenced parent to
-- belong to the caller's org closes that off. select/delete are
-- unaffected: reading or deleting your own org's rows was never a
-- cross-tenant risk regardless of what their FKs point at.

drop policy if exists "Org members can insert sources for their org" on public.sources;
drop policy if exists "Org members can update their org's sources" on public.sources;

create policy "Org members can insert sources for their org"
on public.sources for insert to authenticated
with check (
  public.clerk_org_id() = org_id
  and exists (
    select 1 from public.agents a where a.id = sources.agent_id and a.org_id = public.clerk_org_id()
  )
);

create policy "Org members can update their org's sources"
on public.sources for update to authenticated
using ( public.clerk_org_id() = org_id )
with check (
  public.clerk_org_id() = org_id
  and exists (
    select 1 from public.agents a where a.id = sources.agent_id and a.org_id = public.clerk_org_id()
  )
);

drop policy if exists "Org members can insert chunks for their org" on public.chunks;
drop policy if exists "Org members can update their org's chunks" on public.chunks;

create policy "Org members can insert chunks for their org"
on public.chunks for insert to authenticated
with check (
  public.clerk_org_id() = org_id
  and exists (
    select 1 from public.sources s where s.id = chunks.source_id and s.org_id = public.clerk_org_id()
  )
);

create policy "Org members can update their org's chunks"
on public.chunks for update to authenticated
using ( public.clerk_org_id() = org_id )
with check (
  public.clerk_org_id() = org_id
  and exists (
    select 1 from public.sources s where s.id = chunks.source_id and s.org_id = public.clerk_org_id()
  )
);

drop policy if exists "Org members can insert conversations for their org" on public.conversations;
drop policy if exists "Org members can update their org's conversations" on public.conversations;

create policy "Org members can insert conversations for their org"
on public.conversations for insert to authenticated
with check (
  public.clerk_org_id() = org_id
  and exists (
    select 1 from public.agents a where a.id = conversations.agent_id and a.org_id = public.clerk_org_id()
  )
);

create policy "Org members can update their org's conversations"
on public.conversations for update to authenticated
using ( public.clerk_org_id() = org_id )
with check (
  public.clerk_org_id() = org_id
  and exists (
    select 1 from public.agents a where a.id = conversations.agent_id and a.org_id = public.clerk_org_id()
  )
);

drop policy if exists "Org members can insert messages for their org" on public.messages;
drop policy if exists "Org members can update their org's messages" on public.messages;

create policy "Org members can insert messages for their org"
on public.messages for insert to authenticated
with check (
  public.clerk_org_id() = org_id
  and exists (
    select 1 from public.agents a where a.id = messages.agent_id and a.org_id = public.clerk_org_id()
  )
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and c.org_id = public.clerk_org_id()
  )
);

create policy "Org members can update their org's messages"
on public.messages for update to authenticated
using ( public.clerk_org_id() = org_id )
with check (
  public.clerk_org_id() = org_id
  and exists (
    select 1 from public.agents a where a.id = messages.agent_id and a.org_id = public.clerk_org_id()
  )
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and c.org_id = public.clerk_org_id()
  )
);
