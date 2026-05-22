# Army deployment — what shipped, what's deferred, what you do next

> Single source of truth for the 23-agent army deployment across
> Waves 0-5. Read top-to-bottom before touching code.
>
> Generated at the end of the deployment session — May 2026.

---

## What shipped

### Code (apps/web + apps/mobile + apps/extension + apps/safari-extension)

| Wave | What | Commits |
|---|---|---|
| 0 | Schema for 6 new models (SignalCluster, PredictionModel, DailyNumber, RedirectChoice, Pod + PodMember, TeamsWorkspace) + ChallengePodMember rename of legacy collision | `9f0f68e` + `ef66773` |
| 1 | /about + /advisors + /clinical-board pages | `fcbc4bf` |
| 2 | Layer 1 (HealthKit ingestion), Layer 2 (predictive model V0), Layer 3 (intervention router + redirect CRUD), Layer 4 (Self-Trust + Model Snapshot), Provider dashboard, Daily-Number ritual, CGM/Withings/Calendar integrations | `5d68ca9` + `d1e0d28` + `05a62a5` + `70b50de` + `58eebb7` + `d690993` + `aad9562` |
| 3 | iOS native HealthKit bridge + Apple Watch app + Voice mode + Android port + Safari extension | `f5154ce` + `17ccf11` + `5e7ac28` + `a08f58e` |
| 4 | /clinician onboarding + family/couples pods + Teams Bot + Slack adapter + proxy fixes | `9477bdd` + `d0ad7d4` + `791bed0` |
| Live Activity stack (earlier session) | iOS Live Activity native scaffold + Expo bridge + push action buttons + server APNs pipeline + auto-tag interrupt feedback cron | `b284730` + `fc7a9aa` + `d091889` + `c04466e` + `324c63a` |
| Hot consumer scenes (earlier session) | /how-coyl-knows-you + cohort refresh process + page disclaimers | `d01cbc2` + `4230898` + `d5d50d0` |

### Docs (~76,000 words of strategic + technical handoff)

| File | Words | Owner |
|---|---|---|
| `docs/clinical-study/irb-protocol-skeleton.md` | 3,496 | Clinical lead + Found Health PI |
| `docs/clinical-study/irb-submission-checklist.md` | 2,168 | Founder + Found Health |
| `docs/clinical-study/found-health-partnership-operating-doc.md` | 1,832 | Founder + Found Health |
| `docs/ip/provisional-patents/01-behavioral-context-object.md` | 2,904 | IP attorney |
| `docs/ip/provisional-patents/02-multivariate-danger-window-inference.md` | 3,078 | IP attorney |
| `docs/ip/provisional-patents/03-state-matched-intervention-routing.md` | 3,121 | IP attorney |
| `docs/ip/provisional-patents/README.md` | 1,808 | Founder |
| `docs/outreach/apple-health-featured-packet.md` | 2,686 | Founder |
| `docs/outreach/press-kit-editorial.md` | 4,650 | Founder + PR contractor |
| `docs/outreach/bd-script-novo-nordisk.md` | 4,828 | Founder + Head of BD |
| `docs/outreach/bd-script-eli-lilly.md` | 4,880 | Founder + Head of BD |
| `docs/outreach/bd-pharma-strategy.md` | 4,120 | Founder + board |
| `docs/integrations/microsoft-viva-engineering-spec.md` | 4,220 | Microsoft Viva engineering team |
| `docs/regulatory/fda-q-submission.md` | 3,786 | Regulatory consultant |
| `docs/regulatory/510k-pathway-memo.md` | 2,489 | Regulatory consultant |
| `docs/regulatory/breakthrough-device-eligibility.md` | 2,004 | Regulatory consultant + founder |
| `docs/regulatory/regulatory-strategy.md` | 3,891 | Founder + Head of Compliance |
| `docs/finance/data-room-structure.md` | 2,735 | Founder + bookkeeper |
| `docs/finance/capital-allocation-memo.md` | 3,691 | Founder + board |
| `docs/finance/investor-pipeline.md` | 3,649 | Founder |
| `docs/finance/sources-and-uses.md` | 1,456 | Founder |
| `docs/pitch/seed-deck.md` (refresh) | 5,951 | Founder |

---

## What's deferred (founder action required)

### Manual integration the army couldn't safely do

Three files in active use by multiple agents — none of the Wave 2
agents could safely write into them. **You wire these in.**

