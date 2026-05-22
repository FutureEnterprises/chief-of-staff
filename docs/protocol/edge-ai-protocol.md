# Edge AI Protocol (EAP) — v0.1 draft

> The bigger sibling of PAP. Where PAP makes LLMs proactive about
> behavior, EAP makes LLMs proactive about ACTION — across every
> device in a user's life.
>
> The category: cross-device LLM coordinator. The moat: nobody else
> can ship it because every device manufacturer is incentivized to
> build vertical (Apple Intelligence, Google Gemini, Microsoft
> Copilot) instead of horizontal.
>
> Status: v0.1 draft for founder + advisor review. Spec is Apache 2.0
> open from publication. Reference engine is COYL Cloud + on-device
> bridges (proprietary).
>
> Author: founder. Date: May 2026.

---

## The insight

**Every device the user owns is already an edge with sensors and
actuators. None of them are addressable as an LLM edge.**

Your iPhone has HRV, accelerometer, mic, camera, screen, haptics,
notifications, speaker, app fleet. Your Apple Watch has HRV, mic,
haptics, complications, Live Activities. Your MacBook has screen,
keyboard, mic, camera, Notifications Center, Shortcuts, AppleScript.
Your Chrome browser has tab control, content access, push, extensions.
Your car (CarPlay / Android Auto) has voice, screen, location,
calendar. Your HomeKit / Matter devices have actuators (lights,
thermostats, locks, speakers).

Each device individually has an SDK. Apple has HealthKit + SiriKit +
App Intents. Google has Health Connect + Actions + Tasker. Browsers
have WebExtensions. HomeKit/Matter have their APIs.

What does NOT exist: **a single protocol where any LLM can subscribe
to events from any device + propose actions on any device + have
those actions be governed by a unified consent layer.**

That's EAP.

If PAP is "OAuth for proactive AI behavior," EAP is "the universal
SDK for cross-device LLM action."

---

## The current state

| Layer | Vertical owner | Cross-vendor reach |
|---|---|---|
| Apple Intelligence | Apple — only Apple devices | None |
| Google Gemini in Android + Workspace | Google — only Google ecosystem | Some — limited |
| Microsoft Copilot | Microsoft — Office + Windows + Edge | Some via Graph |
| Samsung Bixby | Samsung — only Samsung | None |
| ChatGPT Operator | OpenAI — browser-based, no device API | None — pure compute |
| Claude Computer Use | Anthropic — browser-based, no device fleet | None |
| Humane Pin / Rabbit R1 | Dedicated hardware (failed) | N/A |

Every vendor has built their own vertical stack. The user is stuck
choosing: either go all-in on Apple (and lose Gemini access to your
calendar) or all-in on Google (and lose Apple Intelligence on your
Watch) or hold both and accept they don't talk to each other.

**The opportunity is the horizontal:**

A neutral third-party protocol that any device manufacturer can adopt
and any LLM can integrate against. EAP becomes the iOS Shortcuts
equivalent for proactive AI — but cross-vendor, cross-device, and
LLM-initiated rather than user-initiated.

Why now? Because:
- Apple, Google, Microsoft each refuse to support each other's
  ecosystems at the LLM level (antitrust + competitive optimization)
- Foundation labs (Anthropic, OpenAI) don't have device fleets → they
  need a way to reach users across hardware they don't own
- Users have multi-vendor device fleets (62% of iPhone users also
  use a Windows PC; 38% of Pixel users also use a Mac) and want
  AI that works across them
- The first horizontal protocol to ship + get foundation-lab traction
  becomes the standard

---

## The 10 primitives

EAP is a protocol with 10 RPC primitives + a consent layer. All HTTP
JSON (or upgradeable to WebSocket for streaming). Authentication via
OAuth 2.0 + short-lived JWTs.

### 1. Device Registration — `POST /eap/v1/device/register`

When a device first joins a user's fleet, it announces itself:

