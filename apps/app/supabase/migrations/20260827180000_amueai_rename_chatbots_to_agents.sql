-- Product-wide rename: "chatbots"/"bots" -> "agents", everywhere (DB +
-- app code, applied together). All tables were empty, so this is a pure
-- rename with zero data migration risk.
alter table public.chatbots rename to agents;
alter table public.sources rename column chatbot_id to agent_id;
alter table public.conversations rename column chatbot_id to agent_id;
alter table public.messages rename column chatbot_id to agent_id;

alter table public.agents rename constraint chatbots_org_id_fkey to agents_org_id_fkey;
alter table public.sources rename constraint sources_chatbot_id_fkey to sources_agent_id_fkey;
alter table public.conversations rename constraint conversations_chatbot_id_fkey to conversations_agent_id_fkey;
alter table public.messages rename constraint messages_chatbot_id_fkey to messages_agent_id_fkey;

alter table public.agents rename constraint chatbots_temperature_range to agents_temperature_range;

-- Recreate the four RLS policies on the renamed table with matching names
-- (policy logic is unchanged - org-scoped via auth.jwt()->>'org_id').
drop policy if exists "Org members can view their org's chatbots" on public.agents;
drop policy if exists "Org members can insert chatbots for their org" on public.agents;
drop policy if exists "Org members can update their org's chatbots" on public.agents;
drop policy if exists "Org members can delete their org's chatbots" on public.agents;

create policy "Org members can view their org's agents"
on public.agents for select to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can insert agents for their org"
on public.agents as permissive for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can update their org's agents"
on public.agents for update to authenticated
using ( (select auth.jwt()->>'org_id') = org_id )
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can delete their org's agents"
on public.agents for delete to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

-- match_chunks: rename the chatbot-id parameter and update the join.
-- Postgres won't let CREATE OR REPLACE rename a parameter, so drop first.
drop function if exists public.match_chunks(extensions.vector, uuid, int);

create function public.match_chunks(
  query_embedding extensions.vector(1536),
  match_agent_id uuid,
  match_count int default 6
)
returns table (
  content text,
  source_id text,
  similarity float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select c.content, c.source_id, 1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  join public.sources s on s.id = c.source_id
  where s.agent_id = match_agent_id
    and s.status = 'ready'
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
