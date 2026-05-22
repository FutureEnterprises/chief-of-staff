# COYL EAP — Android + Wear OS

Native Android Studio project implementing the **Edge AI Protocol (EAP)
v0.1** device coordinator for Android phones and Wear OS watches.

This is a **separate** project from `apps/mobile/android/` (the Expo bare
workflow). Expo's Android lives alongside untouched. Reasoning: the EAP
coordinator runs as a long-lived Foreground Service that doesn't fit
into the Expo runtime model, so we ship it as a dedicated Play Store
listing.

```
apps/android/
├── app/                ← Android phone module (EAP coordinator)
└── wear/               ← Wear OS module
```

---

## Quick start (founder)

1. **Open in Android Studio**
   - `File → Open` → select `apps/android/`
   - Let Gradle sync (first sync takes a few minutes — downloads SDK
     dependencies, Health Connect, Firebase BoM, etc.)

2. **Create the Firebase project and download `google-services.json`**
   - Console: <https://console.firebase.google.com/>
   - Add an Android app with package `ai.coyl.eap` (debug variant adds
     `.debug` suffix — register both `ai.coyl.eap` and `ai.coyl.eap.debug`
     unless you only need release for now)
   - Add a second Android app with package `ai.coyl.eap.wear`
   - Download each `google-services.json` and drop into:
     - `apps/android/app/google-services.json`
     - `apps/android/wear/google-services.json`
   - These files are gitignored by `.gitignore`.

3. **Signing keys**
   - Debug: nothing to do — Android Studio uses the auto-generated
     `~/.android/debug.keystore`.
   - Release: generate a release keystore once:
     ```bash
     keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 \
       -validity 10000 -alias coyl-release
     ```
     Then add a `signingConfigs.release { … }` block in
     `app/build.gradle.kts` and `wear/build.gradle.kts`.
   - TODO marker is at the bottom of each module's `defaultConfig`.

4. **Health Connect**
   - Install Health Connect from the Play Store on your test device
     (Android 13 ships it; Android 14+ has it preloaded).
   - Run the app once → it deep-links to Health Connect → grant the
     EAP scopes (HRV, Steps, Sleep, RHR).
   - Without Health Connect installed the sensor module silently no-ops.

5. **Other runtime grants**
   - `POST_NOTIFICATIONS` (Android 13+) — prompted at first launch.
   - `PACKAGE_USAGE_STATS` — user must enable manually:
     Settings → Apps → Special access → Usage access → COYL EAP → ON.
   - `Notification policy access` (DND toggling) — deep-linked from
     the actuator the first time it's invoked.
   - `Activity Recognition` — runtime permission, prompted on first
     subscription.

6. **Run on a physical device**
   - Health Connect is unavailable in the emulator.
   - Wear OS module requires a paired watch (or Wear OS emulator
     instance paired with the phone via the Wear OS companion app).

---

## Wear OS module

```
wear/
└── src/main/java/ai/coyl/eap/wear/
    ├── WearMainActivity.kt           ← launcher
    ├── WearEAPCoordinator.kt         ← DataLayer messaging
    ├── WearComplicationProvider.kt   ← Self-Trust Score complication
    ├── WearHealthSubscription.kt     ← Health Services PassiveListener
    ├── WearHapticIntervention.kt     ← VibrationEffect actuators
    ├── WearDataLayerListener.kt      ← receives phone-forwarded actions
    ├── WearAuth.kt                   ← Tink-backed secure storage
    └── ComplicationRefreshWorker.kt  ← hourly score refresh
```

### Deployment

1. Enable Wear OS Developer Options on the watch (Settings → System →
   About → Build number → tap 7×).
2. Pair the watch with phone via the **Wear OS app** (Play Store).
3. In Android Studio: `Run → Run 'wear'` after selecting the watch
   from the device dropdown.
4. The complication appears in the watch face customization picker
   under "COYL EAP".

### DataLayer paths

| Path              | Direction        | Payload                                       |
| ----------------- | ---------------- | --------------------------------------------- |
| `/eap/action`     | phone → watch    | `WearActionRequest` JSON                       |
| `/eap/outcome`    | watch → phone    | `WearActionOutcome` JSON (phone POSTs cloud)   |
| `/eap/telemetry`  | watch → phone    | compact summary string from Health Services   |

