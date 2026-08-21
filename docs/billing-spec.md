# AmueAI — Billing MVP Specification

**Stack:** Next.js (App Router) · Clerk · Supabase (Postgres) · Polar (Merchant of Record)
**Model:** strictly organization-scoped billing · subscription plans with monthly credit grants · stackable credit top-ups · per-message metered consumption with hard cap

---

## 0. The four decisions everything else depends on

Lock these before writing a line of code. Each is expensive to reverse.

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Billing entity | **Clerk Organization**. `polar.customer.external_id = clerk_org_id` | Users move between orgs; billing must not follow a person. Reversing this later requires migrating every Polar customer record. |
| 2 | Credit authority | **Your Postgres ledger.** Polar holds no credit balance. | You need plan-credits-expire / top-ups-don't semantics that Polar's benefit can't express, and you're not invoicing overage. One source of truth. |
| 3 | Overage policy | **Hard cap.** No metered price on any Polar product. | An org can never owe more than it prepaid. No surprise invoices, no chargebacks, no disputes with a Mittelstand customer. Add opt-in overage later. |
| 4 | Feature matrix | **In code**, keyed by Polar product ID | Changing what a plan includes should be a deploy, not a billing-dashboard archaeology session. |

### Why not Polar's Meter Credits Benefit (yet)

Polar's Credits benefit is genuinely good, but it grants a flat amount onto a meter balance. It does not model "these 10,000 credits expire on the 14th, those 25,000 you bought never expire, spend the expiring ones first." That ordering is the difference between a customer being happy and a customer emailing you about credits that vanished.

Since decision #3 means the meter isn't invoicing anything, Polar's meter would be display-only — and you'd be maintaining two balances that can drift. Skip it.

**Migration trigger:** when a customer explicitly asks to be billed for overage instead of being cut off. At that point, create the meter, attach a metered price, and start ingesting events. Your ledger keeps doing enforcement; Polar starts doing invoicing. The two systems compose fine — you just don't need both on day one.

---

## 1. Clerk configuration

> **Targets Clerk Core 3 / `@clerk/nextjs` v7 and Next.js 16.** Requires Node 20.9.0+ and `next@>=15.2.3`. If you're on Next.js ≤15, the only difference is that the file is named `middleware.ts` instead of `proxy.ts` — the code is identical.

### 1.0 Core 3 API changes that affect this spec

| Old (Core 2 / v6) | New (Core 3 / v7) |
|---|---|
| `middleware.ts` | `proxy.ts` (Next.js 16) |
| `<Protect permission="…">` | `<Show when={{ permission: '…' }}>` |
| `<SignedIn>` / `<SignedOut>` | `<Show when="signed-in">` / `<Show when="signed-out">` |
| `import type … from '@clerk/types'` | `from '@clerk/nextjs/types'` |
| `<ClerkProvider>` wrapping `<html>` | `<ClerkProvider>` **inside** `<body>` |
| `updateOrganization({ publicMetadata })` | `updateOrganizationMetadata()` |
| `appearance.layout` | `appearance.options` |

`auth.protect()` now returns **401** (not 404) for unauthenticated Server Actions — update any client-side status checks.

Run `npx @clerk/upgrade` if you're migrating an existing app; it codemods most of this.

### 1.1 Forcing universal Organization membership

Every user must be in ≥1 Organization. Three pieces:

1. **Dashboard:** Organizations → disable personal accounts, so every user must belong to an Organization.
2. **Auto-provision a personal Organization on signup.** Clerk `user.created` webhook → create an Organization named `"{firstName}'s Organization"` → add user as `org:admin`. Do this in the webhook, not client-side, so it survives OAuth signups and invited-user flows.
3. **Onboarding redirect in `proxy.ts`** — see the important caveat below.

#### Auth checks belong at the resource, not in the proxy

Clerk has **deprecated `createRouteMatcher()` and middleware-level auth gating**. It still works and logs a deprecation warning; it will be removed in the next major. The rationale matters: Server Functions are invoked *by ID, not by path*, so a proxy matcher never sees them — a Server Action in `/protected/` called from `/public/` sails straight through. Several framework-level middleware bypasses were disclosed in 2025, and Clerk's own `GHSA-vqx2-fgx2-5wq9` came from a path-normalisation mismatch.

**Good news for this spec:** the `requireBillingAdmin()` guard in §6 is already the recommended pattern. Every billing mutation calls it at the top of the resource. Nothing about the billing architecture changes — only the proxy shrinks.

