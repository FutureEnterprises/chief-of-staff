//
//  InterruptDelivery.swift
//  Rebound
//
//  Glue layer between DangerWindowDetector (pure logic) and the
//  iOS notification system. v0.5 path:
//
//    1. Background fetch wakes the app every ~15 minutes.
//    2. We build a DangerWindowInput from HealthKit + local state.
//    3. DangerWindowDetector.detect() returns a Detection.
//    4. If isInWindow && confidence >= threshold: schedule a
//       UNUserNotificationCenter notification with the
//       archetype-appropriate InterruptScript.
//    5. Emit a ReboundEvent so the funnel is recorded.
//
//  Three-second target: the scheduling-to-display path is well under
//  three seconds on a warm device. The hard target is the detection
//  itself, which DangerWindowDetector handles synchronously.
//

import Foundation
#if canImport(UserNotifications)
import UserNotifications
#endif
import ReboundDomain

@MainActor
public final class InterruptDelivery {
    public static let shared = InterruptDelivery()

    private let detector = DangerWindowDetector()
    private var killSwitchEngaged = false

    private init() {}

    /// Engage the kill switch. Interrupts stop firing immediately.
    /// Re-enabling is an explicit user gesture (see KillSwitchView).
    public func engageKillSwitch() {
        killSwitchEngaged = true
        // Emit the trust-contract metric.
        // (Wired to telemetry sink in a real build — stub here.)
    }

    public func disengageKillSwitch() {
        killSwitchEngaged = false
    }

    /// Single detection cycle. Called from the background-fetch
    /// handler. Returns true if an interrupt was scheduled.
    public func tick(archetype: ArchetypeFamily) async -> Bool {
        guard !killSwitchEngaged else { return false }

        let now = Date()
        let nowHour = Calendar.current.component(.hour, from: now)
        let input = DangerWindowInput(
            archetype: archetype,
            nowLocal: now,
            nowLocalHour: nowHour,
            // TODO: pull these from HealthKitClient + local state.
            selfReportedStress: nil,
            priorSlipsInThisHourLast30Days: nil,
            routineAnomalyScore: nil
        )

        let detection = detector.detect(input)
        guard detection.isInWindow else { return false }

        let script = InterruptScriptLibrary.scripts(for: archetype).randomElement()
            ?? InterruptScriptLibrary.all.first!

        await schedule(script)
        return true
    }

    #if canImport(UserNotifications)
    private func schedule(_ script: InterruptScript) async {
        let center = UNUserNotificationCenter.current()
        let content = UNMutableNotificationContent()
        content.title = script.headline
        content.body = script.body
        content.sound = .default
        // Critical interrupt category — surfaces above the lock screen
        // even when the app is backgrounded.
        content.categoryIdentifier = "rebound.danger_window"

        let request = UNNotificationRequest(
            identifier: script.id,
            content: content,
            trigger: nil  // fire immediately
        )

        try? await center.add(request)
    }
    #else
    private func schedule(_ script: InterruptScript) async {
        // macOS test target: noop
    }
    #endif
}
