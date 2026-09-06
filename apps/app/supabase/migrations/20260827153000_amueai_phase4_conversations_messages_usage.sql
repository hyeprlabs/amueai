create table public.conversations (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  chatbot_id uuid not null references public.chatbots(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

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

-- messages already existed (id, chatbot_id, org_id, credits_charged,
-- created_at) with RLS enabled and zero policies. Add what the chat
-- flow needs; credits_charged stays but defaults to 0 - no billing
-- logic wires it up yet.
alter table public.messages
  add column conversation_id text not null references public.conversations(id) on delete cascade,
  add column role text not null check (role in ('user','assistant')),
  add column content text not null;

alter table public.messages alter column credits_charged set default 0;

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

-- Fixed free-tier message cap (Usage limits without billing). Reuses
-- the existing organizations row rather than a separate
-- workspace_usage table - plan_credits/topup_credits stay dormant for
-- future billing.
alter table public.organizations
  add column message_limit int not null default 100,
  add column messages_used int not null default 0,
  add column usage_period_start timestamptz not null default now();
