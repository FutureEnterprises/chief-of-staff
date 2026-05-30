# apps/ios-rebound — Rebound iOS app scaffold

Free-tier iOS app. The behavioral interrupt that catches the 9 PM
negotiation, on the patient's phone, without a paywall.

This is a **scaffold**, not a buildable Xcode project yet. The
intentional structure:

```
apps/ios-rebound/
├── README.md              ← you are here
├── Package.swift          ← SPM manifest (so `swift build` works headlessly)
├── Sources/
│   ├── ReboundDomain/     ← pure-Swift domain logic — no UI, no HealthKit
│   │   ├── Archetype.swift
│   │   ├── DangerWindowDetector.swift
│   │   ├── InterruptScript.swift
│   │   └── ReboundEvent.swift
│   └── Rebound/           ← SwiftUI app + HealthKit + push glue
│       ├── ReboundApp.swift
│       ├── HealthKitClient.swift
│       ├── InterruptDelivery.swift
│       └── Info.plist
└── Tests/
    └── ReboundTests/
        └── DangerWindowDetectorTests.swift
```

## Why this shape

- **ReboundDomain is a separate target** so the danger-window detection
  logic is testable without standing up a simulator. The CI matrix can
  run `swift test` on the domain layer with no Xcode in the loop.
- **Rebound is the iOS app target** — SwiftUI views, HealthKit auth,
  push notification handling, the rest of the iOS-specific glue.
- **Info.plist sits inside Sources/Rebound** so the SPM manifest can
  reference it explicitly when (next step) we generate the actual
  Xcode project.

## What ships in v0.5 (Month 4-5 of the v3 plan)

- ✅ Archetype quiz (web → result deep-link into the app)
- ✅ HealthKit auth flow (read heart rate, sleep, activity)
- ✅ Time-of-day + context danger-window detector
- ✅ Single interrupt delivery path (push notification)
- ✅ Personal kill switch (one tap, everything stops)
- ✅ Audit-log view (your data, exportable)

## What does NOT ship in v0.5

- ❌ Voice-cloned interrupts (deferred per the v3 plan — Month 9+ if at all)
- ❌ Apple Watch app (Month 9+)
- ❌ Premium subscriptions (deferred — see free-consumer-tier.md)
- ❌ In-app messaging with a coach (we are not a coaching company)

## Going from scaffold to buildable Xcode project

When the founder is ready to actually build:

1. Open Xcode → File → New → Project → iOS App
2. Product name: `Rebound`, organization: `COYL`, language: Swift,
   interface: SwiftUI
3. Save to `apps/ios-rebound/Rebound.xcodeproj`
4. In Xcode: drag the four files from `Sources/ReboundDomain/` into a
   new "ReboundDomain" SPM-style local package, OR add them as a folder
   reference in the main app target.
5. Add the four files from `Sources/Rebound/` to the main app target.
6. Replace the auto-generated `Info.plist` with `Sources/Rebound/Info.plist`.
7. In Signing & Capabilities, add HealthKit + Background Modes
   (background fetch + remote notifications).
8. `xcodebuild test -scheme Rebound -destination 'platform=iOS Simulator,name=iPhone 15'` should pass.

The scaffold is structured so this is mechanical, not creative.

## Open architectural decisions (not pre-decided here)

- **Bundle ID**: `ai.coyl.rebound` is the default in Info.plist. If
  you want `com.coyl.rebound` or a separate app-store identity, change
  before TestFlight.
- **App Group**: needed if/when we add an Apple Watch companion.
  Reserved as `group.ai.coyl.rebound.shared` in code comments; not
  enabled until W1 of Watch development.
- **Telemetry**: the iOS app emits the same event taxonomy as the web
  (`src/lib/telemetry/free-tier-events.ts`). Swift mirror of that
  taxonomy lives in `ReboundEvent.swift`. Keep them in sync by hand
  until we build a codegen step.
