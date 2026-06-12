# COYL Edge Architecture

The canonical map of COYL's "edge" — the layers that sit between the user's
behavior in the world and COYL's learning loop. Engineers' doc: terse, accurate,
no marketing. For the Screen Time entitlement specifics, see
[`screen-time-entitlement.md`](./screen-time-entitlement.md).

The edge has **four interception layers** (how COYL reaches the user at the
right moment) plus a **Layer 5 outlook** (where on-device inference is going).
Each layer is a different answer to *"how does COYL catch the moment before the
slip?"* — they stack; they don't replace each other.

---

## Layer 1 — Server-push JITAI · LIVE

Just-In-Time Adaptive Intervention, driven from the server.

- Crons evaluate each user's mapped danger windows and fire interrupts. The core
  one is `/api/cron/danger-window-interrupt` (`*/15 * * * *`), which emits a
  `DANGER_WINDOW_CROSSED` event at the user's mapped windows.
- Delivery is **Expo push** (mobile) and **web push** (PWA).
- **Strength:** zero device-side dependencies; works the day a user installs.
- **Limit:** schedule-based, not act-based. It knows the user is *entering* a
  risky window; it cannot see the specific app-open. Network- and
  battery-dependent; a push can be late or dropped.

## Layer 2 — On-device scheduled check-ins · BEING BUILT (parallel)

Local notifications that fire on the device itself, with actionable buttons.

- **Local calendar/notification triggers** mirror each danger window, scheduled
  on-device so they fire even offline / with the app closed — no server round
  trip in the firing path.
- **Notification category actions** let the user respond from the notification
  without opening the app: `caught_me` and `im_good`.
- **Offline-capable:** the trigger is local; responses queue and sync when
  connectivity returns.
- On response, the device POSTs the outcome → a **`ProductivityEvent`** row,
  which feeds the nightly learners (see "the loop" below).
- **Strength:** reliable timing independent of push infra; one-tap response.
- **Limit:** still schedule-based — fires on the clock, not on the act.

## Layer 3 — HealthKit passive sensing · BEING BUILT (parallel)

Physiological signals that precede behavioral autopilot.

- Reads **steps, sleep, heart rate (and HRV)** from HealthKit (iOS) / Health
  Connect (Android) via the native health bridge.
- Writes normalized samples to a **`health_signals`** table.
- **Next consumer:** the **`danger-window-learner`** workflow — it correlates
  these signals with slip timing to sharpen *when* windows should fire (a
  sedentary + poor-sleep evening shifts the predicted window).
- **Hard constraint (NEDA):** **NO body measurements** — no weight, no BMI, no
  body-fat, no calorie/nutrition intake. COYL is used by people in eating-
  disorder recovery; ingesting body metrics is a safety line we do not cross.
  Steps / sleep / HR only.
- **Strength:** sees the body's state, which schedules and app-opens can't.
- **Limit:** passive and probabilistic — a correlate of risk, not the act
  itself.

## Layer 4 — Screen Time interception · THIS SCAFFOLD (entitlement-gated)

OS-level interception of the specific app-open inside a danger window. This is
the only layer that reacts to the **act**, not a schedule or a correlate.

- **The promise:** user opens DoorDash at 23:42, inside a declared window →
  COYL shields the app or fires an interrupt **at the OS level**.
- **Apple stack:** FamilyControls (authorization) + DeviceActivity (the
  monitoring schedule + the `DeviceActivityMonitor` Swift **extension**) +
  ManagedSettings (the shield).
- **What's in the repo now (the scaffold):**
  - `apps/mobile/plugins/with-screen-time.ts` — config plugin that adds the
    `com.apple.developer.family-controls` entitlement. **Not registered in
    `app.json` yet** — registering before Apple's distribution grant breaks EAS
    signing.
  - `apps/mobile/lib/screen-time-interception.ts` — honest JS stub of the
    eventual contract (`requestAuthorization`, `defineWindowSchedule`,
    `onThresholdEvent`); every call throws until the native side lands, so
    product surfaces can be written against a stable shape today.
