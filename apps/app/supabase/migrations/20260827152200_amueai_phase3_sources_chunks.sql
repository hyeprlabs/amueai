-- Phase 3: sources + chunks + match_chunks RPC.
--
-- chatbots.id is uuid (this project's pre-existing default), not text as
-- the skill's own example schema shows, so chatbot_id/match_chatbot_id
-- are typed uuid here to match rather than following the skill literally.
-- vector lives in the `extensions` schema on this project (Phase 1
-- enabled it there), so vector/vector_cosine_ops are schema-qualified.
create table public.sources (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  chatbot_id uuid not null references public.chatbots(id) on delete cascade,
  type text not null check (type in ('text','file','url','qa')),
  label text not null,
  raw_content text,
  storage_path text,
  status text not null default 'queued' check (status in ('queued','processing','ready','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chunks (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  source_id text not null references public.sources(id) on delete cascade,
  content text not null,
  embedding extensions.vector(1536)
);

create index chunks_embedding_idx on public.chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.sources enable row level security;
alter table public.chunks enable row level security;

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

create or replace function public.match_chunks(
  query_embedding extensions.vector(1536),
  match_chatbot_id uuid,
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
  where s.chatbot_id = match_chatbot_id
    and s.status = 'ready'
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
