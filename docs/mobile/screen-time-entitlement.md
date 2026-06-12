# Screen Time Interception — Founder's Entitlement Playbook (Edge Layer 4)

This is the playbook for shipping COYL's Screen Time interception: what it
unlocks, how to get Apple's gated entitlement, and how to wire the build once
granted. The JS scaffold (`lib/screen-time-interception.ts`) and the config
plugin (`plugins/with-screen-time.ts`) are already in the repo. The entitlement
and the native Swift extension are the remaining gated pieces.

---

## (a) What this unlocks for COYL

The literal product promise of Layer 4:

> **The user opens DoorDash at 11:42 PM — inside a declared danger window — and
> COYL catches it at the OS level: the app is shielded, or a COYL interrupt
> notification fires, before the order happens.**

No other layer can do this. Server push (Layer 1) and on-device scheduled
check-ins (Layer 2) fire on a *schedule* — they can say "you're entering a risky
window," but they cannot react to the *specific act* of opening a specific app.
HealthKit sensing (Layer 3) sees physiology, not app launches. Only Apple's
Screen Time stack can intercept the app-open itself.

Apple's Screen Time stack is three frameworks, used together:

| Framework | Role in COYL |
| --- | --- |
| **FamilyControls** | Authorization. The user grants COYL permission to monitor/shield their own device (`.individual` authorization). |
| **DeviceActivity** | Monitoring. A `DeviceActivityCenter` arms a schedule per danger window; a `DeviceActivityMonitor` app extension wakes on the OS's clock and on threshold events — no JS process needs to be alive. |
| **ManagedSettings** | The reaction. A `ManagedSettingsStore` applies a shield (a system overlay over the app) — or the extension fires a local notification instead, for a softer "caught me" nudge. |

All three are unlocked by a single entitlement:
**`com.apple.developer.family-controls`**.

---

## (b) Getting Apple's entitlement — the application

### The gate

`com.apple.developer.family-controls` behaves in two modes:

- **Development:** works with a normal team/provisioning setup. You can build
  and run on a real device (the simulator does **not** support Screen Time) and
  fully test the extension. No Apple approval needed.
- **Distribution (TestFlight / App Store):** **requires an explicit grant from
  Apple.** Until granted, any distribution provisioning profile that includes
  this entitlement will **fail to sign** — which means the **EAS build fails**.
  This is exactly why `with-screen-time.ts` is NOT registered in `app.json`
  yet: registering it before the grant breaks distribution builds.

### Where to apply

Apply through Apple's Family Controls distribution entitlement **request form**,
reachable from the developer site:

- Apple Developer → **Support → Contact → development/technical** path, or
  directly via Apple's **Family Controls (Distribution) request form** at
  `developer.apple.com/contact/request/family-controls-distribution`.

(If the exact URL has moved, search Apple Developer for "Family Controls
distribution request" — Apple gates this entitlement specifically and publishes
a dedicated request form for it.)

### Who must submit

The **Account Holder** of the Apple Developer Program membership. Admins and
other roles cannot request this entitlement — Apple ties the Family Controls
distribution grant to the legal account holder. Make sure whoever submits is
signed in as the Account Holder.

### What to write — draft justification (copy/adapt verbatim)

Apple's #1 rejection cause is sounding like a **parental-control / monitor-
others** app. COYL is the opposite: the user monitors and shields **their own**
device, by their own consent, for behavioral self-regulation. Lead with that.

> **App name:** COYL
>
> **What the app does:** COYL is a behavioral self-regulation app. It helps a
> user reduce their own compulsive or self-harmful behaviors (e.g. late-night
> impulse ordering, doomscrolling) by letting them define personal "danger
> windows" and choose which of their own apps to shield or be nudged away from
> during those windows.
>
> **How we use Family Controls / DeviceActivity / ManagedSettings:** With the
> user's explicit consent, the user authorizes COYL via FamilyControls
> (`.individual` authorization — the user authorizes monitoring of *their own*
> device, not another person's). COYL uses DeviceActivity to monitor the user's
> own app usage against schedules the user themselves configured, and
> ManagedSettings to shield the user's own selected apps (or fire a local
> notification) when the user opens one of those apps inside a window the user
> defined.
>
> **Who is monitored:** The user, and only the user, on their own device. COYL
> is **not** a parental-control product and does **not** monitor, manage, or
> report on any other person. There is no guardian/child relationship, no remote
> management, and no second party. All shielding is self-imposed and
> user-revocable at any time.
>
> **Why we need the distribution entitlement:** This functionality is the core
> of the product's value — catching the impulsive app-open at the OS level is
> something no API other than Screen Time can do — and we need to ship it via
> TestFlight and the App Store to real users.

