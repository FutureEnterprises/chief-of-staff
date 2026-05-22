# COYL — Engineering Reference

> Canonical spec for the autopilot interruption system. This doc exists
> because the product spec was war-memo-grade: strong on voice, under-
> specified on systems. Every section here maps to code in `apps/web/src`
> or `packages/ai/src`. If you're building a new surface, read this first
> so you inherit the existing state model, guard rails, and prompt contract
> instead of reinventing them.

---

## 1. The loop

```
Signal → Detect → Interrupt → Truth → Action → Recovery → Learn
```

Canonical visualization lives at `/how-it-works`
(`apps/web/src/components/landing/core-loop.tsx`).

Every product surface maps to exactly one box in this loop. New surfaces
must declare their box in a PR description so we don't duplicate loop
positions (e.g. two competing "Interrupt" surfaces).

---

## 2. User state machine

**Code:** `apps/web/src/lib/user-state.ts`

### States

| State          | Meaning                                                          |
| -------------- | ---------------------------------------------------------------- |
| `NEW`          | Account created, onboarding not complete.                        |
| `ACTIVE`       | Engaged and on track. Default steady state.                      |
| `FLARING`      | Currently inside a known danger window.                          |
| `SLIPPED`      | Just logged a slip, <2h since.                                   |
| `RECOVERING`   | 2–24h post-slip, not yet marked recovered.                       |
| `RESILIENT`    | Recovered from a slip within <24h. Reward state.                 |
| `SILENT`       | No activity for 2+ days.                                         |
| `DISAPPEARED`  | No activity for 10+ days.                                        |

State is **derived from data**, not stored. `classifyState(snapshot)` is
a pure function. This keeps state always current even when the user's
`recoveryState` column is stale.

### Priority

When multiple classifications apply, this order wins (high → low):

```
NEW > DISAPPEARED > SILENT > SLIPPED > RECOVERING > RESILIENT > FLARING > ACTIVE
```

Example: a user inside a danger window who ALSO just slipped is `SLIPPED`,
not `FLARING`. They don't need danger-window pings on top of post-slip
pings.

### Legal transitions

See `LEGAL_TRANSITIONS` in `user-state.ts`. Adding a new signal is a
compiler error elsewhere — intentional.

### Interrupt policy per state

`isInterruptAllowed(state, kind)` gates every cron firing. Truth table:

| State         | DANGER_WINDOW | POST_SLIP_2H | POST_SLIP_24H | SILENT_SOFT | SILENT_DIRECT | SILENT_FINAL |
| ------------- | :-----------: | :----------: | :-----------: | :---------: | :-----------: | :----------: |
| `NEW`         |       ✗       |      ✗       |       ✗       |      ✗      |       ✗       |      ✗       |
| `ACTIVE`      |       ✗       |      ✗       |       ✗       |      ✗      |       ✗       |      ✗       |
| `FLARING`     |       ✓       |      ✗       |       ✗       |      ✗      |       ✗       |      ✗       |
| `SLIPPED`     |       ✗       |      ✓       |       ✗       |      ✗      |       ✗       |      ✗       |
| `RECOVERING`  |       ✗       |      ✗       |       ✓       |      ✗      |       ✗       |      ✗       |
| `RESILIENT`   |       ✗       |      ✗       |       ✗       |      ✗      |       ✗       |      ✗       |
| `SILENT`      |       ✗       |      ✗       |       ✗       |      ✓      |       ✓       |      ✗       |
| `DISAPPEARED` |       ✗       |      ✗       |       ✗       |      ✗      |       ✗       |      ✓       |

Changes to this table require a schema-review PR.

---

## 3. Interrupt guard

**Code:** `apps/web/src/lib/interrupt-guard.ts`

Every push/email/callout passes through `guardInterrupt()` before being
delivered. Six checks, in order:

1. **State policy** — `isInterruptAllowed(state, kind)` (see table above).
2. **Quiet hours** — 23:00–07:00 in the user's timezone. No exceptions.
3. **Idempotency** — if `idempotencyKey` provided, has this exact interrupt
   fired before? (Used by post-slip `${slip.id}:${wave}` keys.)