```json
{
  "deviceId": "iphone-15-pro-abc",
  "userId": "u_xyz",
  "deviceClass": "ios_phone",
  "model": "iPhone 16 Pro",
  "os": "iOS 17.4",
  "manifest": {
    "sensors": ["hrv_proxy", "motion", "location_geofence", "screen_state"],
    "actuators": ["push_notification", "haptic", "voice_tts", "live_activity", "open_url", "open_app_intent"],
    "userGrantedScopes": ["edge:phone:notification", "edge:phone:haptic", "edge:phone:voice"]
  },
  "operationalState": {
    "battery": 84,
    "doNotDisturb": false,
    "foregroundApp": "com.coyl.app"
  }
}
```

Each device class has a standard manifest template. Custom devices
extend the standard.

### 2. Capability Discovery — `GET /eap/v1/devices/:userId`

LLM reads the user's full device fleet + each device's manifest.
Returns:

```json
{
  "userId": "u_xyz",
  "fleet": [
    { "deviceId": "iphone-15-pro-abc", "deviceClass": "ios_phone", "online": true, "manifest": {...} },
    { "deviceId": "watch-series-9-def", "deviceClass": "apple_watch", "online": true, "manifest": {...} },
    { "deviceId": "macbook-pro-ghi", "deviceClass": "macos_laptop", "online": false, "lastSeen": "...", "manifest": {...} },
    { "deviceId": "chrome-jkl", "deviceClass": "browser_extension", "online": true, "manifest": {...} }
  ],
  "aggregatePreferences": {
    "quietHours": [{ "dayOfWeek": -1, "startHour": 23, "endHour": 7 }],
    "preferredModality": "haptic_first",
    "panicSwitch": false
  }
}
```

### 3. Action Request — `POST /eap/v1/action/request`

LLM proposes a single action on a specific device:

```json
{
  "actionId": "a_xyz",
  "llmId": "anthropic-claude-sonnet-3.7",
  "userId": "u_xyz",
  "deviceId": "watch-series-9-def",
  "actuator": "haptic",
  "params": {
    "pattern": "double-tap",
    "intensity": "medium"
  },
  "scopeRequested": "edge:watch:haptic",
  "reasoning": "User HRV spiked 18% in last 90min + entered kitchen geofence at 9:43 PM + has active commitment 'no food after 9'",
  "confidence": 0.83,
  "ttlSeconds": 30
}
```

The user's device-side coordinator (see §6) evaluates and responds:

```json
{
  "decision": "allowed",
  "executionToken": "et_xyz",
  "willExecuteAt": "2026-05-21T21:43:18Z"
}
```

Or:

```json
{
  "decision": "denied",
  "reason": "scope_not_granted",
  "ungrantedScope": "edge:watch:haptic",
  "userPromptedToGrant": "deferred"
}
```

### 4. Cross-Device Orchestration — `POST /eap/v1/orchestration`

LLM proposes a multi-device flow:

```json
{
  "orchestrationId": "o_xyz",
  "llmId": "...",
  "userId": "...",
  "atomicity": "all_or_none",
  "steps": [
    {
      "deviceId": "watch-series-9-def",
      "actuator": "haptic",
      "params": { "pattern": "double-tap" },
      "atOffsetMs": 0
    },
    {
      "deviceId": "iphone-15-pro-abc",
      "actuator": "voice_tts",
      "params": { "text": "Stop. Hand on the counter. 4 breaths. Decide at 9:55." },
      "atOffsetMs": 200
    },
    {
      "deviceId": "macbook-pro-ghi",
      "actuator": "system_dim_screen",
      "params": { "brightnessPct": 30, "durationSec": 60 },
      "atOffsetMs": 200
    }
  ]
}
```

Coordinator evaluates each step independently AND the composite. If
atomicity = `all_or_none`, all steps must be allowed or the entire
orchestration is denied. If `best_effort`, run each independently.

### 5. Sensor Subscription — `POST /eap/v1/sensor/subscribe`

