//
//  EAPAction.swift
//  COYL Desktop — EAP Coordinator
//
//  The wire shape of a single EAP action (primitive #3 — Action Request)
//  as it arrives from coyl.ai for this device to execute.
//
//  We decode the JSON the server hands us when we poll
//  `GET /api/eap/v1/devices/<deviceId>/pending-actions`. Each row is
//  an actuator + params + a one-shot executionToken we POST back to
//  `/api/eap/v1/action/outcome` once we've dispatched (or failed to
//  dispatch) the actuator.
//
//  Params are intentionally untyped JSON — the EAP spec leaves the
//  per-actuator parameter schema soft, and `ActuatorRouter` knows
//  how to interpret each actuator's expected keys.
//

import Foundation

/// One action proposed by an LLM and approved by the coordinator for
/// this device to execute. Matches the shape of an `ActionRequest`
/// row server-side after the coordinator allowed it.
struct EAPAction: Codable, Identifiable, Hashable {
    /// Server-issued opaque id for the action row.
    let id: String

    /// Single-use capability we POST back to `/action/outcome`. This
    /// is the only auth the outcome endpoint requires — treat it as
    /// a bearer secret for the lifetime of the action.
    let executionToken: String

    /// EAP actuator identifier — e.g. "notification", "voice_tts",
    /// "applescript_execute". Routed by `ActuatorRouter`.
    let actuator: String

    /// Free-form params; each actuator decides what keys to read.
    /// Decoded as `JSONValue` so we don't lose nested structure.
    let params: JSONValue

    /// EAP scope the LLM had to hold to fire this action. We display
    /// it in the audit log; the coordinator already enforced it
    /// server-side at request time.
    let scopeRequested: String?

    /// Human-readable LLM reasoning. Surfaced in the menu bar dropdown
    /// when the user opens the "what just fired" sheet.
    let reasoning: String?

    /// LLM-provided self-confidence (0..1). Below the user's threshold
    /// the coordinator may have queued instead of fired; either way,
    /// the value travels along.
    let confidence: Double?

    /// Wall-clock the server told us to fire at. We honor it, but we
    /// also accept "now" if the server omits it.
    let willExecuteAt: Date?

    /// Hard cutoff: if we haven't dispatched by then, we report
    /// outcome=expired instead of executed.
    let ttlSeconds: Int?

    /// LLM partner id (string form), used to surface "Claude fired
    /// this" in the menu bar UI.
    let llmPartnerId: String?

    /// `params.text` extraction for actuators that need a string body.
    var textParam: String? { params["text"]?.string }
}

/// One terminal outcome the device coordinator reports back to
/// `POST /api/eap/v1/action/outcome`. The server is idempotent on
/// `executionToken`; we can safely retry the POST until the network
/// confirms a 2xx.
struct EAPActionOutcome: Codable {
    /// The token from the originating `EAPAction`.
    let executionToken: String

    /// One of: "executed" | "failed" | "rejected" | "expired".
    let outcome: String

    /// Free-form reason on failure modes — e.g. "user_paused",
    /// "applescript_denied", "shortcut_not_found".
    let outcomeReason: String?

    /// Whether the user visibly interacted (tapped notification,
    /// answered prompt). For TTS / passive actuators this is false.
    let userInteracted: Bool?

    /// Optional snapshot of the device at outcome time. We attach
    /// foreground app + battery + screen state so the LLM has the
    /// context it needs to learn.
    let deviceState: JSONValue?

    /// Optional one-word user reaction tag — "caught_me", "snoozed",
    /// "ignored". Only set when we know it; usually nil.
    let userTag: String?

    static func executed(_ token: String, deviceState: JSONValue? = nil) -> Self {
        .init(
            executionToken: token,
            outcome: "executed",
            outcomeReason: nil,
            userInteracted: nil,
            deviceState: deviceState,
            userTag: nil
        )
    }

    static func failed(_ token: String, reason: String) -> Self {
        .init(
            executionToken: token,
            outcome: "failed",
            outcomeReason: reason,
            userInteracted: nil,
            deviceState: nil,
            userTag: nil
        )
    }

    static func expired(_ token: String) -> Self {
        .init(
            executionToken: token,
            outcome: "expired",
            outcomeReason: "ttl_exceeded",
            userInteracted: nil,
            deviceState: nil,
            userTag: nil
        )
    }

    static func rejected(_ token: String, reason: String) -> Self {
        .init(
            executionToken: token,
            outcome: "rejected",
            outcomeReason: reason,
            userInteracted: nil,
            deviceState: nil,
            userTag: nil
        )
    }
}

// MARK: - JSONValue

/// Minimal sum type for the freeform `params` blob on EAPAction.
/// Codable so it round-trips through URLSession. We don't try to be
/// `AnyCodable` — only the shapes the protocol actually emits.
enum JSONValue: Codable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let b = try? c.decode(Bool.self) { self = .bool(b); return }
        if let d = try? c.decode(Double.self) { self = .number(d); return }
        if let s = try? c.decode(String.self) { self = .string(s); return }
        if let a = try? c.decode([JSONValue].self) { self = .array(a); return }
        if let o = try? c.decode([String: JSONValue].self) { self = .object(o); return }
        throw DecodingError.dataCorruptedError(
            in: c,
            debugDescription: "unrecognized JSON value"
        )
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .number(let d): try c.encode(d)
        case .bool(let b):   try c.encode(b)
        case .array(let a):  try c.encode(a)
        case .object(let o): try c.encode(o)
        case .null:          try c.encodeNil()
        }
    }

    /// Subscript by key — only meaningful for `.object(...)`.
    subscript(key: String) -> JSONValue? {
        if case .object(let o) = self { return o[key] }
        return nil
    }

    /// Convenience accessors. Each returns nil if the underlying type
    /// doesn't match, which is what every call site here wants.
    var string: String? { if case .string(let s) = self { return s }; return nil }
    var number: Double? { if case .number(let d) = self { return d }; return nil }
    var int: Int?       { if case .number(let d) = self { return Int(d) }; return nil }
    var bool: Bool?     { if case .bool(let b) = self { return b }; return nil }
    var array: [JSONValue]? { if case .array(let a) = self { return a }; return nil }
    var object: [String: JSONValue]? { if case .object(let o) = self { return o }; return nil }
}