4. **Recent-action suppression** — user did any of
   `CHECKIN_COMPLETED`, `RESCUE_TRIGGERED`, `RESCUE_RESOLVED`,
   `DECISION_MADE`, `CALLOUT_VIEWED`, `TASK_COMPLETED`,
   `MORNING_REVIEW`, `NIGHT_REVIEW` in the last 90 minutes.
5. **Per-kind cooldown** — matrix:
   | Kind               | Cooldown |
   | ------------------ | -------- |
   | `DANGER_WINDOW`    | 2h       |
   | `POST_SLIP_2H`     | ∞ (idempotency-gated) |
   | `POST_SLIP_24H`    | ∞ (idempotency-gated) |
   | `SILENT_SOFT`      | 3d       |
   | `SILENT_DIRECT`    | 3d       |
   | `SILENT_FINAL`     | 7d       |
6. **Daily rate cap** — 4 interrupt pings per user per 24h total across
   all kinds. Past that, stay quiet.

If the decision is `allow: false`, increment the `suppressed` counter in
the cron response. These numbers are observable at `/admin`.

### Recording

After successful delivery, call `recordInterrupt({ userId, kind, channel,
idempotencyKey?, metadata? })`. This writes one `AUTOPILOT_INTERRUPTED`
row and feeds all future guard calls.

---

## 4. Crons

All at `apps/web/src/app/api/cron/*`. Registered in `apps/web/vercel.json`.

| Path                                 | Schedule     | Purpose                                         | Guard kinds                |
| ------------------------------------ | ------------ | ----------------------------------------------- | -------------------------- |
| `/api/cron/danger-window-interrupt`  | `*/15 * * *` | JITAI — fire at user's mapped danger windows.   | `DANGER_WINDOW`            |
| `/api/cron/post-slip-interrupt`      | `*/15 * * *` | T+2h and T+24h waves on every slip record.      | `POST_SLIP_2H`, `POST_SLIP_24H` |
| `/api/cron/churn`                    | `0 10 * * *` | "You're disappearing" at 2/5/10 days silent.    | `SILENT_SOFT` / `_DIRECT` / `_FINAL` |
| `/api/cron/autopilot-autopsy`        | `0 10 * * 1` | Weekly pattern report via AI.                   | (no gated pushes yet)      |
| `/api/cron/weekly`                   | `0 9 * * 1`  | Weekly report email.                            | (no gated pushes yet)      |
| `/api/cron/morning`, `/night`, `/briefing`, `/reminders`, `/score` | various | Scheduled content + housekeeping. | (none) |

All scheduled routes call `verifyCronAuth(req)` first. Cron secret set via
`CRON_SECRET` env var.

---

## 5. Prompt contract

**Code:** `packages/ai/src/contract.ts`

### Rules (enforced at prompt-level + validator-level)

- **Length budget** per response kind (`MAX_TOKENS`):
  - `DECIDE`: 380
  - `RESCUE`: 380
  - `SLIP`: 420
  - `CALLOUT`: 320
  - `AUTOPSY`: 620
- **Structure**: use exact section headers specified per task prompt. No
  extras, no preamble.
- **Voice**: "you" language. Speak to the person. Short sentences. Match
  the injected tone block.
- **Prediction required** in every Decide / Rescue / Slip response. If
  confidence is low, prefer a generic "you already know this pattern"
  phrasing over an invented specific prediction.
- **Executable close**: every response ends with ONE physical action in
  the next 5 minutes. Verb + object.
- **Pattern reference** when data supports. Never fabricate history.
- **Banned phrases**: see `BANNED_PHRASES`. Includes therapy voice
  ("I hear you"), hedging ("it depends"), cheerleading ("you got this"),
  enabling cliches ("tomorrow is a new day").
- **Banned identity words**: `failed`, `failure`, `broken`, `weak`,
  `pathetic` when applied to the user. Attack the loop, not the person.

### Enforcement

1. **Prompt-level** — `composeSystem({ core, task, tone, context })`
   always appends `SYSTEM_CONTRACT` last. Every call site uses this.
2. **Runtime** — `validateResponse(text, kind)` returns
   `{ valid, violations, sanitized? }`. Callers can log, strip, or
   regenerate.

