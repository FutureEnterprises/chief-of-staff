# COYLWatch — watchOS app + complication scaffold

This directory contains the Swift sources, Info.plist, and entitlements
for the **COYLWatch** target (Watch app) and its embedded
**COYLWatchComplication** target (WidgetKit complication extension).
The targets themselves are not yet wired into the Xcode project —
Expo's `project.pbxproj` is generated and we don't want to mutate it
from a script. Follow the steps below to add the targets manually in
Xcode, then point them at these source files.

Once the targets are wired, the JS-side bridge in
`apps/mobile/modules/coyl-watch/` sends WatchConnectivity messages
from the phone, and the complication picks up Self-Trust Score
updates from the shared App Group.

## Founder's Xcode setup steps

1. Open `apps/mobile/ios/COYL.xcworkspace` in Xcode.
2. **File → New → Target → watchOS → Watch App.**
   - Product name: `COYLWatch`
   - Bundle ID: `com.coyl.app.watchkitapp`
   - Interface: SwiftUI
   - Language: Swift
   - Include "Notification Scene": NO (we use haptics, not notifications)
   - Include "Complication": YES (creates the embedded extension target)
3. The new target will scaffold its own `COYLWatchApp.swift`,
   `ContentView.swift`, and (for the complication extension)
   a `*Bundle.swift` + `*.swift` widget file. **Delete those
   auto-generated files**, then drag in the files from this folder:
   - `COYLWatchApp.swift`  →  Watch app target only
   - `COYLWatchView.swift` →  Watch app target only
   - `COYLHapticIntervention.swift` → Watch app target only
   - `COYLComplication.swift` → **complication extension target only**
   - `Info.plist` → Watch app target (replace the default)
   - `COYLWatch.entitlements` → both targets
4. Add **App Group** capability to BOTH the Watch app target AND the
   complication extension target. Group identifier:
   `group.com.coyl.shared` (same value the phone app and the existing
   COYLWidget Live Activity target use).
