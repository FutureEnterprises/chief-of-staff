# COYL — Smart-Home Bridge (HomeKit + Matter)

> Two on-device bridges that turn HomeKit accessories and Matter-fabric
> devices into EAP edge actuators. Once running, every light, lock,
> thermostat, switch, and speaker in a user's home becomes addressable
> by any LLM that holds the right scope on `coyl.ai/api/eap/v1/*`.
>
> The end-state scenario: at 9:43 PM the LLM sees user HRV elevated +
> kitchen geofence + the "no food after 9" commitment. It composes a
> three-device orchestration: dim the kitchen lights to 30%, switch
> the speaker to a relaxing playlist, lock the front door. EAP fires
> all three across HomeKit + Matter in <800 ms, audit-logged, scoped,
> revocable via the panic switch.
>
> Status: v0.1 scaffolds. Both bridges are independent — you can ship
> either or both. The MATTER bridge is the strategic primary because
> it's cross-vendor (Apple, Google, Samsung, Amazon, IKEA, Philips,
> Aqara all support it). The HOMEKIT bridge is the depth play for the
> ~30% of US households all-in on Apple.
>
> See `/docs/protocol/edge-ai-protocol.md` (EAP v0.1) for the wire
> protocol this bridge speaks on the cloud side.

---

## 1. Architecture choice

| Option | Reach | Cost to build | Maintenance | Recommendation |
|---|---|---|---|---|
| HomeKit only | ~30% US households (Apple-locked) | Medium (Swift, macOS app) | Low — Apple framework is stable | Ship as depth play |
| Matter only | ~85% by 2027 (industry standard) | Medium-high (matter.js, commissioning UX) | Medium — fabric mgmt is non-trivial | **Strategic primary** |
| Both | ~95% combined | Sum of above | Sum of above | **Recommended** — they don't overlap |

The two bridges do not overlap functionally. A HomeKit-only Hue bulb is
visible only to the HomeKit bridge; a Matter-commissioned Hue bulb is
visible only to the Matter bridge. Users with mixed fleets need both.

The bridges DO overlap on the EAP side — they both register devices
against `/api/eap/v1/device/register` and report outcomes against
`/api/eap/v1/action/outcome`. Server-side dedup (see commit `a5f7c18`
— coordinator logic) prevents two bridges from acting on the same
underlying physical device.

---

## 2. HomeKit bridge (`homekit-bridge/`)

### What it is

A native macOS app written in Swift that wraps `HMHomeManager` and
exposes every accessory in the user's iCloud-synced HomeKit home as
an EAP actuator. The app must run on a Mac that:

1. Is signed into the same iCloud account as the user's HomeKit home, AND
2. Has been added as a Home Hub OR is in the same local network as
   the HomePod / Apple TV that IS the Home Hub.

### Architecture

```
+-----------------------+         +----------------------+
| HMHomeManager         |  reads  | iCloud HomeKit graph |
| (Apple framework)     | <-----> | (Apple-hosted)       |
+-----------+-----------+         +----------------------+
            |
            v
+-----------------------+         +----------------------+
| HomeKitClient         |  HTTPS  | coyl.ai              |
| HomeKitActuators      | <-----> | /api/eap/v1/*        |
| HomeKitSensors        |  poll + |                      |
+-----------------------+ outcome +----------------------+
```

### Files

- `COYLHomeKitBridge.swift` — `@main` SwiftUI app + menu bar agent
- `HomeKitClient.swift` — wraps `HMHomeManager` (discovery, delegate)
- `HomeKitActuators.swift` — EAP actuator key → `HMCharacteristic.writeValue`
- `HomeKitSensors.swift` — `HMCharacteristic` value reads + change subscriptions
- `DeviceRegistration.swift` — POSTs each accessory (or the bridge itself with sub-actuators) to `/api/eap/v1/device/register`
- `Info.plist` — `NSHomeKitUsageDescription`, `LSUIElement=true`
- `COYLHomeKitBridge.entitlements` — `com.apple.developer.homekit`