What stays in `proxy.ts` is the onboarding redirect, and only as a **UX convenience, never as a gate**. Clerk explicitly sanctions this: the redirect sends the user somewhere useful first, while the resource still runs its own check.

```ts
// proxy.ts   (name it middleware.ts on Next.js ≤15 — code is identical)
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/onboarding')) return

  // NOT an auth guarantee — a redirect so users without an
  // Organization land somewhere useful. Resources still check.
  const { isAuthenticated, orgId } = await auth()
  if (isAuthenticated && !orgId) {
    return NextResponse.redirect(new URL('/onboarding/org', req.url))
  }
})

export const config = {
  matcher: [
    // Skip Next internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',   // Clerk Frontend API proxy routes — required in Core 3
  ],
}
```

Then, in **every** billing resource — page, Route Handler, and Server Action alike:

```ts
// app/(app)/billing/actions.ts
'use server'
import { auth } from '@clerk/nextjs/server'

export async function buyTopUp(packId: string) {
  const { orgId } = await requireBillingAdmin()   // §6 — auth + org + permission
  // ...
}
```

**Install the lint rule.** `@clerk/eslint-plugin` ships `@clerk/next/require-auth-protection`, which fails the build when a resource has no auth check. For an app where every unguarded Server Action is a free-credits exploit, this is worth the ten minutes:

```js
// eslint.config.mjs
import clerkNext from '@clerk/eslint-plugin/next'
export default [{
  plugins: { '@clerk/next': clerkNext },
  rules: {
    '@clerk/next/require-auth-protection': ['error', {
      protected: ['**'],
      public: ['src/app/sign-in/**', 'src/app/sign-up/**', 'src/app/api/widget/**'],
    }],
  },
}]
```

> **Still true, still the most common failure:** `clerkMiddleware` silently 404s or redirects your Polar webhook — failed deliveries in the Polar dashboard, no logs on your side. `/api/webhooks/*` and `/api/widget/*` must be excluded from `config.matcher`, and both must do their own verification: signature check for the webhook, `Origin` allowlist + rate limit for the widget.

### 1.2 Roles and permissions

| Role | Billing rights |
|---|---|
| `org:admin` | full — subscribe, change plan, buy top-ups, open portal, change billing email |
| `org:member` | read-only — sees plan, credit balance, and an "ask an admin" upgrade prompt |

Define a custom permission `org:billing:manage` on the admin role rather than checking `role === 'org:admin'` directly. It costs nothing now and lets you add a "Billing Manager" role later without touching call sites.

Client-side, Core 3 replaced `<Protect>` with `<Show>`:

```tsx
import { Show } from '@clerk/nextjs'

<Show when={{ permission: 'org:billing:manage' }} fallback={<AskAnAdminNotice />}>
  <UpgradeButton />
</Show>
```

Cosmetic only — the server-side `requireBillingAdmin()` is the actual gate.

**Members must be able to read billing state.** If a member hits an empty credit balance and sees a generic error, they'll file a support ticket. Show them the real reason and who to ask.

### 1.3 Clerk webhooks to handle

| Event | Action |
|---|---|
| `user.created` | create personal org, add as admin |
| `organization.created` | insert `organizations` row, grant free-tier credits |
| `organization.deleted` | cancel Polar subscription, soft-delete org data. **Do not delete the Polar customer** — you need order history for accounting. |
| `organizationMembership.created` | enforce seat limit for the plan |
| `organizationMembership.deleted` | if the removed user was the billing email owner, flag the org |

---

## 2. Polar catalog

Create in **sandbox first**, mirror in production. Product IDs differ between environments — every ID must come from `process.env`, never a literal.

### 2.1 Plans

Three tiers: **Free · Pro · Business**. Annual is priced at exactly 80% of 12× the monthly rate.

| | Free | Pro | Business |
|---|---|---|---|
| Monthly | €0 | **€49/mo** | **€149/mo** |
| Annual | — | **€470/yr** (€39/mo, save 20%) | **€1,430/yr** (€119/mo, save 20%) |
| **Credits / month** | **100** | **5,000** | **20,000** |
| Chatbots | 1 | 3 | 10 |
| Sources per bot | 10 | 500 | 2,000 |
| Seats | 1 | 5 | 20 |
| Models | mini only | all | all |
| Remove AmueAI branding | — | ✓ | ✓ |
| Custom widget domain | — | — | ✓ |
| API access | — | ✓ | ✓ |
| Lead capture | — | ✓ | ✓ |
| Slack / WhatsApp channels | — | — | ✓ |
| Custom roles & permissions | — | — | ✓ |
| Analytics retention | 7 days | 30 days | 12 months + CSV export |
| Credit top-ups | — | ✓ | ✓ |
| Support | community | email | priority + onboarding call |

