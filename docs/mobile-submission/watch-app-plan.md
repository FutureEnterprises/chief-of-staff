# Apple Watch App — Build Plan

> Per `docs/strategy/product-roadmap-v3.md` §"Gap 4 — Context Portability":
> the phone is the worst place to catch most autopilot scripts. The
> Watch is at the wrist, haptic-first, ambient. **A watchOS app is the
> single biggest off-phone surface opportunity.**

This is NOT shipped yet. This doc is the build plan — what gets built,
in what order, by whom, with what timeline.

---

## Why a separate watchOS app (not a phone-paired widget)

A native watchOS app can:
- Receive its own remote push (independent of iPhone reachability)
- Render rich notifications with custom haptic patterns
- Run background tasks (HealthKit observers, motion sensors)
- Persist user choice locally (acknowledge / dismiss / "this caught me")

A widget extension can only mirror phone state. Insufficient for COYL's
"fire at the moment, before the phone is picked up" promise.

---

## The flow

```
[wrist, 9:47 PM] — passive sensors detect:
   - elevated HR vs. user's baseline
   - sedentary for 90+ min
   - phone screen recently on for 14 min
   - calendar-confirmed stressful day
        ↓
[Apple Watch haptic] — distinctive pattern, configurable
        ↓
[Watch screen wakes] — single line: "This is the moment."
        ↓
[3 actions, single-tap each]
   - "Pulled back"  → logs interrupt, returns to clock
   - "Need rescue"  → opens iPhone to /rescue
   - "Not now"      → 30-min snooze, increments back-off counter
```

The Watch app is **read-only on the data flywheel.** All slip logging,
recovery, rescue conversations happen on the iPhone. The Watch is
purely the haptic interrupt + a one-tap "caught me" signal.

---

## Architecture

```
apps/watch/                                 (new — separate Xcode project)
├── COYLWatch.xcodeproj
├── COYL Watch App Watch App/
│   ├── COYLWatchApp.swift                  (SwiftUI entry)
│   ├── ContentView.swift                   (idle state UI)
│   ├── InterruptView.swift                 (haptic + 3-action UI)
│   ├── HealthSampleObserver.swift          (HR + motion observers)
│   ├── PushHandler.swift                   (APNS handler)
│   └── CoylApi.swift                       (POSTs to coyl.ai/api/v1/*)
├── COYL Watch App Watch AppTests/
└── COYL Watch App Watch AppUITests/
```

Auth: Watch app authenticates by reading the user's session token from
the paired iPhone via `WatchConnectivity` + `WCSession`. The iPhone
COYL app exports the JWT; the Watch app receives it and uses it for
its API calls.

---

## Build sequence

**Phase 1 — Standalone Watch project (Weeks 1–3)**
- New Xcode project, watchOS deployment target 10.0+
- HealthKit + motion entitlements
- Push notification entitlements (separate APNS environment)
- Basic UI: idle → notification → 3-action sheet

**Phase 2 — Push pipeline (Weeks 4–5)**
- Backend: extend `lib/web-push.ts` push-target abstraction to also
  emit APNS direct (we already use Expo Push for the iPhone wrapper,
  but the Watch app needs the device-token route, not Expo's relay)
- Cron update: when firing a danger-window interrupt, send to BOTH
  iPhone (via Expo) AND Watch (via APNS direct) — Watch's haptic is
  the primary signal, phone is fallback
- New API endpoint: `POST /api/v1/user/watch-push-token` to register
  the Watch's device token

**Phase 3 — HealthKit observer + passive signals (Weeks 6–8)**
- Background HKObserverQuery on heart rate (every 30s sample)
- CMMotionActivityManager for activity classification
- Local sliding-window baseline: detect deviation from user's
  3-day moving average
- POST signal events to `/api/v1/health/passive` (new endpoint) which
  feeds the danger-window-learner cron with the new data

**Phase 4 — Submit (Weeks 9–11)**
- TestFlight via shared Apple Developer account
- 5–10 internal testers for 2 weeks
- App Store Review submit (Watch apps reviewed separately from iPhone
  app, even when bundled)
- Approval typically 1–7 days

---

## Why this is 8–12 weeks not 3

The roadmap v3 doc estimates 8–12 weeks. That's accurate. The
breakdown:

- 3 weeks: Xcode project, SwiftUI scaffolding, basic flow
- 2 weeks: Push pipeline (most-underestimated phase — APNS direct is
  different from Expo Push, requires p8 cert + key, different
  failure modes)
- 3 weeks: HealthKit observers + battery optimization (HKObserverQuery
  in a Watch app drains battery fast if not carefully scoped)
- 2 weeks: TestFlight + bug-fix + submit + review

Plus 1 buffer week for the inevitable HealthKit permission UX
iteration.

---

## Cost

- 1 senior iOS engineer × 10–12 weeks = ~$50K of engineering time
- Apple Developer account: already paid (covered by iPhone app)
- Test devices: borrow or 1× Apple Watch Series 9 (~$400)
- TestFlight + App Review: free

---

## Success criteria

Ship when:
1. 95%+ of Watch notifications fire within 60s of the iPhone-side
   cron decision
2. Battery impact <2%/day on average user
3. False-positive rate (interrupt fires but user dismisses with "not
   the moment") <40% in week-2 beta
4. The "Pulled back" tap latency from haptic to log is <1.5s

---

*Watch app plan — Month 8–11 of the product roadmap. Build kicks off
after the browser extension is in stable beta.*