### Actuator mappings

| EAP actuator | HomeKit service | HomeKit characteristic | Notes |
|---|---|---|---|
| `home:lights:on` / `home:lights:off` | `HMServiceTypeLightbulb` | `HMCharacteristicTypePowerState` | Bool write |
| `home:lights:dim` | `HMServiceTypeLightbulb` | `HMCharacteristicTypeBrightness` | 0..100 |
| `home:lights:color` | `HMServiceTypeLightbulb` | `HMCharacteristicTypeHue` + `Saturation` | 0..360, 0..100 |
| `home:lock:lock` | `HMServiceTypeLockMechanism` | `HMCharacteristicTypeLockTargetState` | `:irreversible` — per-action confirm |
| `home:thermostat:set` | `HMServiceTypeThermostat` | `HMCharacteristicTypeTargetTemperature` | Celsius wire |
| `home:speaker:play` / `pause` | `HMServiceTypeSpeaker` | `HMCharacteristicTypeMute` (best-effort) | Speakers are limited in HomeKit |

### Sensor mappings

| EAP sensor | HomeKit characteristic |
|---|---|
| `home:motion:<room>` | `HMCharacteristicTypeMotionDetected` |
| `home:lock:state` | `HMCharacteristicTypeLockCurrentState` |
| `home:temperature:<room>` | `HMCharacteristicTypeCurrentTemperature` |
| `home:occupancy:<room>` | `HMCharacteristicTypeOccupancyDetected` |

### Distribution

Two paths:

1. **Mac App Store** (recommended). Sandboxed app, `HomeKit` entitlement,
   signed + notarized. Discoverable, auto-updating, 30% Apple cut.
2. **Notarized direct download** from `coyl.ai/download/homekit-bridge`.
   .dmg with the .app inside. Notarized so Gatekeeper accepts. No Apple
   cut. Manual update via Sparkle (or in-app check).

Recommendation: start with notarized direct download for v0.1 (faster
iteration, no review cycle); add Mac App Store track once the
actuator surface stabilizes.

### Build

```bash
cd homekit-bridge
xcodebuild -scheme COYLHomeKitBridge -configuration Release
# Or open in Xcode and build the menu bar target
```

### Privacy & safety

- HomeKit access requires explicit `NSHomeKitUsageDescription` grant
  per-Mac. Apple shows a system prompt; we cannot bypass.
- Locks are `:irreversible` scope category — `HomeKitActuators` MUST
  refuse to fire any `home:lock:*` write without a fresh per-action
  user confirmation token from `/api/eap/v1/action/request`.
- Thermostat over-actuation: multiple LLMs may all want to "lower the
  thermostat" within minutes. Server-side dedup (in
  `coordinator.ts`) collapses overlapping requests; the bridge trusts
  the server's decision and does not re-dedup locally.

---

## 3. Matter bridge (`matter-bridge/`)

### What it is

A long-lived Node.js service (Docker or bare-metal) that joins the
user's Matter fabric as a Controller, discovers commissioned devices,
and exposes each as an EAP actuator + sensor.

Matter is the cross-vendor standard. As of 2026, Matter devices ship
from Philips Hue, Aqara, Eve, Apple HomePod, Google Nest, Amazon Echo,
Samsung SmartThings, IKEA Tradfri, and more. A single Matter bridge
on a Raspberry Pi reaches them all.

### Architecture

```
+--------------------+        +-----------------------+
| Matter Fabric      |  IPv6  | matter.js Controller  |
| (mDNS + Thread)    | <----> | (this service)        |
+--------------------+        +-----------+-----------+
                                          |
                                          v
                              +-----------------------+
                              | EAP Coordinator       |
                              | (eap-coordinator.ts)  |
                              +-----------+-----------+
                                          |
                                          v  HTTPS
                              +-----------------------+
                              | coyl.ai/api/eap/v1/*  |
                              +-----------------------+
```

### Files