**Credits are granted monthly on every plan, including annual subscriptions.** Never grant 12× upfront — annual subscribers burn a year of credits in month two and churn having already consumed everything they paid for. Your ledger grants on a calendar cycle independent of the billing interval; this is one of the concrete payoffs of decision #2.

**No free trial on paid plans — the Free tier *is* the trial.** Do not enable Polar's trial period on any product. This removes the `trialing` status from your state machine, the trial-ending dunning sequence, and the trial-abuse surface entirely. A prospect who wants to evaluate AmueAI signs up free and gets 100 credits a month indefinitely; that's a more generous evaluation than 14 days and costs you nothing to operate.

**Top-ups require Pro or above.** If free users can buy credits, credits stop being a reason to upgrade and become a way to avoid upgrading. Gate the top-up checkout behind `plan !== 'free'`.

### 2.2 Top-up packs

| Pack | Price | Credits | €/1k credits |
|---|---|---|---|
| Small | €19 | 2,000 | €9.50 |
| Medium | €69 | 10,000 | €6.90 |
| Large | €199 | 40,000 | €4.98 |

Priced *above* the plans' effective rate (Pro is ~€9.80/1k, Business ~€7.45/1k) at the small end and below it at the large end — so a customer consistently topping up is nudged toward the next plan, while a genuine spike is still affordable. Top-up credits never expire.

### 2.3 Polar catalog — 7 products

One Polar product per plan × interval, plus the packs:

```
Pro Monthly · Pro Yearly · Business Monthly · Business Yearly
Top-up Small · Top-up Medium · Top-up Large
```

Free lives entirely in your DB — no Polar customer is created until an Organization's first paid action. Keeps the Polar dashboard clean and avoids €0 subscription lifecycle edge cases.

### 2.4 Enforce the 20% rule in code, not in the dashboard

Prices typed into two places drift. Derive annual from monthly and assert it:

```ts
// lib/billing/plans.ts
export const ANNUAL_DISCOUNT = 0.2;

export const PLANS = {
  free: {
    label: "Free",
    monthlyCents: 0,
    monthlyCredits: 100,
    features: ["chatbots:1", "sources:10", "seats:1", "models:mini", "analytics:7d"],
  },
  pro: {
    label: "Pro",
    monthlyCents: 4900,
    annualCents: 47000,
    monthlyCredits: 5_000,
    features: ["chatbots:3", "sources:500", "seats:5", "models:all",
               "branding:remove", "api", "leads", "topups", "analytics:30d"],
  },
  business: {
    label: "Business",
    monthlyCents: 14900,
    annualCents: 143000,
    monthlyCredits: 20_000,
    features: ["chatbots:10", "sources:2000", "seats:20", "models:all",
               "branding:remove", "api", "leads", "topups", "custom-domain",
               "channels:slack", "channels:whatsapp", "roles:custom",
               "analytics:12m", "analytics:export"],
  },
} as const;

export type Plan = keyof typeof PLANS;
export type Feature = (typeof PLANS)[Plan]["features"][number];

// Guard: annual must be within a euro of exactly 20% off 12× monthly.
for (const [name, p] of Object.entries(PLANS)) {
  if (!("annualCents" in p)) continue;
  const target = p.monthlyCents * 12 * (1 - ANNUAL_DISCOUNT);
  if (Math.abs(p.annualCents - target) > 100) {
    throw new Error(`${name}: annual €${p.annualCents / 100} breaks the 20% rule (expected ~€${target / 100})`);
  }
}
```

Run that assertion in CI. When you raise Pro to €59 and forget the annual price, the build fails instead of a customer finding a 4% "discount".

`PLAN_BY_PRODUCT` maps every Polar product ID (both intervals) back to a plan key — the interval affects only what Polar charges, never what the org can do or how many credits it gets:

```ts
export const PLAN_BY_PRODUCT: Record<string, Plan> = {
  [process.env.POLAR_PRODUCT_PRO_MONTHLY!]:      "pro",
  [process.env.POLAR_PRODUCT_PRO_YEARLY!]:       "pro",
  [process.env.POLAR_PRODUCT_BUSINESS_MONTHLY!]: "business",
  [process.env.POLAR_PRODUCT_BUSINESS_YEARLY!]:  "business",
};
```

### 2.5 Product metadata

Attach metadata to every Polar product. It rides along on every order, subscription, and webhook, which makes your webhook handlers trivial:

