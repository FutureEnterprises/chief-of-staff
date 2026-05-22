//
//  PanicCommand.swift
//  COYLWatch
//
//  Crown + side-button "panic" gesture handler. Triggers
//  POST /api/eap/v1/panic — the EAP §10 trust circuit-breaker —
//  which sets `PanicState.active = true` for 24h, immediately
//  denying every LLM action across the user's device fleet.
//
//  watchOS GESTURE LIMITATIONS:
//    Apple does not expose a direct "side-button-and-hold +
//    digital-crown" combined-gesture API to third-party apps.
//    The official surfaces we can use:
//
//      - DigitalCrownRotation modifier — for rotation deltas while
//        the wearer scrolls the crown
//      - WKExtension.applicationContextDidUpdate — for tap-style
//        signals from the side button (limited)
//      - Long-press SwiftUI gesture on the watch face area within
//        our app
//
//    The closest user-discoverable gesture we can ship today:
//      1. User opens the COYL Watch app
//      2. Presses + holds anywhere on the face for >= 2 seconds
//      3. Then rotates the crown briskly (>= 5 detents)
//    The combination is intentionally awkward to avoid accidental
//    panic trips. We mirror the same behavior the iPhone-side
//    panic gesture surfaces.
//
//    For a true side-button gesture, we'd need an Apple Watch
//    Action Button binding (Series 9+ Ultra only) via App Intents
//    — that's a future build.
//
//  This file owns:
//    - The gesture state machine (long-press → crown-rotate threshold)
//    - The POST to /api/eap/v1/panic
//    - Haptic confirmation feedback on trip
//    - A debounce so a single gesture can only fire panic once per
//      cool-down (60 seconds) to avoid double-trips
//
//  The actual SwiftUI view binding lives in COYLWatchView (which
//  isn't being touched in this PR — the wiring happens via the
//  `PanicGestureRecognizer.observe(...)` API exposed here so the
//  founder can hook it in a future view edit without changing this
//  module again).
//
//  watchOS 10.0+ — SwiftUI gestures, URLSession, WatchKit.
//

import Foundation
import SwiftUI
import WatchKit

@available(watchOS 10.0, *)
final class PanicCommand {

    static let shared = PanicCommand()

    private let apiBase = URL(string: "https://coyl.ai")!
    private let appGroup = "group.com.coyl.shared"