5. Add **HealthKit** capability if you want the Watch to read HRV or
   heart rate later (optional — this scaffold doesn't use it).
6. Add **WatchConnectivity** by enabling **Background Modes** on the
   Watch app target and checking the "Voice over IP" /
   "Remote notifications" modes as needed. WCSession itself is
   always available without explicit entitlement, but background
   delivery of messages requires Background Modes.
7. Set **Deployment Target → watchOS 10.0** on both new targets.
   Every type in this folder is gated on `@available(watchOS 10.0, *)`.
8. Build the workspace. The schemes Xcode creates for the Watch app
   should appear in the scheme picker — pick the COYLWatch scheme +
   a paired-watch simulator (or a real paired Apple Watch).
9. Run on a **physical paired Apple Watch** for the haptic-listener
   smoke test. The watch simulator can't fire real WKHapticType
   patterns and WCSession in the simulator is flaky.
10. **Smoke test:** from the JS side, call
    `CoylWatch.syncDailyNumber({ selfTrustScore: 78, dayNumber: 12,
    identitySentence: "You're showing up." })`. The watch UI should
    re-render with those values, and any mounted COYL complication
    on the watch face should reload.

## File map

| File | Target | Purpose |
|---|---|---|
| `COYLWatchApp.swift` | Watch app | `@main` SwiftUI App scene |
| `COYLWatchView.swift` | Watch app | Wordmark + Self-Trust + day-N UI |
| `COYLHapticIntervention.swift` | Watch app | WCSession listener; fires haptics + persists daily-number payload |
| `COYLComplication.swift` | Complication extension | `@main` WidgetBundle with circular/rectangular/inline complications |
| `Info.plist` | Watch app | Bundle metadata, WKApplication=true, companion bundle id |
| `COYLWatch.entitlements` | both | App Group membership |

The Watch app and the complication extension are **two separate
targets** with **two separate `@main` entry points**
(`COYLWatchApp` and `COYLComplicationBundle`). They compile
independently — putting both `@main` declarations in this folder is
fine as long as you assign each file to the correct target in
Xcode's File Inspector (right pane → Target Membership).

## How data flows

```
                                +-----------------+
                                |  Phone (Expo)   |
                                +-----------------+
                                          |
                            WCSession.sendMessage / App Group write
                                          v
   +-----------------+   +---------------------------------+
   |  Watch UI       |<--|  COYLHapticIntervention         |
   |  (COYLWatchView)|   |  - dispatches haptics           |
   +-----------------+   |  - writes App Group keys        |
                         |  - reloads complication         |
                         +---------------------------------+
                                          |
                                          v
                                +---------------------+
                                |  COYLComplication   |
                                |  reads App Group at |
                                |  every timeline tick|
                                +---------------------+
```

The App Group `group.com.coyl.shared` is the single source of truth
for displayed values. Keys used:

- `coyl.selfTrustScore` (Int 0–100)
- `coyl.dayNumber` (Int)
- `coyl.identitySentence` (String)

These match the keys the phone-side `CoylWatch.syncDailyNumber()`
bridge writes (`apps/mobile/modules/coyl-watch/ios/CoylWatch.swift`).

## Haptic mode → pattern

| Mode | Pattern | Feel |
|---|---|---|
| `interrupt-high-arousal` | `.notification` | Sharp, gets attention |
| `interrupt-low-arousal` | `.success` | Soft, reassuring |
| `interrupt-post-slip` | `.failure` + 100ms + `.failure` | Double-tap, "this matters" |

Unknown modes fall back to `.notification` so an interrupt never
silently drops.

## What this scaffold does NOT do (yet)

- HealthKit HRV ingestion on-device (the WKBackgroundModes entry
  in Info.plist is there for when we add it).
- Bidirectional WC messaging (Watch → phone). Today the Watch is
  receive-only.
- Notification scene. We use raw haptics rather than UNNotifications
  so the wrist surface is *haptic-only* and never shows visual
  notification cards.

## EAP coordinator additions

The Watch app now functions as an EAP edge device. Additional Xcode steps:

1. Add HealthKit capability to Watch target (Background Delivery: ON)
2. Add Background Modes: workout-processing, remote-notification
3. Add Info.plist permission: NSHealthShareUsageDescription
4. Verify WKApplicationRefreshBackgroundTask is in the Xcode background-tasks list
5. The watch app calls /api/eap/v1/device/register on first launch using the auth token from the shared App Group (written by phone app)

Build target: watchOS 10+. ~50% actuator coverage on Watch — limited
to haptic, voice TTS, complication updates, notifications (watch can't
open arbitrary URLs without phone).

### New files in this PR

| File | Purpose |
|---|---|
| `EAPCoordinator.swift` | Talks to `/api/eap/v1/*` via URLSession; dispatches actions to haptic / voice / complication / notification |
| `SensorPublisher.swift` | HealthKit batches (HRV / resting HR / active energy / stand hours) via background refresh + workout extended runtime |
| `HealthSubscription.swift` | HKObserverQuery wrapper for HRV-spike detection (15% drop vs 14-day rolling median, 60-min cool-down) |
| `PanicCommand.swift` | Long-press + crown-rotate panic gesture → `POST /api/eap/v1/panic` |

### App Group keys consumed by EAP

In addition to the existing `coyl.selfTrustScore` / `coyl.dayNumber` /
`coyl.identitySentence`, the EAP path reads:

- `coyl.authToken` (String) — written by phone after Clerk sign-in
- `coyl.userId` (String) — written by phone after Clerk sign-in
- `coyl.eap.watchScopes` (JSON string array) — written by phone consent UI
- `coyl.watch.deviceFingerprint` (String) — written on first launch by
  EAPCoordinator; opaque per-install identifier

And writes back:

- `coyl.eap.panicActive` (Bool) — set when panic gesture trips
- `coyl.eap.panicActivatedAt` (TimeInterval) — Unix seconds when tripped

### Wiring it on the app side

In a future commit, COYLWatchApp.swift should call on launch:

```swift
.onAppear {
    intervention.activate()
    EAPCoordinator.shared.bootstrap()
    SensorPublisher.shared.bootstrap()
}
```

And the SwiftUI background-task handler should forward to the
publisher:

```swift
.backgroundTask(.appRefresh("coyl.sensor.refresh")) { task in
    await withCheckedContinuation { cont in
        SensorPublisher.shared.handleBackgroundRefresh(task)
        cont.resume()
    }
}
```

Drop `.panicGesture()` on `COYLWatchView()` to enable the panic combo.

### Actuator coverage gap

| Actuator | Watch supports? | Fallback |
|---|---|---|
| `haptic` | yes | — |
| `voice_tts` | yes (AVSpeechSynthesizer since watchOS 6) | — |
| `complication_update` | yes (WidgetCenter) | — |
| `show_notification` | yes (UNUserNotificationCenter) | — |
| `open_url` | no — Watch can't open arbitrary URLs | EAPCoordinator returns `outcome=rejected, outcomeReason=unsupported_actuator_on_watch`; cloud re-routes to phone |
| `live_activity` | n/a (Watch native) | phone |
| `dim_screen` / `do_not_disturb` / `lights_dim` | no | macOS / phone / HomeKit |

When an actuator is unsupported, we explicitly report
`outcome=rejected` so the cloud coordinator can re-route to a
different device in the user's fleet rather than time out.
