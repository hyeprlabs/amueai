-- add_topup_credits/claim_credit_alert/grant_monthly_credits/spend_credits
-- all referenced public.organizations, which no longer exists (dropped in
-- 20260827223000) - calling any of them today would fail with
-- "relation does not exist". None are called anywhere in the app (no
-- billing feature is implemented here), so they're dead code left
-- actively broken rather than just unused.
--
-- claim_webhook_event/webhook_events aren't broken, but they're equally
-- unused - no webhook route in this app calls them - and RLS-enabled
-- with zero policies (nothing, not even an authenticated user, can
-- touch the table through PostgREST; only the SECURITY-DEFINER-less
-- claim_webhook_event function could, and nothing calls it). Removing
-- alongside the other dead scaffold rather than leaving unreachable
-- code sitting in the schema.
drop function if exists public.add_topup_credits(text, integer);
drop function if exists public.claim_credit_alert(text, smallint);
drop function if exists public.grant_monthly_credits();
drop function if exists public.spend_credits(text, integer);
drop function if exists public.claim_webhook_event(text, text, text, jsonb);
drop table if exists public.webhook_events;
