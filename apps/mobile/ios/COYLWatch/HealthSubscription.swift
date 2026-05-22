//
//  HealthSubscription.swift
//  COYLWatch
//
//  Real-time HRV-spike detector. Wraps an HKObserverQuery on the
//  SDNN HRV sample type and computes a rolling 14-day baseline
//  (median of nightly samples) against incoming samples. When a
//  new sample is more than 15% below baseline in a 60-minute
//  window, we emit a Snapshot to the owner — SensorPublisher then
//  POSTs it to /api/eap/v1/sensor/snapshot/realtime so the cloud
//  coordinator can fan out to subscribed LLM partners.
//
//  Why HRV drops matter to EAP:
//    HRV dropping sharply is the cleanest physiological proxy for
//    acute stress / sleep deprivation / illness onset / impending
//    impulse-event. PAP-side LLM partners that subscribed via
//    EAP §5 use it as a trigger to compose an intervention. The
//    Watch is the only device class with reliable HRV streaming;
//    the phone reads HealthKit but lags behind the live wrist sensor.
//
//  Rolling baseline strategy:
//    We query the last 14 days of HRV samples at observer-fire
//    time and take the median. Median is more robust than mean
//    against outliers (stress days, illness days). 14 days is the
//    minimum window that smooths weekday/weekend cycles.
//
//  Delta computation:
//    deltaPct = (sample - baseline) / baseline * 100
//    Negative values = drop. We fire on `deltaPct < -15` AND the
//    most recent fire was > 60 minutes ago (rate limit, so a long
//    high-stress event doesn't flood the cloud).
//
//  Background delivery:
//    HKObserverQuery + HKHealthStore.enableBackgroundDelivery is
//    what lets watchOS wake the app for new HRV samples even when
//    the app isn't foreground. Requires HealthKit capability +
//    Background Delivery enabled in the project.
//
//  watchOS 10.0+ — HealthKit.
//

import Foundation
import HealthKit

@available(watchOS 10.0, *)
final class HealthSubscription {

    /// Public payload emitted upstream when a spike is detected.
    struct Snapshot {
        let observedAt: Date
        let valueMs: Double      // most recent SDNN sample, ms
        let baselineMs: Double   // 14-day rolling median, ms
        let deltaPct: Double     // (value - baseline) / baseline * 100
    }

    /// Spike threshold in percent — fires when the latest sample is
    /// MORE than this much below baseline. Negative number; -15.0
    /// means a 15% drop.
    private let dropThresholdPct: Double = -15.0

    /// Minimum cool-down between fires. Stops a sustained spike
    /// from flooding the cloud.
    private let minIntervalBetweenFires: TimeInterval = 60 * 60 // 60min

    /// Window over which we build the baseline.
    private let baselineLookbackDays: Int = 14

    private let healthStore: HKHealthStore
    private let onSpike: (Snapshot) -> Void

    private var observerQuery: HKObserverQuery?
    private var anchorQuery: HKAnchoredObjectQuery?
    private var lastFireAt: Date?
    private var anchor: HKQueryAnchor?

    private var hrvType: HKQuantityType {
        HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!
    }

    init(healthStore: HKHealthStore, onSpike: @escaping (Snapshot) -> Void) {
        self.healthStore = healthStore
        self.onSpike = onSpike
    }

    // MARK: - Lifecycle

    /// Begin subscribing. Two queries fire in tandem:
    ///   - HKObserverQuery: the "ping" that wakes us on a new sample
    ///   - HKAnchoredObjectQuery: pulls the new sample(s) since last
    ///     anchor so we don't reprocess history every wake
    func start() {
        // 1. Enable background delivery so HealthKit wakes us when a
        //    new HRV sample lands even if the app is suspended.
        healthStore.enableBackgroundDelivery(for: hrvType, frequency: .immediate) { ok, error in
            if let error {
                NSLog("[HealthSub] enableBackgroundDelivery error: \(error.localizedDescription)")
            }
            if !ok {
                NSLog("[HealthSub] background delivery not granted (likely permission)")
            }
        }

        // 2. Observer query — just a notification, no payload. We
        //    react by running the anchored query.
        let obs = HKObserverQuery(sampleType: hrvType, predicate: nil) { [weak self] _, completionHandler, error in
            if let error {
                NSLog("[HealthSub] observer error: \(error.localizedDescription)")
                completionHandler()
                return
            }
            self?.processNewSamples {
                // Tell HealthKit we're done with this wake so it can
                // throttle subsequent fires appropriately.
                completionHandler()
            }
        }
        healthStore.execute(obs)
        observerQuery = obs
    }

