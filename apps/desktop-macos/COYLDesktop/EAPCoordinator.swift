//
//  EAPCoordinator.swift
//  COYL Desktop — EAP Coordinator
//
//  The networking layer. Owns:
//    - The URLSession to coyl.ai/api/eap/v1/*
//    - Device registration (delegated to DeviceRegistration.swift)
//    - The pending-actions polling loop (every 30s by default)
//    - Action dispatch to ActuatorRouter
//    - Outcome reporting back to /action/outcome
//
//  No Apple Push Notifications: macOS menu bar apps can't reliably
//  receive APNs in the background (and the cert+entitlement story
//  for non-MAS distribution is fragile). Polling is the documented
//  contract instead. A future revision may bridge via Web Push to
//  a hidden WKWebView for a more battery-friendly path.
//

import Foundation

/// One-shot response shape from /device/register.
struct DeviceRegisterResponse: Decodable {
    struct Device: Decodable {
        let id: String
        let deviceClass: String
        let paired: Bool
    }
    let device: Device
}

/// Pending-actions response shape. Documented expectation for the
/// server endpoint that does NOT yet exist server-side — the macOS
/// coordinator polls
/// `GET /api/eap/v1/devices/<deviceId>/pending-actions` and the
/// server is expected to return the EAPActions allowed-but-not-yet-
/// dispatched for this device.
struct PendingActionsResponse: Decodable {
    let actions: [EAPAction]
}

/// Errors surfaced to ActuatorRouter / MenuBarController.
enum EAPCoordinatorError: Error {
    case notAuthenticated
    case badStatus(Int, String)
    case decodeFailed(Error)
    case transport(Error)
}

@MainActor
final class EAPCoordinator {
    static let shared = EAPCoordinator()

    /// Base URL of the EAP API. Overridden by the COYL_BASE_URL env
    /// var for local dev; otherwise hits prod.
    let baseURL: URL

    /// Poll interval for pending-actions. 30s per the brief; tunable
    /// via UserDefaults `COYLDesktop.pollIntervalSeconds`.
    var pollIntervalSeconds: TimeInterval

    /// Started/stopped by the menu bar pause toggle.
    private var pollTimer: Timer?
    private var isPolling = false

    /// Built-in actuator dispatcher. Swappable for testing.
    let router: ActuatorRouter

    private let session: URLSession

    private init() {
        let envBase = ProcessInfo.processInfo.environment["COYL_BASE_URL"]
        self.baseURL = URL(string: envBase ?? "https://coyl.ai")!
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 20
        cfg.waitsForConnectivity = true
        self.session = URLSession(configuration: cfg)
        let userInterval = UserDefaults.standard
            .double(forKey: "COYLDesktop.pollIntervalSeconds")
        self.pollIntervalSeconds = userInterval > 0 ? userInterval : 30
        self.router = ActuatorRouter()
    }

    /// Wire registration + polling. Idempotent — safe to call from
    /// applicationDidFinishLaunching AND from the sign-in callback.
    func start() {
        Task { await DeviceRegistration.register(coordinator: self) }

        NotificationCenter.default.addObserver(
            forName: DeviceRegistration.didRegister,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.beginPolling() }
        }

