//
//  COYLHapticIntervention.swift
//  COYLWatch
//
//  Listens for WatchConnectivity messages from the paired iPhone
//  and fires haptics on the wrist. Three intervention modes,
//  each with a distinct tactile signature so the wearer learns
//  to read mode from feel alone:
//
//    "interrupt-high-arousal" → .notification  (sharp, attention-grabbing)
//    "interrupt-low-arousal"  → .success       (soft, reassuring)
//    "interrupt-post-slip"    → double-tap     (.failure, 100ms pause,
//                                               .failure — two beats,
//                                               clearly distinct)
//
//  After firing a haptic we ask WidgetCenter to reload all timelines
//  so any complication on the face briefly re-renders. This is the
//  "subtle pulse" — the OS may animate the slot during reload.
//
//  Also writes daily-number payloads to the App Group when the
//  message kind is "syncDailyNumber", so the watch UI and
//  complications can pick up fresh values without a separate sync.
//
//  watchOS 10.0+ — WatchConnectivity, WidgetCenter.
//

import Foundation
import WatchConnectivity
import WatchKit
import WidgetKit
import Combine

@available(watchOS 10.0, *)
final class COYLHapticIntervention: NSObject, ObservableObject, WCSessionDelegate {
    // Bumped on every received message so SwiftUI views can use
    // .onChange(of: lastEventId) to know when to re-read the App Group.
    @Published var lastEventId: Int = 0

    private let session: WCSession? = WCSession.isSupported() ? WCSession.default : nil

    override init() {
        super.init()
        session?.delegate = self
    }

    /// Idempotent — safe to call from .onAppear. If the session is
    /// already activated this is a no-op.
    func activate() {
        guard let session, session.activationState != .activated else { return }
        session.activate()
    }

    // MARK: - WCSessionDelegate

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        // Activation finished. We don't need to do anything special
        // here — message reception is wired regardless of activation
        // result. Errors are logged via NSLog so the founder can
        // grep Console.app on the paired watch.
        if let error {
            NSLog("[COYL] WCSession activation error: \(error.localizedDescription)")
        }
    }

    /// Receives instantaneous messages (sendMessage on the phone side).
    /// We dispatch based on the `kind` field. Unknown kinds are ignored
    /// so future phone-side message types don't crash older watches.
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        let kind = (message["kind"] as? String) ?? ""

        switch kind {
        case "interrupt":
            let mode = (message["mode"] as? String) ?? "interrupt-high-arousal"
            fireHaptic(for: mode)
            pulseComplication()

        case "syncDailyNumber":
            writeDailyNumberPayload(message)
            pulseComplication()

        default:
            // Silently drop. Future-proofing — the phone side may
            // add new message kinds before all watches update.
            break
        }

        DispatchQueue.main.async { [weak self] in
            self?.lastEventId &+= 1
        }
    }

    /// Some phone-side message variants may arrive via this newer
    /// callback (replyHandler form). Forward to the no-reply handler
    /// and acknowledge with an empty dict so the phone's promise
    /// resolves cleanly.
    func session(
        _ session: WCSession,
        didReceiveMessage message: [String: Any],
        replyHandler: @escaping ([String: Any]) -> Void
    ) {
        self.session(session, didReceiveMessage: message)
        replyHandler(["ok": true])
    }

    // MARK: - Haptic dispatch

    /// Maps an intervention mode string to a WKHapticType pattern.
    /// The double-tap for post-slip is implemented as two haptics
    /// with a 100ms gap — Apple's haptic API has no built-in
    /// "double" type, so we synthesize it.
    private func fireHaptic(for mode: String) {
        let device = WKInterfaceDevice.current()

        switch mode {
        case "interrupt-high-arousal":
            // Sharp, attention-grabbing. Used when the predictive
            // model thinks the user is in a high-arousal danger
            // window (late-night, post-stress, etc.).
            device.play(.notification)

        case "interrupt-low-arousal":
            // Soft, reassuring. Used during low-arousal drift
            // (afternoon slump, social comparison spiral, etc.)
            // where we don't want to spike the user further.
            device.play(.success)

        case "interrupt-post-slip":
            // Double-tap — two beats, clearly distinct from a
            // single .notification. WKInterfaceDevice has no
            // chord/double API, so we play one, wait 100ms,
            // play again. .failure has the right "this matters"
            // weight for the post-slip recovery moment.
            device.play(.failure)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                WKInterfaceDevice.current().play(.failure)
            }

        default:
            // Unknown mode — default to the high-arousal pattern
            // so we never silently drop an interrupt.
            device.play(.notification)
        }
    }

    // MARK: - Complication pulse
    //
    // After a haptic, ask WidgetKit to reload the timelines so any
    // mounted complication re-renders. The OS often animates the
    // slot during reload — that's the "subtle pulse" the spec calls
    // for. Cheap; the provider just re-reads UserDefaults.

    private func pulseComplication() {
        WidgetCenter.shared.reloadAllTimelines()
    }

    // MARK: - App Group writes

    /// Persists a daily-number payload into the App Group so the
    /// Watch UI and complications can read it. Mirrors the keys
    /// that COYLWatchView and COYLComplicationProvider consume.
    private func writeDailyNumberPayload(_ message: [String: Any]) {
        guard let defaults = UserDefaults(suiteName: "group.com.coyl.shared") else {
            NSLog("[COYL] App Group group.com.coyl.shared unavailable")
            return
        }

        if let score = message["selfTrustScore"] as? Int {
            defaults.set(score, forKey: "coyl.selfTrustScore")
        }
        if let day = message["dayNumber"] as? Int {
            defaults.set(day, forKey: "coyl.dayNumber")
        }
        if let sentence = message["identitySentence"] as? String {
            defaults.set(sentence, forKey: "coyl.identitySentence")
        }
        defaults.synchronize()
    }
}
