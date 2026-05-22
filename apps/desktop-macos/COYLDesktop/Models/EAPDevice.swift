//
//  EAPDevice.swift
//  COYL Desktop — EAP Coordinator
//
//  Device-side manifest types. We POST one of these on first launch
//  (and on each manifest change) to `/api/eap/v1/device/register`,
//  which upserts the row and flips `paired=true`. The server uses
//  `deviceFingerprint` as the idempotency key, so re-registers after
//  a reinstall don't duplicate.
//
//  Manifest content drives what actions LLMs can even propose against
//  this device. If we don't list "applescript_execute" in actuators,
//  no LLM can request an AppleScript on this Mac — the coordinator
//  fails closed at the request endpoint, not here.
//

import Foundation

/// The wire body of `POST /api/eap/v1/device/register`. The server
/// adds `userId`, validates fingerprint uniqueness, and writes an
/// audit entry `device_registered` (or `_manifest_updated`).
struct EAPDeviceRegistration: Codable {
    /// The user this device belongs to. Resolved from the auth token
    /// before we POST — see Auth.swift.
    let userId: String

    /// Always "macos_laptop" for this coordinator. The server uses
    /// this to pick the manifest template.
    let deviceClass: String

    /// Marketing model (e.g. "MacBook Pro 14-inch, M3"). Best-effort
    /// from `sysctl hw.model`; we send the raw string.
    let model: String?

    /// "macOS 14.5" — what the user sees in About This Mac. Joined
    /// from ProcessInfo.operatingSystemVersionString.
    let os: String?

    /// A stable, device-unique opaque string. We derive it from the
    /// hardware UUID (IOPlatformExpertDevice) hashed with the bundle
    /// id so two installs on the same Mac share the same fingerprint.
    let deviceFingerprint: String

    /// What this device can sense (read) and actuate (write).
    let manifest: EAPManifest

    /// Live device state at registration time. Refreshed by
    /// `SensorPublisher` on each tick, not here.
    let operationalState: EAPOperationalState

    /// Optional push token (APNs / WebPush). We omit for now: macOS
    /// menu bar apps can't reliably receive APNs in background, and
    /// the coordinator polls instead. Reserved for a future Web Push
    /// or Apple Push for App Extensions path.
    let pushToken: String?
}

/// The capability manifest. Keep the actuator + sensor strings exact;
/// the server reads them as keys against the EAP scope vocabulary.
struct EAPManifest: Codable {
    /// Sensors this device emits. Each entry is an EAP sensor key
    /// from §5 of the spec.
    ///
    /// macOS coverage:
    ///   - screen_state          (display power via DisplayServices)
    ///   - battery               (IOPSGetTimeRemainingEstimate)
    ///   - foreground_app        (NSWorkspace.frontmostApplication)
    ///   - calendar_meeting_density (EventKit; needs user grant)
    ///   - typing_pace           (NSEvent global monitor; needs
    ///                            Accessibility grant)
    let sensors: [String]

    /// Actuators this device can fire. Each is an EAP actuator key.
    ///
    /// macOS coverage (~80% of spec):
    ///   - notification          (UNUserNotificationCenter)
    ///   - voice_tts             (AVSpeechSynthesizer / NSSpeechSynthesizer)
    ///   - open_app              (NSWorkspace.openApplication)
    ///   - open_url              (NSWorkspace.open(URL))
    ///   - run_shortcut          (`shortcuts run` CLI)
    ///   - applescript_execute   (NSAppleScript)
    ///   - dim_screen            (DisplayServices best-effort)
    ///   - do_not_disturb_toggle (Shortcuts-bridged; macOS 14+ blocks
    ///                            direct toggle)
    let actuators: [String]

    /// EAP scope strings the user has granted on THIS device. We seed
    /// from Keychain on launch (Auth.swift) and update on consent
    /// changes (ConsentWindow.swift).
    let userGrantedScopes: [String]
}

/// Coarse runtime state. The server stores the most recent snapshot
/// and the LLM reads it back via `GET /api/eap/v1/sensor/...`.
struct EAPOperationalState: Codable {
    /// 0..100. -1 if we can't read it (desktop Mac on AC with no
    /// battery, or the IOPS call returned an error).
    let battery: Int

    /// Best-effort. macOS 14 removed the public NSUserDefaults read,
    /// so we honor it as user-toggled in the menu bar instead.
    let doNotDisturb: Bool

    /// Bundle id of the frontmost app, e.g. "com.apple.Safari".
    let foregroundApp: String?

    /// True if the user has put the coordinator into pause mode via
    /// the menu bar (Pause for 1h / until tomorrow). LLMs see this
    /// and back off; the coordinator also short-circuits requests
    /// locally.
    let paused: Bool

    /// If paused, when the pause ends. Nil otherwise.
    let pausedUntil: Date?
}

/// Local-side device identity. Persisted to UserDefaults after the
/// first successful `/device/register` round-trip so we don't have
/// to register on every launch.
struct EAPLocalDeviceState: Codable {
    /// Server-issued opaque device id (returned from /device/register).
    let deviceId: String

    /// The fingerprint we sent. Used as the idempotency key on
    /// subsequent re-registers.
    let deviceFingerprint: String

    /// When we last successfully registered.
    let registeredAt: Date
}