### Call sites using composeSystem

| Surface      | File                                               |
| ------------ | -------------------------------------------------- |
| `/decide`    | `apps/web/src/app/api/v1/decide/route.ts`          |
| `/rescue`    | `apps/web/src/app/api/v1/rescue/route.ts`          |
| `/slip`      | `apps/web/src/app/api/v1/slip/route.ts`            |
| Callout mode | `apps/web/src/app/api/v1/callout/route.ts`         |

---

## 6. Adaptive tone

**Code:** `effectiveTone(chosen, state, daysSinceSignup)` in
`user-state.ts`.

Even when the user picked `NO_BS` or `BEAST`, we soften in emotionally
raw states so we don't land drill-sergeant voice on a user who just
slipped.

| Condition                       | Override                      |
| ------------------------------- | ----------------------------- |
| `daysSinceSignup < 7`           | Always `MENTOR`. No exceptions. |
| State is `SLIPPED` or `RECOVERING` | Soften one step: `BEAST`→`NO_BS`, `NO_BS`→`STRATEGIST`. |
| State is `DISAPPEARED`          | Hard downgrade to `MENTOR` for any harsh pick. |
| Otherwise                       | Use chosen.                   |

The first-week override matters most: early churn is catastrophic;
a new user hit with BEAST on day 2 bounces.

---

## 7. Event model

**Types:** `EventType` enum in `packages/database/prisma/schema.prisma`.

High-signal events the guard + analytics read from:

| Event                  | Fires on                                                       |
| ---------------------- | -------------------------------------------------------------- |
| `SLIP_LOGGED`          | `POST /api/v1/slip`                                             |
| `RESCUE_TRIGGERED`     | `POST /api/v1/rescue`                                           |
| `RESCUE_RESOLVED`      | Client `/rescue` marks pulled back                              |
| `DECISION_MADE`        | `POST /api/v1/decide`                                           |
| `EXCUSE_DETECTED`      | `classifyAndStoreExcuse()`                                      |
| `DANGER_WINDOW_CROSSED`| `danger-window-interrupt` cron                                  |
| `AUTOPILOT_INTERRUPTED`| `recordInterrupt()` — one per cron delivery                     |
| `CHURN_EMAIL_SENT`     | `churn` cron (legacy, retained for dashboards)                  |
| `SHARE_CLICKED`        | `ShareMoment` + `CalloutPanel` share buttons                    |
| `CALLOUT_VIEWED`       | `CalloutPanel` modal opens                                      |
| `MORNING_REVIEW`, `NIGHT_REVIEW`, `CHECKIN_COMPLETED` | Scheduled check-ins. |

`SHARE_CLICKED` and `CALLOUT_VIEWED` were added 2026-04-19; ensure the
matching DB enum migration is applied (runs through Prisma `db push`
or the Supabase MCP migration we ran).

---

## 8. Admin metrics

**Route:** `/admin` — gated by `ADMIN_EMAILS` env var (comma-separated).

Primary metrics:
- **Rescue interrupt rate** — `rescueSession.outcome='INTERRUPTED' / total`
- **Recovery within 24h** — `slipRecord.recoveredAt - createdAt ≤ 24h`
- **D7 retention** — cohort registered 7–14 days ago still active in
  last 7 days.
- **D30 retention** — cohort registered 30–60 days ago still active in
  last 30 days.

Target bands (red/amber/green) documented in `apps/web/src/app/admin/page.tsx`.

---

## 9. Narrow-market bias

**Config:** `pickVariant()` in `apps/web/src/app/page.tsx`.

For the next 90 days, landing traffic is weighted 60/20/20 toward the
weight-loss variant (C). Product surface is broader but GTM is narrow.
Flip the weights back to 33/33/33 when we have data-backed reasons to
open up the funnel.

---

## 11. Clerk production key setup (READ THIS BEFORE EVERY DEPLOY)

**Symptom of the bug**: public pages (/, /weight-loss, /how-it-works etc)
redirect to a URL containing `__clerk_hs_reason=dev-browser-missing`
when hit without auth. Bots, crawlers, link previews, and logged-out
first-touch visitors all bounce.