```json
// Subscription products
{ "kind": "plan", "plan": "pro", "interval": "month", "monthly_credits": "5000" }

// Top-up products
{ "kind": "topup", "credits": "10000" }
```

Now `order.paid` for a top-up tells you exactly how many credits to grant without a lookup table. Still validate against a server-side allowlist — treat metadata as a convenience, not as authority.

### 2.3 Currency — and the server-side checkout trap

Polar supports EUR as a presentment currency alongside USD, GBP, CHF and others. Set your org default to EUR for DACH and enable USD.

**The trap:** Polar picks currency from the IP of the request that *creates the checkout session*. If you create sessions server-side — which you must, since only admins may buy — Polar sees your Vercel function's IP and may price a Munich customer in USD.

```ts
const checkout = await polar.checkouts.create({
  products: [productId],
  customerExternalId: orgId,
  customerIpAddress: req.headers.get("x-forwarded-for")?.split(",")[0], // ← required
  successUrl: `${APP_URL}/billing/processing?checkout={CHECKOUT_ID}`,
});
```

Note also that the price structure must match across every enabled currency — so you can't have EUR-only top-up packs.

### 2.4 VAT / B2B

Polar as MoR collects VAT and handles EU B2B reverse charge when a VAT ID is supplied at checkout. Enable VAT ID collection — your Mittelstand customers will expect a proper invoice with their `USt-IdNr.` on it, and getting this wrong is the fastest way to lose a B2B deal. The VAT ID lands on the Polar customer's `tax_id` field; mirror it to your `organizations` row so you can show it in-app.

---

## 3. Supabase schema

All billing tables are **service-role only**. RLS denies everything to anon and authenticated. Reads go through server components and server actions. This removes an entire class of bugs.

```sql
-- ───────────────── Organizations (billing + credits) ─────────────────
create table organizations (
  clerk_org_id      text primary key,
  name              text not null,
  billing_email     text,
  vat_id            text,
  polar_customer_id text unique,

  plan              text not null default 'free',
  status            text not null default 'active',   -- active|past_due|canceled
  period_end        timestamptz,
  cancel_at_period_end boolean not null default false,
  polar_subscription_id text,

  -- Credits. Two buckets, two integers.
  plan_credits      integer not null default 0,       -- overwritten monthly; expires
  topup_credits     integer not null default 0,       -- purchased; never expires
  credits_period    text,                             -- 'YYYY-MM' of last plan grant

  deleted_at        timestamptz,
  created_at        timestamptz not null default now()
);

-- ────────────────── Webhook idempotency ──────────────────
create table webhook_events (
  id           text primary key,      -- provider event id
  provider     text not null,         -- polar | clerk
  type         text not null,
  payload      jsonb not null,
  processed_at timestamptz,
  error        text,
  received_at  timestamptz not null default now()
);
```

**Two integers, not a ledger.** `balance = plan_credits + topup_credits`. Plan credits are *overwritten* each month (which is how they expire — no expiry job, no date arithmetic); top-up credits only ever accumulate. Spending drains plan credits first, so the expiring bucket always goes before the permanent one — the behaviour customers expect, in two columns instead of two tables.

What you give up: no per-message audit trail in the billing schema, and no promo credits with custom expiry dates. Both are recoverable later — add a `credit_events` table when a customer first disputes a charge, and until then the `messages` table (which stores `credits_charged` per row) answers every usage question you'll actually get asked.

---

## 4. The credit engine

One SQL function and one gate. Nothing in application code touches the columns directly.

### 4.1 Gate on read, charge after the call

You can't know an LLM call's cost until it finishes, so: check there's a positive balance, run the call, then charge the actual amount.

```sql
-- Charges actual usage. Drains plan credits first, then top-ups.
-- Deliberately allows a small negative balance under concurrency.
create or replace function spend_credits(p_org_id text, p_amount integer)
returns integer
language sql as $$
  update organizations
     set plan_credits  = greatest(plan_credits - p_amount, 0),
         topup_credits = topup_credits - greatest(p_amount - plan_credits, 0)
   where clerk_org_id = p_org_id
  returning plan_credits + topup_credits;
$$;
```

Both assignments read the *pre-update* values, so the split is computed correctly in one statement. A single `UPDATE` locks the row for its own duration, so concurrent charges serialise automatically — no `FOR UPDATE`, no transaction management.

### 4.2 The wrapper