1. **`apps/web/src/app/(app)/today/today-view.tsx`** — add three components:
   - `<DailyNumberCard />` from `@/components/daily-number/daily-card`
   - `<SnapshotCard />` from `@/components/snapshot/snapshot-card`
   - The existing `<QuickSlipButton />` from `@/components/slip/quick-slip-button` (already added earlier in session)
   
   Suggested order: DailyNumberCard at the top (the day's identity moment), then existing content, then SnapshotCard at the bottom (the long-horizon view).

2. **`apps/web/src/app/(wedges)/audit/audit-view.tsx`** — wire the `<RedirectStep />` component from `@/components/audit/redirect-step` into the post-archetype-reveal flow. The component takes `onComplete(createdIds)` and `onSkip` props. Pass it the user's archetype slug so it pre-populates with the family-specific defaults.

3. **`apps/mobile/app/(app)/_layout.tsx`** — wire:
   - The HealthKit permission interstitial on first cold-start (use `requestHealthPermissions` from `@/lib/health-bridge`)
   - Voice mode bootstrap (`isVoiceAvailable` from `@/lib/voice` to gate the voice settings)
   - Daily-number sync to Watch (`syncDailyNumber` from `@/modules/coyl-watch` after fetching today's number)

### Manual schema migration

Run from `packages/database/`:
```
pnpm prisma migrate deploy
```

This applies migration `20260521010000_phase_1_4_models` which creates: signal_clusters, prediction_models, daily_numbers, redirect_choices, pods, pod_members (NEW shape — challenge_pod_members table renamed from old pod_members), teams_workspaces.

ALSO run the earlier scheduled-interrupts migration if not yet:
```
pnpm prisma migrate deploy
# Applies: 20260520000000_scheduled_interrupts (from earlier session)
# And:     20260521000000_live_activity_registrations
```

### Environment variables to add to Vercel (Production + Preview)

**APNs (Live Activity pushes):**
- `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `APNS_KEY_P8`, `APNS_ENV`

**Third-party data integrations:**
- `DEXCOM_CLIENT_ID`, `DEXCOM_CLIENT_SECRET`, `DEXCOM_REDIRECT_URI`
- `LIBRE_CLIENT_ID`, `LIBRE_CLIENT_SECRET`, `LIBRE_REDIRECT_URI`
- `WITHINGS_CLIENT_ID`, `WITHINGS_CLIENT_SECRET`, `WITHINGS_REDIRECT_URI`
- `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`
- `MS_CALENDAR_CLIENT_ID`, `MS_CALENDAR_CLIENT_SECRET`, `MS_CALENDAR_REDIRECT_URI`
- `INTEGRATION_ENCRYPTION_KEY` (32-byte AES key, base64-encoded — generate via `openssl rand -base64 32`)

**Teams + Slack:**
- `MS_BOT_APP_ID`, `MS_BOT_APP_PASSWORD`, `MS_BOT_TENANT_ID`
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`, `SLACK_BOT_USER_OAUTH_TOKEN`

### Xcode work the army couldn't do

iOS native targets exist as Swift source files but the targets
themselves need to be created in Xcode:

1. **Open `apps/mobile/ios/COYLApp.xcworkspace`**
2. **Create COYLWidget target** (Live Activity widget) — per `apps/mobile/ios/COYLWidget/README.md`
3. **Create COYLWatch target** (Apple Watch app) — per `apps/mobile/ios/COYLWatch/README.md`
4. **Add App Group capability `group.com.coyl.shared`** to: main app + COYLWidget + COYLWatch (all three targets)
5. **Verify build for both Debug + Release** on a physical device (simulator doesn't support Live Activities, Watch needs paired Watch)

### Safari extension submission

Per `apps/safari-extension/README.md`:
1. Xcode → New Project → Safari Extension App
2. Replace auto-generated files with `apps/safari-extension/*`
3. Submit to macOS App Store via Archive → Distribute App
4. **Fill in `REPLACE_WITH_PRODUCTION_LEAF_SPKI_HASH`** in `Info.plist` with the openssl one-liner from the README before archive

### pnpm hoist for mobile dependencies

```
cd apps/mobile && pnpm install
```

After install, two TS errors in `coyl-live-activity/index.ts` + `plugins/with-coyl-health-permissions.ts` should resolve (they currently fail because `expo-modules-core` + `@expo/config-plugins` aren't symlinked into apps/mobile/node_modules yet).

If TS still complains, explicitly add these to `apps/mobile/package.json`:
```json
{
  "dependencies": { "expo-modules-core": "~2.2.3" },
  "devDependencies": { "@expo/config-plugins": "~9.0.0" }
}
```

### Prebuild for Android + iOS

After all the above:
```
cd apps/mobile
expo prebuild --clean
```

This regenerates ios/ and android/ with all the config-plugin
modifications applied (Info.plist permissions, AndroidManifest
permissions, App Group, Live Activity flags, etc.).

---

## What the founder does next (priority order)

### Week 1 (this week)

1. **Today**: Update LinkedIn + Twitter, paste in the `/about` photo at `/founder/iman.jpg`, paste real bio sentence.
2. **Today**: Add the founder photo + LinkedIn URLs to `apps/web/src/app/(wedges)/about/page.tsx`.
3. **This week**: Run `pnpm prisma migrate deploy`.
4. **This week**: Add the env vars above to Vercel.
5. **This week**: Wire the today-view + audit-view + mobile _layout integrations (the three deferred items above).
6. **This week**: Submit IRB protocol to Found Health using `docs/clinical-study/*` — reconcile the N=80 vs N=200 discrepancy in the outreach pitch first.
7. **This week**: Brief an IP attorney with `docs/ip/provisional-patents/*` for 3 provisional filings ($4500-9000 total).

### Weeks 2-4

1. **Open the Series A round** — use `docs/finance/*` + the refreshed `docs/pitch/seed-deck.md`. 30-investor pipeline ready.
2. **Hire CTO + Head of Clinical first** (per `docs/finance/capital-allocation-memo.md`).
3. **Apple Health team outreach** — use `docs/outreach/apple-health-featured-packet.md`.
4. **First pharma BD outreach** — Novo Nordisk first (per `docs/outreach/bd-pharma-strategy.md`).
5. **PR push begins** — pitch first 5 outlets per `docs/outreach/press-kit-editorial.md` (Casey Newton / Sarah Frier / Steven Levy / Will Knight / Olga Khazan).

### Weeks 5-8

1. **Submit FDA Q-Sub** — use `docs/regulatory/fda-q-submission.md`.
2. **Begin RCT enrollment** with Found Health.
3. **Native iOS TestFlight build** with the integrated app.

### Weeks 9-32

Follow the 4-phase 32-week sprint in `docs/pitch/seed-deck.md` Slide 13.5 + the $6B Acquisition Roadmap doc.

---

## Open questions surfaced during the deployment

Across the agents, ~30 founder decisions were flagged. Highest-priority:

1. **N=80 vs N=200 trial design** (IRB agent) — reconcile with Found Health before LOI.
2. **PI selection** — confirm MD vs PhD with Found Health.
3. **BCO taxonomy sizes for patents** (patent agent) — are 6 archetypes + 8 excuses the final production values?
4. **510(k) product code** (FDA agent) — QQR or new code?
5. **510(k) Indications for Use phrasing** (FDA agent) — "during AND after" single indication vs two distinct indications?
6. **BDD framing decision** (FDA agent) — stand down if FDA signals discomfort with "irreversibly debilitating"?
7. **Clinical study primary outcome** (FDA agent) — weight regain vs behavioral mechanism?
8. **Noom Med intelligence** (Pharma BD agent) — do they already have an LOI with Novo or Lilly?
9. **Walk-away floor** (Pharma BD agent) — $4B as drafted, or adjust?
10. **Provider invite flow UI** (Provider agent) — when does the in-app `/provider/invite` get built?

Detailed lists in each agent's commit message + the doc bodies.

---

## The probability-weighted summary

Per `docs/pitch/seed-deck.md` Slide 12 ("Path to $4-6B"):

- **Strategic case ($4-6B, 45% probability)** — Novo OR Lilly acquisition with filed patents + N=80 RCT + first pharma LOI by month 7
- **Base case ($1-2B, 35% probability)** — revenue-based exit with moderate traction
- **Moonshot ($8-10B, 5-15% probability)** — exclusive Novo or Lilly with FDA BDD designation + RCT publication

Probability-weighted EV ≈ **$2.5-3.0B** (more honest than the doc's $4.7B which assumes optimistic gates throughout). On $10M raised at 50% founder ownership post-A: **~$1.25-1.5B EV per founder.** ~120-150x on capital.

The list above is what makes that 45% number real. Every deferred item is a tax on the probability.

---

*Army deployment handoff — May 2026. 23 agents shipped across 5
waves + 31 commits + ~76,000 words of strategic + technical docs.
Codebase pushed to origin/main at HEAD `791bed0`.*