**Root cause**: `pk_test_...` / `sk_test_...` keys in Vercel production.
Clerk **dev instances** force an `accounts.dev` handshake on every
request to establish cross-origin cookies — that handshake IS the
redirect. Clerk **production instances** skip it.

**Fix**:
1. Clerk Dashboard → Production instance (create one if you only have
   Development).
2. API Keys → copy the `pk_live_...` + `sk_live_...` pair.
3. Vercel → Settings → Environment Variables → **Production**
   (not Preview, not Development):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
   - `CLERK_SECRET_KEY` = `sk_live_...`
4. Redeploy.
5. Verify: `curl https://www.coyl.ai/api/health`
   should return `"clerkMode": "live"` and `"status": "ok"`.

**Guardrails we ship to catch this before it happens again**:
- `apps/web/scripts/verify-prod-env.ts` runs as the `prebuild` hook.
  Fails the Vercel build with a loud remediation message if prod is
  about to deploy with `pk_test_` keys. Same script warns softly on
  missing RESEND_API_KEY, CRON_SECRET, ADMIN_EMAILS.
- `apps/web/src/middleware.ts` logs a one-shot CLERK CONFIG FATAL
  banner to stderr on every cold start when `VERCEL_ENV === 'production'`
  and a `pk_test_`/`sk_test_` is detected.
- `GET /api/health` returns `clerkMode: 'live' | 'test' | 'unset'` plus
  DB reachability. Use for uptime monitors.

**Dev-mode is still fine**: local `.env.local` can keep `pk_test_` keys;
the guard only screams when `VERCEL_ENV === 'production'`.

### Interim: middleware bypasses Clerk on public routes

While the Clerk Production instance is being provisioned (requires DNS +
verification, ~5–15 min), `apps/web/src/middleware.ts` short-circuits
clerkMiddleware entirely for marketing + health routes. See the
`SHOULD_BYPASS_CLERK` matcher. Effect:

- Public pages (`/`, `/weight-loss`, `/how-it-works`, `/content`, etc)
  render without the accounts.dev handshake. SEO / crawlers / link
  previews work.
- `/` wraps its `auth()` call in try/catch so logged-in-user redirect
  still fires when middleware IS active, but doesn't crash when the
  bypass skipped Clerk.
- Once `pk_live_` is set, the bypass becomes a no-op — Clerk in prod
  mode skips the handshake anyway. Safe to leave in place; safe to
  remove later.

### Setting up the Clerk Production instance

To get `pk_live_` + `sk_live_`:

1. Clerk Dashboard → top-left dropdown → **"Create production instance"**.
2. Pick a **frontend API URL** — use `clerk.coyl.ai` (or any subdomain
   you control).
3. Clerk shows DNS records:
   - `CNAME clerk → frontend-api.clerk.services`
   - `CNAME accounts → accounts.clerk.services`
   - `CNAME clk._domainkey → ...` (email)
   - `CNAME clk2._domainkey → ...` (email)
   - `CNAME clkmail → mail.{yourfapi}` (email)
4. Add these records to the `coyl.ai` DNS zone (Vercel DNS, Cloudflare,
   whoever owns it). TTL 300 is fine.
5. Back in Clerk → **"Verify"**. Takes 5–15 min after DNS propagation.
6. API Keys tab shows `pk_live_...` + `sk_live_...` once verified.
7. Paste into Vercel → Settings → Environment Variables → Production.
8. Redeploy. `/api/health` returns `"clerkMode": "live"`.

The old dev instance (`complete-baboon-88.clerk.accounts.dev`) stays
active and keeps working for local development — no need to delete it.

---

## 10. 90-day no-touch list

Do not build / refactor these until we ship the above:

- New wedges beyond the six in `UniversalWedges`
- New AI providers (stay on `@ai-sdk/anthropic` until the Vercel AI
  Gateway migration is scoped)
- New prompt surfaces outside the five in the contract table
- Additional cron kinds beyond the six in the interrupt table

Every new cron or AI surface must land in this doc first.

---

## Changelog

- **2026-04-19** — Initial engineering spec. State machine + guard +
  prompt contract + adaptive tone + admin + narrow-market. Crons
  refactored to use guard. 4 AI routes refactored to use `composeSystem`.