```ts
export async function withCredits<T>(
  orgId: string,
  fn: () => Promise<{ result: T; actualCredits: number }>
): Promise<T> {
  const { data: org } = await db.from("organizations")
    .select("plan_credits, topup_credits").eq("clerk_org_id", orgId).single();

  const balance = (org?.plan_credits ?? 0) + (org?.topup_credits ?? 0);
  if (balance <= 0) throw new BillingError("INSUFFICIENT_CREDITS");

  const { result, actualCredits } = await fn();          // charge only on success

  const { data: remaining } = await db.rpc("spend_credits", {
    p_org_id: orgId, p_amount: actualCredits,
  });
  if (remaining < 0) log.warn("credit overdraft", { orgId, remaining });

  return result;
}
```

**Never charge for a failed generation** — the charge happens after `fn()` resolves, so any throw skips it for free. No release path, no stale-reservation cron.

### 4.3 What "allows a small negative balance" actually means

The gate is a read, so N requests can pass it simultaneously and each charge afterwards. An Organization can therefore end a burst slightly below zero — realistically tens of credits against a 5,000-credit plan. The consequences are bounded and self-correcting:

- Accounting stays exact: you charged what was used, so the number is true.
- The next request sees `balance <= 0` and is blocked.
- Top-ups add to `topup_credits`, so a negative balance is repaid before new credits are usable.

The precise alternative — reserve an estimate, run, settle the difference — costs three SQL functions, a reservations table, a `reserved` column and a cron that releases abandoned reservations. Build it when a customer's overdraft is large enough to notice, which needs traffic you don't have yet.

### 4.5 Credit pricing

Define credits against **your marginal cost**, not against "one message." A message-based unit breaks the day you add a bigger model or a customer uploads 400 PDFs and every query drags huge retrieval context.

> **Watch the currency.** Model prices are quoted in USD; your plans are priced in EUR. Mixing them silently mis-sizes every plan's margin. Convert explicitly and pin the rate as a constant you review quarterly — never let an FX drift quietly change what a credit is worth.

```ts
const USD_PER_EUR = 1.08;              // reviewed quarterly, deliberately conservative
const EUR_PER_CREDIT = 0.0018;         // 1 credit ≈ €0.0018 of COGS (~10% buffer)

const MODEL_WEIGHTS = {               // USD per 1M tokens
  "gpt-4o-mini":     { in: 0.15, out: 0.60 },
  "gpt-4o":          { in: 2.50, out: 10.00 },
  "claude-sonnet":   { in: 3.00, out: 15.00 },
};

export function creditsFor(model: keyof typeof MODEL_WEIGHTS, usage: Usage) {
  const w = MODEL_WEIGHTS[model];
  const usd = (usage.inputTokens * w.in + usage.outputTokens * w.out) / 1_000_000;
  const eur = usd / USD_PER_EUR;
  return Math.max(1, Math.ceil(eur / EUR_PER_CREDIT));
}

export const estimateCredits = (model, contextTokens) =>
  Math.ceil(creditsFor(model, { inputTokens: contextTokens + 500, outputTokens: 800 }) * 1.2);
```

Publish the weights table in your docs — "mini = 1 credit, GPT-4o = ~12 credits" is honest, and it means adding a model later is a config change rather than a repricing announcement.

---

## 5. Polar webhooks

One route, `/api/webhooks/polar`, signature-verified, idempotent, fast (respond 200 and defer heavy work).

```ts
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (event) => {
    const { error } = await db.from("webhook_events")
      .insert({ id: event.id, provider: "polar", type: event.type, payload: event });
    if (error?.code === "23505") return;    // duplicate delivery, already handled
    await handlePolarEvent(event);
    await db.from("webhook_events").update({ processed_at: new Date() }).eq("id", event.id);
  },
});
```

| Event | Handler |
|---|---|
| `customer.state_changed` | Upsert plan/status/period on `organizations`. Complete state payload, so it's a pure idempotent write with no ordering logic. |
| `order.paid` | **Top-up fulfilment only.** `metadata.kind === 'topup'` → `topup_credits += metadata.credits`. Idempotency comes from the webhook claim in §5.2. For `kind === 'plan'`, do **not** grant credits here — see below. |
| `subscription.past_due` | Set status, start grace timer, email admins. **Do not cut off.** |
| `subscription.revoked` | Set `plan='free'`, `plan_credits = 100`, and **leave `topup_credits` untouched** — they paid for those. |
| `order.refunded` | `topup_credits -= refunded credits`. Allow it to go negative; usage stays blocked until it recovers. |

### 5.1 Plan credits come from a cron, not from `order.paid`

This is the one place where "grant on payment" is actively wrong. An annual subscriber produces **one** `order.paid` per year, but is owed credits **every month**. Granting on the order would give a Business annual customer 20,000 credits in January and nothing until the following January.