    private let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 10
        cfg.allowsCellularAccess = true
        cfg.waitsForConnectivity = true
        return URLSession(configuration: cfg)
    }()

    // Single-fire debounce.
    private var lastFireAt: Date?
    private let cooldown: TimeInterval = 60

    private init() {}

    // MARK: - Public — gesture recognition state

    /// Gesture recognizer kept on the SwiftUI view side. The view
    /// calls these in sequence as the wearer performs the long-
    /// press + crown-rotate combo. Once both conditions are met
    /// inside the same window, `trip()` is invoked.
    final class Recognizer: ObservableObject {
        private let activationWindow: TimeInterval = 5.0
        private let crownDetentThreshold: Double = 5.0

        @Published private(set) var armed: Bool = false
        private var armedAt: Date?
        private var crownAccumulator: Double = 0
        private let onTrip: () -> Void

        init(onTrip: @escaping () -> Void) {
            self.onTrip = onTrip
        }

        /// Called when the long-press fires. Arms the recognizer
        /// for `activationWindow` seconds.
        func longPressBegan() {
            armed = true
            armedAt = Date()
            crownAccumulator = 0
            // Auto-disarm after the window.
            DispatchQueue.main.asyncAfter(deadline: .now() + activationWindow) { [weak self] in
                self?.disarmIfExpired()
            }
            // Light haptic to acknowledge arming.
            WKInterfaceDevice.current().play(.click)
        }

        /// Called on every DigitalCrownRotation delta while armed.
        /// `delta` is the rotation increment (SwiftUI emits absolute
        /// values; we accumulate magnitude so direction doesn't
        /// matter — a brisk turn either way trips).
        func crownDelta(_ delta: Double) {
            guard armed else { return }
            crownAccumulator += abs(delta)
            if crownAccumulator >= crownDetentThreshold {
                fire()
            }
        }

        /// Manual cancel — e.g. user lifts their finger before the
        /// crown-rotate threshold is met.
        func cancel() {
            armed = false
            armedAt = nil
            crownAccumulator = 0
        }

        private func disarmIfExpired() {
            guard let armedAt else { return }
            if Date().timeIntervalSince(armedAt) >= activationWindow {
                cancel()
            }
        }

        private func fire() {
            armed = false
            armedAt = nil
            crownAccumulator = 0
            // Strong tactile feedback — three distinct beats so the
            // wearer KNOWS something serious just happened.
            let device = WKInterfaceDevice.current()
            device.play(.notification)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                WKInterfaceDevice.current().play(.notification)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.30) {
                WKInterfaceDevice.current().play(.notification)
            }
            onTrip()
        }
    }

    /// Factory helper — instantiates a recognizer pre-wired to
    /// fire `trip()`. The view-side code just owns a @StateObject
    /// of the returned Recognizer.
    func makeRecognizer() -> Recognizer {
        Recognizer { [weak self] in
            self?.trip(reason: "watch_crown_side_button_gesture")
        }
    }

    // MARK: - Trip

    /// Fires the panic POST. Debounced — a second call within the
    /// cooldown window is a no-op (the cloud is also idempotent,
    /// but no need to round-trip).
    func trip(reason: String, durationSec: Int? = nil) {
        if let last = lastFireAt, Date().timeIntervalSince(last) < cooldown {
            NSLog("[Panic] debounced — last fire \(Date().timeIntervalSince(last))s ago")
            return
        }
        lastFireAt = Date()

        var body: [String: Any] = ["reason": reason]
        if let durationSec { body["durationSec"] = durationSec }

        guard let token = sharedDefaults()?.string(forKey: "coyl.authToken") else {
            NSLog("[Panic] no auth token; CANNOT trip panic from Watch")
            return
        }

        guard let url = URL(string: "/api/eap/v1/panic", relativeTo: apiBase) else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        do {
            req.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            return
        }

        let task = session.dataTask(with: req) { _, response, error in
            if let error {
                NSLog("[Panic] POST failed: \(error.localizedDescription)")
                return
            }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            if (200..<300).contains(status) {
                NSLog("[Panic] tripped — all LLM scopes revoked for 24h")
                // Cache the panic-active flag locally so the Watch UI
                // can render an immediate state change without waiting
                // for the next refresh.
                self.sharedDefaults()?.set(true, forKey: "coyl.eap.panicActive")
                self.sharedDefaults()?.set(
                    Date().timeIntervalSince1970,
                    forKey: "coyl.eap.panicActivatedAt"
                )
            } else {
                NSLog("[Panic] server returned \(status)")
            }
        }
        task.resume()
    }

    // MARK: - Helpers

    private func sharedDefaults() -> UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }
}

// MARK: - SwiftUI view modifier
//
// Convenience modifier the founder can drop on COYLWatchView in a
// future commit. Not used by the existing view in this PR — but
// shipping it here so the gesture wiring is one line on the view
// side when it's added.

@available(watchOS 10.0, *)
struct PanicGestureModifier: ViewModifier {
    @StateObject private var recognizer: PanicCommand.Recognizer

    init() {
        _recognizer = StateObject(wrappedValue: PanicCommand.shared.makeRecognizer())
    }

    func body(content: Content) -> some View {
        content
            .gesture(
                LongPressGesture(minimumDuration: 2.0)
                    .onEnded { _ in recognizer.longPressBegan() }
            )
            // DigitalCrownRotation is a SwiftUI modifier on watchOS
            // that emits values as the wearer rotates the crown.
            // We accumulate deltas in the recognizer.
            .focusable()
            .digitalCrownRotation(
                detent: .constant(0.0),
                from: -100,
                through: 100,
                by: 1,
                sensitivity: .medium,
                isContinuous: true,
                isHapticFeedbackEnabled: false,
                onChange: { event in
                    recognizer.crownDelta(event.velocity)
                },
                onIdle: {
                    // No-op; the recognizer auto-disarms on its own
                    // window timer if the threshold wasn't met.
                }
            )
    }
}

@available(watchOS 10.0, *)
extension View {
    /// Drop on the wrist UI root to enable the panic gesture.
    ///   COYLWatchView().panicGesture()
    func panicGesture() -> some View {
        self.modifier(PanicGestureModifier())
    }
}
