# Apple Health Featured — Pitch Packet

> The materials for pitching the Apple Health & Wellness editorial team
> for Featured placement (Health tab, Mental Wellness collection, App
> Store editorial). Read once. Send as-is. Six tightly written pages.
>
> Author: Iman Schrock · iman@coyl.ai · coyl.ai
> Last updated: May 2026 · Confidential — Apple distribution only

---

## Cover letter (page 1)

Subject — _The behavioral interface layer for AI, built on HealthKit_

To the Apple Health & Wellness editorial team:

COYL is the behavioral interface layer for AI — the first product
designed to fire interventions in the three seconds between intention
and action. We built it on HealthKit as the primary signal substrate.

Why this matters for Apple Health: HealthKit is the unique enabler.
No other behavioral app reads HRV, accelerometer, sleep stages,
sedentary duration, and workout context as a multivariate signal
stack the way COYL does. The platform makes the product possible.
Without HealthKit, the prediction window collapses; with it, COYL
becomes the first consumer product that fires _before_ a user breaks
a commitment they made to themselves — not the morning after.

We see four Apple Health surfaces where COYL fits the editorial
brief and the merchandising strategy:

1. **Featured tab — Health category.** Best-in-class HealthKit
   integration, novel use of platform capabilities, demonstrable
   user outcomes, design excellence, privacy-first architecture. We
   address each criterion in this packet.
2. **Mental Wellness collection.** COYL is adjunctive, not
   substitutive. Pattern interrupt is a category Apple has not yet
   featured because no product had built the surface. We built it.
3. **Apple Watch + Health stories** (when WatchOS 11 app ships
   Q3 2026). The Watch is the highest-fidelity signal source for
   pre-behavioral interrupt; haptic delivery is the right modality.
4. **GLP-1 / weight-management editorial.** 10M+ US patients on
   GLP-1 receptor agonists; 60–80% regain weight within two years
   of discontinuation. The behavioral relapse-prevention gap is a
   timely editorial angle and a category Apple Health can shape.

We'd value 30 minutes with the Apple Health editorial team to walk
through the build and demo on a physical device.

Sincerely,

Iman Schrock
Founder, COYL
iman@coyl.ai · coyl.ai · linkedin.com/in/imanschrock

---

## Product overview (page 2)

### What COYL is

A behavioral pattern-interrupt system. Detects the user's mapped
danger windows from passive signals + logged history, fires a state-
matched intervention in the three-second window between trigger and
action, and runs a same-night recovery flow if the user slips
anyway. Built first for the GLP-1 maintenance gap; expandable to
procrastination, doom-scrolling, impulse spending, and any
compulsive autopilot loop.

### The 6 archetypes

Every user is mapped into one of six behavioral archetypes during
the 60-second audit on coyl.ai/audit:

1. **Night Fridge Saboteur** — late-evening eating cluster, often
   stress-mediated, post-9 PM window
2. **Doom-Scroll Drifter** — phone-locked attention loop, late-day
   collapse, sleep displacement downstream
3. **Procrastination Loop** — high-stakes task avoidance, tab-switch
   frequency predictive, mid-day collapse
4. **Impulse Spender** — cart-completion cluster on phone, often
   tied to mood-state windows
5. **Reactive Communicator** — dating-app + DM-message regret
   cluster, often late-night
6. **Doom Drinker / Substance Loop** — context-specific use cluster,
   often Friday + Sunday-night anxiety

The archetype is the read; the danger window is the time; the
intervention is the write.

### The 3 intervention modes

| Mode | When it fires | Modality |
|---|---|---|
| **Pre-window push** | 5–15 min before the user's mapped danger window | iOS push, Web Push, SMS, Watch haptic (V0.2+) |
| **In-window Live Activity** | While the user is inside the predicted window | Lock-screen Live Activity with two action buttons: "Pulled through" / "Need rescue" |
| **Post-slip recovery** | Same-night, ≤ 90 min after a logged slip | In-app rescue flow, no Monday-reset framing, 1-day grace on streaks |

### The Live Activity lock-screen experience (V0.2)

ActivityKit + App Intents shipping in V0.2 (Q3 2026). The Live
Activity is the single most novel use of iOS 17 capability in the
behavior-change category. It places a persistent, glanceable
intervention surface on the lock screen during the user's mapped
window — no app open required, single-tap action, sub-second logging.