So plan credits are granted by a daily cron that reads `organizations`, not by the payment webhook. Granting means **overwriting** `plan_credits` — which is also how last month's unused credits expire, with no expiry job:

```sql
create or replace function grant_monthly_credits() returns integer
language sql as $$
  update organizations o
     set plan_credits   = (case o.plan
                             when 'business' then 20000
                             when 'pro'      then 5000
                             else                 100
                           end),
         credits_period = to_char(now(), 'YYYY-MM')
   where o.deleted_at is null
     and o.status in ('active', 'past_due')
     and o.credits_period is distinct from to_char(now(), 'YYYY-MM')
  returning 1;
$$;
```

The `credits_period is distinct from` guard makes re-running the cron a no-op, so a retry, an overlapping invocation, or a manual run costs nothing. Keep the amounts in sync with `PLANS` via a migration generated from that file, or assert them in CI.

Consequences worth internalising:

- **Billing interval and credit cadence are fully decoupled.** Monthly and annual subscribers get identical credits. Switching interval mid-term changes nothing about the ledger.
- **Free orgs are on the same code path** — `plan='free'` rows get their 100/month from the same statement. No separate free-tier logic.
- **`past_due` orgs keep receiving credits** during the grace window. That's deliberate: cutting off a customer whose card just expired is how you turn a payment hiccup into a churn.
- The `YYYY-MM` period means a customer who subscribes on the 28th gets a full month's credits for those three days. Accept it; pro-rating first-month credits is complexity nobody thanks you for.

### 5.2 Webhook idempotency must not swallow failures

The obvious insert-then-handle pattern has a silent data-loss bug: if the handler throws, the row already exists, so Polar's retry hits the duplicate branch and returns early. A paid top-up never grants its credits, and nothing logs an error.

**Claim the event, then handle, and only mark it processed on success:**

```ts
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (event) => {
    // Claim: succeeds on first delivery, or on retry of a previously FAILED event.
    const { data: claimed } = await db.rpc("claim_webhook_event", {
      p_id: event.id, p_provider: "polar", p_type: event.type, p_payload: event,
    });
    if (!claimed) return;                       // already processed successfully

    try {
      await handlePolarEvent(event);
      await db.from("webhook_events")
        .update({ processed_at: new Date(), error: null }).eq("id", event.id);
    } catch (e) {
      await db.from("webhook_events")
        .update({ error: String(e) }).eq("id", event.id);
      throw e;                                  // non-2xx → Polar retries
    }
  },
});
```

```sql
create or replace function claim_webhook_event(
  p_id text, p_provider text, p_type text, p_payload jsonb
) returns boolean language plpgsql as $$
begin
  insert into webhook_events (id, provider, type, payload)
  values (p_id, p_provider, p_type, p_payload)
  on conflict (id) do nothing;
  -- Claim only if not yet successfully processed.
  return exists (select 1 from webhook_events where id = p_id and processed_at is null);
end $$;
```

Alert on any `webhook_events` row older than an hour with `processed_at is null` — that's an event Polar has given up retrying.

### The success-redirect rule

`?checkout=...` proves nothing; anyone can navigate there. Redirect to `/billing/processing`, which polls your own DB until the webhook lands (typically <2s), with a 30s fallback that calls `polar.customers.getStateExternal(orgId)` directly.

---

## 6. Checkout & portal flows

All four are admin-gated with a single guard:

```ts
export async function requireBillingAdmin() {
  const { userId, orgId, has } = await auth();
  if (!userId || !orgId) throw new BillingError("NO_ORG");
  if (!has({ permission: "org:billing:manage" })) throw new BillingError("FORBIDDEN");
  return { userId, orgId };
}
```

**`orgId` always comes from `auth()`, never from the request body.** Accept an `orgId` parameter and any member of any org can buy for — or cancel — any other org.

| Flow | Implementation |
|---|---|
| Subscribe | `checkouts.create({ products, customerExternalId: orgId, customerIpAddress, metadata: { clerk_org_id: orgId, purchased_by: userId } })` |
| Buy top-up | Same, one-time product. Works on the free plan too — that's a deliberate revenue path. |
| Change plan | Polar customer portal handles proration |
| Portal | `customerSessions.create({ customerExternalId: orgId })` → redirect. Session is scoped to that customer and cannot perform org-level mutations. **Never expose the OAT client-side.** |

---

## 7. Enforcement map

Every gate is server-side. Client-side `has()` decides whether to render a lock icon — nothing more.