LLM subscribes to a sensor stream:

```json
{
  "subscriptionId": "s_xyz",
  "llmId": "...",
  "userId": "...",
  "deviceId": "watch-series-9-def",
  "sensor": "hrv_proxy",
  "filter": { "deltaPctMin": 15, "directionDown": true },
  "webhookUrl": "https://api.anthropic.com/eap/webhooks/hrv",
  "webhookSecret": "...",
  "rateLimitPerHour": 6,
  "scopeRequested": "edge:watch:read:hrv"
}
```

Device-side daemon evaluates against user scope grants + the filter,
fires webhook when matched.

### 6. Sensor Snapshot — `GET /eap/v1/sensor/:deviceId/:sensor`

LLM reads a point-in-time sensor value (vs. subscribing to a stream):

```json
GET /eap/v1/sensor/watch-series-9-def/location_geofence

→ { "kind": "home", "subRegion": "kitchen", "asOf": "..." }
```

### 7. Action Outcome — `POST /eap/v1/action/outcome`

Triggered by EAP, not the LLM. The LLM subscribed to outcomes via §5.

When an action completes (or fails):

```json
{
  "executionToken": "et_xyz",
  "outcome": "executed",
  "outcomeAt": "...",
  "deviceState": { "userInteracted": true, "interactionLatencyMs": 1200 },
  "userTag": "caught_me"  // optional, if user responded
}
```

### 8. Authorization & Scope Grant — `POST /eap/v1/scope/grant`

User-initiated. The user opens the EAP consent UI on COYL (or any
EAP-compliant consent surface), explicitly grants a scope to an LLM:

```json
{
  "userId": "...",
  "llmId": "anthropic-claude-sonnet-3.7",
  "scope": "edge:watch:haptic",
  "grantedAt": "...",
  "expiresAt": null,
  "revocable": true
}
```

Scope vocabulary (per-device + per-actuator):

```
edge:phone:notification          push notifications on phone
edge:phone:haptic                vibration
edge:phone:voice                 voice TTS through phone speaker
edge:phone:live_activity         live activity on lock screen
edge:phone:open_url              open a URL
edge:phone:open_app_intent       invoke an App Intent
edge:phone:read:location         read geofence-only location
edge:phone:read:hrv              read HealthKit HRV
edge:phone:read:screen_state     read if screen is on/off
edge:watch:haptic
edge:watch:complication_update
edge:watch:read:hrv
edge:laptop:notification
edge:laptop:dim_screen
edge:laptop:do_not_disturb_toggle
edge:laptop:open_app
edge:laptop:run_shortcut
edge:browser:notification
edge:browser:overlay
edge:browser:tab_close
edge:browser:read:active_url
edge:browser:read:tab_count
edge:home:lights_dim
edge:home:do_not_disturb
edge:home:lock_doors
edge:car:voice_announce
edge:car:radio_pause

// Irreversible — NEVER auto-granted, always per-action confirmation
edge:phone:send_message:irreversible
edge:phone:initiate_call:irreversible
edge:phone:purchase:irreversible
edge:phone:money_transfer:irreversible
```

Each scope is granular, revocable, logged in audit.

### 9. Audit Log — `GET /eap/v1/audit`

Every action request + outcome + scope grant + revoke is logged.
User can review at any time, export as JSON, revoke retroactively.

### 10. Panic Switch — `POST /eap/v1/panic`

One-tap, user-initiated. Immediately revokes ALL LLM scopes across
all devices. Sets `aggregatePreferences.panicSwitch = true` for 24h.
During this window, no LLM can fire any action.

Critical for trust. Like the airplane-mode of proactive AI.

---

## The Device Coordinator — the small daemon on each device

Each device runs an EAP-compatible coordinator. It's small (~10K
lines per platform), runs in background, and handles:

1. **Local request evaluation** — reads cached scope grants, rate
   limits, quiet hours; decides locally without round-trip when
   possible.
