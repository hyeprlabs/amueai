-- Full-site RAG ingestion pipeline: adds text/qa source types, full-site
-- crawling (one child `sources` row per discovered page under a root url
-- source), and a canonical extracted-markdown path every source type
-- normalizes to before chunking.
--
-- Deviates from the generic spec's raw `auth.jwt()->>'org_id'` RLS pattern:
-- this project already fixed that exact claim shape mismatch project-wide
-- via public.clerk_org_id() (Clerk's current token nests org id under
-- `o.id`, not a flat `org_id` claim - see
-- 20260827215000_amueai_fix_org_claim_jwt_shape.sql and
-- 20260831180000_amueai_fix_storage_rls_org_claim.sql). Existing policies
-- already use clerk_org_id() and are left as-is; nothing here reintroduces
-- the broken pattern.

alter table public.sources drop constraint sources_type_check;
alter table public.sources add constraint sources_type_check
  check (type in ('text', 'qa', 'file', 'url'));

alter table public.sources drop constraint sources_status_check;
alter table public.sources add constraint sources_status_check
  check (status in ('queued', 'crawling', 'processing', 'ready', 'failed'));

-- Self-reference: a root 'url' source (e.g. the site's homepage) has
-- parent_source_id null; every page the crawler discovers under it is its
-- own row with parent_source_id pointing back at the root.
alter table public.sources add column if not exists parent_source_id
  text references public.sources(id) on delete cascade;

-- Canonical extracted markdown, files-sdk key, always set once a source's
-- content has been normalized (see lib/storage.ts). raw_content is only
-- used transiently for text/qa at submission time and cleared once this
-- is written.
alter table public.sources add column if not exists markdown_path text;

-- Root url sources only - drives the weekly recrawl cron.
alter table public.sources add column if not exists last_crawled_at timestamptz;

-- Root crawl URL, or the discovered page URL for a child row. Previously
-- url sources stored their URL in raw_content; backfilled below.
alter table public.sources add column if not exists url text;
update public.sources set url = raw_content where type = 'url' and url is null;

-- Supports the crawl task's upsert-by-page-URL (a re-crawl updates existing
-- page rows instead of duplicating them). Nullable url is fine - Postgres
-- allows multiple nulls under a unique constraint, so text/qa/file rows
-- (which never set url) don't collide with each other.
alter table public.sources add constraint sources_agent_url_unique unique (agent_id, url);

comment on column public.sources.parent_source_id is
  'Root url source this page was discovered under, null for the root itself and for non-url sources.';
comment on column public.sources.markdown_path is
  'files-sdk storage key for this source''s canonical extracted markdown.';
comment on column public.sources.last_crawled_at is
  'Root url sources only - last successful full-site crawl, drives the weekly recrawl cron.';