| Action | Gate | Failure UX |
|---|---|---|
| Send chat message (widget) | `withCredits()` | Configurable fallback message, not an error |
| Send chat message (dashboard) | `withCredits()` | Inline "out of credits" + top-up CTA (admins) |
| Create chatbot | `requireFeature` + count check | Upgrade modal |
| Select a model | `requireFeature('models:all')` — Free is mini-only | Locked options in the picker |
| Add source | plan source limit | Upgrade modal |
| Crawl/embed source | **count against limit, not credits** | Simpler, and embedding cost is small vs. inference |
| Remove branding | `requireFeature("branding:remove")` | Locked toggle |
| API access | `requireFeature("api")` + key check | 402 |
| Invite member | seat limit | Upgrade modal |

---

## 7a. Running out of credits, and downgrades

### At zero credits: hard stop

A paid Organization that exhausts its credits mid-month stops serving answers. `withCredits()` throws `INSUFFICIENT_CREDITS` before calling the model, and the widget replies with the chatbot's configured **fallback message** — never a stack trace, never a generic error, never a message that reveals the customer's billing state to their website visitors. Default copy, editable per chatbot:

> *"Thanks for your message — I can't answer right now. Please reach us at {contact}."*

Everything else about the Organization keeps working: the dashboard opens, sources stay indexed, analytics still render, chatbots aren't deleted. Only new answers stop.

Make sure they see it coming, because a silent widget is a furious customer:

| Trigger | Action |
|---|---|
| 80% of monthly credits | Email billing admins + dashboard banner |
| 100% | Email billing admins, banner with a one-click top-up |
| Any member views the dashboard at 0 | Explicit "out of credits — ask an admin to top up", never a generic error |

