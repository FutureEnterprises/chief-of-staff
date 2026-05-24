# COYL × Microsoft Teams + Viva — AppSource submission package

Status: **v0.2 in repo, pre-submission.** Last updated 2026-05-24.

---

## 1. Where we are vs where we need to be

### Shipped (this commit)

- **4 archetype interrupt cards** (the COYL differentiation inside
  Teams) — Focus Defender, Follow-Through Pinger, Meeting Decliner,
  Recovery Coach. Lives at `apps/web/src/lib/integrations/teams.ts` →
  `buildInterruptCard(class, ctx)`.
- **Notify-by-class endpoint** at
  `apps/web/src/app/api/v1/teams/interrupt/[tenantId]/route.ts`.
  Cron-secret or Clerk-admin auth, zod-validated path param +
  body, tenant ownership check, audits to `productivity_events`.
- **Teams app manifest** at `apps/web/public/microsoft-teams/manifest.json`
  (v1.16 schema). Sideloadable for QA today; AppSource-submittable
  after the four `REPLACE_WITH_AZURE_AD_APP_ID` placeholders are
  filled in.
- **Bot Framework webhook** (`/api/v1/teams/bot/messages`),
  install/admin-consent flow (`/api/v1/teams/install`), and tenant
  provisioning (`TeamsWorkspace` Prisma model) — were already live,
  documented here for completeness.

### Not yet shipped (the v0.3 → v1.0 sequence)

| # | Surface | Effort | Why it matters |
|---|---|---|---|
| 1 | Azure AD app registration + manifest filled in | 1 day | Blocks every other step. No app ID = no sideload, no AppSource. |
| 2 | Color + outline PNG icons (192×192 + 32×32) | 4 hours design | AppSource gate. |
| 3 | Microsoft Graph integration (calendar + email read) | 4-7 days | The 4 interrupt classes currently need Graph signals to fire automatically. Without Graph, they only fire on manual API calls. |
| 4 | Per-user Graph token capture (OAuth on top of tenant consent) | 2-3 days | Each user must consent to Graph reads; we need a token-store + refresh flow. |
| 5 | `/api/cron/teams-graph-pull` cron | 1-2 days | The scheduled poller that fires interrupts when the right Graph pattern is detected. |
| 6 | `/settings/teams` UI card | 1 day | Per-user management of the Teams integration; pause/resume, see signal sources, install link. |
| 7 | Bot JWT signature verification (close v0.1 TODO) | 1 day | Hardening before submission. Currently relies on tenant allow-list as second-layer auth. |
| 8 | Admin dashboard at `/admin/teams/[tenantId]` | 2 days | What an IT admin sees post-install. Seat usage, opt-in rate, interrupt class breakdown. |
| 9 | Trust Center page at `/trust` | 1 day | AppSource certification soft-requirement. Privacy summary, data retention, deletion path, certifications status (SOC2/HIPAA stance honest). |
| 10 | AppSource listing copy + screenshots | 2 days | Listing content, including the 5+ screenshots Microsoft requires (1280×800). |
| 11 | Certification self-attestation + Microsoft 365 Certification application | 3 weeks calendar | The actual submission process. Microsoft 365 Certification is more rigorous than the standard publisher attestation; if budget allows, target M365 Certified for trust signal. |

**Realistic path to AppSource listing live:** 4-6 weeks if Microsoft
365 Certification is targeted, 2-3 weeks if Publisher Attestation only.

---

## 2. The 4 interrupt classes (the differentiation)

Every other Teams productivity bot does generic nudges. COYL ships
four archetype-aware interrupt classes that no competitor has.

### 2.1 Focus Defender

- **Target archetype:** The One-More-Tabber (tab drift kills focus)
- **Signal:** Calendar event tagged with focus/deep-work category in
  the next 15 minutes
- **Primary CTA:** "Protect the block" — silences Teams notifications
  + auto-declines incoming meeting invites for the duration
- **Why it ships first:** the lowest-friction Graph integration
  (read-only Calendar.Read.Shared scope), and the only one that
  doesn't require an outbound write back to Microsoft 365.

### 2.2 Follow-Through Pinger

- **Target archetype:** The 9 PM Negotiator + The Spiral Extender
- **Signal:** Outbound email to a ranked-important contact with no
  reply 48+ hours later
- **Primary CTA:** "Draft a reply" — opens the user's mail app with a
  pre-filled draft; COYL provides the opening line from the original
  promise context
- **Graph requirement:** Mail.Read + Mail.Send (delegate). Send is
  optional; "Open in Outlook" works on read-only too.

### 2.3 Meeting Decliner

- **Target archetype:** The Capitulator (folds under social pressure)
- **Signal:** Calendar density > 70% × 3 consecutive days
- **Primary CTA:** "Show the candidates" — surfaces 2-3 meetings on
  tomorrow's calendar that can be declined without consequence
  (optional invitees, status meetings, meetings where the user wasn't
  a speaker in the last three occurrences)
- **Graph requirement:** Calendar.Read.Shared + Calendar.ReadWrite
  (delegate, decline-only path)

### 2.4 Recovery Coach

- **Target archetype:** The Deserver (reward script fires after hard
  windows)
- **Signal:** Three+ consecutive meetings tagged as "important" or
  "executive" just ended AND the user has ≥5 minutes before next
  event
- **Primary CTA:** "Take 60 seconds" — opens a guided breath / stretch
  / reframe inside the bot conversation
- **Graph requirement:** Calendar.Read.Shared only

---

## 3. Tenant onboarding flow (already live)

1. IT admin clicks "Add COYL to Teams" on `/pricing` or `/teams`
2. Redirect to Azure AD admin-consent endpoint with COYL Bot App ID +
   `?state=clerkId:nonce`
