//
//  COYLInterruptIntents.swift
//  COYLWidget
//
//  Three App Intents bound to the Live Activity buttons. Each intent
//  is invoked WITHOUT opening the app (openAppWhenRun = false) and
//  fires an HTTP POST against the coyl.ai API.
//
//  Auth token is read from the App Group's shared UserDefaults at
//  group.com.coyl.shared, key "coyl.authToken". The JS-side bridge
//  writes that value at sign-in.
//
//  These intents intentionally do NOT throw on network failure — a
//  failed POST is a soft failure (the activity already gave the user
//  the feedback they wanted). Errors are logged to OSLog for triage.
//
//  iOS 16.1+ — AppIntents availability matches ActivityKit.
//

import AppIntents
import Foundation
import OSLog

private let coylLogger = Logger(subsystem: "com.coyl.app.widget", category: "intents")
private let appGroupId = "group.com.coyl.shared"
private let authTokenKey = "coyl.authToken"
private let apiBase = "https://coyl.ai/api/v1"

// MARK: - Networking helper

@available(iOS 16.1, *)
private enum COYLIntentClient {
    /// Reads the Bearer token from the App Group's shared defaults.
    /// Returns nil if the token isn't there yet (user not signed in).
    static func authToken() -> String? {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            coylLogger.error("App Group \(appGroupId, privacy: .public) unavailable")
            return nil
        }
        return defaults.string(forKey: authTokenKey)
    }

    /// Fire a POST and ignore the response body. We surface success/
    /// failure to the logger only — the user already saw their tap
    /// register visually in the Live Activity.
    static func postJSON(
        path: String,
        body: [String: Any]
    ) async {
        guard let url = URL(string: "\(apiBase)\(path)") else {
            coylLogger.error("Invalid URL for path \(path, privacy: .public)")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token = authToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        } else {
            coylLogger.warning("No auth token available — POST will likely 401")
        }

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            coylLogger.error("Failed to encode body: \(error.localizedDescription, privacy: .public)")
            return
        }

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse {
                coylLogger.info("POST \(path, privacy: .public) -> \(http.statusCode)")
            }
        } catch {
            coylLogger.error("POST \(path, privacy: .public) failed: \(error.localizedDescription, privacy: .public)")
        }
    }
}

// MARK: - Held It

@available(iOS 16.1, *)
public struct HeldItIntent: AppIntent {
    public static var title: LocalizedStringResource = "Held it"
    public static var description = IntentDescription(
        "Tell COYL you held the line through the danger window."
    )
    public static var openAppWhenRun: Bool = false

    @Parameter(title: "Interrupt ID")
    public var interruptId: String

    public init() {}

    public init(interruptId: String) {
        self.interruptId = interruptId
    }

    public func perform() async throws -> some IntentResult {
        await COYLIntentClient.postJSON(
            path: "/interrupts/\(interruptId)/feedback",
            body: [
                "feedback": "caught_me",
                "source": "live_activity"
            ]
        )
        return .result()
    }
}

// MARK: - Slipped

@available(iOS 16.1, *)
public struct SlippedIntent: AppIntent {
    public static var title: LocalizedStringResource = "Slipped"
    public static var description = IntentDescription(
        "Confess a slip without unlocking — one-tap honesty."
    )
    public static var openAppWhenRun: Bool = false

    @Parameter(title: "Interrupt ID")
    public var interruptId: String

    public init() {}

    public init(interruptId: String) {
        self.interruptId = interruptId
    }

    public func perform() async throws -> some IntentResult {
        await COYLIntentClient.postJSON(
            path: "/slip/quick",
            body: [
                "context": "live_activity",
                "interruptId": interruptId
            ]
        )
        return .result()
    }
}

// MARK: - Snooze

@available(iOS 16.1, *)
public struct SnoozeIntent: AppIntent {
    public static var title: LocalizedStringResource = "Snooze"
    public static var description = IntentDescription(
        "Acknowledge the interrupt but defer the decision."
    )
    public static var openAppWhenRun: Bool = false

    @Parameter(title: "Interrupt ID")
    public var interruptId: String

    public init() {}

    public init(interruptId: String) {
        self.interruptId = interruptId
    }

    public func perform() async throws -> some IntentResult {
        await COYLIntentClient.postJSON(
            path: "/interrupts/\(interruptId)/feedback",
            body: [
                "feedback": "snoozed",
                "source": "live_activity"
            ]
        )
        return .result()
    }
}
