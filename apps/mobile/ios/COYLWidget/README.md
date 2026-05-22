# COYLWidget — iOS Live Activity scaffold

This directory contains the Swift sources, Info.plist, and entitlements
for the **COYLWidget** extension target. The target itself is not yet
wired into the Xcode project — Expo's `project.pbxproj` is generated
and we don't want to edit it from a script. Follow the steps below to
add the target manually in Xcode, then point it at these source files.

Once the target is wired, the JS-side bridge (separate agent) and the
server `/api/v1/interrupts/*` endpoints (separate agent) make the
activity functional end-to-end.

## Founder's Xcode setup steps

1. Open `apps/mobile/ios/COYLApp.xcworkspace` in Xcode.
2. **File → New → Target → iOS → Widget Extension.** Name: `COYLWidget`.
   Bundle ID: `com.coyl.app.widget`. Activate the scheme when prompted.
3. Replace the auto-generated source files in the new target with the
   ones in `apps/mobile/ios/COYLWidget/` (these files). Specifically:
   - Delete Xcode's `COYLWidget.swift`, `COYLWidgetBundle.swift`,
     `COYLWidgetLiveActivity.swift`, and the auto-generated attributes file.
   - Add references to `COYLInterruptAttributes.swift`,
     `COYLInterruptLiveActivity.swift`, `COYLInterruptIntents.swift`,
     and `COYLWidgetBundle.swift` (uncheck "Copy items if needed"; check
     "COYLWidget" target membership).
4. Add **App Group** capability to BOTH the main app target AND the
   widget target. Group identifier: `group.com.coyl.shared`.
5. Add **Push Notifications** capability to the main app (already
   present) and add `background-modes: remote-notifications` if not
   already configured.
6. In the **widget target's** Info.plist, confirm
   `NSSupportsLiveActivities: YES` (already set in the scaffold plist).
7. In the **main app target's** Info.plist, add:
   - `NSSupportsLiveActivities: YES`
   - `NSSupportsLiveActivitiesFrequentUpdates: YES`
8. Set the widget target's **iOS Deployment Target to 17.0+**.
   ActivityKit shipped in iOS 16.1, but the `Button(intent:)`
   initializer that wires App Intents into Live Activity buttons
   is iOS 17.0 only. Every Swift type in this folder is gated on
   `@available(iOS 17.0, *)`. The main app target can stay at
   16.1 if you guard the start-activity call with `if #available`.
9. Run on a **physical iPhone**. Live Activities do not work in the
   simulator on most Xcode versions, and App Intents bound to widget
   buttons need a real device to round-trip.
10. **Smoke test:** trigger `Activity<COYLInterruptAttributes>.request`
    from the JS bridge — a lock-screen banner with three buttons
    should appear. Tap "Held it" and check the server received a
    POST to `/api/v1/interrupts/{id}/feedback` with
    `feedback=caught_me`, `source=live_activity`.

## File map

| File | Purpose |
|---|---|
| `COYLInterruptAttributes.swift` | `ActivityAttributes` + `ContentState` schema |
| `COYLInterruptLiveActivity.swift` | Lock-screen + Dynamic Island UI |
| `COYLInterruptIntents.swift` | Three App Intents (Held it / Slipped / Snooze) |
| `COYLWidgetBundle.swift` | `@main` entry — bundles the widget(s) |
| `Info.plist` | Widget target Info.plist (declares Live Activities support) |
| `COYLWidget.entitlements` | App Group membership |

## Color & type tokens (kept in `COYLInterruptLiveActivity.swift`)

- Cream background — `#fafaf7`
- Signature orange — `#ff6600`
- Warm dark (Dynamic Island bg) — `#0e0d0b`
- Display face — Instrument Serif when bundled, falls back to system
  serif. To enable the custom face, add `InstrumentSerif-Regular.ttf`
  to the widget target and list it under `UIAppFonts` in this Info.plist.

## How auth flows to the widget

The widget extension runs in its own process and cannot read the main
app's Keychain directly. The JS-side bridge writes the user's Bearer
token to the shared App Group's `UserDefaults` at sign-in:

```ts
// JS side (separate agent will wire this)
SharedUserDefaults.setString('coyl.authToken', token, 'group.com.coyl.shared');
```

`COYLIntentClient.authToken()` reads that same key. If the value is
absent (signed out), the POST goes out without an `Authorization`
header and the server will return 401 — which is what we want.