### HealthKit read scopes used + why

| Scope | Why we read it |
|---|---|
| `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | Primary stress + arousal signal; deviation from rolling baseline is the strongest pre-behavioral predictor in our model |
| `HKQuantityTypeIdentifierHeartRate` | Co-signal with HRV; resting vs. active classification |
| `HKQuantityTypeIdentifierStepCount` + activity samples | Sedentary-duration signal; long stationary blocks predict night-fridge cluster |
| `HKCategoryTypeIdentifierSleepAnalysis` | Sleep-debt signal; under-slept users show 2.3× higher slip rate |
| `HKWorkoutType` | Workout-context window; post-workout cravings cluster is mapped per-user |
| `HKCategoryTypeIdentifierMindfulSession` | Recovery proxy; mindfulness-after-slip predicts faster bounceback |

We request the minimum scope set required to make the prediction
work. No write scopes are requested in V0.1; V0.2 ships an optional
`HKCategoryTypeIdentifierMindfulSession` write for the post-slip
recovery flow, with explicit per-event consent.

### iOS 17.0+ requirement justification

The Live Activity surface (ActivityKit) requires iOS 16.2+. The
App Intents action buttons on the Live Activity require iOS 17.0+.
The Watch complication relay layer assumes WatchOS 10.0+. Bumping
the minimum to iOS 17.0+ unlocks the single feature that
differentiates COYL from every other behavior-change app: the lock-
screen Live Activity with one-tap interrupt resolution.

---

## Why COYL matches Apple Health editorial criteria (page 3)

Apple Health editorial reviews against five criteria. We address
each directly.

### 1. Best-in-class HealthKit integration

- HRV is the primary read; we run a per-user rolling baseline
  computed on-device and detect deviation in the 3–5σ band as the
  pre-window signal
- The multivariate model fuses HRV + step count + sleep + workout
  context + (V0.2) Watch motion to produce a confidence-gated
  firing decision
- No other behavior-change app in the App Store reads this many
  HealthKit scopes for this specific decision — we cross-checked
  against the top 25 apps in the Health and Mental Wellness
  categories in April 2026
- Apple Watch complication shipping V0.2; surfaces today's window
  state directly on the watch face

### 2. Novel use of platform capabilities

- **ActivityKit Live Activities for pre-behavioral interrupt** is
  a use of the API that no other app in the Health category ships
  today. Live Activities are commonly used for delivery tracking,
  sports scores, and ride-share — using them as a behavioral
  intervention surface is a category-creating use of the API
- App Intents lock-screen action buttons let the user resolve a
  pattern interrupt without opening the app (single tap on lock
  screen, sub-second log)
- HealthKit background delivery + observer queries enable the
  prediction loop to run with sub-2% daily battery cost on the
  user's behalf
- WatchOS 10 standalone app (V0.2) authenticates via
  WatchConnectivity and runs HKObserverQuery on the wrist directly

### 3. Demonstrable user outcomes

- A 12-week IRB-pathway-mapped randomized study is in setup with a
  partner clinic; primary endpoint is differential weight regain at
  +90 days post GLP-1 discontinuation between COYL + standard care
  vs. standard care alone (N = 80, full protocol at coyl.ai/clinical-study)
- Interim N = 1000+ pilot user metrics will be available before
  the V0.2 App Store submission (placeholder for the live numbers;
  to be appended before Apple call)
- Self-reported same-night recovery rate (slip → 3-action recovery
  completed within 24 h) is the most reported quantitative outcome
  in pilot user feedback
- We will share the de-identified outcome dataset under DUA with
  Apple Health editorial on request, in conformance with the study
  publication plan

### 4. Design excellence

The COYL visual system is built on three discipline rules:

- **Cream canvas + Instrument Serif display + signature orange
  accent.** The cream + Instrument Serif lockup is editorial; the
  orange (`#ff6600`) is single-use, primary-action only. No third
  brand color. Every page reads as either a brochure (marketing
  surface) or a cockpit (app surface) — never both.
- **Reference examples:** the homepage (coyl.ai), the
  /how-coyl-knows-you interactive page that walks the user
  through the signal stack and the prediction window, and the
  /psyche page that frames the category claim.
