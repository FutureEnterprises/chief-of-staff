//
//  EAPAction.swift
//  COYL HomeKit Bridge
//
//  Wire shape of an EAP action as it arrives from coyl.ai. This is a
//  near-copy of apps/desktop-macos/COYLDesktop/Models/EAPAction.swift —
//  duplicated intentionally so the bridge ships as a standalone .app
//  without needing the desktop coordinator as a dependency.
//
//  If the two diverge in v0.2 we'll factor a shared Swift Package. For
//  v0.1 a copy keeps the dependency graph zero.
//

import Foundation

struct EAPAction: Codable, Identifiable, Hashable {
    let id: String
    let executionToken: String
    let actuator: String
    let params: JSONValue
    let scopeRequested: String?
    let reasoning: String?
    let confidence: Double?
    let willExecuteAt: Date?
    let ttlSeconds: Int?
    let llmPartnerId: String?
}

struct EAPActionOutcome: Codable {
    let executionToken: String
    let outcome: String
    let outcomeReason: String?
    let userInteracted: Bool?
    let deviceState: JSONValue?
    let userTag: String?

    static func executed(_ token: String) -> Self {
        .init(executionToken: token, outcome: "executed",
              outcomeReason: nil, userInteracted: nil,
              deviceState: nil, userTag: nil)
    }
    static func failed(_ token: String, reason: String) -> Self {
        .init(executionToken: token, outcome: "failed",
              outcomeReason: reason, userInteracted: nil,
              deviceState: nil, userTag: nil)
    }
    static func rejected(_ token: String, reason: String) -> Self {
        .init(executionToken: token, outcome: "rejected",
              outcomeReason: reason, userInteracted: nil,
              deviceState: nil, userTag: nil)
    }
}

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
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "unrecognized JSON value")
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

    subscript(key: String) -> JSONValue? {
        if case .object(let o) = self { return o[key] }
        return nil
    }

    var string: String? { if case .string(let s) = self { return s }; return nil }
    var number: Double? { if case .number(let d) = self { return d }; return nil }
    var int: Int?       { if case .number(let d) = self { return Int(d) }; return nil }
    var bool: Bool?     { if case .bool(let b) = self { return b }; return nil }
    var array: [JSONValue]? { if case .array(let a) = self { return a }; return nil }
    var object: [String: JSONValue]? { if case .object(let o) = self { return o }; return nil }
}
