//
//  InterruptScript.swift
//  ReboundDomain
//
//  The script the user actually sees when an interrupt fires.
//  Pure data — no UI. The Rebound app target renders these into
//  push notifications + in-app modals.
//
//  Voice and structure mirror what's on the web (see
//  apps/web/src/app/(wedges)/how-it-works/page.tsx — the "three
//  lived moments" examples). Same writer, same voice.
//

import Foundation

public struct InterruptScript: Sendable, Codable {
    public let id: String
    public let archetype: ArchetypeFamily
    /// One-line headline. Push notification title. Under 40 chars.
    public let headline: String
    /// 1-3 sentence body. Push notification body or in-app modal copy.
    public let body: String
    /// A concrete next action the user can take in the next 5 minutes.
    /// Sized to be doable now, not aspirational.
    public let action: String

    public init(id: String, archetype: ArchetypeFamily, headline: String, body: String, action: String) {
        self.id = id
        self.archetype = archetype
        self.headline = headline
        self.body = body
        self.action = action
    }
}

/// Library of v0.5 scripts. Six archetypes × three example scripts =
/// 18 entries; the actual library will be much larger (and partly
/// personalized) when the data layer lands. These are the seeds.
public enum InterruptScriptLibrary {
    public static let all: [InterruptScript] = [
        .init(
            id: "9pm-fridge-1",
            archetype: .ninePmNegotiator,
            headline: "You're not hungry.",
            body: "You're not hungry. You're doing it again. Close the fridge. Walk five minutes. Then decide.",
            action: "Walk five minutes."
        ),
        .init(
            id: "9pm-fridge-2",
            archetype: .ninePmNegotiator,
            headline: "Three seconds.",
            body: "The window where this can still be re-routed is right now. Three seconds. Step back.",
            action: "Step back."
        ),
        .init(
            id: "monday-resetter-1",
            archetype: .mondayResetter,
            headline: "The next rep, not the restart.",
            body: "You didn't blow it. You're about to blow it. Different thing. Water, brush teeth, bed in thirty.",
            action: "Water. Brush teeth. Bed in 30."
        ),
        .init(
            id: "deserver-1",
            archetype: .deserver,
            headline: "You don't owe yourself this.",
            body: "\"I deserve this\" is the sentence the pattern uses. The pattern is not your friend right now.",
            action: "Name the pattern out loud."
        ),
        .init(
            id: "tab-switch-1",
            archetype: .oneMoreTabber,
            headline: "One more becomes the morning.",
            body: "The doc isn't the problem. The switch is. Stay.",
            action: "Stay."
        ),
        .init(
            id: "spiral-1",
            archetype: .spiralExtender,
            headline: "Different thing.",
            body: "You didn't blow it. You're about to blow it. That sentence is the real machinery. Don't sign it.",
            action: "Water, brush teeth, bed in thirty."
        ),
        .init(
            id: "capitulator-1",
            archetype: .capitulator,
            headline: "Half the day is still the day.",
            body: "The afternoon is not lost because the morning was. Same plan, same rules. Start now.",
            action: "Start the next thing now."
        ),
    ]

    public static func scripts(for archetype: ArchetypeFamily) -> [InterruptScript] {
        all.filter { $0.archetype == archetype }
    }
}
