//
//  Archetype.swift
//  ReboundDomain
//
//  The patient's archetype family — resolved from the web audit at
//  coyl.ai/audit and deep-linked into the iOS app via a result code.
//
//  This file mirrors apps/web/src/lib/audit-archetype.ts. They must
//  stay in sync — if a new family ships on the web, add it here in
//  the same PR. (Codegen step is a Month-6+ improvement; manual sync
//  for now.)
//

import Foundation

public enum ArchetypeFamily: String, CaseIterable, Sendable, Codable {
    case ninePmNegotiator = "the-9pm-negotiator"
    case mondayResetter = "the-monday-resetter"
    case deserver = "the-deserver"
    case oneMoreTabber = "the-one-more-tabber"
    case spiralExtender = "the-spiral-extender"
    case capitulator = "the-capitulator"

    /// Display label for the family. Same names as the web wordmarks.
    public var displayName: String {
        switch self {
        case .ninePmNegotiator: return "The 9 PM Negotiator"
        case .mondayResetter:   return "The Monday Resetter"
        case .deserver:         return "The Deserver"
        case .oneMoreTabber:    return "The One-More-Tabber"
        case .spiralExtender:   return "The Spiral Extender"
        case .capitulator:      return "The Capitulator"
        }
    }

    /// The hour-of-day where this archetype's danger window typically
    /// peaks. Used by DangerWindowDetector as the BASELINE schedule;
    /// the per-patient model adjusts over time.
    public var peakHourLocalTime: Int {
        switch self {
        case .ninePmNegotiator: return 21  // 9 PM
        case .mondayResetter:   return 18  // Sunday evening
        case .deserver:         return 19  // post-stress evening
        case .oneMoreTabber:    return 11  // mid-morning tab pivot
        case .spiralExtender:   return 22  // post-slip late evening
        case .capitulator:      return 14  // post-lunch "screw it"
        }
    }
}