- `package.json` — dependencies: `@matter/main`, `@matter/protocol`, `pino`, `dotenv`
- `src/index.ts` — boot: create CommissioningController, restore fabric, start poll loop
- `src/eap-coordinator.ts` — `pollPendingActions` + `postOutcome` + `registerDevice`
- `src/actuators.ts` — EAP actuator → Matter cluster command
- `src/sensors.ts` — Matter cluster attribute subscriptions → EAP sensor publish
- `Dockerfile` — Node 20-alpine base, host networking required for mDNS

### Cluster → actuator mapping

| EAP actuator | Matter cluster | Cluster id | Command / Attribute |
|---|---|---|---|
| `home:lights:on` | OnOff | 0x0006 | `On` command |
| `home:lights:off` | OnOff | 0x0006 | `Off` command |
| `home:lights:dim` | LevelControl | 0x0008 | `MoveToLevel` |
| `home:lights:color` | ColorControl | 0x0300 | `MoveToHueAndSaturation` |
| `home:lock:lock` | DoorLock | 0x0101 | `LockDoor` — `:irreversible` |
| `home:lock:unlock` | DoorLock | 0x0101 | `UnlockDoor` — `:irreversible` |
| `home:thermostat:set` | Thermostat | 0x0201 | `SetpointRaiseLower` or write `OccupiedHeatingSetpoint` |
| `home:fan:speed` | FanControl | 0x0202 | write `PercentSetting` |
| `home:cover:position` | WindowCovering | 0x0102 | `GoToLiftPercentage` |

### Cluster → sensor mapping

| EAP sensor | Matter cluster | Attribute |
|---|---|---|
| `home:motion:<room>` | OccupancySensing | `Occupancy` |
| `home:temperature:<room>` | TemperatureMeasurement | `MeasuredValue` |
| `home:humidity:<room>` | RelativeHumidityMeasurement | `MeasuredValue` |
| `home:lock:state` | DoorLock | `LockState` |
| `home:light_level:<room>` | IlluminanceMeasurement | `MeasuredValue` |

### Distribution

Three paths, founder picks based on user segment:

1. **Docker container** — `docker pull coyl/matter-bridge:latest`,
   pre-built image on Docker Hub. Power-users with a NAS / home server
   install in 30 seconds. `--network=host` required for mDNS.
2. **Raspberry Pi installer** — `curl -sSL coyl.ai/download/matter-bridge | bash`
   one-liner. Pulls the Docker image OR a native systemd unit onto a
   Pi 4 / Pi 5. Target: users without a home server who want a small
   plug-in box.
3. **Pre-configured COYL Hub** (future) — see §5 below.

### Build & run

```bash
cd matter-bridge
pnpm install
pnpm dev          # local with hot reload
pnpm build && pnpm start   # production

# Or container
docker build -t coyl/matter-bridge .
docker run -d --network=host \
  -e COYL_USER_TOKEN=... \
  -e COYL_API_BASE=https://coyl.ai \
  -v coyl-matter-fabric:/data \
  coyl/matter-bridge
```

### Commissioning UX

First-run flow:

1. User runs the bridge — it starts on port `5540` and prints a pairing
   URL.
2. User opens `http://<bridge-ip>:5540` from their phone.
3. They scan a Matter pairing QR code from a device (or paste the
   11-digit numeric code).
4. The bridge commissions the device into its fabric and registers it
   with EAP.

This is identical UX to how Apple Home / Google Home / Alexa onboard
Matter devices — we are just another commissioner.

---

## 4. EAP integration (both bridges)

Both bridges speak the same wire protocol against `coyl.ai`:

1. **On first launch:** POST `/api/eap/v1/device/register` with manifest
   (sensors + actuators + `userGrantedScopes`).
2. **Continuous:** poll `GET /api/eap/v1/devices/:deviceId/pending-actions`
   every 2-5 seconds. (Future: upgrade to WebSocket per EAP §1.)
3. **Per action:** dispatch to HomeKit / Matter, then POST
   `/api/eap/v1/action/outcome` with `executionToken`.
