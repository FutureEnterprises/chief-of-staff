//
//  SensorPublisher.swift
//  COYL Desktop — EAP Coordinator
//
//  Periodic publish loop. Reads the macOS sensors we have grants for
//  and POSTs a snapshot to the server. The server fans the events
//  out to any LLM that has subscribed via EAP primitive #5
//  (Sensor Subscription).
//
//  We DON'T stream — bursty publishes with deltas would be nicer but
//  more code; v0.1 publishes a full snapshot every 60s. The server's
//  delta-filter (configured per subscription) decides whether to fan
//  it out.
//
//  Sensor matrix:
//    - screen_state             cheap; always read
//    - battery                  cheap; always read
//    - foreground_app           cheap; always read
//    - calendar_meeting_density EventKit; skipped without grant
//    - typing_pace              NSEvent global monitor; skipped
//                               without Accessibility grant
//

import AppKit
import Foundation
import IOKit
import IOKit.ps

#if canImport(EventKit)
import EventKit
#endif

@MainActor
final class SensorPublisher {
    static let shared = SensorPublisher()

    /// How often we publish. Tunable via UserDefaults.
    var publishIntervalSeconds: TimeInterval = 60

    private var timer: Timer?
    private var typingMonitor: Any?
    private var recentKeyDowns: [Date] = []

    func start() {
        let userInterval = UserDefaults.standard
            .double(forKey: "COYLDesktop.publishIntervalSeconds")
        if userInterval > 0 { publishIntervalSeconds = userInterval }

        timer?.invalidate()
        timer = Timer.scheduledTimer(
            withTimeInterval: publishIntervalSeconds,
            repeats: true
        ) { [weak self] _ in
            Task { @MainActor in await self?.publishOnce() }
        }
        startTypingMonitorIfGranted()
    }

    func stop() {
        timer?.invalidate()
        timer = nil
        if let monitor = typingMonitor {
            NSEvent.removeMonitor(monitor)
            typingMonitor = nil
        }
    }

    // MARK: - Publish

    func publishOnce() async {
        guard
            let deviceId = DeviceRegistration.cachedLocalState()?.deviceId,
            AuthStore.shared.preferredBearerToken != nil
        else { return }

        let snapshot = readSnapshot()
        await postSnapshot(deviceId: deviceId, snapshot: snapshot)
    }

    /// Snapshot the device. Each key is an EAP sensor name; absent
    /// keys mean "no grant" or "unavailable".
    func readSnapshot() -> [String: JSONValue] {
        var out: [String: JSONValue] = [:]

        out["screen_state"] = .object([
            "displayOn": .bool(isDisplayOn()),
            "asOf": .string(ISO8601DateFormatter().string(from: Date())),
        ])

        let pct = readBatteryPercent()
        if pct >= 0 {
            out["battery"] = .object([
                "percent": .number(Double(pct)),
                "charging": .bool(isOnAC()),
            ])
        }

        if let frontApp = NSWorkspace.shared.frontmostApplication {
            out["foreground_app"] = .object([
                "bundleId": .string(frontApp.bundleIdentifier ?? "unknown"),
                "name": .string(frontApp.localizedName ?? ""),
            ])
        }

        if let meetingDensity = readCalendarDensity() {
            out["calendar_meeting_density"] = .number(meetingDensity)
        }

        // Typing pace = keys per minute, rolling 5-minute window.
        let kpm = typingPaceKeysPerMinute()
        if kpm >= 0 {
            out["typing_pace"] = .number(Double(kpm))
        }

        return out
    }

    // MARK: - Sensor readers

    private func isDisplayOn() -> Bool {
        // CGSession idle / display sleep query. The exact private
        // API differs across macOS releases; we use the public
        // CGSessionCopyCurrentDictionary as a proxy. Returns true if
        // the user has a session (i.e., not at the login window).
        if let dict = CGSessionCopyCurrentDictionary() as? [String: Any] {
            if let onConsole = dict["kCGSSessionOnConsoleKey"] as? Bool {
                return onConsole
            }
        }
        return true
    }