- Apple's HIG is followed throughout the iOS app: dynamic type,
  reduced motion respect, dark mode parity, semantic SF Symbols,
  no custom hamburger menus, no skeuomorphic gradient stacks.

### 5. Privacy-first architecture

- **On-device inference for the pre-window prediction.** The
  HealthKit rolling baseline + deviation detection runs locally on
  the user's iPhone — no raw HRV samples leave the device
- **BAA-covered cloud for the model + outcome data.** Supabase
  Postgres under BAA; all PHI flagged per HIPAA Safe Harbor
- **No PII leaves the device for ML training.** Model updates use
  de-identified slip events keyed to a study ID; on-device
  inference for the per-user baseline
- **Full data export** via the in-app account screen + API
  endpoint; the user can take their data with them at any time
- **No third-party advertising SDKs.** No Meta SDK, no Google
  Analytics on the iOS surface; first-party telemetry only
- **GDPR-compliant** for EU users, with the EU residency option
  shipping V0.3

---

## Demo script — 5 minutes (page 4)

A live demo for the Apple Health editorial team. Founder is on the
call, physical iPhone in hand, screen-sharing the device.

### Minute 1 — The 60-second audit

- Open coyl.ai/audit on the founder's actual iPhone
- Walk through five questions (60 seconds end-to-end)
- Show the founder's actual archetype output (founder is a
  Procrastination Loop with a late-afternoon collapse window)
- Show the danger-window map populated immediately from the audit

### Minute 2 — The Live Activity firing on the lock screen

- Physical device is locked; demonstrate the simulated pre-window
  push fire (the engineering team has a `?force=true` query
  parameter that fires the next decision immediately for demo
  purposes)
- Lock-screen Live Activity appears with the cream/orange treatment
- Tap "Pulled through" — sub-second log, Live Activity collapses to
  a confirmation state, returns to clock
- Tap "Need rescue" alternate path — opens app to /rescue with
  3-action recovery flow

### Minute 3 — The HealthKit data-flow inspector

- Open the in-app /settings/health-debug screen
- Show the signal cluster captured at the moment the decision fired:
  current HRV (with the rolling-baseline delta), step count for the
  last 90 min, sleep debt from last night, workout context, and the
  computed confidence band
- Show the model's gating threshold (confidence ≥ 0.62 for fire,
  below that defer)
- Demonstrate that no raw HealthKit samples are POSTed off-device —
  only the boolean fire/defer decision and the user's resolution

### Minute 4 — The recurring brand anchor + the daily-number mechanic

- Open /today on the iPhone
- Show the recurring brand-anchor module (single sentence, cream-on-
  cream, that reminds the user of the rule they committed to)
- Show the daily-number mechanic — the "Wrapped"-style daily score
  the user can share to social: pattern catches, recovery time,
  current streak with the 1-day grace already factored in
- Demonstrate the Apple Watch complication preview (V0.2): the
  user's window state surfaced on the watch face directly

### Minute 5 — The HealthKit closing loop

- Show the in-app weekly summary screen rendered as a HealthKit-
  native chart (HRV trajectory + slip events overlaid)
- Demonstrate the BAA + DUA disclosure surfaces, the data-export
  endpoint, and the account-deletion flow (App Store guideline
  5.1.1(v) compliance shipped)
- Close with the Mental Wellness collection fit: "Pattern interrupt
  is adjunctive to therapy + meditation + clinical care. We are not
  replacing any of those. We are filling the gap that none of them
  can fill — the moment itself."

---

## Press + traction one-pager (page 5)

### Founder

**Iman Schrock** — founder, COYL. Shipping daily.
LinkedIn: linkedin.com/in/imanschrock
Email: iman@coyl.ai

### Capital raised

[Placeholder — append when applicable. Current state: $4–6M Seed
round active at $20–30M pre-money valuation. Strategic angels from
Hims, Ro Body, Calibrate, Noom alumni in conversation.]

### User count

[Placeholder — append the live n when ≥ 1000. Current state at
draft: pilot cohort actively onboarding. The number will be added
to this packet before the Apple call as a clean, defensible
figure with the caveat that headline counts can mislead in early-
stage products.]

### Press hits

