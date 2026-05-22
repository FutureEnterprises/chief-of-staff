//
//  SensorPublisher.swift
//  COYLWatch
//
//  Periodic background publisher of Watch-specific sensor batches.
//  Three execution paths:
//
//    1. `WKExtendedRuntimeSession` during workouts — when a workout
//       is active the Watch grants up to ~1h of foreground-equivalent
//       runtime; we sample at higher frequency during this window.
//    2. `WKApplicationRefreshBackgroundTask` every 1-4 hours — the
//       standard background refresh path. We schedule the next task
//       at the end of each invocation; watchOS grants budget on the
//       order of one wake every couple of hours.
//    3. `HKObserverQuery` for real-time HRV spike notifications —
//       streaming, not polling. See HealthSubscription.swift for the
//       detector logic; this file just owns the lifecycle.
//
//  All sensor reads use HealthKit (HKHealthStore). HealthKit must be
//  authorized — we trigger the prompt on first launch from the Watch
//  app (`requestAuthorization`). The phone-side onboarding pre-warms
//  the user's expectation that the Watch will ask.
//
//  Once a batch is read, we POST to coyl.ai/api/v1/health/ingest
//  (existing endpoint). The Bearer token is read from the shared
//  App Group, same as EAPCoordinator.
//
//  watchOS 10.0+ — HealthKit, WatchKit (WKExtendedRuntimeSession,
//  background tasks), URLSession.
//

import Foundation
import HealthKit
import WatchKit

@available(watchOS 10.0, *)
final class SensorPublisher: NSObject {

    static let shared = SensorPublisher()

    // HealthKit store — singleton-ish; instantiate once.
    let healthStore = HKHealthStore()

    // Cloud base URL — same as EAPCoordinator.
    private let apiBase = URL(string: "https://coyl.ai")!

    // App Group for auth + userId lookup.
    private let appGroup = "group.com.coyl.shared"