4. **Sensor publish:** when a watched characteristic changes, POST
   to the sensor publish endpoint (TBD — see spec §5 sensor subscription
   webhook target).

Auth is the same `COYL_USER_TOKEN` bearer that the existing macOS
desktop coordinator uses (see `apps/desktop-macos/COYLDesktop/`).

---

## 5. Commercial decision — the "COYL Hub"

**Founder decision required.**

Question: do we sell a physical "COYL Hub" device at $99?

Hardware:
- Raspberry Pi 4 (2GB) — bulk cost ~$45
- Custom plastic enclosure, COYL branding — ~$8
- Pre-flashed SD card with Matter bridge + auto-update — ~$5
- Cable + power supply — ~$6
- Packaging + fulfillment — ~$10
- **Bill of materials: ~$74. Sell at $99 → ~$25 margin.**

Pros:
- Hardware revenue line — recurring SKU, predictable margins, retail
  channel optionality.
- Removes the #1 setup friction for non-technical users ("how do I
  install Docker on a Raspberry Pi?"). Plug it in, scan a QR code,
  done.
- Brand surface — users see "COYL Hub" sitting in their living room
  every day. Hardware is the best ad.
- Strategic moat — once 100K users own a COYL Hub, no competitor can
  ship the same depth of cross-vendor coordination without first
  shipping hardware.

Cons:
- Hardware ops is a separate company-shape problem (returns, RMA,
  shipping, FCC certification, CE marking, customs).
- Capital tied up in inventory.
- Hardware product cycle (12-18 months) is slower than software (weekly).
- $25 margin × 100K units = $2.5M — not a moonshot revenue line; the
  strategic value is the install base, not the per-unit margin.

**Recommended posture (v0.1):** defer hardware. Ship the Docker
container + Raspberry Pi installer + macOS HomeKit bridge first.
Re-evaluate hardware at the 10K-installs threshold — if Docker friction
is the dominant churn cause, ship the Hub. If not, skip.

Alternative: launch the Hub via **a hardware partner** (Onion, Home
Assistant Yellow, etc.) so COYL doesn't take inventory risk. White-
label their device with our firmware. Lower margin, faster ship.

---

## 6. Roadmap (this bridge)

| Milestone | Scope |
|---|---|
| v0.1 (this) | Skeleton + actuator/sensor mappings + register flow |
| v0.2 | First end-to-end action: Claude fires `home:lights:dim` on a real Hue bulb via Matter |
| v0.3 | Multi-action orchestration: dim lights + lock door + start playlist in one POST |
| v0.4 | Subscription webhooks instead of polling |
| v0.5 | Matter QR-code commissioning UX in a tiny embedded web app |
| v0.6 | macOS HomeKit bridge shipped as notarized direct download |
| v1.0 | Mac App Store + Docker Hub publish + one-line Pi installer |

---

## 7. Open questions for founder

1. **Bridge identity model:** does the bridge register one EAP device
   per accessory (clean per-device scopes, complex audit) or one EAP
   device for the bridge itself with N actuators (simpler ID model,
   coarser scopes)? Current scaffold uses per-accessory. Reverse if needed.
2. **Matter commissioning UX:** embed a web UI in the bridge process,
   or punt to a companion mobile flow? Embedded is simpler; companion
   is more polished.
3. **Speaker integration:** HomeKit speakers are barely controllable
   (only mute/volume). For richer speaker control (play a specific
   playlist) we'd need Apple Music or Spotify Connect actuators —
   different category entirely. Document in v0.5.
4. **`:irreversible` lock handling:** server-side per-action confirm is
   the spec'd answer, but UX of "confirm this lock action in the COYL
   app" needs to be designed end-to-end. Locks are a high-trust feature.
5. **Hub commercialization:** see §5. Need a founder call before any
   hardware spend.

---

*EAP smart-home bridge v0.1 — May 2026. Author: founder. Reference
implementation under apps/bridge-homekit-matter/. Speaks EAP v0.1 over
HTTPS to coyl.ai/api/eap/v1/*.*
