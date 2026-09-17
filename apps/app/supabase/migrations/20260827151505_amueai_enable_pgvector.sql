-- Phase 1: enable pgvector, required for the `chunks.embedding` column
-- (Phase 3) and the `match_chunks` RPC (Phase 3/4).
--
-- Applied to the remote AmueAI project (vwacvviffixddrxbxnkc) via
-- mcp__Supabase__apply_migration under the same name. This repo's
-- supabase/migrations/ starts here — the project's pre-existing Payload
-- and billing-scaffolding migrations (organizations, chatbots, messages,
-- webhook_events, credit engine) predate this build and are not
-- backfilled as local files.
create extension if not exists vector with schema extensions;
