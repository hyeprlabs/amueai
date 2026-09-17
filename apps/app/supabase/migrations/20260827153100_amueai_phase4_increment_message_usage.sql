-- Atomic message-cap check + increment (avoids a check-then-increment
-- race between concurrent widget requests). Mirrors the style of the
-- pre-existing spend_credits function on this project.
create or replace function public.increment_message_usage(p_org_id text)
returns boolean
language sql
set search_path to ''
as $$
  with updated as (
    update public.organizations
       set messages_used = messages_used + 1
     where clerk_org_id = p_org_id
       and messages_used < message_limit
    returning true
  )
  select coalesce((select true from updated), false);
$$;
