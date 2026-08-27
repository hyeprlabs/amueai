---
name: amueai-mvp-builder
description: Use this skill when building, extending, or debugging AmueAI — a Chatbase-style "train a chatbot on your own data" SaaS MVP, built on the modern Vercel/Supabase-native AI stack (Next.js, AI SDK, AI Gateway, AI Elements, Supabase, Clerk, Trigger.dev, Upstash, shadcn/ui). Covers the full RAG ingestion pipeline (files/URLs/text → chunk → embed → vector store), the chat/retrieval API, the embeddable widget, the dashboard, and usage limits (no billing). Trigger whenever the user references AmueAI, "the chatbot builder," "the widget," "data sources," "retrain," or any part of this stack, even without naming the skill.
---

# AmueAI MVP Builder

You are building **AmueAI**, a from-scratch clone of Chatbase's original (2023) MVP: a no-code
tool that lets a user feed in their own content and get back an embeddable Q&A chatbot that only
answers from that content. The *product scope* is intentionally small and fixed — see below.
The *tech stack* is intentionally modern and Supabase-native: lean on what Supabase itself
provides (Postgres + pgvector, RLS, Storage, Realtime, CLI migrations) rather than layering a
separate ORM or query engine on top where Supabase's own tooling already does the job.

Resist scope creep toward Chatbase's later "enterprise platform" features (voice, WhatsApp,
actions/refunds, helpdesk handoff, Backstage, SOC2) unless the user explicitly asks to go beyond
MVP. **Billing is explicitly out of scope for this MVP** — see "Usage limits without billing."

This file is the source of truth for architecture, schema, and build order. Read the relevant
section before writing code for that part of the system. Follow the phase sequencing in "Build
phases" — each phase should be shippable and demoable before the next one starts.

## Already in place — don't re-scaffold this

The user already has **Supabase connected to Clerk via Supabase's native third-party auth
integration** (not the deprecated JWT template), with **Clerk Organizations as the tenancy
boundary**. Verify it, build on it — don't re-set it up from scratch.

- Clerk is configured as a Supabase third-party auth provider (Clerk Dashboard → Supabase
  integration → Clerk domain pasted into Supabase → Authentication → Sign In / Providers).
- Clerk session tokens carry `sub` (Clerk user id) and `org_id`/`org_role` (Organizations) —
  these are what RLS policies check, not an app-maintained workspace table. Workspaces **are**
  Clerk Organizations; there is no separate `workspaces` table.
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
  `auth.jwt()->>'org_id'` against its own `org_id` column. App-layer checks are a UX nicety for
  good error messages, not the security boundary.
- **The one place this doesn't apply**: the public, unauthenticated `/api/chat/[chatbotId]`
  route the widget calls, and the Trigger.dev ingestion task. Neither runs under a live Clerk
  session, so there's no `org_id` claim for RLS to check. Both use the Supabase **service role**
  key server-side (never exposed to a client) and do their own explicit `org_id`/`chatbot_id`
  matching in queries — this is the one intentional exception; every authenticated dashboard
  route goes through the Clerk-token-scoped client instead.

## Product scope (the exact MVP — unchanged regardless of stack)

1. Auth + workspace: a user signs up and lands on a dashboard of "chatbots" (agents) they own.
2. Create a chatbot: give it a name.
3. Add data sources to a chatbot:
   - Plain text paste
   - File upload (.txt, .pdf, .docx — text extraction only, no OCR in MVP)
   - URL(s) — fetch and strip a single page to readable text; optional shallow crawl of same-domain links up to a small page cap
   - Q&A pairs (question + answer typed directly)
4. Ingestion pipeline runs per source: extract → chunk → embed → store. Source shows a status
   (`queued` → `processing` → `ready` / `failed`), updated live via Supabase Realtime.
