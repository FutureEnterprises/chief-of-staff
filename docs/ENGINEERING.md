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