2. **Action execution** — invokes the platform's native actuator.
3. **Sensor publication** — streams sensor events to EAP cloud
   (which then fans out to subscribed LLMs).
4. **Audit logging** — local log + sync to EAP cloud.
5. **Fallback execution** — if EAP cloud is unreachable, devices
   can still respect cached scope grants + fire local actions.

Per platform:

| Platform | Coordinator implementation | Actuator coverage |
|---|---|---|
| iOS | Native app extension + App Intents | ~60% (Apple restricts a lot) |
| macOS | Menu bar app + AppleScript + Shortcuts | ~80% |
| watchOS | Watch app + WatchConnectivity | ~50% (limited by watchOS) |
| Android | Tasker + custom Service | ~85% |
| Wear OS | Watch app | ~50% |
| Chrome / Edge / Firefox | WebExtension | ~70% (web actuators) |
| Safari | Safari Extension | ~50% (most restricted of browsers) |
| Windows | System tray app + PowerShell + Shortcuts | ~85% |
| Linux | systemd service + dbus | ~95% (most permissive) |
| HomeKit/Matter | Bridge via Homebridge or Matter Controller | Actuator-level only |
| CarPlay/Android Auto | Companion phone app | ~30% (very restricted) |

COYL Cloud + on-device bridges = the reference implementation.
Anyone can build their own coordinator, but COYL's is the canonical
one + the one foundation labs integrate against first.

---

## How EAP relates to other protocols

| Protocol | Scope | EAP relationship |
|---|---|---|
| **MCP** (Anthropic) | LLM → tools/data | MCP is for SOFTWARE tools. EAP is for HARDWARE devices. Complementary. |
| **PAP** (COYL — earlier doc) | LLM → behavioral interventions | PAP is a subset of EAP. PAP focuses on behavioral state interventions; EAP is broader (any cross-device action). PAP can be reimplemented on top of EAP. |
| **BIP** (COYL) | Behavioral context primitives | EAP extends BIP. BIP defines the behavioral context object; EAP defines what to DO with it across devices. |
| **A2A** (Google) | Agent-to-agent | Different scope. A2A is for agents talking to each other. EAP is for agents talking to devices. |
| **iOS Shortcuts / Tasker** | User-defined automations | EAP adopts these as actuators. An EAP action can invoke a Shortcut. |
| **HomeKit / Matter** | Smart-home device control | EAP adopts these as actuators. An EAP action can dim HomeKit lights. |
| **WebExtensions** | Browser extensions | EAP browser coordinator IS a WebExtension. |
| **App Intents** (iOS) | iOS app-level actions | EAP iOS coordinator invokes App Intents. |

EAP doesn't replace any of these. EAP UNIFIES them under a single
protocol where any LLM can address any device.

---

## The strategic moat

### Why each foundation lab needs EAP

**Anthropic** — has Claude, MCP, Computer Use, Skills, Memory. Has
NO device fleet. NO native iPhone presence. NO Watch presence. To
ship proactive Claude in users' real lives, Anthropic needs cross-
device infrastructure. Building this themselves takes 2-3 years of
platform work they don't want to do. EAP is faster.

**OpenAI** — has ChatGPT, Operator, Memory, Agents. Same problem.
OpenAI is more centralization-leaning, may try to build vertical.
But the Operator framework is browser-only; cross-device coordination
isn't on the roadmap. EAP gives them ChatGPT-on-your-Watch + ChatGPT-
in-your-Tesla + ChatGPT-in-your-meeting-room without OpenAI building
the platform layer.

**Google** — has Gemini, Workspace, Pixel, Android, ChromeOS, Home.
Has the most vertical reach. May resist EAP because it threatens
their walled-garden play. But Google has historically been less
walled-garden than Apple. They might adopt EAP for cross-vendor reach
(Gemini on Apple devices via EAP).