        NotificationCenter.default.addObserver(
            forName: URLSchemeHandler.didCompleteSignIn,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self = self else { return }
            Task { @MainActor in
                await DeviceRegistration.register(coordinator: self)
            }
        }
    }

    // MARK: - Polling

    func beginPolling() {
        guard !isPolling else { return }
        isPolling = true
        pollTimer?.invalidate()
        pollTimer = Timer.scheduledTimer(
            withTimeInterval: pollIntervalSeconds,
            repeats: true
        ) { [weak self] _ in
            Task { @MainActor in await self?.pollOnce() }
        }
        Task { @MainActor in await pollOnce() } // Kick first tick now.
    }

    func stopPolling() {
        isPolling = false
        pollTimer?.invalidate()
        pollTimer = nil
    }

    func pollOnce() async {
        guard let deviceId = DeviceRegistration.cachedLocalState()?.deviceId else { return }
        do {
            let response = try await getPendingActions(deviceId: deviceId)
            for action in response.actions {
                await dispatch(action: action)
            }
        } catch {
            // Quiet — surface in audit log; don't spam the user.
            NSLog("[COYLDesktop] poll failed: \(error)")
        }
    }

    /// Single action dispatch: route to ActuatorRouter, then POST
    /// outcome back. Outcome reporting is fire-and-retry once on
    /// transport failure.
    func dispatch(action: EAPAction) async {
        // TTL gate.
        if let ttl = action.ttlSeconds,
           let willAt = action.willExecuteAt,
           Date() > willAt.addingTimeInterval(TimeInterval(ttl)) {
            await reportOutcome(.expired(action.executionToken))
            return
        }

        // Local scope check — fail closed if the user revoked since
        // the LLM made the request.
        if let scope = EAPScope.forActuator(action.actuator),
           let partner = action.llmPartnerId,
           !AuthStore.shared.grantCache.hasGrant(partnerId: partner, scope: scope)
        {
            await reportOutcome(
                .rejected(action.executionToken, reason: "scope_revoked_locally")
            )
            return
        }

        let outcome = await router.execute(action: action)
        await reportOutcome(outcome)
    }

    func reportOutcome(_ outcome: EAPActionOutcome) async {
        do {
            _ = try await postActionOutcome(outcome: outcome)
        } catch {
            // One retry — outcome endpoint is idempotent on token.
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            _ = try? await postActionOutcome(outcome: outcome)
        }
    }

    // MARK: - HTTP primitives

    /// POST /api/eap/v1/device/register
    func postDeviceRegister(
        body: EAPDeviceRegistration
    ) async throws -> DeviceRegisterResponse {
        let url = baseURL.appendingPathComponent("/api/eap/v1/device/register")
        return try await postJSON(url: url, body: body)
    }

    /// GET /api/eap/v1/devices/<deviceId>/pending-actions
    func getPendingActions(deviceId: String) async throws -> PendingActionsResponse {
        let url = baseURL.appendingPathComponent(
            "/api/eap/v1/devices/\(deviceId)/pending-actions"
        )
        return try await getJSON(url: url)
    }

    /// POST /api/eap/v1/action/outcome
    @discardableResult
    func postActionOutcome(outcome: EAPActionOutcome) async throws -> Data {
        struct Empty: Decodable {}
        let url = baseURL.appendingPathComponent("/api/eap/v1/action/outcome")
        // Outcome endpoint authenticates via the executionToken in
        // the body itself — bearer token is NOT required. We still
        // attach it when present; servers tolerate the extra header.
        let (data, response) = try await rawJSON(
            url: url,
            method: "POST",
            body: outcome,
            includeBearer: false
        )
        try ensureOK(response: response, data: data)
        return data
    }

    // MARK: - Generic JSON helpers

    private func getJSON<R: Decodable>(url: URL) async throws -> R {
        let (data, response) = try await rawRequest(
            url: url,
            method: "GET",
            bodyData: nil,
            includeBearer: true
        )
        try ensureOK(response: response, data: data)
        do { return try JSONDecoder.eap.decode(R.self, from: data) }
        catch { throw EAPCoordinatorError.decodeFailed(error) }
    }

    private func postJSON<B: Encodable, R: Decodable>(
        url: URL, body: B
    ) async throws -> R {
        let (data, response) = try await rawJSON(
            url: url,
            method: "POST",
            body: body,
            includeBearer: true
        )
        try ensureOK(response: response, data: data)
        do { return try JSONDecoder.eap.decode(R.self, from: data) }
        catch { throw EAPCoordinatorError.decodeFailed(error) }
    }

    private func rawJSON<B: Encodable>(
        url: URL, method: String, body: B, includeBearer: Bool
    ) async throws -> (Data, URLResponse) {
        let encoded = try JSONEncoder.eap.encode(body)
        return try await rawRequest(
            url: url,
            method: method,
            bodyData: encoded,
            includeBearer: includeBearer
        )
    }

    private func rawRequest(
        url: URL,
        method: String,
        bodyData: Data?,
        includeBearer: Bool
    ) async throws -> (Data, URLResponse) {
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue(
            "COYLDesktop/0.1 (macOS; menu-bar-coordinator)",
            forHTTPHeaderField: "User-Agent"
        )
        if includeBearer, let token = AuthStore.shared.preferredBearerToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let bodyData = bodyData {
            req.httpBody = bodyData
        }
        do {
            return try await session.data(for: req)
        } catch {
            throw EAPCoordinatorError.transport(error)
        }
    }

    private func ensureOK(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw EAPCoordinatorError.badStatus(0, "no_response")
        }
        guard (200..<300).contains(http.statusCode) else {
            let snippet = String(data: data, encoding: .utf8) ?? ""
            throw EAPCoordinatorError.badStatus(http.statusCode, snippet)
        }
    }
}

// MARK: - JSON ISO date coders

extension JSONEncoder {
    static let eap: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()
}

extension JSONDecoder {
    static let eap: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()
}