    private func isOnAC() -> Bool {
        guard
            let snapshot = IOPSCopyPowerSourcesInfo()?.takeRetainedValue(),
            let sources = IOPSCopyPowerSourcesList(snapshot)?.takeRetainedValue()
                as? [CFTypeRef]
        else { return false }

        for source in sources {
            guard
                let desc = IOPSGetPowerSourceDescription(snapshot, source)?
                    .takeUnretainedValue() as? [String: Any],
                let state = desc[kIOPSPowerSourceStateKey] as? String
            else { continue }
            if state == kIOPSACPowerValue { return true }
        }
        return false
    }

    private func readBatteryPercent() -> Int {
        guard
            let snapshot = IOPSCopyPowerSourcesInfo()?.takeRetainedValue(),
            let sources = IOPSCopyPowerSourcesList(snapshot)?.takeRetainedValue()
                as? [CFTypeRef]
        else { return -1 }
        for source in sources {
            guard
                let desc = IOPSGetPowerSourceDescription(snapshot, source)?
                    .takeUnretainedValue() as? [String: Any],
                let capacity = desc[kIOPSCurrentCapacityKey] as? Int
            else { continue }
            return capacity
        }
        return -1
    }

    /// Today's meeting count. -1 if the user hasn't granted Calendar
    /// access; coordinator omits the key in that case.
    private func readCalendarDensity() -> Double? {
        #if canImport(EventKit)
        let store = EKEventStore()
        let status = EKEventStore.authorizationStatus(for: .event)
        // `.fullAccess` is macOS 14+; `.authorized` is the macOS 13
        // equivalent. Accept either so the coordinator works across
        // the deployment range.
        if #available(macOS 14.0, *) {
            guard status == .fullAccess || status == .authorized else { return nil }
        } else {
            guard status == .authorized else { return nil }
        }

        let cal = Calendar.current
        let now = Date()
        let start = cal.startOfDay(for: now)
        let end = cal.date(byAdding: .day, value: 1, to: start) ?? now
        let predicate = store.predicateForEvents(
            withStart: start,
            end: end,
            calendars: nil
        )
        let events = store.events(matching: predicate)
        return Double(events.count)
        #else
        return nil
        #endif
    }

    // MARK: - Typing pace

    /// Global NSEvent monitor for keyDown. Requires Accessibility
    /// permission. If the user hasn't granted, addGlobalMonitorForEvents
    /// returns a non-nil handle but never fires — we report -1.
    private func startTypingMonitorIfGranted() {
        guard AXIsProcessTrusted() else { return }
        typingMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] _ in
            guard let self = self else { return }
            self.recentKeyDowns.append(Date())
            // Trim to last 5 minutes.
            let cutoff = Date().addingTimeInterval(-300)
            self.recentKeyDowns.removeAll { $0 < cutoff }
        }
    }

    private func typingPaceKeysPerMinute() -> Int {
        guard AXIsProcessTrusted() else { return -1 }
        let cutoff = Date().addingTimeInterval(-60)
        return recentKeyDowns.filter { $0 >= cutoff }.count
    }

    // MARK: - POST

    /// POST /api/eap/v1/sensor/<deviceId>/publish — documented
    /// expectation. The server endpoint matching this contract is
    /// NOT yet shipped; this is the snapshot endpoint the macOS
    /// coordinator expects (sibling iOS / browser coordinators do
    /// the same).
    private func postSnapshot(deviceId: String, snapshot: [String: JSONValue]) async {
        let coordinator = EAPCoordinator.shared
        let url = coordinator.baseURL.appendingPathComponent(
            "/api/eap/v1/sensor/\(deviceId)/publish"
        )
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = AuthStore.shared.preferredBearerToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let body = SnapshotPayload(snapshot: snapshot, asOf: Date())
        do {
            req.httpBody = try JSONEncoder.eap.encode(body)
        } catch {
            return
        }
        do {
            _ = try await URLSession.shared.data(for: req)
        } catch {
            // Silent: sensor stream is best-effort.
        }
    }

    private struct SnapshotPayload: Encodable {
        let snapshot: [String: JSONValue]
        let asOf: Date
    }
}
