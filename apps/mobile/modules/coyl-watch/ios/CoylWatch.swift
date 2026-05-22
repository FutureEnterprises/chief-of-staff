//
//  CoylWatch.swift
//  CoylWatch (Expo Module)
//
//  React Native ↔ WatchConnectivity bridge for COYL. Exposes
//  three functions to JS:
//
//    sendIntervention(mode, headline, subhead) → Promise<Bool>
//    syncDailyNumber(payload)                  → Promise<Void>
//    isWatchPaired()                           → Promise<Bool>
//
//  All WatchConnectivity work happens through a single
//  `WCSessionDelegate`-conforming singleton so the session stays
//  activated for the lifetime of the host app process.
//
//  Counterpart on the watch:
//    apps/mobile/ios/COYLWatch/COYLHapticIntervention.swift
//
//  App Group keys read/written here must match those consumed by:
//    apps/mobile/ios/COYLWatch/COYLWatchView.swift
//    apps/mobile/ios/COYLWatch/COYLComplication.swift
//

import ExpoModulesCore
import Foundation
import WatchConnectivity

// MARK: - Phone-side WCSession delegate
//
// WCSession requires a delegate that's retained for the session's
// lifetime. We use a singleton because the phone has exactly one
// session, and Expo modules can be torn down and re-created when
// the JS bundle reloads — we don't want the session to die with
// the module instance.

@available(iOS 13.0, *)
private final class CoylWatchSessionManager: NSObject, WCSessionDelegate {
    static let shared = CoylWatchSessionManager()

    private let session: WCSession? = WCSession.isSupported() ? WCSession.default : nil

    /// Activates the session if needed. Idempotent — safe to call
    /// multiple times. Returns true if the session is supported on
    /// this device (false on iPad / non-paired hardware).
    @discardableResult
    func activateIfNeeded() -> Bool {
        guard let session else { return false }
        if session.activationState != .activated {
            session.delegate = self
            session.activate()
        }
        return true
    }

    /// True iff a watch is paired and the COYL watch app is
    /// installed. Both conditions must hold for sendMessage to
    /// reach the wrist.
    var isWatchPaired: Bool {
        guard let session else { return false }
        return session.isPaired && session.isWatchAppInstalled
    }

    /// True if the watch is currently reachable in real time.
    /// Used to choose between sendMessage (live) and
    /// transferUserInfo (queued for later delivery).
    var isReachable: Bool {
        return session?.isReachable ?? false
    }

    /// Sends a message to the watch. If the watch is reachable
    /// we use sendMessage for low-latency delivery (haptics need
    /// this). If not, we fall back to transferUserInfo so the
    /// message lands the next time the watch wakes — for daily-
    /// number sync that's fine; haptics by definition need
    /// reachability so we just return false there.
    /// Returns true if the message was dispatched (live or queued).
    func send(
        _ message: [String: Any],
        prefersImmediate: Bool
    ) -> Bool {
        guard let session, isWatchPaired else { return false }

        if isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                NSLog("[COYL] WCSession.sendMessage error: \(error.localizedDescription)")
            }
            return true
        }

        if prefersImmediate {
            // Haptics that arrive after the moment passed are
            // worse than useless — they train the wrong pattern.
            // Don't queue.
            return false
        }

        // Non-realtime payload (e.g., daily-number sync). Queue
        // it for the next watch wake.
        session.transferUserInfo(message)
        return true
    }

    // MARK: WCSessionDelegate

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if let error {
            NSLog("[COYL] Phone WCSession activation error: \(error.localizedDescription)")
        }
    }

    // The phone-side delegate must implement these two callbacks
    // (required by the protocol) even though we don't switch
    // watches in this app.
    func sessionDidBecomeInactive(_ session: WCSession) { /* no-op */ }
    func sessionDidDeactivate(_ session: WCSession) {
        // After deactivation the docs recommend re-activating so
        // we can re-pair with a different watch. We don't ever
        // expect to hit this in practice but it's cheap.
        WCSession.default.activate()
    }
}

// MARK: - Expo module

public class CoylWatchModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CoylWatch")

        // Eagerly activate the session when the module loads so
        // the first call from JS isn't racing with delegate setup.
        OnCreate {
            if #available(iOS 13.0, *) {
                _ = CoylWatchSessionManager.shared.activateIfNeeded()
            }
        }

        // MARK: sendIntervention
        //
        // Fires a haptic interrupt on the wrist. Returns false if
        // no watch is paired or the watch isn't currently reachable
        // — the phone-side caller can then fall back to a phone
        // haptic / banner.
        AsyncFunction("sendIntervention") {
            (mode: String, headline: String, subhead: String, promise: Promise) in
            if #available(iOS 13.0, *) {
                let payload: [String: Any] = [
                    "kind": "interrupt",
                    "mode": mode,
                    "headline": headline,
                    "subhead": subhead,
                    "sentAtIso": ISO8601DateFormatter().string(from: Date()),
                ]
                let queued = CoylWatchSessionManager.shared.send(
                    payload,
                    prefersImmediate: true
                )
                promise.resolve(queued)
            } else {
                promise.resolve(false)
            }
        }

        // MARK: syncDailyNumber
        //
        // Writes the payload to the shared App Group (so the
        // watch UI / complication can read it on next refresh)
        // AND messages the watch to nudge an immediate reload.
        // The App Group write is the durable surface; the message
        // is the realtime hint.
        AsyncFunction("syncDailyNumber") { (payload: [String: Any], promise: Promise) in
            // Write the App Group. This is the source of truth —
            // the watch reads UserDefaults at every complication
            // timeline tick, so even if the realtime message
            // never lands, values eventually catch up.
            if let defaults = UserDefaults(suiteName: "group.com.coyl.shared") {
                if let score = payload["selfTrustScore"] as? Int {
                    defaults.set(score, forKey: "coyl.selfTrustScore")
                }
                if let day = payload["dayNumber"] as? Int {
                    defaults.set(day, forKey: "coyl.dayNumber")
                }
                if let sentence = payload["identitySentence"] as? String {
                    defaults.set(sentence, forKey: "coyl.identitySentence")
                }
                defaults.synchronize()
            } else {
                NSLog("[COYL] App Group group.com.coyl.shared unavailable on phone side")
            }

            // Nudge the watch. transferUserInfo is acceptable here
            // because the daily number changes ~once per day — a
            // few-second delay is invisible to the user.
            if #available(iOS 13.0, *) {
                var msg: [String: Any] = ["kind": "syncDailyNumber"]
                // Forward the fields explicitly so the watch can
                // double-write them locally without touching the
                // App Group (faster path).
                if let score = payload["selfTrustScore"] as? Int {
                    msg["selfTrustScore"] = score
                }
                if let day = payload["dayNumber"] as? Int {
                    msg["dayNumber"] = day
                }
                if let sentence = payload["identitySentence"] as? String {
                    msg["identitySentence"] = sentence
                }
                _ = CoylWatchSessionManager.shared.send(msg, prefersImmediate: false)
            }

            promise.resolve(nil)
        }

        // MARK: isWatchPaired
        //
        // Used by JS to gate "show Watch onboarding card" UI.
        // Returns false on devices that don't support WCSession
        // at all (iPad, etc.) and on iPhones with no paired watch.
        AsyncFunction("isWatchPaired") { (promise: Promise) in
            if #available(iOS 13.0, *) {
                _ = CoylWatchSessionManager.shared.activateIfNeeded()
                promise.resolve(CoylWatchSessionManager.shared.isWatchPaired)
            } else {
                promise.resolve(false)
            }
        }
    }
}
