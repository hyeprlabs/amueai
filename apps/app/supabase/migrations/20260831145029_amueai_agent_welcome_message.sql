-- The greeting an agent shows first, before the visitor has typed anything -
-- a proactive "Hi! What can I help you with?" rather than a blank panel.
-- Purely a client-side seed for the chat UI (never sent through the model
-- or persisted as a real turn), so it lives on the agent row rather than
-- in conversations/messages.
alter table public.agents
  add column if not exists welcome_message text not null default 'Hi! What can I help you with?';

comment on column public.agents.welcome_message is
  'Greeting shown as the first assistant bubble before any real message is sent. UI-only - never sent to the model or stored in messages.';
