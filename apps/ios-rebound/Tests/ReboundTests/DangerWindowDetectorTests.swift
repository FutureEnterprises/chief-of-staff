//
//  DangerWindowDetectorTests.swift
//  ReboundDomainTests
//
//  Tests the detection logic in isolation. The point of separating
//  ReboundDomain from the iOS app target is that this file runs
//  under `swift test` on Linux/macOS, no simulator required, so the
//  CI matrix can verify the catch logic without standing up Xcode.
//

import XCTest
@testable import ReboundDomain

final class DangerWindowDetectorTests: XCTestCase {

    func testOnPeakHourFires() {
        // 9 PM Negotiator at 9 PM → time-of-day score 1.0 ×
        // weight 0.5 = 0.5. Just below default 0.55 threshold;
        // tip over by adding a small stress signal.
        let input = DangerWindowInput(
            archetype: .ninePmNegotiator,
            nowLocal: Date(),
            nowLocalHour: 21,
            selfReportedStress: 0.3
        )
        let detection = DangerWindowDetector().detect(input)
        XCTAssertTrue(detection.isInWindow)
        XCTAssertGreaterThanOrEqual(detection.confidence, 0.55)
    }

    func testOffPeakHourDoesNotFire() {
        // 9 PM Negotiator at 11 AM → time-of-day score 0.0.
        let input = DangerWindowInput(
            archetype: .ninePmNegotiator,
            nowLocal: Date(),
            nowLocalHour: 11
        )
        let detection = DangerWindowDetector().detect(input)
        XCTAssertFalse(detection.isInWindow)
        XCTAssertLessThan(detection.confidence, 0.55)
    }

    func testPriorPatternBoostsConfidence() {
        // At peak hour, adding a prior-pattern signal should
        // increase confidence above what time-of-day alone gives.
        let bare = DangerWindowInput(
            archetype: .ninePmNegotiator,
            nowLocal: Date(),
            nowLocalHour: 21
        )
        let withPrior = DangerWindowInput(
            archetype: .ninePmNegotiator,
            nowLocal: Date(),
            nowLocalHour: 21,
            priorSlipsInThisHourLast30Days: 8
        )
        let bareDetection = DangerWindowDetector().detect(bare)
        let priorDetection = DangerWindowDetector().detect(withPrior)
        XCTAssertGreaterThan(priorDetection.confidence, bareDetection.confidence)
    }

    func testAllArchetypesHavePeakHour() {
        // Sanity: every family resolves a peak hour without crashing.
        for family in ArchetypeFamily.allCases {
            let h = family.peakHourLocalTime
            XCTAssertGreaterThanOrEqual(h, 0)
            XCTAssertLessThan(h, 24)
        }
    }

    func testInterruptScriptLibraryCoversAllArchetypes() {
        // We don't ship without at least one script per family.
        for family in ArchetypeFamily.allCases {
            let scripts = InterruptScriptLibrary.scripts(for: family)
            XCTAssertFalse(scripts.isEmpty, "no scripts for \(family.displayName)")
        }
    }
}
