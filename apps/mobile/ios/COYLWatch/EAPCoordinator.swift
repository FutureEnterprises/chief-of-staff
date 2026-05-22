//
//  EAPCoordinator.swift
//  COYLWatch
//
//  Watch-side EAP coordinator. Talks to coyl.ai/api/eap/v1/* directly
//  via URLSession (watchOS supports URLSession since watchOS 6 with
//  no Background Modes gymnastics for foreground HTTPS calls; we use
//  background sessions only for long-running uploads).
//
//  Responsibilities:
//    1. On first launch, POST /api/eap/v1/device/register with the
//       Watch manifest (sensors + actuators supported on this device
//       class) using the auth token written to the shared App Group
//       by the paired iPhone app.
//    2. Listen for action proposals delivered through two channels:
//         (a) WCSession messages forwarded from the phone — the phone-
//             side coordinator already routes Watch-targeted actions
//             into the wrist via COYLHapticIntervention; we extend
//             that handler so non-haptic actuators (voice, complication
//             update, notification) are also dispatched here.
//         (b) Direct APNs to the Watch (paired Watches running
//             watchOS 7+ can receive their own pushes); the existing
//             UNUserNotificationCenter delegate forwards EAP action
//             payloads to us.
//    3. Execute the action by dispatching to the right native API
//       (WKInterfaceDevice, AVSpeechSynthesizer, WidgetCenter,
//       UNUserNotificationCenter).
//    4. Report the outcome back to COYL Cloud via
//       POST /api/eap/v1/action/outcome with the executionToken
//       minted by the cloud when the request was created.
//
//  The Watch is a *partial* coordinator — actuator coverage is ~50%
//  per the EAP spec. We can fire haptic + voice TTS + complication
//  reloads + local notifications. We CANNOT open arbitrary URLs
//  without a phone roundtrip, dim the screen, toggle DND, run
//  shortcuts, or anything else that requires a richer platform
//  surface. Those actions get explicitly rejected with
//  outcome='rejected' + outcomeReason='unsupported_actuator_on_watch'
//  so the cloud coordinator can re-route to a different device in
//  the user's fleet.
//
//  watchOS 10.0+ — URLSession, AVFoundation (AVSpeechSynthesizer),
//  WidgetKit, UserNotifications, WatchKit.
//

import Foundation
import WatchKit
import WidgetKit
import AVFoundation
import UserNotifications

// MARK: - Actuator vocabulary
//
// Mirror of the EAP scope vocabulary from docs/protocol/edge-ai-
// protocol.md. We only enumerate what the WATCH actually supports;
// everything else is rejected as unsupported.

@available(watchOS 10.0, *)
enum EAPWatchActuator: String {
    case haptic = "haptic"
    case voiceTTS = "voice_tts"
    case complicationUpdate = "complication_update"
    case showNotification = "show_notification"
}

// MARK: - Wire shapes
//
// Mirror of the JSON the cloud coordinator emits + ingests. We hand-
// roll Codable structs rather than reach for a third-party so the
// Watch target stays lean (binary size matters on watchOS).

@available(watchOS 10.0, *)
struct EAPActionEnvelope: Decodable {
    let executionToken: String
    let actionId: String?
    let actuator: String
    let params: [String: AnyCodable]?
    let ttlSeconds: Int?
}

/// Minimal type-erased JSON value. The action `params` map is
/// schema-shaped per actuator; we keep it loose and let each
/// dispatcher pluck out the keys it cares about.
@available(watchOS 10.0, *)
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self.value = NSNull()
        } else if let b = try? container.decode(Bool.self) {
            self.value = b
        } else if let i = try? container.decode(Int.self) {
            self.value = i
        } else if let d = try? container.decode(Double.self) {
            self.value = d
        } else if let s = try? container.decode(String.self) {
            self.value = s
        } else if let arr = try? container.decode([AnyCodable].self) {
            self.value = arr.map(\.value)
        } else if let obj = try? container.decode([String: AnyCodable].self) {
            self.value = obj.mapValues(\.value)
        } else {
            self.value = NSNull()
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case is NSNull: try container.encodeNil()
        case let b as Bool: try container.encode(b)
        case let i as Int: try container.encode(i)
        case let d as Double: try container.encode(d)
        case let s as String: try container.encode(s)
        case let arr as [Any]: try container.encode(arr.map { AnyCodable($0) })
        case let obj as [String: Any]: try container.encode(obj.mapValues { AnyCodable($0) })
        default: try container.encodeNil()
        }
    }
}

