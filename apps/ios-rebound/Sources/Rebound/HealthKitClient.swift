//
//  HealthKitClient.swift
//  Rebound
//
//  Thin wrapper around HealthKit. v0.5 reads:
//    - heart rate (stress proxy)
//    - sleep analysis (routine anomaly signal)
//    - active energy burned (activity proxy)
//
//  Writes nothing back. Patients are paranoid about their health data,
//  reasonably, and we don't need write access for the v0.5 catch.
//

import Foundation
#if canImport(HealthKit)
import HealthKit
#endif

@MainActor
public final class HealthKitClient {
    public static let shared = HealthKitClient()

    private init() {}

    #if canImport(HealthKit)
    private let store = HKHealthStore()

    /// Request read-only authorization for the three types we use.
    /// Returns true if the user granted all three; false otherwise.
    /// We don't degrade gracefully on partial grants yet — that's a
    /// v0.7 nice-to-have.
    public func requestAuthorization() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else { return false }

        let read: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
        ]

        do {
            try await store.requestAuthorization(toShare: [], read: read)
            return true
        } catch {
            return false
        }
    }
    #else
    /// macOS-only fallback for `swift test` runs. Always returns true.
    public func requestAuthorization() async -> Bool { true }
    #endif
}