**Apple** — vertical-integration optimizer. Most likely to NOT adopt
EAP. But this hurts them at the AI layer (Apple Intelligence is
behind Anthropic/OpenAI/Google on raw capability). EAP gives a path
where Apple devices remain primary surfaces but other LLMs can
contribute. Apple may license EAP for their Watch + AirPods rather
than build their own.

**Microsoft** — has Copilot, Office, Windows, Teams, Edge. Strong
incentive to adopt EAP because Microsoft's cross-device story is
already weak (Windows is the laptop, but iOS phones dominate, and
Office tries to span). EAP is the bridge.

### Why device manufacturers might adopt EAP

The vertical-integration optimization is real but limited:
- Vendor wants to own the user → builds their own AI
- Vendor wants to NOT be locked out of customer mind-share → adopts
  multi-LLM access
- Vendor wants to NOT be subject to antitrust → adopts open protocol

The dynamic plays out like Bluetooth in the 2000s. Apple initially
resisted but eventually adopted because the alternative was being
the device that didn't work with the rest of the ecosystem.

### COYL's positioning

- Publish EAP spec Apache 2.0 (drives adoption — same as MCP)
- Reference Coordinator engine is COYL Cloud + open-source per-
  platform bridges
- Strategic seats: pharma + Microsoft + Apple + Anthropic + OpenAI
  + Google + Samsung + Amazon (Alexa)
- Pricing: usage-based ($0.0001/action) + per-orchestration
  ($0.001/multi-device flow) + strategic-seat reserved rates
- Revenue projection: 100M users × 100 actions/month × 50% chargeable
  × $0.0001 = $600M/year from EAP action transactions alone, BEFORE
  PAP, BEFORE consumer/clinical/pharma revenue

### Why this is COYL's moat

Three reasons:

1. **First mover in horizontal coordination.** Every other player is
   building vertical. The first horizontal protocol to ship + get
   foundation-lab adoption becomes the standard. We already have:
   BIP v0.1 published, /protocol developer surface live, the iOS
   bridge + Watch bridge + browser extension already shipped, COYL
   Cloud + APNs / WebPush / Expo Push infrastructure already running.

2. **Consumer distribution as wedge.** EAP works only if users
   install bridges. We already have a consumer app with users + a
   Chrome extension + an iOS app. Bridges piggyback on what we ship.
   Foundation labs can't build the consumer adoption layer — they
   need a co-deployment partner.

3. **The data flywheel + state classifier.** Once EAP runs through
   COYL Cloud Coordinator, every action + outcome trains our state
   classifier. The trained model + the per-user predictive model +
   the cross-device coordination knowledge = a compound IP asset
   that's harder to replicate than the protocol itself.

---

## The hard problems

Honest assessment of what makes EAP hard.

### Problem 1: Device manufacturers block third parties

