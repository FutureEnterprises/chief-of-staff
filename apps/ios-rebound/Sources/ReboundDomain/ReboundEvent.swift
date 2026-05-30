//
//  ReboundEvent.swift
//  ReboundDomain
//
//  Swift mirror of the free-tier event taxonomy defined in
//  apps/web/src/lib/telemetry/free-tier-events.ts. They must stay in
//  sync — adding an event on either side requires updating both.
//  A codegen step will eventually replace this; manual sync for now.
//

import Foundation

public enum ReboundEventName: String, Sendable, Codable {
    case appOpened = "app.opened"
    case dangerWindowDetected = "interrupt.danger_window_detected"
    case interruptFired = "interrupt.fired"
    case interruptChangedBehavior = "interrupt.changed_behavior"
    case slipReported = "slip.reported"
    case recoveryCompleted = "recovery.completed"
    case killSwitchFired = "kill_switch.fired"
}

public struct ReboundEventBaseProps: Sendable, Codable {
    public let anonymousUserId: String
    public let clientTimestamp: Date
    public let surface: String   // "ios" | "apple-watch"
    public let buildVersion: String

    public init(anonymousUserId: String, clientTimestamp: Date, surface: String, buildVersion: String) {
        self.anonymousUserId = anonymousUserId
        self.clientTimestamp = clientTimestamp
        self.surface = surface
        self.buildVersion = buildVersion
    }
}

public struct ReboundEvent: Sendable, Codable {
    public let name: ReboundEventName
    public let base: ReboundEventBaseProps
    /// Per-event properties beyond the base. Kept as a flat string map
    /// for transport simplicity; the typed properties are checked at
    /// construction time by the helper initializers below.
    public let extra: [String: String]

    public init(name: ReboundEventName, base: ReboundEventBaseProps, extra: [String: String] = [:]) {
        self.name = name
        self.base = base
        self.extra = extra
    }
}

public extension ReboundEvent {
    /// Construct a danger-window detection event.
    static func dangerWindowDetected(
        base: ReboundEventBaseProps,
        archetype: ArchetypeFamily,
        windowLabel: String,
        confidence: Double
    ) -> ReboundEvent {
        ReboundEvent(
            name: .dangerWindowDetected,
            base: base,
            extra: [
                "archetypeSlug": archetype.rawValue,
                "windowLabel": windowLabel,
                "confidence": String(format: "%.3f", confidence),
            ]
        )
    }

    /// Construct an interrupt-fired event with latency in ms.
    static func interruptFired(
        base: ReboundEventBaseProps,
        interruptId: String,
        archetype: ArchetypeFamily,
        latencyMs: Int
    ) -> ReboundEvent {
        ReboundEvent(
            name: .interruptFired,
            base: base,
            extra: [
                "interruptId": interruptId,
                "archetypeSlug": archetype.rawValue,
                "latencyMs": String(latencyMs),
            ]
        )
    }

    /// Trust-contract metric — fires whenever the user hits the kill
    /// switch. Logged in BOTH the iOS app AND the server so we can't
    /// silently miss it.
    static func killSwitchFired(base: ReboundEventBaseProps) -> ReboundEvent {
        ReboundEvent(name: .killSwitchFired, base: base)
    }
}
