---
name: amueai-mvp-builder
description: Use this skill when building, extending, or debugging AmueAI — a Chatbase-style "train an agent on your own data" SaaS, built on the modern Vercel/Supabase-native AI stack (Next.js, AI SDK, AI Gateway, AI Elements, Supabase, Clerk, Trigger.dev, Firecrawl, Upstash, shadcn/ui). Covers the full-site RAG ingestion pipeline (text/qa/file/url, every type normalized to markdown → chunk → embed → vector store), the chat/retrieval API, the embeddable widget, the dashboard, and usage limits (no billing). Trigger whenever the user references AmueAI, "the agent builder," "the widget," "data sources," "retrain," "crawl," or any part of this stack, even without naming the skill.
---

# AmueAI MVP Builder

You are building **AmueAI**, a from-scratch clone of Chatbase's original (2023) MVP: a no-code
tool that lets a user feed in their own content and get back an embeddable Q&A agent that only
answers from that content. The *product scope* is intentionally small and fixed — see below.
The *tech stack* is intentionally modern and Supabase-native: lean on what Supabase itself
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
  import { auth } from '@clerk/nextjs/server'
  import { createClient } from '@supabase/supabase-js'

  export function createServerSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { async accessToken() { return (await auth()).getToken() } },
    )
  }
  ```
  ```ts
  // hooks/use-supabase-client.ts (client components)
  import { useSession } from '@clerk/nextjs'
  import { createClient } from '@supabase/supabase-js'

  export function useSupabaseClient() {
    const { session } = useSession()
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { async accessToken() { return session?.getToken() ?? null } },
    )
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
     the root, with a weekly automatic recrawl
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
9. Retrain: re-running a `url`/`file` source's ingestion (`text`/`qa` sources have no original
   input left to re-extract once ingested — delete and re-add instead).