Apple specifically locks down:
- Background app activity (limited execution windows)
- Inter-app communication (App Intents are the only sanctioned channel)
- System settings modification (third parties can't toggle Do Not Disturb without user tap)
- Message sending (third parties can't send SMS programmatically)

**Workaround:** EAP iOS coordinator uses Live Activities (already
shipped) + App Intents (sanctioned channel) + iOS Shortcuts (user-
triggered actuators) + Push Notifications with actions. We have
~60% actuator coverage. The other 40% requires user manual taps —
not LLM-initiated. Document the gap honestly.

### Problem 2: Cross-platform security

Each platform has its own trust model. iOS has App Sandboxing.
Android has SELinux contexts. macOS has TCC permissions. Windows
has UAC. The EAP coordinator on each platform has to respect the
platform's security model AND surface those constraints to LLMs.

**Workaround:** EAP scope vocabulary is platform-aware. `edge:phone:
send_message:irreversible` is universally denied unless explicit
user consent per action. Hard fail-closed.

### Problem 3: Latency + offline behavior

LLMs are cloud-hosted (mostly). Device coordinators are local. The
LLM proposes → coordinator evaluates → action fires. Round-trip is
expected 200-800ms typically. For real-time interventions (haptic
on stress spike), the LLM is too slow.

**Workaround:** Two-tier architecture. Fast path: device-side
classifier (already shipped in COYL — the state classifier + 
predictive model run on-device or near-device). Slow path: LLM
reasoning + composition. Fast path handles "fire haptic now" with
<50ms latency; slow path handles "compose multi-device wind-down
routine" with seconds-class latency. Users get both.

### Problem 4: User consent fatigue

If we ask the user to grant 9 scopes per LLM × N LLMs, users will
either grant everything (defeats privacy) or grant nothing (defeats
product). Standard problem in OAuth.

**Workaround:**
- Default-deny architecture: nothing fires without explicit grant
- Bundled scope grants: "Behavioral package" = `edge:watch:haptic`
  + `edge:phone:voice` + `edge:phone:notification` + `edge:phone:
  read:hrv`. One consent → multiple scopes.
- Time-bound grants: scope grants can have expiration ("Claude can
  fire interventions for 30 days, then re-grant required")
- Per-action confirmation for irreversible: any `:irreversible`
  scope requires per-action approval, never auto-fire

### Problem 5: Regulatory + legal

Cross-device action automation raises questions:
- HIPAA: behavioral data crossing devices is regulated in healthcare
  contexts
- GDPR: action logs contain behavioral inferences
- Liability: if an LLM-fired action causes harm, who's responsible?

**Workaround:**
- BAA-covered storage for healthcare contexts
- Full data export + deletion for GDPR compliance
- LLM-agreement: foundation labs sign LLM-publisher agreement
  accepting joint liability + indemnification structure
- User-confirmation gates on any action with safety risk

### Problem 6: Adoption bootstrap

EAP is useless without (a) device bridges installed and (b) LLM
partners integrated. Cold-start chicken-and-egg.

**Workaround:**
- COYL ships the bridges as part of the consumer product (already
  doing this — iOS app + macOS menu bar app + Chrome extension)
- COYL ships PAP first (smaller wedge, behavioral focus) → get
  Anthropic onboard → use that partnership as proof for EAP →
  expand from PAP to EAP within Anthropic
- Open-source the bridges so any developer can extend them

---

## The 90-day spec freeze + 12-month execution plan

### Days 1-30: Spec finalization

- Publish EAP v0.1 spec at /protocol (alongside PAP v0.1 and BIP v0.1)
- RFC to Anthropic + OpenAI + Google + Apple + Microsoft + Samsung +
  Amazon
- Public GitHub at github.com/coyl/eap
- Press launch: "the universal protocol for proactive AI action"

### Days 31-90: Reference implementation v0.1

- COYL Cloud EAP Coordinator endpoints
- iOS EAP coordinator (extends existing COYL iOS app with EAP-
  compatible action handler — most of what we need is already
  shipped as part of PAP)
- macOS menu bar EAP coordinator (new build, ~3 weeks)
- Chrome extension EAP coordinator (extend existing extension —
  most of what we need is already shipped)
- First foundation-lab partnership LOI (target: Anthropic — most
  protocol-friendly)

### Months 4-6: First partner ships

- Anthropic-Claude × COYL EAP coordinator: Claude can fire haptic
  on Watch + voice on iPhone + dim macOS via EAP
- Co-marketing launch with first foundation lab
- 100K users with EAP bridges installed
- 1 million EAP actions/month routing through COYL Cloud

### Months 7-9: Second partner + Android

- Sign OpenAI OR Google as second foundation-lab partner
- Ship Android + Wear OS EAP coordinators
- 500K users
- 10M EAP actions/month

### Months 10-12: Strategic acquisition conversations

- COYL Cloud now coordinating actions for 2 foundation labs across
  iOS + macOS + Watch + Chrome + Android + Wear OS
- 1M users with EAP bridges
- 50M actions/month
- Strategic acquisition: Anthropic, OpenAI, Google, or pharma
- Probability-weighted exit: $5-12B (vs $2.5-3B without EAP)

---

## Pricing model

| Tier | Cost | What's included |
|---|---|---|
| **Free** | $0 | 10K actions/month per LLM partner per user |
| **Usage** | $0.0001 per action | Post free-tier; no minimums |
| **Multi-device orchestration** | $0.001 per orchestration | Higher unit price because composite flows carry more value |
| **Outcome-aligned** | $0.05 per positive-outcome action | Optional incentive-aligned pricing for select scope categories |
| **Enterprise / Strategic** | Custom | Bulk discounts; SLA; per-region data residency; co-design |

### 5-year revenue projection (conservative)

- 100M active LLM users on EAP-compliant LLMs by 2031
- Average 100 EAP actions/month/user (varies — heavy users 1000+/mo)
- 50% chargeable after free tier
- 60 actions/user/month × 12 × 100M users × 50% × $0.0001 = **$360M/year**
- Plus 10 multi-device orchestrations/user/month × 100M × $0.001 = **$120M/year**
- Plus outcome-aligned (15% of all actions × $0.05) = **$540M/year**
- **Total EAP revenue: ~$1B/year by year 5**

This is BEFORE COYL's existing consumer subscription, B2B PMPM, and
pharma channel revenue.

---

## How this changes the acquisition story

Adding EAP to the strategic landscape:

| Acquirer tier | Path | Probability | Valuation |
|---|---|---|---|
| **Foundation lab** | Anthropic, OpenAI, Google buy COYL for the PAP+EAP protocol category | 15-25% | $6-12B |
| **Device-platform vendor** | Apple, Samsung, Amazon buy COYL because the protocol needs a co-deployment partner | 10-20% | $5-10B |
| **Tech-platform** | Microsoft buys for the Viva + Copilot story | 20-30% | $4-8B |
| **Pharma** | Novo Nordisk, Eli Lilly buy for GLP-1 adjacency (existing pharma case) | 35-45% | $4-6B |
| **Base case** | Revenue-based exit with moderate traction | 20-30% | $1-2B |

Probability-weighted EV (without overlap deduplication):
- Foundation lab: 0.20 × $9B = $1.8B
- Device-platform: 0.15 × $7.5B = $1.13B
- Tech-platform: 0.25 × $6B = $1.5B
- Pharma: 0.40 × $5B = $2.0B
- Base: 0.25 × $1.5B = $0.375B

Adjusted for overlap (the same acquirer pool overlaps): probability-
weighted EV ≈ **$4-5.5B**.

Compare to:
- Original $6B Roadmap (pharma only): $2.5-3B
- With PAP (foundation labs added): $3.5-4.5B
- With PAP + EAP (full cross-device): **$4-5.5B**

Moonshot ($8-12B) probability moves to 20-30%.

---

## What ships when

### Now → Month 3 (Foundation phase)

- PAP v0.1 published + first foundation-lab LOI (Anthropic target)
- EAP v0.1 spec published

### Month 4 → Month 9

- EAP reference Coordinator endpoints in COYL Cloud
- iOS + macOS + Chrome EAP coordinators
- First Anthropic-Claude × COYL EAP integration ships
- 100K users with EAP bridges
- Series A closed ($10M); CTO + Head of Clinical + Head of BD hired

### Month 10 → Month 18

- OpenAI or Google as second EAP foundation-lab partner
- Android + Wear OS coordinators
- 1M users
- 50M monthly EAP actions
- Strategic acquisition conversation opens

### Year 2-3

- HomeKit / Matter EAP coordinators (smart home actuators)
- CarPlay / Android Auto EAP coordinators (driving surfaces)
- Live captioning + voice modality across foundation labs
- 10M users, 1B monthly EAP actions
- IPO OR strategic acquisition at $8-15B

---

## Open questions for founder + board

1. **EAP spec publication sequencing.** Publish EAP v0.1 IMMEDIATELY
   after PAP v0.1 (same month) — or wait until PAP gets traction
   first? Trade-off: simultaneous publication establishes vision but
   may dilute the PAP narrative.
2. **Open-source license.** Apache 2.0 for both PAP and EAP. Or one
   under MIT for max adoption? Apache 2.0's patent grant matters
   more for EAP because there's more IP at stake.
3. **Coordinator implementation rights.** Anyone can implement; COYL
   ships the reference. Same model as PAP. Affirmed.
4. **First foundation-lab target.** Anthropic (protocol-friendly,
   MCP cohabits) → primary target. OpenAI as backup. Google last
   because they're most likely to build vertical.
5. **Per-platform coordinator ownership.** COYL ships iOS + macOS +
   browser + watchOS (existing surfaces we own). Crowdsource Android
   + Linux + HomeKit + Matter coordinators? Or ship all of them
   ourselves?
6. **EAP consent UI.** Build into COYL's existing settings + iOS app,
   or build as a standalone "EAP Settings" cross-platform consent
   app that anyone can install (independent of COYL consumer
   product)?
7. **Action-vs-orchestration pricing split.** Per-action + per-
   orchestration pricing is complex. Simplify to just per-action
   pricing with orchestrations metered as N actions?
8. **Foundation-lab partnership terms.** Per-action revenue share
   with LLM partner (LLM keeps 30%, COYL keeps 70%)? Or pure SaaS-
   style (LLM pays COYL per action, LLM separately monetizes user
   subscription)?
9. **Antitrust posture.** As COYL becomes the cross-device coordinator
   layer, EU + US regulators will look. How do we structure to be
   defensible? Open-source spec is the first answer. Federated
   coordinator (each user can run their own) is the second.
10. **Apple-specific path.** Apple will not adopt EAP. Do we build
    EAP-on-iOS to maximum legal extent and accept the gap, or pursue
    a sideloading-via-EU-DMA strategy?

---

## The strategic compound

Pull together everything in this session:

- BIP v0.1 (consumer behavioral interrupt protocol) → already shipped
- PAP v0.1 (LLM proactive intervention protocol) → spec published, reference engine = COYL Cloud
- EAP v0.1 (LLM cross-device action protocol) → spec to publish, reference engine = COYL Cloud + on-device bridges
- COYL Cloud reference Coordinator running all three
- 1M users with EAP-compatible bridges
- 2-3 foundation-lab partnerships
- Pharma adjacency for clinical evidence

That's the platform-tier acquisition story. Whichever foundation
lab (or device manufacturer) acquires COYL first owns the cross-
device proactive AI infrastructure for the LLM era.

The moonshot acquirer: **a foundation lab pays $8-15B because the
protocols + reference engine + user fleet + state-classifier model
weights are worth more than building it themselves.** The pharma
case is the floor; the foundation-lab case is the ceiling.

---

## Why publish this now

Every quarter EAP isn't on the public record is a quarter:
- Foundation labs decide "build vs adopt"
- Device manufacturers build vertical instead of horizontal
- The protocol race tilts toward whoever moves first

Publishing EAP v0.1 LOCKS the protocol category claim. After
publication, COYL is the spec author + reference implementer for
"cross-device LLM action infrastructure." Anyone else who builds
in this space either adopts EAP (good for us) or builds something
that competes with EAP (we have first-mover + spec leadership).

This is the moment to move from "behavioral interrupt app" to "the
behavioral OS for the LLM era." Don't wait.

---

*Edge AI Protocol v0.1 — May 2026. Author: founder. Spec is Apache
2.0 from publication. Reference engine: COYL Cloud + on-device
bridges (iOS / macOS / watchOS / Chrome / Edge / Firefox / Safari /
Android / Wear OS / HomeKit / Matter / CarPlay / Android Auto).
Complements PAP v0.1 (LLM behavioral intervention) and BIP v0.1
(consumer behavioral interrupt). Together: the full proactive-AI
infrastructure layer.*