Tailor the app description to COYL's current App Store positioning, but keep the
three load-bearing claims intact: **own device, by consent, not parental
control of others.**

### Expected timeline

Apple's Family Controls distribution grant is a manual review. Plan for roughly
**1–3 weeks**; it can be faster, and it can stall if Apple asks follow-up
questions. Treat it as a **blocking dependency for the Layer-4 release** and
submit early — well before you intend to ship the interception feature.

### Common rejection reasons (and how this draft pre-empts them)

1. **Reads as a parental-control / employee-monitoring app.** → The draft
   states "not parental control," "own device," "no second party" explicitly.
2. **Unclear that it's self-monitoring by consent.** → "`.individual`
   authorization," "user-revocable," "self-imposed."
3. **Family Controls used as a feature gimmick, not core value.** → The draft
   ties it to the core promise (catch the app-open at the OS level).
4. **Submitted by a non–Account-Holder.** → Confirm the submitter is the
   Account Holder before sending.
5. **Vague on which frameworks and why.** → The draft names FamilyControls,
   DeviceActivity, ManagedSettings and the exact role of each.

---

## (c) Build wiring — once Apple grants the entitlement

### 1. Register the config plugin (the one-line change)

Add this single entry to the `expo.plugins` array in `apps/mobile/app.json`:

```jsonc
"./plugins/with-screen-time"
```

That registers `plugins/with-screen-time.ts`, which adds
`com.apple.developer.family-controls = true` to the iOS entitlements on the next
`expo prebuild`. **Do this only after the grant lands** — earlier, it breaks
distribution signing.

Then regenerate native projects:

```bash
npm --prefix apps/mobile run prebuild -- --clean
```

### 2. Add the native Swift DeviceActivityMonitor extension

The interception itself is native Swift and cannot be expressed in JS or
synthesized by `expo prebuild`. You add a new **app-extension target** in Xcode
(or carry it in an **EAS custom build** that includes the extension target — the
extension must be part of the same build that EAS signs). The named pieces:

- **Extension target:** a *Device Activity Monitor Extension* target (a
  `DeviceActivityMonitor` subclass). This is the process the OS wakes — it runs
  even when the main app is closed.
- **`DeviceActivityCenter` schedule per danger window:** the main app (via the
  native module the stub will eventually call) arms one
  `DeviceActivitySchedule` per window, mirroring the `WindowSchedule` shape in
  `lib/screen-time-interception.ts` (`windowId`, local `start`/`end`, `days`).
- **The reaction — `ManagedSettingsStore` shield OR local notification:** inside
  the extension's `eventDidReachThreshold` / `intervalDidStart` callbacks,
  either apply a `ManagedSettingsStore` shield over the selected apps, or post a
  local "caught me" notification. (COYL likely ships the notification first —
  softer, still effective — and offers the hard shield as an opt-in.)
- **Relay back to JS:** the extension writes the event (e.g. via the shared App
  Group, `group.com.coyl.shared`, already set up by
  `with-coyl-live-activity.ts`) so the main app can surface the response and
  POST a `ProductivityEvent` to feed the nightly learners.

### 3. EAS custom build

Because the extension target lives in the native project, you must do an
**EAS custom build** that carries the extension target through to signing
(managed-only prebuilds will not include a hand-added extension). The
distribution profile EAS uses must include the granted
`com.apple.developer.family-controls` entitlement.

---

## Apple reference docs (by name)

- **DeviceActivity** framework — `DeviceActivityMonitor`, `DeviceActivityCenter`,
  `DeviceActivitySchedule`, `DeviceActivityEvent`.
- **FamilyControls** framework — `AuthorizationCenter`,
  `FamilyActivitySelection`.
- **ManagedSettings** framework — `ManagedSettingsStore`, application shields.
- Apple Developer → **Family Controls** entitlement overview and the
  distribution request form.