// MARK: - Coordinator

@available(watchOS 10.0, *)
final class EAPCoordinator: NSObject {

    /// Singleton — the coordinator lives for the lifetime of the
    /// Watch process. WCSession forwards into `handleAction(_:)`
    /// and the UNUserNotificationCenter delegate does the same.
    static let shared = EAPCoordinator()

    // Cloud base URL. Hardcoded — the Watch only ever talks to one
    // EAP cloud, and the App Group / build config decides which.
    // For non-prod builds, swap this at build time via a config
    // header (kept simple here).
    private let apiBase = URL(string: "https://coyl.ai")!

    // Shared App Group — the phone writes the auth token here after
    // sign-in. The Watch reads it on every API call.
    private let appGroup = "group.com.coyl.shared"

    // URLSession used for control-plane calls (register, outcome).
    // Default config is fine — these calls are small + foreground.
    private let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 15
        cfg.timeoutIntervalForResource = 30
        // The Watch is on cellular some of the time; allow it.
        cfg.allowsCellularAccess = true
        cfg.waitsForConnectivity = true
        return URLSession(configuration: cfg)
    }()

    // AVSpeechSynthesizer is heavy to instantiate per-utterance; keep
    // a single instance for the coordinator's lifetime.
    private lazy var speechSynth = AVSpeechSynthesizer()

    // Tracks whether we've registered with the cloud this process
    // run. Idempotent on the server side; we re-register on first
    // launch + on auth-token rotation.
    private var hasRegistered = false

    private override init() {
        super.init()
    }

    // MARK: - Public API

    /// Called from COYLWatchApp on first appearance (and re-called
    /// whenever the phone signals a token refresh via WCSession).
    /// Idempotent — safe to call repeatedly.
    func bootstrap() {
        guard !hasRegistered else { return }
        guard authToken() != nil else {
            // Phone hasn't synced an auth token yet; we'll try again
            // when COYLHapticIntervention notifies us a new message
            // arrived. The phone's syncDailyNumber() flow writes
            // both the token and the daily-number keys.
            NSLog("[EAP] No auth token in App Group; deferring register")
            return
        }
        registerDevice()
    }

    /// Entry point from COYLHapticIntervention when a phone-forwarded
    /// message has `kind == "eapAction"`. The phone strips out any
    /// haptic-specific shortcuts ahead of us; everything reaching
    /// here is a generic EAP action.
    func handleAction(_ message: [String: Any]) {
        // Decode into the typed envelope. Keep tolerance for missing
        // fields so a slightly-future cloud doesn't crash an older
        // Watch.
        guard let executionToken = message["executionToken"] as? String,
              let actuator = message["actuator"] as? String else {
            NSLog("[EAP] handleAction: missing executionToken or actuator")
            return
        }
        let params = (message["params"] as? [String: Any]) ?? [:]
        dispatch(executionToken: executionToken, actuator: actuator, params: params)
    }

    /// Entry point from UNUserNotificationCenter delegate when a
    /// direct-to-Watch APNs arrives with an `eap.action` payload.
    func handleRemoteNotification(_ userInfo: [AnyHashable: Any]) {
        guard let eap = userInfo["eap"] as? [String: Any],
              let executionToken = eap["executionToken"] as? String,
              let actuator = eap["actuator"] as? String else {
            return
        }
        let params = (eap["params"] as? [String: Any]) ?? [:]
        dispatch(executionToken: executionToken, actuator: actuator, params: params)
    }

    // MARK: - Dispatch

    /// Routes the action to the right native API, then posts the
    /// outcome. Each branch is responsible for invoking
    /// `reportOutcome` exactly once.
    private func dispatch(executionToken: String, actuator: String, params: [String: Any]) {
        guard let kind = EAPWatchActuator(rawValue: actuator) else {
            // Unknown to the Watch — tell the cloud so it can re-
            // route to phone / laptop / browser.
            reportOutcome(
                executionToken: executionToken,
                outcome: "rejected",
                outcomeReason: "unsupported_actuator_on_watch",
                userInteracted: false
            )
            return
        }

        switch kind {
        case .haptic:
            executeHaptic(params: params)
            reportOutcome(executionToken: executionToken, outcome: "executed",
                          outcomeReason: nil, userInteracted: false)

        case .voiceTTS:
            executeVoiceTTS(params: params)
            reportOutcome(executionToken: executionToken, outcome: "executed",
                          outcomeReason: nil, userInteracted: false)

        case .complicationUpdate:
            executeComplicationUpdate()
            reportOutcome(executionToken: executionToken, outcome: "executed",
                          outcomeReason: nil, userInteracted: false)

        case .showNotification:
            executeShowNotification(params: params) { ok in
                self.reportOutcome(
                    executionToken: executionToken,
                    outcome: ok ? "executed" : "failed",
                    outcomeReason: ok ? nil : "notification_post_failed",
                    userInteracted: false
                )
            }
        }
    }

    // MARK: - Actuators

    /// Haptic — same vocabulary as COYLHapticIntervention but
    /// callable from the EAP path. We delegate to the existing
    /// haptic table so behavior is consistent whether the haptic
    /// came via WCSession-kind=interrupt or via WCSession-kind=
    /// eapAction.
    private func executeHaptic(params: [String: Any]) {
        let pattern = (params["pattern"] as? String) ?? "notification"
        let device = WKInterfaceDevice.current()
        switch pattern {
        case "double-tap":
            device.play(.failure)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                WKInterfaceDevice.current().play(.failure)
            }
        case "success":
            device.play(.success)
        case "notification":
            device.play(.notification)
        case "directionUp":
            device.play(.directionUp)
        case "directionDown":
            device.play(.directionDown)
        default:
            device.play(.notification)
        }
    }

    /// Voice TTS — AVSpeechSynthesizer has been on watchOS since
    /// watchOS 6. We pick a default voice locale matched to the
    /// user's region (best-effort; falls back to en-US).
    private func executeVoiceTTS(params: [String: Any]) {
        guard let text = params["text"] as? String, !text.isEmpty else { return }
        let utterance = AVSpeechUtterance(string: text)
        // params.lang overrides; otherwise infer from current locale.
        let lang = (params["lang"] as? String) ?? Locale.current.identifier
        utterance.voice = AVSpeechSynthesisVoice(language: lang)
            ?? AVSpeechSynthesisVoice(language: "en-US")
        if let rate = params["rate"] as? Double {
            utterance.rate = Float(rate)
        }
        if let pitch = params["pitch"] as? Double {
            utterance.pitchMultiplier = Float(pitch)
        }
        speechSynth.speak(utterance)
    }

    /// Complication reload — forwards to WidgetCenter. The actual
    /// payload re-read happens in COYLComplicationProvider, which
    /// pulls from the shared App Group.
    private func executeComplicationUpdate() {
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Local notification — UNUserNotificationCenter on watchOS
    /// renders these as wrist notifications. Requires the user has
    /// granted notification permission; we don't request it here
    /// (the phone-side onboarding already does).
    private func executeShowNotification(params: [String: Any],
                                         completion: @escaping (Bool) -> Void) {
        let content = UNMutableNotificationContent()
        content.title = (params["title"] as? String) ?? "COYL"
        content.body = (params["body"] as? String) ?? ""
        if let sub = params["subtitle"] as? String { content.subtitle = sub }
        if let categoryId = params["categoryId"] as? String {
            content.categoryIdentifier = categoryId
        }
        // Trigger immediately. Watch UNTimeIntervalNotificationTrigger
        // requires > 0; use the lowest legal value.
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.01, repeats: false)
        let req = UNNotificationRequest(
            identifier: "eap.\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(req) { error in
            completion(error == nil)
        }
    }

    // MARK: - Device registration

    /// First-launch POST to /api/eap/v1/device/register. We send the
    /// Watch manifest with the actuators we ACTUALLY support; the
    /// cloud uses that to filter LLM action proposals before they
    /// reach the wrist.
    private func registerDevice() {
        guard let token = authToken() else { return }

        let userId = sharedDefaults()?.string(forKey: "coyl.userId") ?? ""
        guard !userId.isEmpty else {
            NSLog("[EAP] No userId in App Group; deferring register")
            return
        }

        let device = WKInterfaceDevice.current()
        let body: [String: Any] = [
            "userId": userId,
            "deviceClass": "apple_watch",
            "model": device.model,
            "os": "\(device.systemName) \(device.systemVersion)",
            "deviceFingerprint": deviceFingerprint(),
            "manifest": [
                "sensors": [
                    "hrv_proxy",
                    "resting_heart_rate",
                    "active_energy_burned",
                    "stand_hour"
                ],
                "actuators": [
                    "haptic",
                    "voice_tts",
                    "complication_update",
                    "show_notification"
                ],
                // The Watch can't grant scopes itself — the phone-
                // side consent UI is canonical. We surface what the
                // user previously granted (read from the App Group)
                // so the cloud sees a coherent view of Watch grants.
                "userGrantedScopes": readGrantedScopes()
            ],
            "operationalState": [
                "battery": Int((device.batteryLevel * 100).rounded()),
                "lowPowerMode": ProcessInfo.processInfo.isLowPowerModeEnabled
            ]
        ]

        post(path: "/api/eap/v1/device/register", body: body, bearer: token) { ok in
            if ok {
                self.hasRegistered = true
                NSLog("[EAP] device.register OK")
            } else {
                NSLog("[EAP] device.register failed — will retry on next bootstrap")
            }
        }
    }

    // MARK: - Outcome reporting

    /// POST /api/eap/v1/action/outcome. The cloud keyed the outcome
    /// off the executionToken alone; no Bearer auth required (the
    /// token is a capability). We still send the Bearer for consistency
    /// and so the cloud can attribute the report.
    private func reportOutcome(executionToken: String,
                               outcome: String,
                               outcomeReason: String?,
                               userInteracted: Bool) {
        var body: [String: Any] = [
            "executionToken": executionToken,
            "outcome": outcome,
            "userInteracted": userInteracted
        ]
        if let reason = outcomeReason { body["outcomeReason"] = reason }
        body["deviceState"] = [
            "device": "apple_watch",
            "battery": Int((WKInterfaceDevice.current().batteryLevel * 100).rounded()),
            "interactionLatencyMs": NSNull()
        ]

        let token = authToken()
        post(path: "/api/eap/v1/action/outcome", body: body, bearer: token) { ok in
            if !ok {
                NSLog("[EAP] action.outcome POST failed for token \(executionToken)")
            }
        }
    }

    // MARK: - HTTP

    /// Generic JSON POST helper. Encodes the body, sets the Bearer
    /// header, fires the request, calls the completion on the main
    /// queue.
    private func post(path: String,
                      body: [String: Any],
                      bearer: String?,
                      completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: path, relativeTo: apiBase) else {
            DispatchQueue.main.async { completion(false) }
            return
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let bearer { req.setValue("Bearer \(bearer)", forHTTPHeaderField: "Authorization") }
        do {
            req.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            DispatchQueue.main.async { completion(false) }
            return
        }

        let task = session.dataTask(with: req) { _, response, error in
            if error != nil {
                DispatchQueue.main.async { completion(false) }
                return
            }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            DispatchQueue.main.async { completion((200..<300).contains(status)) }
        }
        task.resume()
    }

    // MARK: - App Group helpers

    private func sharedDefaults() -> UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }

    /// The phone writes `coyl.authToken` after sign-in (and on every
    /// Clerk session refresh). If the user is signed out, this is
    /// nil and we defer all EAP traffic.
    private func authToken() -> String? {
        sharedDefaults()?.string(forKey: "coyl.authToken")
    }

    /// Stable per-install identifier. WKInterfaceDevice has no UUID
    /// API on the Watch, so we synthesize one on first call and
    /// persist it. Matches the server-side `deviceFingerprint`
    /// contract — opaque, stable across launches, unique per
    /// Watch+install.
    private func deviceFingerprint() -> String {
        let key = "coyl.watch.deviceFingerprint"
        if let stored = sharedDefaults()?.string(forKey: key) { return stored }
        let fresh = "watch_" + UUID().uuidString
        sharedDefaults()?.set(fresh, forKey: key)
        return fresh
    }

    /// Reads the scope grants the phone-side consent UI has previously
    /// established for Watch-targeted actuators. The phone writes a
    /// JSON-encoded string array into `coyl.eap.watchScopes`.
    private func readGrantedScopes() -> [String] {
        guard let raw = sharedDefaults()?.string(forKey: "coyl.eap.watchScopes"),
              let data = raw.data(using: .utf8),
              let arr = try? JSONSerialization.jsonObject(with: data) as? [String] else {
            return []
        }
        return arr
    }
}
