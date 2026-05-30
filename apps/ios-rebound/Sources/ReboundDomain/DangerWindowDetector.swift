//
//  DangerWindowDetector.swift
//  ReboundDomain
//
//  Detects when the patient is in a danger window. Pure logic — no
//  HealthKit, no UIKit, no networking. The iOS layer wires real
//  signals into DangerWindowInput; this file decides whether they
//  add up to "we should be ready to fire."
//
//  Three signals today (v0.5):
//    1. Time-of-day proximity to the archetype's peak hour.
//    2. Self-reported stress level (entered in the app or via
//       Watch shortcut).
//    3. Prior-pattern match (historical slip frequency in this
//       hour-of-day band).
//
//  Sub-three-second target: this function is on the synchronous path
//  for every relevant sensor change. Keep allocations zero or near it.
//

import Foundation

/// Inputs to a single detection cycle. Everything optional except the
/// archetype and the current time — those two alone produce a
/// schedule-only signal (the BASELINE), and adding more inputs makes
/// the confidence sharper.
public struct DangerWindowInput: Sendable {
    public let archetype: ArchetypeFamily
    public let nowLocal: Date
    public let nowLocalHour: Int
    /// 0.0 - 1.0. nil if the patient hasn't reported a level today.
    public let selfReportedStress: Double?
    /// Number of slips in this hour-of-day window over the last 30
    /// days. nil for new users.
    public let priorSlipsInThisHourLast30Days: Int?
    /// Detected anomaly in the patient's typical late-evening
    /// routine (e.g., didn't brush teeth by 9:30, lights still on
    /// past 11). nil if signals aren't available.
    public let routineAnomalyScore: Double?

    public init(
        archetype: ArchetypeFamily,
        nowLocal: Date,
        nowLocalHour: Int,
        selfReportedStress: Double? = nil,
        priorSlipsInThisHourLast30Days: Int? = nil,
        routineAnomalyScore: Double? = nil
    ) {
        self.archetype = archetype
        self.nowLocal = nowLocal
        self.nowLocalHour = nowLocalHour
        self.selfReportedStress = selfReportedStress
        self.priorSlipsInThisHourLast30Days = priorSlipsInThisHourLast30Days
        self.routineAnomalyScore = routineAnomalyScore
    }
}

/// A single detection. Confidence ∈ [0.0, 1.0]; the interrupt-firing
/// layer should not fire below ~0.55 (tuned empirically once we have
/// real engagement data).
public struct DangerWindowDetection: Sendable {
    public let isInWindow: Bool
    public let confidence: Double
    public let reason: String

    public static let none = DangerWindowDetection(
        isInWindow: false,
        confidence: 0.0,
        reason: "outside window"
    )
}

public struct DangerWindowDetector: Sendable {
    /// Tunable threshold — interrupts fire above this confidence.
    public let fireThreshold: Double

    public init(fireThreshold: Double = 0.55) {
        self.fireThreshold = fireThreshold
    }

    /// Run the detector synchronously. No I/O. No allocations beyond
    /// the small Detection struct return value.
    public func detect(_ input: DangerWindowInput) -> DangerWindowDetection {
        // Component 1: time-of-day proximity. Triangle peak at the
        // archetype's peak hour; falls off linearly within ±2 hours.
        let peakDelta = abs(input.nowLocalHour - input.archetype.peakHourLocalTime)
        let timeOfDayScore: Double
        switch peakDelta {
        case 0:    timeOfDayScore = 1.0
        case 1:    timeOfDayScore = 0.6
        case 2:    timeOfDayScore = 0.25
        default:   timeOfDayScore = 0.0
        }

        // Component 2: self-reported stress amplifies but does not
        // create a danger window on its own.
        let stressBoost = (input.selfReportedStress ?? 0.0) * 0.25

        // Component 3: prior-pattern match — historical density in
        // this hour. Capped at 0.25 contribution.
        let priorScore: Double = {
            guard let n = input.priorSlipsInThisHourLast30Days else { return 0.0 }
            // 8+ slips in 30d in this hour = saturated prior.
            return min(Double(n) / 8.0, 1.0) * 0.25
        }()

        // Component 4: routine anomaly (the "they always brush their
        // teeth by 9:30 and it's 9:42" signal).
        let anomalyBoost = (input.routineAnomalyScore ?? 0.0) * 0.15

        let total = timeOfDayScore * 0.5 + stressBoost + priorScore + anomalyBoost
        let confidence = min(max(total, 0.0), 1.0)
        let isInWindow = confidence >= fireThreshold

        let reason = "tod=\(String(format: "%.2f", timeOfDayScore)) stress+=\(String(format: "%.2f", stressBoost)) prior+=\(String(format: "%.2f", priorScore)) anomaly+=\(String(format: "%.2f", anomalyBoost))"

        return DangerWindowDetection(
            isInWindow: isInWindow,
            confidence: confidence,
            reason: reason
        )
    }
}