    // URLSession for batch uploads. Background sessions are more
    // expensive to set up; for typical batch sizes (a few hundred
    // bytes each), default config is fine.
    private let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 20
        cfg.allowsCellularAccess = true
        cfg.waitsForConnectivity = true
        return URLSession(configuration: cfg)
    }()

    // Tracks the in-flight extended-runtime session during workouts.
    private var runtimeSession: WKExtendedRuntimeSession?

    // The HRV-spike subscription. Owned by HealthSubscription.
    private(set) var hrvSubscription: HealthSubscription?

    // The HealthKit types we read. Stand hour is a category type;
    // the others are quantity types.
    private var quantityTypesToRead: Set<HKQuantityType> {
        Set([
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        ])
    }

    private var categoryTypesToRead: Set<HKCategoryType> {
        Set([
            HKCategoryType.categoryType(forIdentifier: .appleStandHour)!
        ])
    }

    private override init() {
        super.init()
    }

    // MARK: - Public lifecycle

    /// Called from COYLWatchApp on first launch. Idempotent: re-asks
    /// HealthKit for authorization (returns immediately if already
    /// granted), schedules the next background refresh, and starts
    /// the HRV-spike observer.
    func bootstrap() {
        guard HKHealthStore.isHealthDataAvailable() else {
            NSLog("[Sensor] HealthKit unavailable on this device")
            return
        }

        // HealthKit's requestAuthorization expects Set<HKObjectType>;
        // quantityTypesToRead / categoryTypesToRead are subtypes —
        // build the union by walking each set and adding into a
        // common Set<HKObjectType>.
        var readTypes: Set<HKObjectType> = []
        for t in quantityTypesToRead { readTypes.insert(t) }
        for t in categoryTypesToRead { readTypes.insert(t) }

        healthStore.requestAuthorization(toShare: nil, read: readTypes) { granted, error in
            if let error {
                NSLog("[Sensor] HealthKit auth error: \(error.localizedDescription)")
                return
            }
            if !granted {
                // User declined; we silently skip — the Watch UI
                // already prompts via onboarding text.
                return
            }
            // Authorization granted (or previously granted). Start
            // the streaming HRV observer and schedule the first
            // periodic refresh.
            self.startHRVObserver()
            self.scheduleNextRefresh()
        }
    }

    /// Called by the WatchKit extension delegate (set up via the
    /// SwiftUI app lifecycle's `.backgroundTask` modifier) when iOS
    /// hands us a periodic refresh window. We do one read+publish
    /// cycle then reschedule.
    func handleBackgroundRefresh(_ task: WKApplicationRefreshBackgroundTask) {
        publishLatestBatch { [weak self] in
            self?.scheduleNextRefresh()
            // setTaskCompletedWithSnapshot is what watchOS expects;
            // pass false because we didn't mutate the UI snapshot.
            task.setTaskCompletedWithSnapshot(false)
        }
    }

    /// Begin an extended-runtime session. Call this when the user
    /// starts a workout from the phone (the phone-side coordinator
    /// signals us via WCSession message kind="workoutStarted") or
    /// when the Watch detects a workout autonomously.
    func startWorkoutSession() {
        guard runtimeSession == nil else { return }
        let s = WKExtendedRuntimeSession()
        s.delegate = self
        s.start()
        runtimeSession = s
    }

    /// End the workout-window extended session. The watchOS scheduler
    /// will pick up periodic refreshes from there.
    func endWorkoutSession() {
        runtimeSession?.invalidate()
        runtimeSession = nil
    }

    // MARK: - Periodic batch publish

    /// Reads the last hour of samples for each tracked type and
    /// POSTs a single batch to /api/v1/health/ingest.
    func publishLatestBatch(completion: @escaping () -> Void) {
        let group = DispatchGroup()
        var batch: [[String: Any]] = []

        let end = Date()
        // Look back one hour. The cloud is idempotent on (type,
        // startDate); a slightly-overlapping window is fine.
        let start = end.addingTimeInterval(-3600)

        for type in quantityTypesToRead {
            group.enter()
            readQuantitySamples(type: type, start: start, end: end) { samples in
                batch.append(contentsOf: samples)
                group.leave()
            }
        }

        group.enter()
        readStandHours(start: start, end: end) { samples in
            batch.append(contentsOf: samples)
            group.leave()
        }

        group.notify(queue: .main) {
            if batch.isEmpty {
                completion()
                return
            }
            self.uploadBatch(batch) { _ in completion() }
        }
    }

    // MARK: - HRV observer

    /// Wires up the streaming HRV subscription. The HealthSubscription
    /// object owns the rolling baseline + delta detection; we just
    /// hold the reference so the query stays alive for the process
    /// lifetime.
    private func startHRVObserver() {
        guard hrvSubscription == nil else { return }
        let sub = HealthSubscription(healthStore: healthStore) { snapshot in
            // Spike detected. Post a real-time snapshot to the EAP
            // sensor channel so the cloud coordinator can decide
            // whether to wake subscribed LLM partners. See
            // HealthSubscription.realtimePOST(_:) for the wire.
            self.postRealtimeSpike(snapshot)
        }
        sub.start()
        hrvSubscription = sub
    }

    /// POST a real-time HRV snapshot to the EAP coordinator. This is
    /// distinct from the batched /health/ingest path — this is a
    /// LOW-LATENCY signal that an LLM partner is likely subscribed
    /// to via §5 (Sensor Subscription).
    private func postRealtimeSpike(_ snapshot: HealthSubscription.Snapshot) {
        let body: [String: Any] = [
            "deviceClass": "apple_watch",
            "sensor": "hrv_proxy",
            "asOf": ISO8601DateFormatter().string(from: snapshot.observedAt),
            "value": snapshot.valueMs,
            "baselineMs": snapshot.baselineMs,
            "deltaPct": snapshot.deltaPct,
            "direction": snapshot.deltaPct < 0 ? "down" : "up"
        ]
        post(path: "/api/eap/v1/sensor/snapshot/realtime", body: body) { ok in
            if !ok { NSLog("[Sensor] HRV-spike realtime POST failed") }
        }
    }

    // MARK: - Background refresh scheduling

    /// Schedule the next periodic refresh. watchOS doesn't honor a
    /// strict interval — we hint at +1h but the system may delay up
    /// to ~4h depending on power/usage. The deadline must be in the
    /// future; passing `nil` user-info because we don't carry state
    /// across invocations.
    private func scheduleNextRefresh() {
        let nextDate = Date().addingTimeInterval(60 * 60) // +1h hint
        WKExtension.shared().scheduleBackgroundRefresh(
            withPreferredDate: nextDate,
            userInfo: nil
        ) { error in
            if let error {
                NSLog("[Sensor] scheduleBackgroundRefresh error: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - HealthKit reads

    /// Reads quantity samples in [start, end] for one type. Returns
    /// an array of dicts shaped for the /health/ingest payload.
    private func readQuantitySamples(type: HKQuantityType,
                                     start: Date,
                                     end: Date,
                                     completion: @escaping ([[String: Any]]) -> Void) {
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let query = HKSampleQuery(
            sampleType: type,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { _, samples, error in
            if let error {
                NSLog("[Sensor] read \(type.identifier) error: \(error.localizedDescription)")
                completion([])
                return
            }
            let arr: [[String: Any]] = (samples as? [HKQuantitySample] ?? []).map { s in
                let unit = Self.canonicalUnit(for: type)
                return [
                    "type": Self.canonicalIdentifier(for: type),
                    "value": s.quantity.doubleValue(for: unit),
                    "unit": Self.unitString(for: type),
                    "startDate": ISO8601DateFormatter().string(from: s.startDate),
                    "endDate": ISO8601DateFormatter().string(from: s.endDate),
                    "source": "apple_watch"
                ]
            }
            completion(arr)
        }
        healthStore.execute(query)
    }

    /// Stand hours is a category type — different sample shape.
    private func readStandHours(start: Date,
                                end: Date,
                                completion: @escaping ([[String: Any]]) -> Void) {
        guard let type = HKCategoryType.categoryType(forIdentifier: .appleStandHour) else {
            completion([])
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let query = HKSampleQuery(
            sampleType: type,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { _, samples, error in
            if let error {
                NSLog("[Sensor] read standHour error: \(error.localizedDescription)")
                completion([])
                return
            }
            let arr: [[String: Any]] = (samples as? [HKCategorySample] ?? []).map { s in
                return [
                    "type": "stand_hour",
                    "value": s.value, // 0 = idle, 1 = stood
                    "unit": "category",
                    "startDate": ISO8601DateFormatter().string(from: s.startDate),
                    "endDate": ISO8601DateFormatter().string(from: s.endDate),
                    "source": "apple_watch"
                ]
            }
            completion(arr)
        }
        healthStore.execute(query)
    }

    // MARK: - Unit + identifier helpers

    private static func canonicalUnit(for type: HKQuantityType) -> HKUnit {
        switch type.identifier {
        case HKQuantityTypeIdentifier.heartRateVariabilitySDNN.rawValue:
            return HKUnit.secondUnit(with: .milli) // ms
        case HKQuantityTypeIdentifier.restingHeartRate.rawValue:
            // BPM = count / min
            return HKUnit.count().unitDivided(by: HKUnit.minute())
        case HKQuantityTypeIdentifier.activeEnergyBurned.rawValue:
            return HKUnit.kilocalorie()
        default:
            return HKUnit.count()
        }
    }

    private static func unitString(for type: HKQuantityType) -> String {
        switch type.identifier {
        case HKQuantityTypeIdentifier.heartRateVariabilitySDNN.rawValue: return "ms"
        case HKQuantityTypeIdentifier.restingHeartRate.rawValue: return "bpm"
        case HKQuantityTypeIdentifier.activeEnergyBurned.rawValue: return "kcal"
        default: return "count"
        }
    }

    private static func canonicalIdentifier(for type: HKQuantityType) -> String {
        switch type.identifier {
        case HKQuantityTypeIdentifier.heartRateVariabilitySDNN.rawValue: return "hrv_proxy"
        case HKQuantityTypeIdentifier.restingHeartRate.rawValue: return "resting_heart_rate"
        case HKQuantityTypeIdentifier.activeEnergyBurned.rawValue: return "active_energy_burned"
        default: return type.identifier
        }
    }

    // MARK: - HTTP

    /// Uploads a batch of sensor samples to /api/v1/health/ingest.
    private func uploadBatch(_ samples: [[String: Any]],
                             completion: @escaping (Bool) -> Void) {
        let userId = sharedDefaults()?.string(forKey: "coyl.userId") ?? ""
        let body: [String: Any] = [
            "userId": userId,
            "samples": samples,
            "source": "apple_watch"
        ]
        post(path: "/api/v1/health/ingest", body: body, completion: completion)
    }

    /// JSON POST with Bearer auth from the App Group.
    func post(path: String, body: [String: Any], completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: path, relativeTo: apiBase) else {
            completion(false); return
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = sharedDefaults()?.string(forKey: "coyl.authToken") {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        do {
            req.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            completion(false); return
        }
        let task = session.dataTask(with: req) { _, response, error in
            if error != nil { completion(false); return }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            completion((200..<300).contains(status))
        }
        task.resume()
    }

    private func sharedDefaults() -> UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }
}

// MARK: - WKExtendedRuntimeSessionDelegate

@available(watchOS 10.0, *)
extension SensorPublisher: WKExtendedRuntimeSessionDelegate {
    func extendedRuntimeSession(_ extendedRuntimeSession: WKExtendedRuntimeSession,
                                didInvalidateWith reason: WKExtendedRuntimeSessionInvalidationReason,
                                error: Error?) {
        if let error {
            NSLog("[Sensor] runtime session invalidated: \(reason.rawValue) — \(error.localizedDescription)")
        }
        if extendedRuntimeSession === runtimeSession {
            runtimeSession = nil
        }
    }

    func extendedRuntimeSessionDidStart(_ extendedRuntimeSession: WKExtendedRuntimeSession) {
        // Kick off a higher-frequency batch immediately. The watch
        // is awake; take advantage of it.
        publishLatestBatch { /* no-op */ }
    }

    func extendedRuntimeSessionWillExpire(_ extendedRuntimeSession: WKExtendedRuntimeSession) {
        // Final flush before iOS pulls runtime.
        publishLatestBatch { /* no-op */ }
    }
}
