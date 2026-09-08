---
name: amueai-mvp-builder
description: Use this skill when building, extending, or debugging AmueAI — a Chatbase-style "train an agent on your own data" SaaS, built on the modern Vercel/Supabase-native AI stack (Next.js, AI SDK, AI Gateway, AI Elements, Supabase, Clerk, Trigger.dev, Firecrawl, Upstash, shadcn/ui). Covers the full-site RAG ingestion pipeline (text/qa/file/url, every type normalized to markdown → chunk → embed → vector store), the chat/retrieval API, the embeddable widget, the dashboard, and usage limits (no billing). Trigger whenever the user references AmueAI, "the agent builder," "the widget," "data sources," "retrain," "crawl," or any part of this stack, even without naming the skill.
---

# AmueAI MVP Builder

You are building **AmueAI**, a from-scratch clone of Chatbase's original (2023) MVP: a no-code
tool that lets a user feed in their own content and get back an embeddable Q&A agent that only
answers from that content. The _product scope_ is intentionally small and fixed — see below.
The _tech stack_ is intentionally modern and Supabase-native: lean on what Supabase itself
provides (Postgres + pgvector, RLS, Storage, Realtime, CLI migrations) rather than layering a
separate ORM or query engine on top where Supabase's own tooling already does the job.

Resist scope creep toward Chatbase's later "enterprise platform" features (voice, WhatsApp,
actions/refunds, helpdesk handoff, Backstage, SOC2) unless the user explicitly asks to go beyond
MVP. **Billing is explicitly out of scope for this MVP** — see "Usage limits without billing."

This file is the source of truth for architecture, schema, and build order. Read the relevant
section before writing code for that part of the system. **Phases 1–11 below are complete and
live** — the product runs on the "agent" naming (not "chatbot"), Firecrawl instead of
pdf-parse/mammoth/cheerio, and Trigger.dev is already the ingestion backend, not a future phase.
Phase 12 (full-site RAG pipeline: text/qa source types, full-site crawling, files-sdk storage
abstraction) is the current milestone — see "Ingestion pipeline" and "Phase 12" below.

## Already in place — don't re-scaffold this

The user already has **Supabase connected to Clerk via Supabase's native third-party auth
integration** (not the deprecated JWT template), with **Clerk Organizations as the tenancy
boundary**. Verify it, build on it — don't re-set it up from scratch.

- Clerk is configured as a Supabase third-party auth provider (Clerk Dashboard → Supabase
  integration → Clerk domain pasted into Supabase → Authentication → Sign In / Providers).
- Clerk session tokens carry `sub` (Clerk user id) and org id (Organizations) — these are what
  RLS policies check, not an app-maintained workspace table. Workspaces **are** Clerk
  Organizations; there is no separate `workspaces` table.
- **Clerk's currently-issued session tokens are the "compact"/v2 shape**, which nests the active
  org under `o.id` (`{ v: 2, o: { id, slg, rol, per } }`), not a flat `org_id` claim. Every RLS
  policy in this project reads org id through the `public.clerk_org_id()` helper —
  `coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')` — never `auth.jwt()->>'org_id'`
  directly. That flat claim is silently `NULL` under the current token shape: a `using` clause
  built on it fails closed (empty `SELECT`, easy to miss), but a `with check` on it hard-fails
  every `INSERT`/`UPDATE` with `"new row violates row-level security policy"` — this exact bug
  has bitten this project's Storage policies twice already. **Any new RLS policy must call
  `public.clerk_org_id()`, never write `auth.jwt()->>'org_id'` inline.**
- Supabase clients for authenticated routes are built with an `accessToken()` callback that
  returns the Clerk session token, not the `anon`/`service_role` key:
  ```ts
  // lib/supabase/server.ts
  import { auth } from "@clerk/nextjs/server";
  import { createClient } from "@supabase/supabase-js";

  export function createServerSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        async accessToken() {
          return (await auth()).getToken();
        },
      },
    );
  }
  ```
  ```ts
  // hooks/use-supabase-client.ts (client components)
  import { useSession } from "@clerk/nextjs";
  import { createClient } from "@supabase/supabase-js";

  export function useSupabaseClient() {
    const { session } = useSession();
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      },
    );
  }
  ```
- **Row Level Security is the real tenant boundary, not application code.** Every table checks
  `public.clerk_org_id()` against its own `org_id` column. App-layer checks are a UX nicety for
  good error messages, not the security boundary. This has been live-verified end to end
  (impersonating a foreign org via `set local role authenticated` + `set_config('request.jwt.claims', ...)`
  in SQL): a foreign org sees zero rows across `agents`/`sources`/`chunks`/`storage.objects`, and
  an `INSERT` claiming another org's `org_id` is rejected by the `with check` clause, not
  silently accepted.
- **The one place this doesn't apply**: the public, unauthenticated `/api/chat/[agentId]` route
  the widget calls, and every Trigger.dev ingestion task (`ingest-source`, `crawl-website`,
  `process-markdown-source`, `embed-chunk-batch`). None of these run under a live Clerk session,
  so there's no org claim for RLS to check. All use the Supabase **service role** key
  (`createServiceRoleSupabaseClient()`) server-side (never exposed to a client) and do their own
  explicit `org_id`/`agent_id` matching in queries and inserts — this is the one intentional
  exception; every authenticated dashboard route goes through the Clerk-token-scoped client
  instead.

## Product scope (the exact MVP — unchanged regardless of stack)

1. Auth + workspace: a user signs up and lands on a dashboard of agents they own.
2. Create an agent: give it a name.
3. Add data sources to an agent:
   - Plain text paste
   - File upload (PDF, Word, Excel, PowerPoint, CSV, EPUB, RTF, OpenDocument — via Firecrawl's
     document parser, no OCR in MVP)
   - URL(s) — a full-site crawl (Firecrawl `/crawl`), one page per discovered `sources` row under
     the root, one-time at add time (no scheduled recrawl — delete and re-add to refresh)
   - Q&A pairs (question + answer typed directly)
4. Ingestion pipeline runs per source: normalize to markdown → chunk → embed → store. Source shows
   a status (`queued` → `crawling`/`processing` → `ready` / `failed`), updated live via
   Trigger.dev Realtime (primary) and Supabase Realtime (cross-tab baseline).