[Placeholder — append when applicable. Initial press kit cycle
scheduled for Q3 2026 (see `docs/outreach/press-kit-editorial.md`).
Tier-1 targets: Bloomberg, NYT, The Verge, Wired, WSJ, MIT
Technology Review.]

### Notable advisors + clinical board

[Placeholder — append as advisors confirm publicly. Active
recruitment: obesity-medicine MD-PhD with prior GLP-1 RCT
experience for clinical PI; ex-Apple Health product partner-
engineering operator for the platform side; ex-Noom clinical
operations lead for B2B GTM.]

---

## The ask (page 6, part 1)

Four specific asks from the Apple Health editorial team:

1. **A 30-minute call** with the Apple Health editorial team to
   walk through the build and demo on a physical device
2. **Beta access invitation list** for any Apple Featured pre-
   program that exists for Health-category apps — we'd value being
   on the radar before V0.2 ships
3. **Feedback on the V0.2 Live Activity implementation** before
   App Store submission. We'd rather catch HIG concerns from Apple
   directly than discover them in a review reject cycle
4. **Co-marketing exploration** if Apple sees the fit. We are not
   asking for it; we are leaving the door open. If COYL is a fit
   for a Mental Wellness story or a Health-category Featured slot,
   we'd organize whatever launch cadence Apple wants.

Not asked: exclusivity, M&A discussions, paid placement. The
packet is editorial, not commercial.

---

## Apple-team contact strategy (page 6, part 2)

Four channels in priority order. Founder action items.

### Channel A — Warm intro via ex-Apple operators

Highest-conversion route. Founder action:

- LinkedIn search: `ex-Apple AND ("Health" OR "Watch" OR "Editorial")`
  in second-degree network; pull top 20 within 2 degrees
- Send 5 personalized notes per week (script: "I'm building the
  behavioral interrupt layer on top of HealthKit. Apple Health
  editorial should see this before V0.2 ships. Could you point me
  at the right person internally — partner engineering or
  editorial? No ask beyond the intro.")
- Track in a single CSV: name, last role at Apple, intro target,
  status

### Channel B — Apple Developer Relations submission via dev portal

Slowest but most legible route. Founder action:

- Submit COYL to the App Store editorial team via the official
  nomination form: https://developer.apple.com/contact/app-store/
- Subject: "Mental Wellness / Health category nomination — COYL"
- Include: this packet (PDF), the V0.2 TestFlight build link, the
  /how-coyl-knows-you interactive demo link, and the founder's
  direct email
- Follow up at 14 days if no reply; do not pester past 30

### Channel C — App Store editorial nomination flow

The annual nomination window for App Store editorial collections.
Founder action:

- Calendar reminder for the annual cycle (Apple announces the
  window via Developer News; we watch for it)
- File the nomination within the first 72 hours of the window open
- Pair with a press cycle aligned to the same week (see press-kit
  doc) — Apple editorial is more receptive to apps with concurrent
  editorial press
- Specific collections to nominate for: Mental Wellness,
  Behavioral Health, GLP-1 / Weight Management, Best of [Year]

### Channel D — WWDC + DT&E networking

The long game. Founder action:

- Attend WWDC in person (if invited); apply for the WWDC
  Scholarship Lab session on HealthKit if it runs that year
- Connect with the Design + Technology & Engineering (DT&E) team
  in the labs sessions — they review HIG conformance and can
  surface us to editorial via internal channels
- Apple Watch developer community: file a labs session request
  for the WatchKit + ActivityKit team specifically; the V0.2 Live
  Activity is the work we'd want their review on

---

## Appendix — Source materials linked

- Homepage + audit: https://coyl.ai/audit
- The signal-stack interactive page: https://coyl.ai/how-coyl-knows-you
- The category-claim page: https://coyl.ai/psyche
- The /today operational surface: https://coyl.ai/today (auth gated)
- The Behavioral Interrupt Protocol v0.1 spec: https://coyl.ai/protocol
- The clinical study protocol: https://coyl.ai/clinical-study
- Founder LinkedIn: https://linkedin.com/in/imanschrock
- Press inquiries: press@coyl.ai
- Founder direct: iman@coyl.ai

---

*Apple Health Featured pitch packet — May 2026. Confidential.
Distribution: Apple Health editorial team, Apple Developer
Relations, ex-Apple intro channels under NDA. Not for press.*