---

## Architecture map

```
┌────────────────────────────────────────────────────────┐
│                       coyl.ai                          │
│  /api/eap/v1/{device/register,action/request,...}      │
│  /api/v1/{health/ingest,scope/grant,self-trust/...}    │
└──────────────────────────┬─────────────────────────────┘
            FCM push        │       OkHttp REST
                            ▼
┌────────────────────────────────────────────────────────┐
│  Android phone (apps/android/app)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ EAPCoordinatorService  (Foreground, dataSync)    │  │
│  │  ├─ EAPFirebaseMessagingService                  │  │
│  │  ├─ EAPActuators        (8 actuators ~85%)       │  │
│  │  ├─ EAPSensors          (Health Connect)         │  │
│  │  └─ HealthIngestWorker  (periodic 2h)            │  │
│  └──────────────────────────────────────────────────┘  │
│            │ DataLayer (Wearable)                      │
└────────────┼───────────────────────────────────────────┘
             ▼
┌────────────────────────────────────────────────────────┐
│  Wear OS watch (apps/android/wear)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ WearEAPCoordinator                               │  │
│  │  ├─ WearDataLayerListener                        │  │
│  │  ├─ WearHapticIntervention (haptic/notif/comp)   │  │
│  │  ├─ WearHealthSubscription (PassiveListener)     │  │
│  │  ├─ WearComplicationProvider (Self-Trust score)  │  │
│  │  └─ ComplicationRefreshWorker (hourly)           │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## Coverage versus EAP spec

| Actuator                | Phone | Wear |
| ----------------------- | :---: | :--: |
| `notification`          |   ✓   |  —   |
| `haptic`                |   ✓   |  ✓   |
| `voice_tts`             |   ✓   |  —   |
| `open_url`              |   ✓   |  —   |
| `open_app`              |   ✓   |  —   |
| `do_not_disturb_toggle` |   ✓   |  —   |
| `lock_screen`           |   ◐*  |  —   |
| `dim_screen`            |   ◐*  |  —   |
| `complication_update`   |   —   |  ✓   |

`*` Requires extra grants (DeviceAdmin / WRITE_SETTINGS). Disabled by
default — flip the TODO in `EAPActuators.kt`.

Approx phone coverage: **~85%** per EAP spec target.
Approx wear coverage: **~50%** per EAP spec target.

---

## Play Store submission

- $25 one-time developer fee (assume founder has Google Play account).
- Two app listings: `ai.coyl.eap` (phone) + a Wear OS listing that
  ships the wear APK as part of an App Bundle.
- Required policy declarations:
  - **Foreground service** type `dataSync` — declare its purpose
    (cross-device LLM action coordination).
  - **Package usage stats** — declare in store listing why it's read.
  - **Health Connect** scopes — privacy policy must enumerate them.

## Known TODOs

- Release keystore signing config (see step 3 above).
- Optional DeviceAdmin + WRITE_SETTINGS actuators are stubbed but
  return `failed` until granted.
- Per-LLM scope grants — current model is platform-wide (`llmId = "*"`).
- A second device admin entry point in `ConsentActivity` for
  `lock_screen` capability if founder elects to ship.
- Wear OS skin-temperature: validated availability call exists but the
  data-class import is pinned to Wear Health Services 1.1.0-alpha03;
  re-verify when bumping the SDK.

## Build sanity

`kotlinc -d /tmp/test.jar **/*.kt` cannot succeed standalone — Android
classes (Compose, Health Connect, Firebase) require the Android SDK on
the classpath. Use Android Studio's "Build → Make Project" or
`./gradlew :app:assembleDebug :wear:assembleDebug` from the command
line after running `./gradlew wrapper` once to materialize the wrapper
jar.

If the wrapper jar is missing locally:
```bash
cd apps/android
gradle wrapper --gradle-version 8.7
```

---

*EAP v0.1. Spec: `/docs/protocol/edge-ai-protocol.md`.*