3. Admin approves → Microsoft 302s back to `/api/v1/teams/install`
   with `tenant`, `admin_consent=true`, `state`
4. `provisionTeamsWorkspace()` creates the `TeamsWorkspace` row
5. Admin bounced to `/clinician/onboarding` to finish COYL-side
   configuration (default plan, SCIM toggle, etc.)
6. End users install the app from the Teams App Store (after AppSource
   listing) OR via admin push (Teams Admin Center)

---

## 4. Pricing (Microsoft channel)

> **Naming note: use "per-seat" or "per-user-per-month (PUPM)" in
> the Microsoft channel, NOT PMPM.** PMPM is healthcare/benefits
> jargon and signals the wrong audience to IT/CTO buyers. See the
> "PMPM rename" section below for the broader cleanup.

| Tier | Per seat / month | Includes |
|---|---|---|
| Team (1-50 seats) | $9 PUPM | All 4 interrupt classes, personal dashboard, Graph signals |
| Workspace (51-500 seats) | $7 PUPM | + team aggregate dashboard, SCIM, admin console |
| Enterprise (500+) | Negotiated | + white-label, dedicated CSM, custom interrupt classes |

Billing: monthly or annual through Microsoft Commercial Marketplace
(Microsoft takes ~3% transaction fee) OR direct via Stripe with
purchase-order support for enterprise.

---

## 5. PMPM vs PUPM — the rename

COYL's site currently uses "PMPM" (Per Member Per Month) across
`/teams`, `/work`, `/clinician`, and the `PMPMCalculator` component.
That's correct for two audiences:

- **Healthcare buyers** (clinics, health plans, self-funded employers
  buying COYL as a benefit). PMPM is their lingua franca because it
  signals "this is a benefits/wellness product priced in the way
  insurance products are priced."
- **Benefits administrators** at Fortune-500 HR teams. Same reasoning.

But PMPM is **wrong** for:

- **Microsoft AppSource + Viva ISV channels.** IT buyers don't have
  the PMPM vocabulary. They expect "per seat" or "PUPM."
- **Pure-tech enterprise buyers** (engineering org leaders, CTOs).
  PMPM reads as healthcare jargon and triggers HIPAA-adjacent
  friction they don't want.
- **General consumer audiences.** Confusing — "Per Member Per Month"
  in B2C context creates the wrong mental model.

**Recommendation:**

1. Keep PMPM language on `/clinician` and any healthcare-buyer
   surface. It's correct there.
2. Switch `/teams` and `/work` (employer/IT audience) to "per seat"
   or PUPM. Rename the `PMPMCalculator` component to
   `SeatPricingCalculator` and refactor copy.
3. On AppSource and Microsoft channel materials, never use PMPM.
4. The pitch deck (`docs/pitch/seed-deck.md`) should clarify which
   channel uses which framing — investors will ask.

A scoped rename PR can flip the workplace surfaces in one focused
commit when bandwidth opens up. Until then, the duality is honest:
COYL prices PMPM for healthcare, per-seat for IT.

---

## 6. Honest probability bands (recap from the Viva strategy
   conversation, for traceability)

| Outcome (12-18 months) | Probability | Realistic ARR contribution |
|---|---|---|
| Microsoft for Startups acceptance | 85-95% | $5-150K credits + distribution access |
| AppSource listing live | 70-80% | $0-500K Y1 (depends on 0.5-3% Marketplace install→paid conversion) |
| Viva ISV Partner badge | 50-65% | Distribution + co-marketing |
| Direct partnership with Viva PM team | 20-35% | Strategic value, not ARR |
| Strategic acquisition offer from Microsoft | 5-15% | $50-200M depending on traction proven |
| OEM revenue share at $2-4 PMPM × 1M+ seats | <3% | Not how Microsoft buys |

**The honest read:** Viva is real distribution, modest near-term
revenue, optional acquisition upside. The four-card Teams app
shipping today is the credible foundation. The deepening (Graph,
admin console, M365 Certification) is what converts the foundation
into actual distribution.

---

## 7. Next-90-days operational checklist

- [ ] Apply to Microsoft for Startups (https://startups.microsoft.com)
- [ ] Register the Azure AD app for the COYL Teams Bot
- [ ] Generate color + outline icons (192×192, 32×32)
- [ ] Fill `REPLACE_WITH_AZURE_AD_APP_ID` in
      `apps/web/public/microsoft-teams/manifest.json`
- [ ] Sideload manifest into a test Teams tenant; verify the 4
      interrupt classes render correctly
- [ ] Build the Microsoft Graph integration (calendar read first,
      email second)
- [ ] Wire `/api/cron/teams-graph-pull` to fire interrupts on
      detected signals
- [ ] Build `/settings/teams` UI card
- [ ] Build `/trust` page (compliance posture summary)
- [ ] Capture 5+ screenshots for AppSource listing
- [ ] Write AppSource listing copy (short description, full
      description, keywords, support contact)
- [ ] Submit to Microsoft 365 Certification track (or Publisher
      Attestation if timeline-constrained)
- [ ] After listing live: ask Microsoft for Co-Sell Ready status
- [ ] After Co-Sell Ready: warm-intro to the Viva product team

---

## 8. Author + handoff state

- **Drafted by:** COYL founder + engineering scaffolding.
- **Owns next step:** the Azure AD app registration is a 1-day
  unblock — the founder can either do it solo (Microsoft docs at
  https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant)
  OR pair with a Microsoft for Startups onboarding engineer once MFS
  acceptance lands.
- **Until shipped:** the marketing pages claiming Teams integration
  (`/teams`, `/work`) should soften from "ships inside Teams" to
  "Teams app v0.2, AppSource listing coming Q3 2026" — the manifest
  exists but isn't installable from the Teams app store yet.