- **2026-04-19 (later)** — Aligned to
  `COYL_system_behavior_rules.md`. Summary of changes:
  - **Rate cap** lowered 4→3 per user per 24h (spec §2.2).
  - **Aggressive-tier cap** added: 1 `SILENT_FINAL`-tier ping per 24h.
  - **Global 90-min gap** between any two interrupts regardless of kind
    (spec §2.2).
  - **Dismissal tracking**: new `PROMPT_DISMISSED` event; guard
    suppresses for 6h if user dismissed last 2 prompts in <10s each
    (spec §2.3).
  - **Recent-action events extended** to include `COMMITMENT_KEPT`,
    `FOLLOW_UP_COMPLETED`, `SLIP_RECOVERED`.
  - **State-driven tone overrides** (spec §5):
    - `FLARING` → No-BS floor (Mentor/Strategist upgraded to No-BS).
    - `SLIPPED` / `RECOVERING` / `DISAPPEARED` → Mentor ceiling.
    - `consecutiveIgnoredInterrupts ≥ 3` → Beast escalation.
  - **Prompt section headers** aligned to spec §6:
    - Decide: `What's happening / Prediction / Your excuse / Best move / Next action`
    - Rescue: `Pattern name / Callout / Interrupt / Action / Follow-up`
    - Slip: `Acknowledge slip / Stop spiral / Stabilize / Next move / Tomorrow plan`
  - **MAX_TOKENS tightened**: DECIDE/RESCUE 220 tokens (~140 words),
    SLIP 240 (~150 words) per spec §6 120-word target.
  - **Excuse detection enriched**: now returns `confidence` (0-1) and
    `suggestedCounter` (one-line callout). Below-0.5 confidence treated
    as no detection so we never fire interrupts on fuzzy signal.
  - **Identity update cron** at `/api/cron/identity-update`, runs 04:30
    UTC daily. Applies spec §7 rules: fast repeated recovery →
    `RESILIENT`, disappeared-after-slip → `AVOIDANT`, etc. Pure
    transition function in the route file; easy to test.

### Identity state transitions (spec §7)

| Trigger                                            | Resulting state         |
| -------------------------------------------------- | ----------------------- |
| Disappeared after slip (not recovered, silent 2d+) | `AVOIDANT`              |
| 3+ slips, all recovered <24h                       | `RESILIENT`             |
| ≥1 recovered slip + active in last 7d              | `RECOVERING`            |
| Multiple slips + long silence                      | `AVOIDANT`              |
| Streak ≥21d + slips ≤1/month                       | `DISCIPLINED`           |
| Streak ≥7d + slips ≤2/month                        | `INCREASINGLY_CONSCIOUS` |
| Otherwise with activity                             | `UNSTABLE_BUT_TRYING`   |
| No activity                                         | `SLEEPWALKING`          |

### Interrupt intensity tiers (spec §3.1)

| Kind             | Intensity     |
| ---------------- | ------------- |
| `DANGER_WINDOW`  | `direct`      |
| `POST_SLIP_2H`   | `direct`      |
| `POST_SLIP_24H`  | `soft`        |
| `SILENT_SOFT`    | `soft`        |
| `SILENT_DIRECT`  | `direct`      |
| `SILENT_FINAL`   | `aggressive`  |

Aggressive-tier kinds are capped at 1 per user per 24h even if the
overall 3/24h rate cap hasn't been hit.

---

## 13. Durable cron pattern (Workflow DevKit)

Best-effort `/api/cron/*` routes that take >30s or process users in a
loop should migrate to the Workflow DevKit (`workflow` package). The
benefit is per-step retries on transient DB blips and a persisted
execution log a crashed instance can resume from.

### Pattern

1. **Workflow** at `apps/web/src/workflows/<name>.ts` — exports an
   async function with the `"use workflow"` directive on its first
   line. Orchestration logic only; no `prisma`, `fetch`, or Node
   built-ins (the workflow sandbox forbids them).
2. **Steps** in the same file — async functions with `"use step"` on
   the first line. All DB work, all I/O, all crypto. Each step is
   independently retried on failure; results are cached so re-runs
   skip already-succeeded steps.
