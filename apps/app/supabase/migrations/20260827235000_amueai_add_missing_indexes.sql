-- The agents table's primary key constraint/index is still named after
-- the pre-rename "chatbots" table - purely cosmetic, but worth cleaning
-- up rather than leaving a stale name pointing at product terminology
-- that no longer exists anywhere else in the schema or app.
alter table public.agents rename constraint chatbots_pkey to agents_pkey;

-- Every RLS policy filters by org_id, and the parent-ownership checks
-- added for sources/chunks/conversations/messages join through their FK
-- columns (agent_id/source_id/conversation_id) - none of that had a
-- covering index (only primary keys existed, plus one pre-existing index
-- on messages.org_id). Left unindexed, every select/insert/update/delete
-- and every cascade delete degrades to a sequential scan as data grows.

create index if not exists agents_org_id_idx on public.agents (org_id);

create index if not exists sources_org_id_idx on public.sources (org_id);
create index if not exists sources_agent_id_idx on public.sources (agent_id);

create index if not exists chunks_org_id_idx on public.chunks (org_id);
create index if not exists chunks_source_id_idx on public.chunks (source_id);

create index if not exists conversations_org_id_idx on public.conversations (org_id);
create index if not exists conversations_agent_id_idx on public.conversations (agent_id);

create index if not exists messages_agent_id_idx on public.messages (agent_id);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
