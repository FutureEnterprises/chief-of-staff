//
//  EAPHTTP.swift
//  COYL HomeKit Bridge
//
//  Thin URLSession wrapper for the EAP HTTP surface. Mirrors what the
//  macOS desktop coordinator (apps/desktop-macos/) does — kept inside
//  this app so the bridge is shippable as a standalone .app without
//  needing the desktop coordinator on the same Mac.
//
//  Endpoints used:
//    POST /api/eap/v1/device/register
//    GET  /api/eap/v1/devices/<id>/pending-actions
//    POST /api/eap/v1/action/outcome
//    POST /api/eap/v1/sensor/publish
//
//  Auth: bearer token from Keychain (service="com.coyl.app", account="user_token").
//  If the token is absent every call short-circuits with .notSignedIn —
//  the menu bar UI surfaces this and points the user to coyl.ai sign-in.
//
//  Base URL is overridable via COYL_API_BASE env var for local dev
//  against a tunneled coyl.ai (vercel preview deployment, ngrok, etc).
//

import Foundation
import Security

enum EAPHTTPError: Error {
    case notSignedIn
    case badResponse(status: Int, body: String)
    case decode(String)
    case noDeviceIdInResponse
}

final class EAPHTTP {
    static let shared = EAPHTTP()

    private let session = URLSession(configuration: .default)
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    private var baseURL: URL {
        let env = ProcessInfo.processInfo.environment["COYL_API_BASE"]
        return URL(string: env ?? "https://coyl.ai")!
    }

    // MARK: - Endpoints

    /// POST /api/eap/v1/device/register. Returns the server-issued deviceId.
    func registerDevice(body: [String: Any]) async throws -> String {
        let data = try JSONSerialization.data(withJSONObject: body)
        let resp = try await post("/api/eap/v1/device/register", data: data)
        guard let obj = try JSONSerialization.jsonObject(with: resp) as? [String: Any],
              let deviceId = obj["deviceId"] as? String else {
            throw EAPHTTPError.noDeviceIdInResponse
        }
        return deviceId
    }

    /// GET /api/eap/v1/devices/<id>/pending-actions.
    func fetchPendingActions(deviceId: String) async throws -> [EAPAction] {
        let path = "/api/eap/v1/devices/\(deviceId)/pending-actions"
        let data = try await get(path)
        // Server returns { actions: [...] }
        struct Envelope: Codable { let actions: [EAPAction] }
        do {
            return try decoder.decode(Envelope.self, from: data).actions
        } catch {
            throw EAPHTTPError.decode(error.localizedDescription)
        }
    }

    /// POST /api/eap/v1/action/outcome.
    func postOutcome(_ outcome: EAPActionOutcome) async throws {
        let data = try encoder.encode(outcome)
        _ = try await post("/api/eap/v1/action/outcome", data: data)
    }

    /// POST /api/eap/v1/sensor/publish.
    func publishSensor(deviceId: String, sensor: String, value: Any?) async throws {
        let payload: [String: Any] = [
            "deviceId": deviceId,
            "sensor": sensor,
            "value": value ?? NSNull(),
            "at": ISO8601DateFormatter().string(from: Date())
        ]
        let data = try JSONSerialization.data(withJSONObject: payload)
        _ = try await post("/api/eap/v1/sensor/publish", data: data)
    }

    // MARK: - Verbs

    private func get(_ path: String) async throws -> Data {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = "GET"
        try attachAuth(&req)
        return try await run(req)
    }

    private func post(_ path: String, data: Data) async throws -> Data {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.httpBody = data
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        try attachAuth(&req)
        return try await run(req)
    }

    private func run(_ req: URLRequest) async throws -> Data {
        let (data, resp) = try await session.data(for: req)
        guard let http = resp as? HTTPURLResponse else {
            throw EAPHTTPError.badResponse(status: 0, body: "no http response")
        }
        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw EAPHTTPError.badResponse(status: http.statusCode, body: body)
        }
        return data
    }

    private func attachAuth(_ req: inout URLRequest) throws {
        guard let token = Keychain.read(service: "com.coyl.app", account: "user_token") else {
            throw EAPHTTPError.notSignedIn
        }
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
}

// MARK: - Keychain (tiny, just what we need)

enum Keychain {
    static func read(service: String, account: String) -> String? {
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let s = String(data: data, encoding: .utf8) else {
            return nil
        }
        return s
    }
}