5. Agent settings: base/system instructions (e.g. "You are a support agent for Acme. Only answer
   from the provided context. If you don't know, say so."), model choice, temperature.
6. Test chat inside the dashboard, using the exact same API the public widget calls.
7. Embeddable widget: copy a `<script>` snippet; it renders a chat bubble on any external site
   and talks to a hosted `/api/chat/[agentId]` endpoint — no login required for the visitor.
8. Conversation logs: every widget/test conversation is stored and viewable per agent.
9. Usage limits: count messages sent per workspace, hard-capped at a fixed free-tier number —
   see "Usage limits without billing" below. No payment flow.

No retrain, no scheduled recrawl, no agent-branding auto-capture — a source that needs refreshing
is deleted and re-added; deliberately smaller surface than earlier iterations of this MVP.

Explicitly NOT in this MVP: voice, WhatsApp/Slack/Messenger/Instagram channels, actions/API-calling
by the bot, human helpdesk handoff, sentiment analytics, team seats beyond what Clerk
Organizations give you for free, A/B testing of prompts, **any billing/payment integration**. If
the user asks for these, treat it as a deliberate post-MVP feature request.

## Usage limits without billing

There is no Stripe, no Clerk Billing, no plans, no upgrade flow in this MVP. There is exactly one
tier: a fixed message cap per organization, enforced on the public chat route. This exists purely
to prevent runaway API cost during development/demo use, not as a monetization mechanism. If the
cap is hit, the widget/test-chat shows a plain "message limit reached" state — no upsell, no
checkout link. Don't build any Stripe webhook, checkout session, or pricing page as part of this
MVP. Revisit billing entirely as a post-MVP milestone.

## Tech stack (Supabase-native where possible, modern Vercel/AI stack everywhere else)

| Layer                       | Choice                                                                                                                                                                                                                                                                                       | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                   | **Next.js (App Router)**, deployed on **Vercel**                                                                                                                                                                                                                                             | Route handlers, streaming, one codebase for dashboard + public chat API + widget host                                                                                                                                                                                                                                                                                                                                                               |
| Language                    | TypeScript everywhere                                                                                                                                                                                                                                                                        | non-negotiable for a project this shape                                                                                                                                                                                                                                                                                                                                                                                                             |
| Auth                        | **Clerk**, with **Organizations** as the "Workspace" concept                                                                                                                                                                                                                                 | org = workspace, org membership = team access                                                                                                                                                                                                                                                                                                                                                                                                       |
| Database + tenant isolation | **Supabase Postgres** with `pgvector`, Clerk as a native third-party auth provider (already configured)                                                                                                                                                                                      | RLS keyed on `public.clerk_org_id()` is the actual tenant boundary                                                                                                                                                                                                                                                                                                                                                                                  |
| Schema & migrations         | Applied via the **Supabase MCP** (`apply_migration`), plain SQL files mirrored under `supabase/migrations/` — **no separate ORM**                                                                                                                                                            | avoids running a second query layer (Drizzle/Prisma over a raw connection string) that wouldn't carry the Clerk JWT the way `accessToken()` does, which would silently bypass RLS if misconfigured                                                                                                                                                                                                                                                  |
| Typed client access         | Regenerated via the **Supabase MCP** (`generate_typescript_types`) after every migration, hand-pasted into `src/types/supabase.ts` (see that file's own header comment — never edit it any other way), passed as the generic to `createClient<Database>(...)`                                | fully typed `.from()`/`.rpc()` calls without hand-written types drifting from the schema                                                                                                                                                                                                                                                                                                                                                            |
| Data access pattern         | **`supabase-js` directly** (`.from()`, `.rpc()`) for all reads/writes on authenticated routes, via the Clerk-token-scoped client; **service-role `supabase-js` client** for the documented exceptions (public chat route, every Trigger.dev task)                                            | matches how Supabase intends RLS + Clerk integration to be consumed — no raw `pg`/connection-string layer in the app                                                                                                                                                                                                                                                                                                                                |
| Vector similarity search    | A Postgres **RPC function** (`match_chunks`, `security invoker`) called via `supabase.rpc('match_chunks', {...})`                                                                                                                                                                            | `security invoker` means the function runs under the caller's RLS on authenticated routes automatically — no need to duplicate org-scoping logic in application code                                                                                                                                                                                                                                                                                |
| Object storage              | **files-sdk** (`trigger/ingest-source/shared/storage.ts`, the only place that touches storage), Supabase Storage adapter today. RLS policies on `storage.objects` scoped by org (same `clerk_org_id()` pattern as table RLS)                                                                 | uploaded originals and every source's canonical extracted markdown live here, path convention `{org_id}/{agent_id}/{source_id}/original.{ext}` and `{org_id}/{agent_id}/{source_id}.md`. A Cloudflare R2 adapter ships in files-sdk but isn't wired up — see "Ingestion pipeline" below for what adding it later requires                                                                                                                           |
| Live status updates         | **Trigger.dev Realtime** (`useRealtimeRunsWithTag`, tag `source:{id}`) as the primary mechanism — exact run-lifecycle status with no dependency on a Postgres change event; **Supabase Realtime** (Postgres Changes on `sources`) as a cross-tab/teammate baseline                           | drives the queued/crawling/processing/ready/failed UI live, no polling, no reload                                                                                                                                                                                                                                                                                                                                                                   |
| AI orchestration            | **Vercel AI SDK** (`ai` package, `@ai-sdk/react` for hooks)                                                                                                                                                                                                                                  | `streamText`, `generateText`, `embed`/`embedMany`, `useChat`                                                                                                                                                                                                                                                                                                                                                                                        |
| Model access                | **Vercel AI Gateway**                                                                                                                                                                                                                                                                        | Never call a provider SDK directly. `provider/model` strings route through the Gateway automatically when `AI_GATEWAY_API_KEY` is set. The chat model list is a **hardcoded** array of three cheap models in `lib/models.ts` (`CHAT_MODELS`, `DEFAULT_CHAT_MODEL`) — no live Gateway catalog fetch, no "Auto" sentinel that resolves to a model at request time. Widening the list means editing that one array, not adding pricing-threshold logic |
| Chat UI                     | **AI Elements** (`npx ai-elements@latest`, from `elements.ai-sdk.dev`)                                                                                                                                                                                                                       | Prebuilt chat primitives built on shadcn/ui, wired for `useChat` streaming. Use for both the dashboard test-chat panel and the widget iframe                                                                                                                                                                                                                                                                                                        |
| General UI                  | **shadcn/ui** + Tailwind CSS                                                                                                                                                                                                                                                                 | dashboard shell, forms, tables, dialogs                                                                                                                                                                                                                                                                                                                                                                                                             |
| Web + document extraction   | **Firecrawl** (`@mendable/firecrawl-js`) exclusively — `.crawl()` for URLs, `.parse()` for uploaded files, each client instantiated directly in the one task file that uses it (`ingest-source/index.ts`, `ingest-source/crawl-website/index.ts`) — no shared `getFirecrawlClient()` wrapper | no hand-rolled fetch/cheerio crawler, no `pdf-parse`/`mammoth`; Firecrawl owns SSRF protection, JS rendering, anti-bot handling, and every document format (PDF/Word/Excel/PowerPoint/CSV/EPUB)                                                                                                                                                                                                                                                     |
| Background jobs             | **Trigger.dev** (`@trigger.dev/sdk`, `@trigger.dev/react-hooks`) — `ingest-source`, `crawl-website`, `process-markdown-source`, `embed-chunk-batch`                                                                                                                                          | durable, retryable background tasks off the request path; each app env (dev/staging/prod) needs its own env vars set directly on the Trigger.dev project — they do NOT inherit from Vercel                                                                                                                                                                                                                                                          |
| Rate limiting               | **Upstash Redis** + `@upstash/ratelimit` on the public `/api/chat/[agentId]` route                                                                                                                                                                                                           | serverless-friendly                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Billing                     | **None**                                                                                                                                                                                                                                                                                     | see "Usage limits without billing"                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Validation                  | **Zod**                                                                                                                                                                                                                                                                                      | validate all route handler inputs                                                                                                                                                                                                                                                                                                                                                                                                                   |

### Trigger.dev environment vars are separate from Vercel's

Tasks run on Trigger.dev's own infrastructure, not Vercel's — env vars set on the Vercel project
never reach them. Each Trigger.dev environment (dev/staging/prod) needs its own copies of
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `FIRECRAWL_API_KEY`, `AI_GATEWAY_API_KEY` set
directly on the Trigger.dev project — via its dashboard, or
`POST /api/v1/projects/:ref/envvars/:env/import` (bearer: a personal access token) if scripting
it. The CLI itself has no `env set` command, only `env list`/`env get`/`env pull`. Forgetting this
surfaces at runtime as `"Error: supabaseUrl is required."` or similar from inside a task, not at
deploy time.

## Data model (SQL migrations + RLS — the Supabase-native way)

Every table carries `org_id`, RLS-scoped to `public.clerk_org_id()`. Current live shape:

```sql
create extension if not exists vector;

create table agents (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  name text not null,
  system_prompt text not null default 'You are a helpful assistant. Only answer using the provided context. If the answer isn''t in the context, say you don''t know.',
  model text not null default 'openai/gpt-4o-mini',
  temperature real not null default 0.3,
  welcome_message text not null default '',
  fallback_message text not null default '',
  allowed_origins text[] not null default '{}',
  remove_branding boolean not null default false,
  created_at timestamptz not null default now()
);

create table sources (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  agent_id text not null references agents(id) on delete cascade,

  -- self-reference: a root 'url' source has parent_source_id = null; every
  -- page the crawler discovers under it is its own row with
  -- parent_source_id set to the root.
  parent_source_id text references sources(id) on delete cascade,

  type text not null check (type in ('text','qa','file','url')),
  label text not null,

  url text,                    -- root crawl URL, or the discovered page URL for a child row
  storage_path text,           -- original uploaded file, files-sdk key (type = 'file' only)
  markdown_path text,          -- canonical extracted markdown, files-sdk key, set once ready
  raw_content text,            -- only for 'text'/'qa' at submission time, cleared once markdown_path is written

  status text not null default 'queued'
    check (status in ('queued','crawling','processing','ready','failed')),
  error_message text,

  last_crawled_at timestamptz, -- root url sources only, set once by the initial crawl

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (agent_id, url) -- supports crawl-website's upsert-by-page-URL; nullable url is fine
);

create table chunks (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  source_id text not null references sources(id) on delete cascade,
  content text not null,
  embedding extensions.vector(1536)
);

create index chunks_embedding_idx on chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create table conversations (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  agent_id text not null references agents(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now()
);

create table messages (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  agent_id text not null references agents(id) on delete cascade,
  conversation_id text not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
```

RLS — the identical four-policy pattern (`select`/`insert`/`update`/`delete`) on every table,
using `public.clerk_org_id()`, shown fully for `agents` (repeat for `sources`, `chunks`,
`conversations`, `messages`, substituting the table name and, where the table has a parent, an
`exists (...)` check against it — see the live policies for the exact shape):

```sql
create or replace function public.clerk_org_id() returns text
language sql stable
set search_path = ''
as $$
  select coalesce(
    (select auth.jwt()->>'org_id'),
    (select auth.jwt()->'o'->>'id')
  );
$$;

alter table agents enable row level security;

create policy "Org members can view their org's agents"
on agents for select to authenticated
using ( public.clerk_org_id() = org_id );

create policy "Org members can insert agents for their org"
on agents for insert to authenticated
with check ( public.clerk_org_id() = org_id );

create policy "Org members can update their org's agents"
on agents for update to authenticated
using ( public.clerk_org_id() = org_id )
with check ( public.clerk_org_id() = org_id );

create policy "Org members can delete their org's agents"
on agents for delete to authenticated
using ( public.clerk_org_id() = org_id );
```

`sources` and `chunks` are written by Trigger.dev tasks under the service-role key (no live Clerk
session), so their `org_id` is stamped explicitly in task code (copied from the parent
`agent`/`source`) rather than defaulted from `auth.jwt()`. They still get the same four RLS
policies for read access from the dashboard.

The vector search RPC function:

```sql
create or replace function public.match_chunks(
  query_embedding extensions.vector(1536),
  match_agent_id text,
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
  where s.agent_id = match_agent_id
    and s.status = 'ready'
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
```

Called from the authenticated dashboard test-chat route via the Clerk-token client — `security
invoker` means the caller's RLS applies automatically, no extra org filter needed in the function
itself. Called from the public widget chat route via the service-role client — RLS is bypassed
there regardless of `security invoker`/`definer`, which is fine since `match_agent_id` is already
an explicit, validated parameter and the route does its own `org_id` lookup separately for usage
accounting.

Storage bucket policy (private `sources` bucket, path convention `org_id/agent_id/...`):

```sql
create policy "Org members can read their org's files"
on storage.objects for select to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );

create policy "Org members can upload to their org's folder"
on storage.objects for insert to authenticated
with check ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );

create policy "Org members can delete their org's files"
on storage.objects for delete to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = public.clerk_org_id() );
```

## API surface

One resource, one route file per shape, REST verbs mapped straight onto HTTP methods (Resend's
own API is organized the same way — a flat `POST /agents`-style collection route plus a
`GET`/`PATCH`/`DELETE` `:id` route per resource). No Server Actions anywhere in the agent surface
— every one of these is a plain route handler behind the RLS-scoped Clerk client, called from
client forms through the shared `apiFetch` helper (`lib/api-client.ts`) instead of a
framework-specific action import:

- `POST /api/agents` — create an agent (Clerk-token client; RLS scopes it to the active org)
- `GET /api/agents/:id` — read
- `PATCH /api/agents/:id` — update name/systemPrompt/model/temperature/etc.
- `DELETE /api/agents/:id` — delete (cascades sources/chunks/conversations/messages)
- `POST /api/agents/:id/sources` — add a source (`text`/`qa`/`file`/`url`); dispatches to
  `crawl-website` (url) or `ingest-source` (everything else) via `lib/trigger.ts`'s
  `triggerIngestion`, and returns `{ source, run: { tag, publicAccessToken } }` for the client to
  subscribe to live status with `useRealtimeRunsWithTag`
- `DELETE /api/agents/:id/sources/:sourceId` — delete source + its chunks (cascades), and its
  uploaded file from Storage
- `POST /api/chat/:agentId` — **public, no Clerk auth**. Body: `{ message, conversationId? }`.
  Service-role client, explicit `org_id`/`agent_id` checks, `match_chunks` RPC, `streamText`
  through the Gateway. Rate-limited via Upstash. Checks/increments usage; 429 if the cap is
  reached.
- `GET /api/agents/:id/conversations` — list conversations + messages for the dashboard
- `GET /widget.js` — route handler, not a static file (see "Widget" below)
- No billing endpoints in this MVP.

No retrain endpoint and no recrawl cron — a source that needs refreshing is deleted and re-added.
No agent-branding endpoint or Server Action — the dashboard never auto-captures a site's colors or
logo.

## Ingestion pipeline (the core of the product)

**Core principle: every source becomes markdown, always.** Regardless of whether a source is
`text`, `qa`, `file`, or `url`, the pipeline normalizes it to a single canonical Markdown document
before chunking. There is exactly one chunk/embed/store code path (`processMarkdownSource`), fed
by different extraction paths:

```
text   → markdown = raw_content, wrapped in a level-1 heading with the label
qa     → markdown = "## {question}\n\n{answer}" per pair, joined
file   → markdown = Firecrawl .parse() output
url    → markdown = Firecrawl .crawl() output, one markdown doc PER discovered page
```

Everything for the ingestion pipeline lives under `src/trigger/`, as **one folder per task,
nested under the main task that owns them**:

```
src/trigger/
  ingest-source/                    main task: the only entry point, for every source type
    index.ts
    crawl-website/index.ts          sub-task: url sources
    process-markdown-source/index.ts  sub-task: the one chunk/embed/store path
    embed-chunk-batch/index.ts        sub-task: one embedMany() call per batch
    shared/
      source.ts    SourceRef, claimSource(), updateSource(), markFailed(), db()
      storage.ts   the files-sdk `files` instance + markdownKey()
      chunk.ts     chunkText() / chunkArray()
```

A future pipeline gets its own top-level `src/trigger/<main-task>/` folder with its sub-tasks
nested under it the same way; a new sub-task of this one is a new folder beside its siblings.
`trigger.config.ts`'s `dirs: ["./src/trigger"]` picks any of them up regardless of nesting, so no
config change is ever needed. Cross-task imports are relative (`../process-markdown-source`);
imports from outside `src/trigger/` use `@/trigger/ingest-source`, which resolves to the folder's
`index.ts`.

**Every task takes the same payload**, `SourceRef = { sourceId, orgId, agentId }` — nothing else
is passed between them. Each task reads what it needs from the `sources` row it already has the id
for, and derives the markdown storage key from the ids (`markdownKey()`), so no payload can drift
out of sync with the row. `claimSource()` is called exactly once, at the entry point: it flips
`queued -> processing` only if the row isn't already `processing` and returns the row in the same
round trip, so a double-triggered source exits quietly and every downstream task can skip claiming
entirely.

There is deliberately **no `markdown_path` write**: the column exists but nothing reads it, and
writing it cost one extra UPDATE per crawled page.

```
POST /api/agents/:id/sources → tasks.trigger("ingest-source", { sourceId, orgId, agentId })

ingest-source (the only entry point)
  claimSource() → returns the row, or null if another run already claimed it
  ├─ type = url:               crawlWebsite.triggerAndWait(...)
  └─ type in (text, qa, file):  markdown → files.upload(markdownKey(ref))
                                → processMarkdownSource.triggerAndWait(...)

crawl-website (url → many markdown docs, one per page)
  status -> "crawling" → Firecrawl .crawl() → upsert one `sources` child row per page
  (parent_source_id = root, onConflict agent_id+url) → upload each page's markdown →
  processMarkdownSource.batchTriggerAndWait(...) (each item tagged source:{rootId}, not its own
  id, so the dashboard's one subscription on the root sees every page's progress) →
  root source -> "ready", last_crawled_at = now()

process-markdown-source (shared by ALL source types — the one chunk/embed/store path)
  chunkText/chunkArray (shared/chunk.ts) → embedChunkBatch.batchTriggerAndWait (fanned out) →
  insert new chunks → delete the source's prior chunks (only after the new set is stored) →
  source -> "ready"
```

Storage goes through **files-sdk** (the `files` instance exported from
`trigger/ingest-source/shared/storage.ts`),
never `supabase.storage.*` directly. `files.download(key)` returns a `StoredFile` (`.blob()`,
`.text()`, `.arrayBuffer()`), not a raw Blob — get the blob out before handing it to Firecrawl's
`.parse()`. A future Cloudflare R2 migration means installing `files-sdk/r2`'s AWS SDK peer deps
(`@aws-sdk/client-s3`, `@aws-sdk/s3-presigned-post`, `@aws-sdk/s3-request-presigner` — not
installed today) and branching on `process.env.STORAGE_PROVIDER` in `trigger/ingest-source/shared/storage.ts`
the same way it already branches on nothing else today (Supabase is the only adapter wired up);
Trigger.dev's bundler resolves every static import regardless of which branch runs, so
`files-sdk/r2` can't be imported unconditionally until those deps exist.

Each task's `onFailure` hook takes a **single destructured params object**
(`{ payload, error, ctx, ... }`), not two positional arguments — this is a real API detail easy to
get wrong from memory/generic examples:

```ts
onFailure: async ({ payload, error }) => {
  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("sources").update({ status: "failed", error_message: String(error) }).eq("id", payload.sourceId);
},
```

Never let a source's status flip to `ready` on partial success, and never touch a source's prior
chunks until the new set is fully stored (a failed run shouldn't blank out a working agent). A
losing claim (two overlapping runs on the same source) should return quietly, not throw
— throwing triggers `onFailure` and incorrectly marks the source `failed` even though the winning
run is still legitimately in flight.

## Live status in the dashboard

Two mechanisms, both without a page reload:

1. **Trigger.dev Realtime** (`useRealtimeRunsWithTag`, tag `source:{id}`) — the primary mechanism,
   mint a Public Access Token scoped `{ read: { tags: [tag] } }` right after triggering
   (`lib/trigger.ts`), pass it to the client, subscribe. Immediate, exact run-lifecycle status,
   independent of any Postgres change event reaching the client — this is what makes a full-site
   crawl's "N/M pages processed" progress possible (every child page's `processMarkdownSource` run
   carries the _root_ source's tag).
2. **Supabase Realtime** (Postgres Changes on `sources`) — a baseline so a second tab or a
   teammate viewing the same agent also sees status live, even without a run token for it.

A newly queued source is added to local UI state directly from the route's response
(source + run), not left to wait on a Realtime event to even show the row. Once a source's tagged
runs all settle, refetch that row directly rather than trusting Supabase Realtime already picked
up the DB write — the badge should never fall back to a stale pre-run status.

## Chat/retrieval flow (runtime path — widget and dashboard test-chat both call this)

1. Rate-limit check (Upstash, keyed by IP + `agentId`).
2. Reject if the usage cap is hit for the org (429, clear error body — no upsell copy).
3. Embed the incoming user message via the Gateway (same model as ingestion).
4. Call `match_chunks` RPC for top-k (k=4–6) chunks scoped to that agent's `ready` sources.
5. Build the prompt with the agent's `system_prompt` plus the retrieved context, instructing the
   model to answer only from context and say so plainly when it doesn't know.
6. `streamText({ model: agent.model, temperature: agent.temperature, messages })` through the
   Gateway, returned as a `useChat`-compatible stream, rendered with **AI Elements**.
7. Persist the user + assistant messages once streaming completes; increment usage by 1 per user
   turn.
8. If `conversationId` wasn't provided, create a new `conversations` row and return its id.

## Widget

Architecture: a closed **Shadow DOM** host holding a single **cross-origin iframe**
(`/embed/:agentId`), which renders its own shadcn `Popover` — trigger button and chat panel both
live inside the iframe, not split across the frame boundary. `widget.js` only owns the iframe's
box size on the host page, toggled by two discrete `postMessage`s the iframe sends itself.

- `src/widget/widget.js` is the source of truth: hand-written, zero-dependency vanilla JS (no
  bundler runtime), budgeted at **under 5kb gzipped**, enforced by `scripts/build-widget.mjs`
  (runs as part of `pnpm build`, exits non-zero over budget — this repo has no separate CI, so the
  build itself is the gate). Never import a shared util/framework into this file.
- It creates a `div` with a **closed** `attachShadow`, holding only the `<iframe>` — immune to the
  host page's own CSS (resets, `* { all: unset }`, global `iframe` selectors). Deferred via
  `requestIdleCallback` (`setTimeout` fallback for Safari) so it never competes with the host
  page's own critical rendering path. The iframe mounts on page load (not lazily on first click)
  because the launcher button itself is rendered inside it — this is a deliberate trade against
  the earlier lazy-mount optimization, made so the whole widget (trigger + panel) could be one
  self-contained shadcn/AI-SDK React component instead of a vanilla-JS button paired with a
  separate iframe UI.
- **The iframe hugs the visible UI exactly, in both states, and the UI fills it edge to edge —
  and the trigger's own geometry never depends on the iframe's current size.** Closed: a 56x56
  iframe (`widget.js`'s default `iframe{}` rule), and the trigger `Button` is a **fixed 56x56**
  circle pinned to its corner (`fixed bottom-0 right-0 size-14`, never `inset-0`/`size-full`).
  Open (`iframe[data-open]`): `min(400px,100vw-32px)` x `min(640px,100vh-32px)`, and
  `PopoverContent` is forced to `!fixed !inset-0 !size-full`. **Never size the trigger off the
  iframe's box (`inset-0 size-full`).** The iframe resize (driven by `widget.js`, instant, no CSS
  transition) and the React re-render that swaps the trigger's classes are two separate documents
  on two separate paint schedules — they cannot be made to land in the same frame. A trigger sized
  `inset-0`/`size-full` stretches into a giant pill exactly the size of the about-to-open chat
  panel for the (however brief) window where the iframe has already resized but React hasn't
  re-rendered yet. A trigger with a **fixed pixel size** never stretches regardless of which side
  of that race wins — worst case it's a small correctly-shaped circle sitting in the corner of an
  already-large frame for one frame, not a giant pill.
- **Never leave slack between the iframe box and the UI inside it, in either state.** An iframe's
  canvas is not reliably transparent: it composited fine in local Chromium but painted opaque
  white in the wild, which showed up as a white square behind the launcher and a white border
  around the panel on a customer's dark site. Any slack is a white box waiting to happen. Two
  belts to the same braces, neither load-bearing on their own: the embed document sets
  `color-scheme: dark` (so an unpainted canvas is near-black, not white) and `widget.js` sets
  `background:transparent` on the iframe.
- Getting `PopoverContent` to actually land at exactly `(0,0)` sized to the iframe — not merely
  intended to — needs one thing that is easy to miss: base-ui's `Positioner` (the `Popup`'s
  immediate parent) sets an inline `transform` for its floating-ui placement math, and a
  `transform` on an ancestor creates a new **containing block** for `position: fixed` descendants.
  Forcing `!fixed !inset-0` on the popup alone resolves against the `Positioner`'s own collapsed
  `0x0` box, not the true viewport — it measures `(0,0) 0x0`, not a bug in the class names but in
  which element they're fighting. `PopoverContent` takes a `positionerClassName` prop for exactly
  this: pass `!fixed !inset-0 !transform-none` to neutralize the `Positioner`'s transform so the
  popup's own `fixed` positions against the real viewport.
- **This full-viewport trick is conditional on actually being inside a host iframe
  (`window.parent !== window`, read once via `useEffect` into a `framed` boolean state — reading
  it eagerly during render would throw during SSR).** Unframed — the dashboard Playground, which
  renders `Widget` directly with no wrapping iframe — `PopoverContent` must NOT force
  `!fixed !inset-0`, or the chat hijacks the entire dashboard viewport instead of floating near the
  button. Unframed, it's a plain, normally-anchored popover (`h-[560px] w-[360px]`, default
  `side`/`align`/`sideOffset`, no `positionerClassName` override) — the same component, branched
  on `framed`, not two components.
- **Every path that closes the panel must go through the same `toggle(false)` that posts
  `amueai:close`** — `Popover`'s own `onOpenChange` (trigger click, `Escape`, outside click) is
  wired to it, and so must the header's `X` button be. A bare `onClick={() => setOpen(false)}` on
  that button flips React state without ever telling `widget.js` to shrink the iframe back down —
  the panel stays stuck open-sized with nothing in it responding, since `setOpen` alone never
  reaches the parent document.
- Which size the iframe applies is driven by the two messages its own content posts on open/close
  (`{type:"amueai:open"}` / `{type:"amueai:close"}`) — a discrete boolean toggle, not a
  measurement. **Never reintroduce a content-height bridge** (continuously measuring rendered
  content and feeding that back as a size) — that's a different, incompatible thing from this
  open/close toggle. The earlier flicker bug came from a `ResizeObserver` on an `h-full` element
  posting its _own_ measured height back to the parent that had just set that height on it: a
  self-referential loop that can't resolve, settling at a 0-height panel and re-triggering on
  every streamed token. The current toggle carries no measurement at all.
- Why the iframe box has to actually resize (not just fade/hide) between these two states: an
  `<iframe>` element's own `pointer-events` in the _parent_ document is one on/off switch for its
  entire rectangle — content inside the iframe setting its own `pointer-events: none` on unused
  areas does **not** let clicks fall through to the host page underneath. So the invisible
  hit-testable area must always match what's actually visible: a small circle when closed, the
  full panel when open. A single large iframe that's merely faded out when "closed" would silently
  block clicks on whatever's underneath it on the host page.
- **On a narrow viewport, the panel is a shadcn `Drawer` (full-screen bottom-sheet primitive)
  instead of a `Popover`** — same trigger `Button`, same `PanelHeader`/`Chat` body, just a
  different wrapper chosen by an `isMobile` boolean: `framed ? mobile : useIsMobile()`. The
  `mobile` half only exists because a cross-origin iframe can't read the host page's own viewport
  width — `widget.js` computes `window.matchMedia("(max-width: 480px)").matches` once (matching
  the same breakpoint as its own CSS fullscreen rule) and appends `mobile=1` to the iframe's `src`
  query string, mirrored by `page.tsx` into a `mobile` prop, the same static-snapshot-at-creation
  pattern already used for `side`. Unframed (the dashboard Playground), there's no cross-origin
  boundary in the way, so it just reads `useIsMobile()` (the existing 768px-breakpoint hook)
  directly — a deliberately different breakpoint from the embed's 480px, since they answer
  different questions (is this a mobile device vs. does the visitor's browser cross the width where
  `widget.js` already makes the iframe fullscreen).
- **A shadcn `Drawer` is not full-screen by default, even with `--drawer-height` set.** For a
  swipe-axis-y drawer (the default, `swipeDirection="down"`) the component's own base classes bake
  in `--drawer-content-max-height: calc(100dvh - 6rem)` — a deliberate peek gap at the top for a
  normal bottom sheet. Setting `--drawer-height` alone (even via an `!important`-flagged class)
  loses to that more specific `data-[swipe-axis=y]:[...]` rule. Making it genuinely full-screen
  needs **both** `--drawer-height` and `--drawer-content-max-height` overridden together, and
  reliably winning that specificity fight means setting them via an inline `style` prop
  (`DrawerContent` forwards arbitrary props to the underlying `Popup`), not a class — inline style
  beats a plain class regardless of selector specificity. Also use `100vh`, not `100dvh`, for both:
  `position: fixed; inset: 0` (used elsewhere, e.g. the framed `Popover`'s `positionerClassName`)
  resolves against the large/static viewport, and a `dvh`-sized sibling can end up measurably
  shorter than that when the browser's dynamic-viewport-height adjustment doesn't apply the same
  way to both — measured directly (not assumed) via the rendered heights.
- **The chat itself (`useChat`, `DefaultChatTransport`, message rendering, the composer) lives in
  its own file, `src/components/widget-chat.tsx`, loaded via `next/dynamic(..., { ssr: false })`
  from `widget.tsx`.** This is the one deliberate exception to "the widget is one file" — splitting
  it out is what makes the AI SDK code a separate chunk the browser never fetches for a visitor who
  loads the page but never opens the chat (verified: several additional chunks load only after the
  first click, zero before). `widget.tsx` calls `import("@/components/widget-chat")` speculatively
  on the trigger's `pointerenter`/`focus` too, so the chunk is usually already warm by the time a
  visitor actually clicks. Message rows are wrapped in `memo` so a streaming reply's re-renders
  don't re-diff every prior message.
- **Never animate the trigger `Button` itself with `initial`/`animate` (`motion/react` or
  otherwise).** It was tried once, for a mount "pop-in": `motion` renders its `initial` state
  straight into the server-rendered HTML as an inline `style` (verified directly —
  `style="opacity:0;transform:scale(0.6)"` was present in the raw SSR output), so the button is
  genuinely invisible until React hydrates and motion's JS runs. On any real-world connection
  that's a real gap where the launcher — the _only_ thing rendered on page load, since the panel
  doesn't mount until first open — is either invisible or missing entirely. The trigger's
  hover/tap feedback is plain Tailwind (`transition-transform hover:scale-105 active:scale-95`);
  it must be visible, unanimated, and fully itself in the raw HTML, before any JS runs at all.
  Micro-animation is fine deeper in the tree (e.g. inside `widget-chat.tsx`, which only ever mounts
  client-side after the lazy import resolves, so it never appears in SSR output) — never on
  anything that's part of the widget's very first paint.
- The agent's `name`/`welcome_message` lookup in `page.tsx` is wrapped in `unstable_cache` (not the
  `"use cache"` directive — this project hasn't opted into Cache Components, and enabling
  `cacheComponents` project-wide is a far bigger change than this one lookup warrants), keyed and
  tagged per `agentId` (`["embed-agent", agentId]`, tag `` `agent-${agentId}` ``), `revalidate: 60`.
  `PATCH`/`DELETE /api/agents/:id` call `revalidateTag(\`agent-${id}\`, "max")` so a dashboard edit
reflects on the public widget immediately rather than waiting out the TTL — **`revalidateTag`takes a required second argument in this Next.js version** (a`cacheLife`profile name,`"max"`
  for the standard stale-while-revalidate behavior); the old one-argument call still type-errors
  here, not a training-data assumption to trust.
- `/widget.js` is a **route handler** (`src/app/widget.js/route.ts`), not a static file: in
  production it 302-redirects (short-cached, `max-age=300`) to whatever content-hashed
  `widget.<hash>.js` the last build produced (immutably cached, `max-age=31536000`) — existing
  customer embeds pick up non-breaking improvements within minutes without ever touching their
  snippet, while the actual payload is cached hard at the edge. In dev (no build has run, no
  manifest on disk) it serves `src/widget/widget.js` directly. `public/widget.*.js` and
  `public/widget-manifest.json` are build artifacts — gitignored, regenerated every build, never
  hand-edited.
- **There is exactly one chat UI in the codebase**: `src/components/widget.tsx`, exporting
  `Widget`. It renders _only_ a shadcn `Popover` — a rounded-full `Button` with a
  `MessageCircleIcon` as `PopoverTrigger`, and a `PopoverContent` panel with the agent name
  top-left, an `XIcon` close button top-right, and **AI Elements** (`Conversation`, `Message`,
  `Shimmer`) + `useChat` against `/api/chat/[agentId]` below — with no wrapper element around it.
  Both surfaces render that same component: the embed route (`app/embed/[agentId]/page.tsx`, the
  iframe a customer's site loads) and the dashboard Playground. The old parallel dashboard stack
  (`ChatPreview` -> `ChatWidget` -> `ChatPanel`) is gone; it had drifted into a _second_ chat
  implementation, and its `ChatPreview` wrapped the chat in a 40rem `border bg-muted/30` box —
  the "weird white box" the widget appeared to open inside.
- **The widget carries its own dark theme**, as `dark` on the trigger and the panel themselves
  (`.dark` is a plain class selector in `globals.css`, so it scopes the dark tokens to that
  subtree). That is what keeps it dark inside the light dashboard _and_ on any customer page,
  without a wrapper div and without the embed document having to be dark. `app/embed/layout.tsx`
  is therefore theme-neutral, with a `bg-transparent` body so the iframe composites onto the host
  page instead of painting a box — verified against a bright-red host page.
- `Widget` only talks to a host frame when it actually has one (`window.parent !== window`), so
  the same component works unframed in the dashboard.
- No custom font (`next/font` or otherwise) — inherits the system font stack on purpose. It ships
  the app's shared `globals.css` rather than a separately-purged stylesheet — a known trade-off,
  not yet worth a second Tailwind build pipeline for one route.
- **Two postMessages in the whole protocol**, both origin-checked by `widget.js` on receipt:
  `{type:"amueai:open"}` and `{type:"amueai:close"}`, posted from an `useEffect` keyed on the
  `Popover`'s own `open` state (`onOpenChange`) — covers the trigger click, `Escape`, and
  outside-click, since all three already flow through base-ui's `Popover` state, not
  hand-rolled listeners. Nothing else crosses the frame boundary.
- Accessibility: `Conversation` carries `aria-live="polite"` (on top of its existing `role="log"`)
  so screen readers announce streamed replies without interrupting; the trigger and close buttons
  are real `Button`s with `aria-label`s.
- `Content-Security-Policy: frame-ancestors *` on `/embed/:path*` (`next.config.ts` `headers()`) —
  documents that arbitrary cross-origin framing is intentional here, the whole point of the
  widget. Revisit with a per-agent domain allowlist if that becomes a paid-plan feature.
- Rate limiting on `/api/chat/[agentId]` (Upstash, IP + agentId) already covers the widget's public
  surface — see "Chat/retrieval flow" above.
- SRI (`integrity="sha384-..."` on the snippet's `<script>` tag) is deliberately **not** wired up:
  the content hash changes on every deploy under the current caching scheme, which is fundamentally
  incompatible with pinning a single SRI hash. Revisit only alongside a `widget-v2.js`-style major
  version split (a new path for any breaking postMessage/DOM change, so old embeds keep working
  indefinitely on the old file) — that's the point at which a hash is stable enough to pin.
- Snippet shown to the user (`agents/[id]/build/embed`):
  ```html
  <script src="https://yourdomain.com/widget.js" data-agent-id="AGENT_ID" async></script>
  ```
  `data-position="bottom-left"` is also supported (default `bottom-right`).

## Build phases

**Phases 1–11 (foundations through fine-tuning) are complete and live** — agent CRUD, sources +
ingestion (originally text-only inline, since replaced by the full Trigger.dev task graph below),
the chat/retrieval API, the dashboard test-chat panel, the public widget, conversation logs,
Realtime status, and background jobs on Trigger.dev with Upstash rate limiting all exist in the
current codebase. Read the sections above for their current shape rather than an in-progress plan.

**Phase 12 — Full-site RAG ingestion pipeline**
Rearchitected ingestion from a single inline extract-chunk-embed-store function into the task
graph described above: added `text`/`qa` source types, full-site crawling for `url` sources (one
child `sources` row per discovered page), the `files-sdk` storage abstraction, and
Trigger.dev-Realtime-driven live status (tag-based, covering both single-doc and many-page-crawl
cases). Live-verified the RLS audit (see "Already in place") as part of this milestone rather than
deferring it. (The weekly-recrawl-via-Vercel-Cron piece of this phase was later removed — see
Phase 15.)

**Phase 13 — High-performance embeddable widget**
Rearchitected the widget from a direct-DOM-injection loader (iframe eagerly created and hidden on
every page load, no Shadow DOM, fixed-size panel) into the Shadow-DOM-launcher +
lazy-cross-origin-iframe architecture described in "Widget" above: `requestIdleCallback`
deferral, iframe created only on first click, `ResizeObserver`/`postMessage` sizing and mobile
fullscreen bridge, focus trap + `Escape`-to-close, load-failure fallback, `frame-ancestors` CSP,
and content-hash + short-cached-redirect caching (`scripts/build-widget.mjs` + `widget.js` route
handler) in place of a mutable static file. Rate limiting was already in place and needed no
change.

**Phase 14 — Codebase cleanup: minimal REST API, no comments**
Two changes, both about surface area rather than behavior: (1) agent CRUD moved from Server
Actions to a Resend-style REST surface — `POST /api/agents`, `GET`/`PATCH`/`DELETE /api/agents/:id`
— with a tiny shared `apiFetch` client helper replacing five separate hand-rolled try/catch blocks
across the dashboard forms; (2) explanatory comments removed throughout — naming and structure
carry the intent instead. Lint/type-checker directive comments (`oxlint-disable`,
`@ts-expect-error`) are the one exception, since those aren't documentation, they're instructions
to the tooling. (This phase briefly collapsed the four Trigger.dev tasks into one file,
`trigger/tasks.ts` — reverted in Phase 15 back to one file per task, still all under `src/trigger/`.)

**Phase 15 — Trim to the minimal MVP surface: no retrain, no scheduled recrawl, no branding capture**
Removed three features that added surface area without being part of the fixed MVP scope: the
per-source retrain endpoint/button, the weekly recrawl Vercel Cron (`vercel.json` and
`/api/cron/recrawl-sources` are both gone — a `url` source's initial crawl still runs once at add
time, it just never re-runs on a schedule), and agent-branding auto-capture (`captureAgentBrand`,
`lib/branding.ts`, and the `agents.brand` column, dropped via migration). Also split the
Trigger.dev task graph back into one file per task under `src/trigger/` (`ingest-source.ts`,
`crawl-website.ts`, `process-markdown-source.ts`, `embed-chunk-batch.ts`, plus `chunk.ts`,
`storage.ts`, `shared.ts` for the helpers only they use — nothing ingestion-related lives in
`src/lib/` anymore), and removed the now-unnecessary shared `lib/firecrawl.ts` wrapper: each task
that calls Firecrawl constructs its own client directly.

**Phase 16 — Hardcoded models, a detached widget UI, cleaner Supabase clients, no tests**
Four changes: (1) the dynamic AI Gateway model catalog (`lib/gateway-models.ts`,
`lib/model-picker.ts`, the `"auto"` sentinel, the pricing-threshold filtering) is gone, replaced
by a hardcoded `CHAT_MODELS` array in `lib/models.ts` — three cheap models, no auto-resolution,
`ModelSwitcher` is a plain `Select` over that array instead of AI Elements' searchable
`ModelSelector`; (2) the public widget (`app/embed/[agentId]/widget.tsx`) is its own self-contained
UI, no longer sharing `ChatPanel` with the dashboard's Playground preview — see "Widget" above;
(3) every `createServerSupabaseClient()` call site dropped a stray `await` — the function is
synchronous (it only wraps a Clerk `accessToken()` closure, no cookies to read), so awaiting it
was always a no-op, not a correctness issue but not how Supabase's own Clerk-integration example
writes it either; (4) every Vitest test file added while building this app is gone, along with the
now-dead `sources.tsx` AI Elements component and the chat route's source-citation plumbing
(`source-url` message parts) that only that removed UI ever rendered. `vitest`, `vitest.config.ts`,
and the `test` script are untouched — there's simply nothing under `src/**/*.test.ts` right now.

**Phase 17 — Trigger tasks in their own folders, an explicit default model, dogfooding the widget**
Three changes: (1) `src/trigger/` moved from one file per task to one **folder** per task
(`ingest-source/index.ts`, `crawl-website/index.ts`, `process-markdown-source/index.ts`,
`embed-chunk-batch/index.ts`), with the cross-task helpers under a `shared/` folder — see
"Ingestion pipeline" above for the exact layout and the convention for adding a new task; (2)
`POST /api/agents` now inserts `model: DEFAULT_CHAT_MODEL` explicitly instead of relying solely
on the `agents.model` column's SQL default — both already agreed (`openai/gpt-4o-mini`), but the
app-code path is now the source of truth rather than a DB default that could silently drift from
`lib/models.ts`; (3) the marketing site embeds its own widget for live dogfooding
(`components/marketing/widget-embed.tsx`, rendered from the `(marketing)` layout only — never the
dashboard or the embed route itself, which would nest the widget inside its own iframe) pointed at
a real agent already trained on amueai.com's own pages (id `9417dbb0-6ad3-473c-a568-ff3ac42acf56`
in the `agents` table) — visit any marketing page to test the real, deployed widget end to end.

**Phase 18 — Readable tasks, a widget that doesn't flicker, dead weight gone**
Four changes: (1) the trigger tree became **sub-tasks nested under their main task**
(`ingest-source/` owning `crawl-website/`, `process-markdown-source/`, `embed-chunk-batch/`,
`shared/`), `ingest-source` became the single entry point, and every task now takes the same
`SourceRef` payload and reads the row itself — the whole pipeline is ~250 lines across 7 files,
and `lib/trigger.ts` went from 65 lines of per-type branching to one `tasks.trigger` call;
(2) the widget's content-height bridge is gone in favour of a CSS-sized panel — see "Widget" for
why it flickered and what replaced it; (3) this PR's dead vendored components were deleted
(`ai-elements/prompt-input.tsx`, `ai-elements/model-selector.tsx`, `ui/command.tsx`,
`ui/switch.tsx` — 1616 lines, none of them imported anywhere) along with the `cmdk` and `nanoid`
dependencies they were the only users of; (4) smaller trims: the `retryAt` rate-limit wire
protocol (only the removed countdown UI read it), the chat route's 32-line
find-or-create-conversation branch (now one `upsert`), and the duplicate status-badge rendering in
`sources-table.tsx` / `live-source-status.tsx` (now one `SourceStatusBadge`).

**Phase 19 — The widget's trigger and panel moved inside the iframe**
The embeddable widget's launcher button and chat panel are now both rendered by
`app/embed/[agentId]/widget.tsx` itself, as a single shadcn `Popover` (rounded-full `Button` +
`MessageCircleIcon` trigger, a panel with an agent-name header and an `XIcon` close button,
forced dark theme) instead of a vanilla-JS button living outside the iframe in `widget.js`'s
Shadow DOM. `widget.js` shrank to just mounting the iframe and toggling its CSS box between a
64x64 closed circle and the full open panel size, driven by two `postMessage`s
(`amueai:open`/`amueai:close`) the `Popover`'s own `onOpenChange` sends — see "Widget" above for
why this needed the iframe to mount on page load rather than lazily on first click, and why that
trade-off doesn't reintroduce the earlier content-height-bridge flicker bug. `page.tsx` now also
fetches the agent's `name` for the header.

**Phase 20 — One `Widget` component everywhere, and its geometry made actually robust**
The parallel dashboard chat stack (`ChatPreview` -> `ChatWidget` -> `ChatPanel`, and
`app/embed/[agentId]/widget.tsx`) collapsed into exactly one component,
`src/components/widget.tsx`, rendered directly by both the embed route and the dashboard
Playground — no more drift between what a visitor sees and what the dashboard previews. Getting
one component to look right in both a customer's cross-origin iframe and the plain dashboard page
needed: a `framed` boolean (`window.parent !== window`, read once via `useEffect`) branching
`PopoverContent` between a forced full-viewport panel (framed) and a normal anchored popover
(unframed); a trigger with a **fixed** pixel size instead of one sized off the iframe's box, so it
can never visibly stretch into a giant pill during the unavoidable cross-document resize race (see
"Widget" above for the exact mechanism); a `positionerClassName` escape hatch on the shared
`PopoverContent` to neutralize base-ui's `Positioner` transform, since forcing `!fixed !inset-0`
on the popup alone measured `(0,0) 0x0` instead of the intended full frame; and every close path
(trigger, `Escape`, the header's own `X` button) going through the same `toggle(false)` that tells
the parent to shrink the iframe back down — a bare `setOpen(false)` on the `X` button left the
panel stuck open-sized. Verified geometry by sampling the iframe's bounding box at 20ms intervals
across the open and close transitions in Chromium, not by reading the JSX.

**Phase 21 — A full-screen shadcn Drawer on mobile**
Below the mobile breakpoint the panel is a shadcn `Drawer` instead of a `Popover` — same trigger,
same header/body, chosen by an `isMobile` boolean the same way `framed` already branches the
component (`framed ? mobile : useIsMobile()`), with `mobile` threaded from `widget.js`'s own
`matchMedia("(max-width: 480px)")` check through the iframe's `src` query string exactly like
`side` already was, since a cross-origin iframe can't read the host page's viewport directly. Making
the Drawer genuinely full-screen (not the default bottom-sheet-with-a-peek-gap) needed overriding
both `--drawer-height` and `--drawer-content-max-height` together via an inline `style` (a class
alone loses to the component's own more-specific `data-[swipe-axis=y]` rule) — see "Widget" above
for the exact mechanism and why `100vh` was required over `100dvh`.

**Phase 22 — A lazily-loaded chat and cached agent lookups (current milestone)**
Two changes, neither touching the geometry-critical code (the framed/unframed branch, the fixed
trigger size, the `positionerClassName`/inline-style overrides) — every regression from Phases
19–21 was re-verified in Chromium after each of these: (1) the chat itself (`useChat` and
everything it pulls in) split into its own lazily-loaded file, `widget-chat.tsx` — see "Widget"
above for why and how it's verified; (2) the embed page's agent lookup is cached per-agent via
`unstable_cache` with tag-based invalidation on write, rather than hitting Supabase on every widget
load. A first pass at this phase also added `bg-primary`/`bg-card` bubble colors and a
`motion/react` mount animation on the trigger — both reverted the same day: the bubble colors were
unnecessary custom styling over ai-elements' own `Message`/`MessageContent` defaults, and the
trigger animation broke the widget's very first paint (see "Widget" above, "Never animate the
trigger"). The lesson generalizes: verify a change against the actual server-rendered HTML output,
not just a post-hydration screenshot, before trusting anything that touches what renders first.

**Phase 23 — The white iframe background was never a `color-scheme` problem, and the panel now
floats over the trigger instead of covering it**
Two misconceptions from Phase 20 got corrected. First: `color-scheme: dark` set on the parent's
`<iframe>` element does nothing for the child document — `color-scheme` only affects the document
it's declared *within*, so setting it on the embed page's own `<html>` only takes effect once that
cross-origin document has loaded, which does nothing for the blank gap *before* it loads (DNS/TLS/
cold start for a genuinely cross-origin request). During that gap the browser paints the raw
`<iframe>` replaced element using its own parent-side CSS `background`, which was `transparent` —
i.e. white. The actual fix has zero network dependency: `widget.js` now paints the closed-state
`<iframe>` a solid dark color matching `--popover` (`background:#1a1a1a;background:oklch(0.205 0
0)`) directly, available instantly regardless of load timing. Second: Phase 20's framed branch
forced `PopoverContent` to `!fixed !inset-0 !size-full`, filling the entire iframe box — which is
exactly where the trigger sits, so the panel visually replaced the trigger instead of floating
above it ("opens on top of it" instead of "over it"). That override, and the `positionerClassName`
escape hatch it needed, are both gone now: framed and unframed use the same natural anchored
floating-ui positioning (`side="top"`, `sideOffset={16}`, a fixed `h-[560px] w-[360px]` panel), and
the trigger stays visible and clickable underneath the open desktop panel (it only hides for the
mobile Drawer, which is genuinely full-screen). This was only safe to do once the iframe's fallback
background was opaque instead of transparent — `widget.js`'s `iframe[data-open]` size grew to
`664px` tall to fit trigger + gap + panel, and its own background reverts to `transparent` while
open so the negative space around the trigger/panel (now real, visible gaps) shows the host page
through rather than a solid rectangle. Verified with a genuinely cross-origin test harness (host
page and embed page on different ports) rather than the same-origin setup used in earlier phases —
same-origin testing had been silently hiding exactly this class of pre-load-timing bug.

## Guardrails while building

- Never let the LLM answer outside the retrieved context by default — the system prompt must
  say so explicitly.
- Never call a provider SDK directly — always the AI SDK with a `provider/model` Gateway string.
- **Never reach for the Supabase `service_role` key on an authenticated route out of convenience.**
  It's reserved for exactly the documented paths: the public chat route and every Trigger.dev task.
- **Don't introduce a second query layer (Drizzle/Prisma/raw `pg`) alongside `supabase-js`.**
  Schema lives in SQL migrations (applied via the Supabase MCP); runtime access goes through
  `supabase-js` so RLS is always evaluated correctly against the Clerk JWT.
- **Never write a new RLS policy against `auth.jwt()->>'org_id'` directly** — always
  `public.clerk_org_id()`. The flat claim is `NULL` under Clerk's current token shape.
- Never let a source's status flip to `ready` on partial success.
- Never call the embeddings API once per chunk in a loop when `embedMany`/`embedChunkBatch`
  batching is available.
- Never hand-build chat message rendering/streaming state when AI Elements + `useChat` solve it.
- **There is one chat UI: `components/widget.tsx`.** Don't add a second implementation for a new
  surface, and don't wrap it in a bordered/background container - it renders only its `Popover`,
  and it carries its own `dark` scope. Verify widget changes in a browser against a
  strongly-coloured host page, not by reading the code: every real bug in it so far (clipped
  bubble, collision-clipped panel, opaque box, an invisible-until-hydrated trigger) was invisible
  in the diff — the trigger bug specifically was only caught by diffing the raw SSR HTML output,
  not a post-load screenshot.
- **Prefer ai-elements'/shadcn's own default styling over a custom override on the widget.**
  `Message`/`MessageContent` already distinguish user from assistant (`group-[.is-user]:bg-muted`,
  `group-[.is-assistant]:border`) - a `bg-primary`/`bg-card` override on top of that is unnecessary
  surface area for a component this fragile, not an improvement.
- **Don't add any billing/payment code** — no Stripe, no Clerk Billing, no pricing page, no
  upgrade flow — until the user explicitly asks for it post-MVP.
- Never call `supabase.storage.*` directly for a source's original file or canonical markdown —
  always through the `files` instance in `trigger/ingest-source/shared/storage.ts`.
- New Trigger.dev tasks get their own folder with an `index.ts`, nested under the main task they
  belong to — never a bare file dropped beside existing task folders, and never a `shared/` that
  grows past the handful of genuinely cross-task helpers.
- Task payloads stay `SourceRef`-shaped. If a task needs more, it reads the row; don't widen the
  payload and don't add a second payload type per task.
- Never write a new agent CRUD path as a Server Action — `POST /api/agents` and
  `GET`/`PATCH`/`DELETE /api/agents/:id` are the only ones, called via `apiFetch`
  (`lib/api-client.ts`). There are no Server Actions left in the agent surface at all.
- Don't re-add retrain, scheduled recrawl, or agent-branding auto-capture without the user
  explicitly asking — all three were deliberately removed. A source that needs refreshing is
  deleted and re-added.
- No code comments except lint/type-checker directives (`oxlint-disable`, `@ts-expect-error`, and
  the like) — this codebase explains itself through naming and structure, not prose above the
  code. If a piece of logic needs a comment to be understood, restructure it instead.
- Trigger.dev task lifecycle hooks (`onFailure`, `onSuccess`, etc.) take a single destructured
  params object, not positional arguments — verify against the installed `@trigger.dev/core`
  types rather than assuming a shape from a generic example.
- Each Trigger.dev environment needs its own env vars set directly on the Trigger.dev project —
  they never inherit from Vercel.
- The public `/api/chat/:agentId` endpoint has no user auth — validate the agent exists, resolve
  its `org_id` for usage accounting, and rate-limit by IP/visitorId, since RLS provides no
  protection on this path.