3. **Cron route** at `apps/web/src/app/api/cron/<name>/route.ts` —
   thin shim that calls `start(workflowFn)` and returns 200 with the
   `runId`. The route's `maxDuration` drops to 10s (was 120s for
   inline handlers).
4. **Heartbeat** — workflow's terminal step upserts to
   `CronHeartbeat` so the admin dashboard can show last-success.
5. **Config** — `next.config.ts` is wrapped with `withWorkflow()`.
   The proxy matcher excludes `.well-known/workflow/` so Clerk
   doesn't intercept the internal queue POSTs.

### Migrated to durable

- `danger-window-learner` (May 22, 2026) — chosen first because it
  feeds the histogram model surfaced on `/how-coyl-knows-you` and
  the precision-interrupt cron's firing schedule. Flaky retries =
  stale predictions = the moat claim degrades.

### Migrate next (priority order)

1. `retrain-prediction-models` — longest-running cron, highest crash
   probability under load
2. `scheduled-interrupts` — affects per-user push delivery
3. `self-trust-recompute` — daily, needs consistency guarantees
4. `model-snapshot` — drives the autopilot-map weekly render

### Observability

- `npx workflow web` — dashboard at runtime
- `npx workflow inspect runs --backend vercel --project coyl-web`
  on Vercel deployments
- Heartbeats query: `SELECT name, "lastRunAt" FROM cron_heartbeats
  ORDER BY "lastRunAt" DESC`

---

## 14. Cache Components migration plan (Next 16)

The v2 strategy brief listed Cache Components migration as a deferred
engineering item. The conservative "one page at a time" plan from the
original spec doesn't work in Next 16 — `"use cache"` is gated on the
global `cacheComponents: true` flag in next.config.ts. There is no
per-page opt-in.

**Status (May 22, 2026): deferred.** A trial enable surfaced ~20 files
that need coordinated changes before the flag can stay on. The flag is
intentionally off until those land.

### What enabling `cacheComponents: true` requires

Run from project root to reproduce the audit:

```bash
# Pages with `export const revalidate = N` — must convert to
# `"use cache" + cacheLife()`. Eleven files today.
grep -rln "export const revalidate" apps/web/src/app --include="*.tsx" --include="*.ts"

# Routes with `runtime = 'edge'` — must be removed. Edge runtime is
# incompatible with cacheComponents. Five files today, mostly OG
# image renderers (api/og, api/share, d/[code]/og, d/[code]/social,
# opengraph-image.tsx). Moving these to Node has cold-start
# implications — measure before committing.
grep -rln "export const runtime = 'edge'" apps/web/src/app --include="*.tsx" --include="*.ts"

# Pages reading dynamic APIs at top level without Suspense — must
# refactor so the dynamic read happens inside a Suspense'd child.
grep -rln "await headers()\|await cookies()\|await searchParams" \
  apps/web/src/app --include="*.tsx"
```

The third bucket today is `app/page.tsx` (variant cookie + searchParams)
and `(admin)/admin/marketing/page.tsx` (filter searchParams).

### Migration order when ready

1. **Marketing wedges first** — convert each `revalidate = 86400` to
   `'use cache' + cacheLife('days') + cacheTag('marketing-<slug>')`.
   Wire `revalidateTag('marketing-<slug>')` into the admin marketing
   save action so edits invalidate surgically rather than waiting 24h.
2. **Edge route audit** — for each `runtime = 'edge'` route, decide:
   move to Node (cold-start hit), or carve out as a non-cacheable
   subdomain. The OG image routes are the highest-traffic of these and
   need a perf budget before the move.
3. **Dynamic API refactors** — wrap `app/page.tsx` variant selection
   in a Suspense'd subcomponent so the cached shell stays static.
   Same for `(admin)/admin/marketing/page.tsx` filter UI.
4. **Flip the flag** — set `cacheComponents: true` in next.config.ts.
   Run a clean build locally; address any remaining errors.
5. **Verify in preview** — deploy to a preview URL, hit the migrated
   pages with a fresh cache, confirm headers show the expected mix of
   static + cached + dynamic segments.

Reference: https://nextjs.org/docs/app/getting-started/cache-components