    /// Stop observing — useful for tests and for a panic-switch state
    /// where we want to suspend all sensor publishing.
    func stop() {
        if let obs = observerQuery {
            healthStore.stop(obs)
            observerQuery = nil
        }
        if let anc = anchorQuery {
            healthStore.stop(anc)
            anchorQuery = nil
        }
        healthStore.disableBackgroundDelivery(for: hrvType) { _, _ in }
    }

    // MARK: - Sample processing

    /// Pull all new HRV samples since the last anchor, recompute the
    /// rolling baseline, and check the most recent sample for a spike.
    private func processNewSamples(completion: @escaping () -> Void) {
        // Cancel any prior in-flight anchored query.
        if let anc = anchorQuery {
            healthStore.stop(anc)
            anchorQuery = nil
        }

        let query = HKAnchoredObjectQuery(
            type: hrvType,
            predicate: nil,
            anchor: anchor,
            limit: HKObjectQueryNoLimit
        ) { [weak self] _, samples, _, newAnchor, error in
            guard let self else { completion(); return }
            if let error {
                NSLog("[HealthSub] anchored query error: \(error.localizedDescription)")
                completion()
                return
            }
            self.anchor = newAnchor
            let quantitySamples = (samples as? [HKQuantitySample]) ?? []
            // We only care about the LATEST sample for spike detection.
            // The anchored query returns them in arrival order, so
            // take the last by endDate.
            guard let latest = quantitySamples.max(by: { $0.endDate < $1.endDate }) else {
                completion()
                return
            }
            self.evaluateAgainstBaseline(latest, completion: completion)
        }
        healthStore.execute(query)
        anchorQuery = query
    }

    /// Build the rolling baseline by querying the last N days of
    /// HRV samples, taking the median, then comparing the latest
    /// sample value against it.
    private func evaluateAgainstBaseline(_ latest: HKQuantitySample,
                                         completion: @escaping () -> Void) {
        let end = Date()
        let start = Calendar.current.date(
            byAdding: .day,
            value: -baselineLookbackDays,
            to: end
        ) ?? end.addingTimeInterval(-Double(baselineLookbackDays) * 86400)

        let predicate = HKQuery.predicateForSamples(
            withStart: start,
            end: end,
            options: .strictStartDate
        )
        let query = HKSampleQuery(
            sampleType: hrvType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { [weak self] _, samples, error in
            guard let self else { completion(); return }
            if let error {
                NSLog("[HealthSub] baseline query error: \(error.localizedDescription)")
                completion()
                return
            }
            let values = (samples as? [HKQuantitySample] ?? []).map { s in
                s.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
            }
            // Need at least 7 samples (one a day for a week) before
            // baseline is meaningful. Otherwise skip — we'd false-
            // positive on first-week installs.
            guard values.count >= 7 else { completion(); return }

            let baseline = self.median(values)
            guard baseline > 0 else { completion(); return }

            let latestMs = latest.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
            let deltaPct = ((latestMs - baseline) / baseline) * 100.0

            if deltaPct < self.dropThresholdPct,
               self.cooldownExpired() {
                self.lastFireAt = Date()
                let snap = Snapshot(
                    observedAt: latest.endDate,
                    valueMs: latestMs,
                    baselineMs: baseline,
                    deltaPct: deltaPct
                )
                self.onSpike(snap)
            }
            completion()
        }
        healthStore.execute(query)
    }

    // MARK: - Helpers

    /// Standard 50th-percentile median (interpolated for even N).
    private func median(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        let sorted = values.sorted()
        let mid = sorted.count / 2
        if sorted.count % 2 == 0 {
            return (sorted[mid - 1] + sorted[mid]) / 2.0
        }
        return sorted[mid]
    }

    /// Rate limit gate. Allows the first fire of the process and
    /// then every `minIntervalBetweenFires` thereafter.
    private func cooldownExpired() -> Bool {
        guard let last = lastFireAt else { return true }
        return Date().timeIntervalSince(last) >= minIntervalBetweenFires
    }
}