- **The genuinely-gated pieces (out of scope for the scaffold):**
  1. Apple's `com.apple.developer.family-controls` **distribution entitlement**
     (Account Holder applies; ~1–3 weeks).
  2. A native **Swift `DeviceActivityMonitor` extension** — the actual
     interception cannot run in JS, and `expo prebuild` cannot synthesize the
     extension target. Requires an EAS custom build carrying that target.
- **Strength:** catches the act itself; works with the app closed.
- **Limit:** iOS-gated, manual Apple approval, native extension required.

## Layer 5 — On-device inference · OUTLOOK

Where the intelligence runs, maturing honestly from cloud-now to hybrid-later.

- **Now (cloud):** the deep reasoning — window mapping, weekly learning,
  archetype synthesis — runs server-side against a cloud LLM (Claude). Accurate
  framing: today the learners and the interrupt copy are cloud-generated.
- **Later (hybrid):** push an **instant local pattern-match** onto the device
  using Apple's **Foundation Models framework** (on-device LLM, iOS 18.1+ /
  Apple Intelligence devices). The split we're aiming for:
  - **On-device (Foundation Models):** millisecond "is this moment risky given
    what just happened?" pattern-match — runs in the interception path, no
    network, private by construction.
  - **Cloud (Claude):** the heavy lift — multi-week reasoning, weekly report
    generation, learner training that updates each user's model.
- This is a **maturation, not a rewrite**: the cloud path stays the source of
  truth for deep reasoning; the on-device model is added in front of it for
  latency and privacy in the hot path. Don't claim on-device inference ships
  today — it's the next horizon, gated on the same native-extension work as
  Layer 4.

---

## The loop (data flow)

Every layer feeds one loop. The interception layers are the **schedule →
interrupt → respond** middle; sensing and learning bracket them.

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │                                                                        │
   │   SENSE            SYNC            LEARN           SCHEDULE             │
   │  ┌───────┐       ┌───────┐       ┌───────┐       ┌──────────┐         │
   │  │HealthKit│ ──▶ │ POST  │ ──▶  │ nightly │ ──▶  │ danger    │        │
   │  │ steps   │     │health_ │      │ danger- │      │ windows   │        │
   │  │ sleep   │     │signals │      │ window- │      │ mapped    │        │
   │  │ HR/HRV  │     │ table  │      │ learner │      │ per user  │        │
   │  │(L3)     │     │        │      │ (+cloud │      │           │        │
   │  └───────┘       └───────┘       │  LLM)   │      └────┬─────┘         │
   │                                  └───▲────┘           │               │
   │                                      │                ▼               │
   │                                      │          INTERRUPT             │
   │                                      │      ┌──────────────────┐      │
   │                                      │      │ L1 server push   │      │
   │                                      │      │ L2 local check-in│      │
   │                                      │      │ L4 Screen Time   │      │
   │                                      │      │    OS shield     │      │
   │                                      │      └────────┬─────────┘      │
   │                                      │               ▼               │
   │                                      │           RESPOND             │
   │                                      │      ┌──────────────────┐      │
   │                                      │      │ caught_me/im_good │     │
   │                                      │      │ → ProductivityEvent│    │
   │                                      └──────┤   (the feedback)  │     │
   │                                  LEARN ◀────└──────────────────┘      │
   │                              (next night's run consumes it)           │
   │                                                                        │
   └──────────────────────────────────────────────────────────────────────┘

   sense ─▶ sync ─▶ learn ─▶ schedule ─▶ interrupt ─▶ respond ─▶ learn ↺
```

- **sense** — Layer 3 reads physiology (`health_signals`).
- **sync** — device POSTs signals + check-in responses to the server.
- **learn** — the `danger-window-learner` (cloud LLM today) updates each user's
  window model from `ProductivityEvent` + `health_signals`.
- **schedule** — mapped windows are pushed back to the device (L2 local
  triggers, L4 `DeviceActivitySchedule`s) and to the server crons (L1).
- **interrupt** — L1 / L2 / L4 fire at the window; L4 additionally fires on the
  **act**.
- **respond** — `caught_me` / `im_good` → a `ProductivityEvent`.
- **learn (again)** — the next nightly run consumes those events. The loop
  tightens each night.