No overage billing (decision #3) and no auto-recharge in the MVP. (The 80%/100% alerts are the same ones listed in §8 — build them once.) **Auto-recharge is the first post-MVP billing feature to build** — it converts the worst moment in the product (a dead widget) into a non-event, and it's a pure revenue add. Design for it now by keeping the top-up grant path a single function call; adding a threshold trigger later is then a cron and a saved payment method, not a refactor.

### Downgrades: gate at creation, never retroactively

Business → Pro with 8 chatbots against a limit of 3: **do nothing to the existing 8.** Enforce plan limits only when *creating* a new resource:

```ts
export async function createChatbot(input: NewChatbot) {
  const { orgId } = await requireBillingAdmin();
  const e = await getEntitlements();
  const count = await countChatbots(orgId);
  if (count >= limitOf(e.plan, "chatbots")) throw new BillingError("PLAN_LIMIT", { resource: "chatbots" });
  // ...
}
```

This is the least code — no deactivation job, no `disabled_at` flag, no widget handling for disabled bots, no re-enable path on upgrade, no "pick which 5 to keep" UI. It's also, unusually, the correct answer rather than just the cheap one: **chatbot count doesn't drive your COGS — credits do.** An Organization with 8 chatbots on Pro still receives exactly 5,000 credits a month, so those extra bots cost you storage and nothing more. The same reasoning covers sources and seats.

The revenue leak is real but bounded: a customer can downgrade and keep more chatbots than Pro advertises. At your current scale that is a theoretical loss, and the fix — a `disabled_at` column plus a handler on `customer.state_changed` — is an hour's work whenever a real customer actually does it.

---

## 8. Widget abuse — domain allowlist

Your widget is embedded on public websites, so **anonymous visitors spend your customer's credits.** For the MVP, one control:

**Domain allowlist per chatbot.** Every chatbot stores the domains it may be embedded on. The widget endpoint rejects any request whose `Origin` header isn't registered. This stops the realistic attack — someone lifting your customer's embed code onto their own site — and it's a dozen lines.

```ts
// app/api/widget/[botId]/route.ts   (public — excluded from proxy.ts matcher)
const origin = req.headers.get("origin");
const bot = await getChatbot(params.botId);
if (!origin || !bot.allowed_origins.includes(new URL(origin).host)) {
  return new Response("Origin not allowed", { status: 403 });
}
```

Deliberately **not** in the MVP: per-IP limits, per-session limits, and an Organization-configurable daily credit cap. Those defend against a determined attacker abusing a *legitimate* domain — someone who actively wants to hurt your customer. That's a real threat, but it's not the one you'll meet first, and the hard credit cap (decision #3) already bounds the damage to one month's credits rather than an unbounded bill.

**The mitigation that matters more than rate limiting is the alerting**, which is cheap and stays in:

| Trigger | Action |
|---|---|
| 80% of monthly credits | Email billing admins + dashboard banner |
| 100% | Email billing admins, banner with one-click top-up |

A customer who gets an email at 80% can investigate an anomaly themselves. A customer whose widget silently dies at 100% churns.

Add per-IP limiting the first time you see a single address responsible for an implausible share of one chatbot's traffic — the `messages` table already has what you need to spot it.

---

## 9. Failure modes checklist

- [ ] Webhook routes excluded from `clerkMiddleware` matcher
- [ ] `/api/widget/*` excluded from `clerkMiddleware`
- [ ] Every Polar product ID read from env, separate sandbox/prod values
- [ ] `past_due` → 5-day grace, degrade don't delete; existing chatbots keep answering
- [ ] Downgrade with excess chatbots → left running; limits enforced at creation only (§7a)
- [ ] Fallback message fires at 0 credits — never an error page in a customer's widget
- [ ] 80% and 100% credit alerts reach billing admins
- [ ] Refund → claw back grant, allow negative balance, block until positive
- [ ] Org deleted → cancel subscription, keep Polar customer record
- [ ] Free-tier abuse: one free org per verified email, no credit-card-free bulk signup path
- [ ] Billing email decoupled from admin's personal address
- [ ] Spot-check: an Organization's `plan_credits + topup_credits` matches the sum of `credits_charged` in `messages` since its last grant
- [ ] `webhook_events` rows older than 1h with `processed_at is null` → alert (Polar stopped retrying)
- [ ] Monthly-credit cron proven against an **annual** subscriber, not just a monthly one
- [ ] `USD_PER_EUR` constant reviewed; credit COGS recomputed after any model price change
- [ ] Test the full flow in sandbox including a refund and a failed renewal

---

## 10. Build order

Roughly 3–4 focused days. Do not reorder — each step is testable on its own.

| Day | Work |
|---|---|
| **1** | Clerk org enforcement (middleware, auto-provision, roles). `organizations` table. `getEntitlements()` + `requireFeature()`. Ship with everyone on free. |
| **2** | Add the credit columns + `spend_credits()` + `grant_monthly_credits()`. `withCredits()` wrapper. Wire the chat endpoint. Set credits by hand in SQL to test. No Polar yet. |
| **3** | Polar sandbox catalog. Checkout routes + admin guard. Webhook handler with idempotency. `/billing/processing` polling page. Test subscribe → renew → top-up → refund → cancel. |
| **4** | Billing UI (plan card, credit meter, usage chart, top-up buttons, portal link). Widget domain allowlist. 80%/100% emails. Promote to production. |

**Day 2 before day 3 is deliberate.** The credit engine is the part that's hard to get right and the part that breaks customer trust when it's wrong. Build and test it in isolation, with SQL-inserted grants, before any payment provider is involved. If credits work with fake grants, they'll work with real ones.

---

## 11. Deliberately not in the MVP

Cut these. Each is a day of work that no early customer will pay for:

- Seat-based pricing (flat plan tiers with seat *limits* are fine)
- Annual→monthly proration edge cases (send them to the Polar portal)
- Credit rollover for plan credits (they expire; state it plainly on the pricing page)
- Metered overage invoicing (decision #3 — hard cap)
- Auto-recharge at a low-balance threshold (**build this first, post-MVP**)
- Reserve→settle exact credit accounting (only once overdrafts get noticeable)
- Per-grant credit ledger with custom expiry (only once someone disputes a charge)
- Per-IP / per-session widget rate limiting
- Free trials on paid plans (Free tier is the trial)
- Custom enterprise plans (do them manually in the Polar dashboard)
- Multi-currency beyond EUR + USD
- Usage analytics beyond a simple 30-day credit-spend chart
- In-app invoice history (the Polar customer portal already has it)

---

## Appendix: environment variables

Minimum versions: `node >= 20.9.0`, `next >= 15.2.3` (16.x recommended), `@clerk/nextjs@^7`.

```bash
# Clerk
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_WEBHOOK_SECRET=

# Polar
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_SERVER=sandbox            # sandbox | production
POLAR_PRODUCT_PRO_MONTHLY=
POLAR_PRODUCT_PRO_YEARLY=
POLAR_PRODUCT_BUSINESS_MONTHLY=
POLAR_PRODUCT_BUSINESS_YEARLY=
POLAR_PRODUCT_TOPUP_SMALL=
POLAR_PRODUCT_TOPUP_MEDIUM=
POLAR_PRODUCT_TOPUP_LARGE=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=      # server only, never NEXT_PUBLIC_
```