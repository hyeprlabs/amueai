-- Clerk Organizations is already the source of truth for org identity and
-- membership - this table only ever mirrored a `clerk_org_id` plus billing
-- fields (plan/credits/polar_*) and a soft message-usage cap, none of
-- which this MVP uses (no billing, and the usage cap was the only thing
-- reading/writing it). Dropping it outright rather than leaving a dead
-- table with RLS policies to maintain. org_id columns on agents/sources/
-- chunks/conversations/messages stay exactly as they are (still the
-- tenancy key everything is scoped by via Clerk's org_id JWT claim) -
-- only the FK to this table goes away.
alter table public.agents drop constraint if exists agents_org_id_fkey;
alter table public.messages drop constraint if exists messages_org_id_fkey;

drop function if exists public.increment_message_usage(text);
drop table if exists public.organizations;