5. Chatbot settings: base/system instructions (e.g. "You are a support agent for Acme. Only
   answer from the provided context. If you don't know, say so."), model choice, temperature.
6. Test chat inside the dashboard, using the exact same API the public widget calls.
7. Embeddable widget: copy a `<script>` snippet; it renders a chat bubble on any external site
   and talks to a hosted `/api/chat/[chatbotId]` endpoint — no login required for the visitor.
8. Conversation logs: every widget/test conversation is stored and viewable per chatbot.
9. Retrain: editing or deleting a source marks it dirty and re-runs the pipeline for that source.
10. Usage limits: count messages sent per workspace, hard-capped at a fixed free-tier number —
    see "Usage limits without billing" below. No payment flow.

Explicitly NOT in this MVP: voice, WhatsApp/Slack/Messenger/Instagram channels, actions/API-calling
by the bot, human helpdesk handoff, sentiment analytics, multi-page crawling at scale, team seats
beyond what Clerk Organizations give you for free, A/B testing of prompts, **any billing/payment
integration**. If the user asks for these, treat it as a deliberate post-MVP feature request.

## Usage limits without billing

There is no Stripe, no Clerk Billing, no plans, no upgrade flow in this MVP. There is exactly one
tier: a fixed message cap per organization (e.g. 100 messages), tracked in `workspace_usage`,
enforced on the public chat route. This exists purely to prevent runaway API cost during
development/demo use, not as a monetization mechanism. If the cap is hit, the widget/test-chat
shows a plain "message limit reached" state — no upsell, no checkout link. Don't build any Stripe
webhook, checkout session, or pricing page as part of this MVP. Revisit billing entirely as a
post-MVP milestone.

## Tech stack (Supabase-native where possible, modern Vercel/AI stack everywhere else)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)**, deployed on **Vercel** | Route handlers, streaming, one codebase for dashboard + public chat API + widget host |
| Language | TypeScript everywhere | non-negotiable for a project this shape |
| Auth | **Clerk**, with **Organizations** as the "Workspace" concept | org = workspace, org membership = team access |
| Database + tenant isolation | **Supabase Postgres** with `pgvector`, Clerk as a native third-party auth provider (already configured) | RLS keyed on `auth.jwt()->>'org_id'` is the actual tenant boundary |
| Schema & migrations | **Supabase CLI** (`supabase migration new`, `supabase db push`), plain SQL files under `supabase/migrations/` — **no separate ORM** | this is Supabase's own recommended workflow; it avoids running a second query layer (Drizzle/Prisma over a raw connection string) that wouldn't carry the Clerk JWT the way `accessToken()` does, which would silently bypass RLS if misconfigured |
| Typed client access | `supabase gen types typescript --project-id <ref> > types/supabase.ts`, passed as the generic to `createClient<Database>(...)` | fully typed `.from()`/`.rpc()` calls without hand-written types drifting from the schema |
| Data access pattern | **`supabase-js` directly** (`.from()`, `.rpc()`) for all reads/writes on authenticated routes, via the Clerk-token-scoped client; **service-role `supabase-js` client** for the two documented exceptions (public chat route, Trigger.dev ingestion task) | matches how Supabase intends RLS + Clerk integration to be consumed — no raw `pg`/connection-string layer in the app |
| Vector similarity search | A Postgres **RPC function** (`match_chunks`, `security invoker`) called via `supabase.rpc('match_chunks', {...})` | this is Supabase's own documented pattern for pgvector search from a JS client; `security invoker` means the function runs under the caller's RLS on authenticated routes automatically — no need to duplicate org-scoping logic in application code |
| File storage | **Supabase Storage**, private bucket, RLS policies on `storage.objects` scoped by `org_id` (same JWT pattern as table RLS), accessed via signed URLs from the ingestion path | uploaded PDFs/docx live here |
| Realtime status updates | **Supabase Realtime** (Postgres Changes) subscribed to the `sources` table, filtered to the current chatbot | drives the queued/processing/ready/failed UI live, no polling |
| AI orchestration | **Vercel AI SDK** (`ai` package, `@ai-sdk/react` for hooks) | `streamText`, `generateText`, `embed`/`embedMany`, `useChat` |
| Model access | **Vercel AI Gateway** | Never call a provider SDK directly. `provider/model` strings (e.g. `openai/gpt-4o-mini`, `openai/text-embedding-3-small`) route through the Gateway automatically when `AI_GATEWAY_API_KEY` is set. Check the current model list in the Vercel dashboard rather than assuming a fixed model name |
| Chat UI | **AI Elements** (`npx ai-elements@latest`, from `elements.ai-sdk.dev`) | Prebuilt chat primitives built on shadcn/ui, wired for `useChat` streaming. Use for both the dashboard test-chat panel and the widget iframe. Supersedes the old "Chat SDK" template |
| General UI | **shadcn/ui** + Tailwind CSS | dashboard shell, forms, tables, dialogs |
| File parsing | `pdf-parse` (PDF), `mammoth` (.docx), plain text read for `.txt` | |
| URL fetching | `cheerio` | strip HTML to readable text |
| Background jobs | **Trigger.dev** for the ingestion pipeline, once past Phase 1's inline version | durable, retryable background tasks; a Trigger.dev MCP connector will be linked into Claude Code later — see MCP note below |
| Rate limiting | **Upstash Redis** + `@upstash/ratelimit` on the public `/api/chat/[chatbotId]` route | serverless-friendly; an Upstash MCP connector will also be linked in later — see MCP note below |
| Billing | **None** | see "Usage limits without billing" |
| Validation | **Zod** | validate all route handler inputs |

### MCP note for Trigger.dev and Upstash

The user will connect **Trigger.dev** and **Upstash** to Claude Code via MCP later. Once those
connectors are present: check available MCP tools for them before writing integration code —
use the connector to inspect the user's actual Trigger.dev project (existing tasks, environments)
and actual Upstash Redis instance (existing keys/config) rather than assuming SDK shapes or
resource names from training data. If the connectors aren't yet available when you reach Phase
10, scaffold the integration against the public `trigger.dev` and `@upstash/ratelimit` SDKs as
normal, but flag clearly that it should be re-verified against the MCP-provided project details
once connected, since env vars, project refs, or task names may need to change to match the
user's real Trigger.dev/Upstash setup.

## Data model (SQL migrations + RLS — the Supabase-native way)

Every table carries `org_id`, RLS-scoped to `auth.jwt()->>'org_id'`, following the same pattern
as the Clerk×Supabase `tasks` example (`user_id default auth.jwt()->>'sub'`), keyed on
organization instead of user.

`supabase/migrations/0001_init.sql`:

```sql
create extension if not exists vector;

create table workspace_usage (
  org_id text primary key,
  message_limit int not null default 100,
  messages_used int not null default 0,
  period_start timestamptz not null default now()
);

create table chatbots (
  id text primary key default gen_random_uuid()::text,
  org_id text not null default auth.jwt()->>'org_id',
  name text not null,
  system_prompt text not null default 'You are a helpful assistant. Only answer using the provided context. If the answer isn''t in the context, say you don''t know.',
  model text not null default 'openai/gpt-4o-mini',
  temperature real not null default 0.3,
  created_at timestamptz not null default now()
);

create table sources (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  chatbot_id text not null references chatbots(id) on delete cascade,
  type text not null check (type in ('text','file','url','qa')),
  label text not null,
  raw_content text,
  storage_path text,
  status text not null default 'queued' check (status in ('queued','processing','ready','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table chunks (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  source_id text not null references sources(id) on delete cascade,
  content text not null,
  embedding vector(1536)
);

create index chunks_embedding_idx on chunks
  using hnsw (embedding vector_cosine_ops);

create table conversations (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  chatbot_id text not null references chatbots(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now()
);

create table messages (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  conversation_id text not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
```

`supabase/migrations/0002_rls.sql` — enable RLS + policies on every table (shown fully for
`chatbots`; repeat the identical four policies for `sources`, `chunks`, `conversations`,
`messages`, `workspace_usage`, substituting the table name):

```sql
alter table chatbots enable row level security;

create policy "Org members can view their org's chatbots"
on chatbots for select to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can insert chatbots for their org"
on chatbots as permissive for insert to authenticated
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can update their org's chatbots"
on chatbots for update to authenticated
using ( (select auth.jwt()->>'org_id') = org_id )
with check ( (select auth.jwt()->>'org_id') = org_id );

create policy "Org members can delete their org's chatbots"
on chatbots for delete to authenticated
using ( (select auth.jwt()->>'org_id') = org_id );
```

`sources` and `chunks` are written by the ingestion task under the service-role key (no live
Clerk session), so their `org_id` is stamped explicitly in application code (copied from the
parent `chatbot`/`source`) rather than defaulted from `auth.jwt()`. They still get the same four
RLS policies for read access from the dashboard.

`supabase/migrations/0003_match_chunks.sql` — the vector search RPC function (Supabase's
documented pattern for pgvector + a JS client):

```sql
create or replace function match_chunks(
  query_embedding vector(1536),
  match_chatbot_id text,
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
as $$
  select c.content, c.source_id, 1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  join sources s on s.id = c.source_id
  where s.chatbot_id = match_chatbot_id
    and s.status = 'ready'
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
```

Called from the authenticated dashboard test-chat route via the Clerk-token client — `security
invoker` means the caller's RLS applies automatically, no extra org filter needed in the function
itself. Called from the public widget chat route via the service-role client — RLS is bypassed
there regardless of `security invoker`/`definer`, which is fine since `match_chatbot_id` is
already an explicit, validated parameter and the route does its own `org_id` lookup separately
for usage accounting.

```ts
const { data: chunks } = await supabase.rpc('match_chunks', {
  query_embedding: embedding,
  match_chatbot_id: chatbotId,
  match_count: 6,
})
```

Storage bucket policy (private `sources` bucket, path convention `org_id/chatbot_id/filename`):

```sql
create policy "Org members can read their org's files"
on storage.objects for select to authenticated
using ( bucket_id = 'sources' and (storage.foldername(name))[1] = (select auth.jwt()->>'org_id') );

create policy "Org members can upload to their org's folder"
on storage.objects for insert to authenticated
with check ( bucket_id = 'sources' and (storage.foldername(name))[1] = (select auth.jwt()->>'org_id') );
```

## API surface

- `POST /api/chatbots` — create a chatbot (Clerk-token client; RLS scopes it to the active org)
- `GET /api/chatbots` / `GET /api/chatbots/:id` — list / read
- `PATCH /api/chatbots/:id` — update name/systemPrompt/model/temperature
- `POST /api/chatbots/:id/sources` — add a source (text/file/url/qa); triggers the Trigger.dev ingestion task
- `DELETE /api/chatbots/:id/sources/:sourceId` — delete source + its chunks (cascades)
- `POST /api/chatbots/:id/sources/:sourceId/retrain` — re-trigger ingestion for one source
- `POST /api/chat/:chatbotId` — **public, no Clerk auth**. Body: `{ message, conversationId? }`.
  Service-role client, explicit `org_id`/`chatbot_id` checks, `match_chunks` RPC, `streamText`
  through the Gateway. Rate-limited via Upstash. Checks/increments `messages_used`; 429 if the
  cap is reached.
- `GET /api/chatbots/:id/conversations` — list conversations + messages for the dashboard
- `GET /widget.js` — static widget bundle
- No billing endpoints in this MVP.

## Ingestion pipeline (the core of the product — get this right first)

```
extractText(source) -> chunkText(text) -> embedChunks(chunks) -> storeChunks(sourceId, chunks+vectors)
```

- `extractText`: branch on `source.type`.
  - `text`/`qa`: use `raw_content` directly (for `qa`, format as `"Q: ...\nA: ..."` per pair).
  - `file`: download from **Supabase Storage** by `storage_path` (service-role client), run
    `pdf-parse` or `mammoth` depending on extension.
  - `url`: `fetch` the page, load into `cheerio`, strip `script/style/nav/footer/header`,
    collapse whitespace.
- `chunkText`: split on paragraph boundaries first, hard-wrap anything longer than ~1000 tokens
  (~4000 chars) with ~100-token overlap. Don't over-engineer this for MVP.
- `embedChunks`: `embedMany({ model: "openai/text-embedding-3-small", values })` through the
  Gateway, batched ~100 chunks per call — never one call per chunk.
- `storeChunks`: bulk insert into `chunks` (service-role client), stamping `org_id` from the
  parent chatbot. Flip `source.status` to `ready` only once **all** chunks for that source
  succeed. On failure, set `status = 'failed'` with `error_message`, leaving any prior chunks
  (on a retrain) untouched until the new run fully succeeds.
- **Where this runs**: Phase 1–3 run it inline in the route handler for simplicity. The
  "Background jobs" phase moves it into a **Trigger.dev** task (`ingestSource`), triggered from
  the `POST /sources` and `retrain` routes via `tasks.trigger("ingest-source", { sourceId })`.
  The task itself uses the service-role client throughout, since it runs outside any Clerk
  session context.

## Chat/retrieval flow (runtime path — widget and dashboard test-chat both call this)

1. Rate-limit check (Upstash, keyed by IP + `chatbotId`).
2. Reject if `messages_used >= message_limit` for the org (429, clear error body — no upsell copy).
3. Embed the incoming user message via the Gateway (same model as ingestion).
4. Call `match_chunks` RPC for top-k (k=4–6) chunks scoped to that chatbot's `ready` sources.
5. Build the prompt:
   ```
   system: {chatbot.system_prompt}

   Context:
   ---
   {chunk 1}
   ---
   {chunk 2}
   ---
   ...

   Answer the user's question using only the context above. If the context doesn't contain
   the answer, say you don't have that information.
   ```
6. `streamText({ model: chatbot.model, temperature: chatbot.temperature, messages })` through
   the Gateway, returned as a `useChat`-compatible stream, rendered with **AI Elements**.
7. Persist the user + assistant messages once streaming completes; increment `messages_used`
   by 1 per user turn.
8. If `conversationId` wasn't provided, create a new `conversations` row and return its id.

## Widget

- Standalone script (`public/widget.js` or a route handler), zero framework dependencies,
  injecting an `iframe` pointed at a hosted `/embed/[chatbotId]` page.
- The iframe page renders the same **AI Elements** components against
  `useChat({ api: "/api/chat/[chatbotId]" })` as the dashboard's test-chat panel.
- `conversationId` + a random `visitorId` live in the iframe's own localStorage.
- Snippet shown to the user:
  ```html
  <script src="https://yourdomain.com/widget.js" data-chatbot-id="CHATBOT_ID" async></script>
  ```

## Build phases (basics → fine-tuning — each phase demoable before the next starts)

**Phase 1 — Verify foundations & chatbot shell**
Confirm the existing Clerk↔Supabase integration actually resolves `auth.jwt()->>'org_id'` for a
signed-in user (test against a throwaway table first). Confirm `pgvector` is enabled. Set up
`supabase/migrations/`, generate typed client (`types/supabase.ts`). Add shadcn/ui, set
`AI_GATEWAY_API_KEY`. Build the empty dashboard shell showing the active org's chatbot list.

**Phase 2 — Chatbot CRUD**
`chatbots` table + RLS (migration 0001 + 0002 subset). Create/list/view a chatbot with a name.
Settings page for `system_prompt` / `model` / `temperature`.

**Phase 3 — First data source + ingestion (text only, inline)**
`sources` + `chunks` tables + RLS + `match_chunks` RPC. Ingestion pipeline for `type: "text"`
only, run inline in the route handler. Verify chunks + embeddings land with correct `org_id`.

**Phase 4 — Retrieval + chat API**
`/api/chat/:chatbotId` (service-role client, manual org/limit checks), `match_chunks` RPC,
`streamText` through the Gateway. Verify with curl/Postman before any UI.

**Phase 5 — Dashboard test-chat with AI Elements**
Install AI Elements. Wire the test-chat panel to the Phase 4 API via `useChat` +
`Conversation`/`Message`/`PromptInput`/`Response`.

**Phase 6 — Remaining source types**
File upload (Supabase Storage, storage RLS, `pdf-parse`/`mammoth`) and URL ingestion (`cheerio`).
Q&A pair source type.

**Phase 7 — Public widget**
`widget.js` + `/embed/[chatbotId]` iframe using the same AI Elements components as Phase 5.
Confirm it works embedded in a plain external HTML page with no Clerk session at all.

**Phase 8 — Conversation logs + Realtime status**
List conversations/messages per chatbot (RLS-scoped read). Wire Supabase Realtime to the
`sources` table so the queued/processing/ready/failed status updates live in the UI.

**Phase 9 — Retrain & source management UX**
Re-run/remove a source and its chunks; surface status transitions from Phase 8's Realtime feed.

**Phase 10 — Background jobs & rate limiting**
Move ingestion into a **Trigger.dev** task with retries. Add the **Upstash** rate limiter to the
public chat route. Check for Trigger.dev/Upstash MCP connectors first — see MCP note above —
and use them to verify project/resource details before finalizing env vars and task names.

**Phase 11 — Fine-tuning & polish (final phase)**
- Tune chunk size/overlap and top-k against real content for answer quality
- Tighten the system prompt so the model reliably refuses to answer outside context
- Loading/error/empty states everywhere (shadcn/ui skeletons, toasts)
- Responsive pass on the dashboard and widget iframe at small viewport sizes
- Accessibility pass on AI Elements usage (labels, focus management, keyboard nav)
- Observability: Gateway usage/cost dashboard, `tags`/`user` via `providerOptions.gateway`
- **RLS audit**: sign in as org A, attempt to read/write org B's data on every table, confirm it
  fails. Confirm the two service-role paths (public chat route, Trigger.dev task) can't be
  reached in a way that leaks another org's data despite bypassing RLS.
- Confirm Storage objects aren't publicly listable/guessable
- Copy pass on empty states, onboarding, the widget snippet instructions, and the
  "message limit reached" state (plain and honest — no fake upsell since there's no paid plan yet)

## Guardrails while building

- Never let the LLM answer outside the retrieved context by default — the system prompt must
  say so explicitly.
- Never call a provider SDK directly — always the AI SDK with a `provider/model` Gateway string.
- **Never reach for the Supabase `service_role` key on an authenticated route out of convenience.**
  It's reserved for exactly two paths: the public chat route and the Trigger.dev ingestion task.
- **Don't introduce a second query layer (Drizzle/Prisma/raw `pg`) alongside `supabase-js`.**
  Schema lives in SQL migrations; runtime access goes through `supabase-js` so RLS is always
  evaluated correctly against the Clerk JWT.
- Never let a source's status flip to `ready` on partial success.
- Never call the embeddings API once per chunk in a loop when `embedMany` batching is available.
- Never hand-build chat message rendering/streaming state when AI Elements + `useChat` solve it.
- **Don't add any billing/payment code** — no Stripe, no Clerk Billing, no pricing page, no
  upgrade flow — until the user explicitly asks for it post-MVP.
- Before writing Trigger.dev or Upstash integration code, check whether their MCP connectors are
  available and use them to confirm real project/resource details rather than guessing.
- The public `/api/chat/:chatbotId` endpoint has no user auth — validate the chatbot exists,
  resolve its `org_id` for usage accounting, and rate-limit by IP/visitorId, since RLS provides
  no protection on this path.
- Don't build Phase 10 (background jobs) before Phases 1–9 work end to end synchronously.
