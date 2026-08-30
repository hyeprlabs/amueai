-- Bug: deleting an agent with any messages failed with a foreign key
-- violation ("update or delete on table agents violates foreign key
-- constraint messages_agent_id_fkey"). This column predates the tracked
-- migration history (added directly on the Supabase dashboard - see the
-- phase4 migration's own comment: "messages already existed ... with RLS
-- enabled and zero policies") and its FK was left ON DELETE NO ACTION,
-- the only one of agents' child-table FKs not set to CASCADE
-- (sources.agent_id, conversations.agent_id, and messages.conversation_id
-- all cascade correctly already). Referential integrity for
-- messages.agent_id is already guaranteed transitively through
-- conversation_id -> agents, so this direct FK only needs to stop
-- blocking the parent delete.
alter table public.messages
  drop constraint messages_agent_id_fkey,
  add constraint messages_agent_id_fkey
    foreign key (agent_id) references public.agents(id) on delete cascade;