10. Usage limits: count messages sent per workspace, hard-capped at a fixed free-tier number —
    see "Usage limits without billing" below. No payment flow.

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

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)**, deployed on **Vercel** | Route handlers, streaming, one codebase for dashboard + public chat API + widget host |
| Language | TypeScript everywhere | non-negotiable for a project this shape |
| Auth | **Clerk**, with **Organizations** as the "Workspace" concept | org = workspace, org membership = team access |
| Database + tenant isolation | **Supabase Postgres** with `pgvector`, Clerk as a native third-party auth provider (already configured) | RLS keyed on `public.clerk_org_id()` is the actual tenant boundary |
| Schema & migrations | Applied via the **Supabase MCP** (`apply_migration`), plain SQL files mirrored under `supabase/migrations/` — **no separate ORM** | avoids running a second query layer (Drizzle/Prisma over a raw connection string) that wouldn't carry the Clerk JWT the way `accessToken()` does, which would silently bypass RLS if misconfigured |
| Typed client access | Regenerated via the **Supabase MCP** (`generate_typescript_types`) after every migration, hand-pasted into `src/types/supabase.ts` (see that file's own header comment — never edit it any other way), passed as the generic to `createClient<Database>(...)` | fully typed `.from()`/`.rpc()` calls without hand-written types drifting from the schema |
| Data access pattern | **`supabase-js` directly** (`.from()`, `.rpc()`) for all reads/writes on authenticated routes, via the Clerk-token-scoped client; **service-role `supabase-js` client** for the documented exceptions (public chat route, every Trigger.dev task) | matches how Supabase intends RLS + Clerk integration to be consumed — no raw `pg`/connection-string layer in the app |
| Vector similarity search | A Postgres **RPC function** (`match_chunks`, `security invoker`) called via `supabase.rpc('match_chunks', {...})` | `security invoker` means the function runs under the caller's RLS on authenticated routes automatically — no need to duplicate org-scoping logic in application code |
| Object storage | **files-sdk** (`lib/storage.ts` — the one file that knows the active backend), Supabase Storage adapter today. RLS policies on `storage.objects` scoped by org (same `clerk_org_id()` pattern as table RLS) | uploaded originals and every source's canonical extracted markdown live here, path convention `{org_id}/{agent_id}/{source_id}/original.{ext}` and `{org_id}/{agent_id}/{source_id}.md`. A Cloudflare R2 adapter ships in files-sdk but isn't wired up — its AWS SDK peer deps aren't installed, and Trigger.dev's bundler needs every import resolvable at build time even for an unused branch; see `lib/storage.ts`'s comment for what adding it later requires |
| Live status updates | **Trigger.dev Realtime** (`useRealtimeRunsWithTag`, tag `source:{id}`) as the primary mechanism — exact run-lifecycle status with no dependency on a Postgres change event; **Supabase Realtime** (Postgres Changes on `sources`) as a cross-tab/teammate baseline | drives the queued/crawling/processing/ready/failed UI live, no polling, no reload |
| AI orchestration | **Vercel AI SDK** (`ai` package, `@ai-sdk/react` for hooks) | `streamText`, `generateText`, `embed`/`embedMany`, `useChat` |
| Model access | **Vercel AI Gateway** | Never call a provider SDK directly. `provider/model` strings (e.g. `openai/gpt-4o-mini`, `openai/text-embedding-3-small`) route through the Gateway automatically when `AI_GATEWAY_API_KEY` is set. Check the current model list in the Vercel dashboard rather than assuming a fixed model name |
| Chat UI | **AI Elements** (`npx ai-elements@latest`, from `elements.ai-sdk.dev`) | Prebuilt chat primitives built on shadcn/ui, wired for `useChat` streaming. Use for both the dashboard test-chat panel and the widget iframe |
| General UI | **shadcn/ui** + Tailwind CSS | dashboard shell, forms, tables, dialogs |
| Web + document extraction | **Firecrawl** (`@mendable/firecrawl-js`) exclusively — `.scrape()`/`.crawl()` for URLs, `.parse()` for uploaded files | no hand-rolled fetch/cheerio crawler, no `pdf-parse`/`mammoth`; Firecrawl owns SSRF protection, JS rendering, anti-bot handling, and every document format (PDF/Word/Excel/PowerPoint/CSV/EPUB) |
| Background jobs | **Trigger.dev** (`@trigger.dev/sdk`, `@trigger.dev/react-hooks`) — `ingest-source`, `crawl-website`, `process-markdown-source`, `embed-chunk-batch` | durable, retryable background tasks off the request path; each app env (dev/staging/prod) needs its own env vars set directly on the Trigger.dev project — they do NOT inherit from Vercel |
| Rate limiting | **Upstash Redis** + `@upstash/ratelimit` on the public `/api/chat/[agentId]` route | serverless-friendly |
| Billing | **None** | see "Usage limits without billing" |
| Validation | **Zod** | validate all route handler inputs |

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
  brand jsonb,
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

  last_crawled_at timestamptz, -- root url sources only, drives the weekly recrawl

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

- `POST /api/agents` — create an agent (Clerk-token client; RLS scopes it to the active org)
- `GET /api/agents` / `GET /api/agents/:id` — list / read
- `PATCH /api/agents/:id` — update name/systemPrompt/model/temperature/etc.
- `POST /api/agents/:id/sources` — add a source (`text`/`qa`/`file`/`url`); dispatches to
  `crawl-website` (url) or `ingest-source` (everything else) via `lib/trigger.ts`'s
  `triggerIngestion`, and returns `{ source, run: { tag, publicAccessToken } }` for the client to
  subscribe to live status with `useRealtimeRunsWithTag`
- `DELETE /api/agents/:id/sources/:sourceId` — delete source + its chunks (cascades), and its
  uploaded file from Storage
- `POST /api/agents/:id/sources/:sourceId/retrain` — re-trigger ingestion for a `url`/`file`
  source (400 for `text`/`qa` — no original input left to re-extract)
- `POST /api/chat/:agentId` — **public, no Clerk auth**. Body: `{ message, conversationId? }`.
  Service-role client, explicit `org_id`/`agent_id` checks, `match_chunks` RPC, `streamText`
  through the Gateway. Rate-limited via Upstash. Checks/increments usage; 429 if the cap is
  reached.
- `GET /api/agents/:id/conversations` — list conversations + messages for the dashboard
- `GET /api/cron/recrawl-sources` — Vercel Cron (weekly, see `vercel.json`), bearer-secured with
  `CRON_SECRET`. Looks up every root `url` source and `batchTrigger`s `crawl-website` for each,
  idempotent per calendar week — kept thin per Vercel's own cron guidance, all crawling logic
  lives in the task
- `GET /widget.js` — static widget bundle
- No billing endpoints in this MVP.

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

Task graph (`src/trigger/`):

```
POST /api/agents/:id/sources
  ├─ type in (text, qa, file): tasks.trigger("ingest-source", {...})
  └─ type = url:               tasks.trigger("crawl-website", {...})

ingest-source (text/qa/file → one markdown doc)
  claim (status -> "processing", skip quietly if already claimed)
  → extract → upload markdown via files-sdk → processMarkdownSource.triggerAndWait(...).unwrap()

crawl-website (url → many markdown docs, one per page)
  claim (status -> "crawling")
  → Firecrawl .crawl() → upsert one `sources` child row per page (parent_source_id = root,
    onConflict agent_id+url) → upload each page's markdown → processMarkdownSource.batchTriggerAndWait(...)
    (each item tagged source:{rootId}, not its own id, so the dashboard's one subscription on the
    root sees every page's progress) → root source -> "ready", last_crawled_at = now()

processMarkdownSource (shared by ALL source types — the one and only chunk/embed/store path)
  chunk (lib/chunk.ts) → embedChunkBatch.batchTriggerAndWait (fanned out, lib/chunk.ts's
  chunkArray) → insert new chunks → delete the source's prior chunks (only after the new set is
  stored) → source -> "ready"
```

Storage goes through **files-sdk** (`lib/storage.ts`), never `supabase.storage.*` directly — that
file is the only place that knows which backend is active, so swapping `STORAGE_PROVIDER=r2` plus
R2 env vars is the entire migration to Cloudflare R2. `files.download(key)` returns a `StoredFile`
(`.blob()`, `.text()`, `.arrayBuffer()`), not a raw Blob — get the blob out before handing it to
Firecrawl's `.parse()`.

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
chunks until the new set is fully stored (a failed retrain/recrawl shouldn't blank out a working
agent). A losing claim (two overlapping runs on the same source) should return quietly, not throw
— throwing triggers `onFailure` and incorrectly marks the source `failed` even though the winning
run is still legitimately in flight.

## Live status in the dashboard

Two mechanisms, both without a page reload:

1. **Trigger.dev Realtime** (`useRealtimeRunsWithTag`, tag `source:{id}`) — the primary mechanism,
   mint a Public Access Token scoped `{ read: { tags: [tag] } }` right after triggering
   (`lib/trigger.ts`), pass it to the client, subscribe. Immediate, exact run-lifecycle status,
   independent of any Postgres change event reaching the client — this is what makes a full-site
   crawl's "N/M pages processed" progress possible (every child page's `processMarkdownSource` run
   carries the *root* source's tag).
2. **Supabase Realtime** (Postgres Changes on `sources`) — a baseline so a second tab or a
   teammate viewing the same agent also sees status live, even without a run token for it.

A newly queued/retrained source is added to local UI state directly from the route's response
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

- Standalone script (`public/widget.js` or a route handler), zero framework dependencies,
  injecting an `iframe` pointed at a hosted `/embed/[agentId]` page.
- The iframe page renders the same **AI Elements** components against
  `useChat({ api: "/api/chat/[agentId]" })` as the dashboard's test-chat panel.
- `conversationId` + a random `visitorId` live in the iframe's own localStorage.
- Snippet shown to the user:
  ```html
  <script src="https://yourdomain.com/widget.js" data-agent-id="AGENT_ID" async></script>
  ```

## Build phases

**Phases 1–11 (foundations through fine-tuning) are complete and live** — agent CRUD, sources +
ingestion (originally text-only inline, since replaced by the full Trigger.dev task graph below),
the chat/retrieval API, the dashboard test-chat panel, the public widget, conversation logs,
Realtime status, retrain, and background jobs on Trigger.dev with Upstash rate limiting all exist
in the current codebase. Read the sections above for their current shape rather than an
in-progress plan.

**Phase 12 — Full-site RAG ingestion pipeline (current milestone)**
Rearchitected ingestion from a single inline extract-chunk-embed-store function into the task
graph described above: added `text`/`qa` source types, full-site crawling for `url` sources (one
child `sources` row per discovered page, weekly recrawl via Vercel Cron), the `files-sdk` storage
abstraction, and Trigger.dev-Realtime-driven live status (tag-based, covering both single-doc and
many-page-crawl cases). Live-verified the RLS audit (see "Already in place") as part of this
milestone rather than deferring it.

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
- **Don't add any billing/payment code** — no Stripe, no Clerk Billing, no pricing page, no
  upgrade flow — until the user explicitly asks for it post-MVP.
- Never call `supabase.storage.*` directly for a source's original file or canonical markdown —
  always through `files` from `lib/storage.ts`.
- Trigger.dev task lifecycle hooks (`onFailure`, `onSuccess`, etc.) take a single destructured
  params object, not positional arguments — verify against the installed `@trigger.dev/core`
  types rather than assuming a shape from a generic example.
- Each Trigger.dev environment needs its own env vars set directly on the Trigger.dev project —
  they never inherit from Vercel.
- The public `/api/chat/:agentId` endpoint has no user auth — validate the agent exists, resolve
  its `org_id` for usage accounting, and rate-limit by IP/visitorId, since RLS provides no
  protection on this path.
