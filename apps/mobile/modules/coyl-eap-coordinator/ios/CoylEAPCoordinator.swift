//
//  CoylEAPCoordinator.swift
//  CoylEAPCoordinator (Expo Module)
//
//  Native bridge for the EAP (Edge AI Protocol) device coordinator.
//  Owns the operations that can't be done from JS:
//
//    getDeviceFingerprint() -> Promise<String>
//        Reads / mints a persistent UUID in the shared App Group
//        UserDefaults. We deliberately do NOT use the Keychain here:
//        the fingerprint is a non-secret persistent device identifier
//        (not a credential), and it must be readable from BGTask
//        background fetch handlers while the device is locked — the
//        same App Group surface the auth token + daily-number sync
//        already use (see CoylLiveActivityModule.setAuthToken and
//        CoylWatch.syncDailyNumber).
//
//    getOperationalState() -> Promise<[String:Any]>
//        Battery / DND / foreground-app snapshot for the EAP
//        device.register manifest. Reads UIDevice + UNUserNotification
//        center settings.
//
//    setUserGrantedScopes(scopes) -> Promise<Void>
//    getUserGrantedScopes()      -> Promise<[String]>
//        Reads/writes the EAP scope list in the shared App Group
//        (group.com.coyl.shared) under "coyl.eap.userGrantedScopes".
//
//    requestAppIntent(name, params) -> Promise<Bool>
//        Dispatches a named App Intent via NSUserActivity, attached
//        to the active scene's root view controller. The OS picks
//        the userActivity up and routes it to a matching App Intent
//        in COYLInterruptIntents.swift (or any other intent
//        registered on this build).
//
//  All async functions resolve cleanly; failures bucket into nil /
//  false / empty array rather than rejecting where possible, because
//  the EAP coordinator in JS is a best-effort layer — an unavailable
//  App Group shouldn't crash the actuator path.
//
//  iOS 13.0+ for the core APIs (UIScene, etc.) to match CoylWatch's
//  floor.
//

import ExpoModulesCore
import Foundation
import UIKit
import UserNotifications

// MARK: - Constants

private let appGroupId = "group.com.coyl.shared"
private let fingerprintKey = "coyl.eap.deviceFingerprint"
private let scopesKey = "coyl.eap.userGrantedScopes"

// MARK: - Persistence helpers
//
// We use App Group UserDefaults for the fingerprint rather than the
// Keychain for three reasons:
//
//   1. The fingerprint is a NON-SECRET persistent identifier. It's
//      not a credential, not a token, not PII — it's an opaque UUID
//      the EAP server uses to dedupe Device rows on re-register.
//      Exposure grants zero capability; every EAP RPC additionally
//      requires an LLM-partner Bearer token + an explicit
//      ScopeGrant.
//
//   2. The BGTaskScheduler sensor-publish path (registered as
//      "ai.coyl.eap.publish-sensors") runs while the device is
//      locked. App Group UserDefaults is freely readable in that
//      context; Keychain with biometric ACLs would block or fail
//      the background read.
//
//   3. The widget extension + Watch app already read the same App
//      Group keys (coyl.authToken, coyl.selfTrustScore, etc.). Using
//      the same surface keeps the cross-target persistence story
//      uniform — one place to look when debugging missing values.
//
// If we ever need to store actual secrets here (refresh tokens, etc.)
// we'd add a separate Keychain-backed slot with a proper SecAccessControl.

private enum CoylEAPStorage {
    /// Reads the persistent device fingerprint. Returns nil on
    /// first call (caller mints one) or if the App Group isn't
    /// provisioned yet.
    static func readFingerprint() -> String? {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return nil }
        return defaults.string(forKey: fingerprintKey)
    }

    /// Writes a freshly-minted fingerprint. Returns true on success,
    /// false if the App Group is unavailable.
    @discardableResult
    static func writeFingerprint(_ value: String) -> Bool {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return false }
        defaults.set(value, forKey: fingerprintKey)
        defaults.synchronize()
        return true
    }
}

// MARK: - Operational state helpers

private func currentBatteryLevel() -> Int {
    // UIDevice.batteryLevel requires monitoring to be enabled. We
    // toggle it on, read, and leave it on — battery monitoring is
    // free at runtime once enabled, and the EAP coordinator wants
    // fresh values whenever device.register is re-POSTed.
    let device = UIDevice.current
    if !device.isBatteryMonitoringEnabled {
        device.isBatteryMonitoringEnabled = true
    }
    let level = device.batteryLevel  // -1.0 = unknown, 0.0..1.0 otherwise
    if level < 0 { return -1 }
    return Int((level * 100.0).rounded())
}

/// Best-effort Do-Not-Disturb / Focus detection.
///
/// iOS does not expose Focus mode to third-party apps directly. The
/// closest signal we can get is UNNotificationSettings.notificationCenterSetting
/// — if it's `.disabled` the user has DND or notifications-off at
/// the OS level. That's imperfect (a Focus filter that whitelists
/// us reads as enabled here) but it's the legal surface.
private func currentDoNotDisturbState(completion: @escaping (Bool) -> Void) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
        // .notDetermined = pre-permission; treat as "not dnd".
        // .denied       = permission revoked; treat as "not dnd" because
        //                 that's a separate condition the LLM should
        //                 already know from its scope check.
        // .disabled     = the system has notifications throttled —
        //                 closest proxy we have to DND from third-party
        //                 perspective.
        let isDnd = settings.notificationCenterSetting == .disabled
        completion(isDnd)
    }
}

// MARK: - Expo module

public class CoylEAPCoordinatorModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CoylEAPCoordinator")

        // MARK: getDeviceFingerprint
        //
        // Idempotent: returns the same UUID on every call for this
        // device install. Persists across app updates because the
        // App Group survives reinstall — losing the fingerprint
        // would reset the EAPAuditEntry continuity trail on every
        // reinstall, which is bad.
        AsyncFunction("getDeviceFingerprint") { (promise: Promise) in
            if let existing = CoylEAPStorage.readFingerprint() {
                promise.resolve(existing)
                return
            }
            let fresh = UUID().uuidString.lowercased()
            _ = CoylEAPStorage.writeFingerprint(fresh)
            // Even if the write failed (App Group not provisioned)
            // we still return a fingerprint — losing it before the
            // next launch is better than failing device.register
            // entirely. Next launch will retry the write.
            promise.resolve(fresh)
        }

        // MARK: getOperationalState
        //
        // Snapshot for the EAP device.register manifest. The DND
        // check is async (requires hitting UNUserNotificationCenter)
        // so we wrap the whole thing in an AsyncFunction even though
        // battery + foregroundApp are synchronous.
        AsyncFunction("getOperationalState") { (promise: Promise) in
            let battery = currentBatteryLevel()
            let bundleId = Bundle.main.bundleIdentifier ?? "com.coyl.app"

            currentDoNotDisturbState { isDnd in
                let payload: [String: Any] = [
                    "battery": battery,
                    "doNotDisturb": isDnd,
                    "foregroundApp": bundleId,
                ]
                promise.resolve(payload)
            }
        }

        // MARK: setUserGrantedScopes
        //
        // Writes the scope list into the shared App Group. The
        // widget extension + Watch app can read the same key to gate
        // their local behavior (e.g., a Watch complication that says
        // "Claude has wrist access" or "Claude can't reach here").
        AsyncFunction("setUserGrantedScopes") { (scopes: [String], promise: Promise) in
            guard let defaults = UserDefaults(suiteName: appGroupId) else {
                // App Group not provisioned yet (pre-prebuild on a
                // fresh machine). Don't reject — the JS-side
                // coordinator treats this as "no scopes granted" and
                // retries on next launch.
                NSLog("[COYL][EAP] App Group \(appGroupId) unavailable on setUserGrantedScopes")
                promise.resolve(nil)
                return
            }
            defaults.set(scopes, forKey: scopesKey)
            defaults.synchronize()
            promise.resolve(nil)
        }

        // MARK: getUserGrantedScopes
        AsyncFunction("getUserGrantedScopes") { (promise: Promise) in
            guard let defaults = UserDefaults(suiteName: appGroupId) else {
                promise.resolve([String]())
                return
            }
            let scopes = (defaults.array(forKey: scopesKey) as? [String]) ?? []
            promise.resolve(scopes)
        }

        // MARK: requestAppIntent
        //
        // Dispatches a named App Intent via NSUserActivity. The
        // standard pattern for invoking an App Intent from another
        // module (without the user tapping a Siri/Shortcuts surface)
        // is to construct an NSUserActivity with activityType
        // matching the intent's identifier + put the params into
        // userInfo, then attach the activity to a UIResponder in the
        // active scene's hierarchy. The OS routes it to a matching
        // App Intent.
        //
        // We resolve `true` if we found a UIResponder to attach to,
        // `false` if no foreground scene is available (rare — should
        // only happen during very narrow background-state windows;
        // the JS coordinator's open_app_intent handler falls back to
        // a push notification in that case).
        AsyncFunction("requestAppIntent") { (name: String, params: [String: Any], promise: Promise) in
            DispatchQueue.main.async {
                let activity = NSUserActivity(activityType: name)
                activity.userInfo = params
                activity.isEligibleForHandoff = false
                activity.isEligibleForSearch = false

                let scenes = UIApplication.shared.connectedScenes
                guard let windowScene = scenes
                    .compactMap({ $0 as? UIWindowScene })
                    .first(where: { $0.activationState == .foregroundActive
                        || $0.activationState == .foregroundInactive })
                else {
                    // No foreground scene. The OS will not dispatch
                    // a userActivity into a backgrounded scene — the
                    // caller should fall back to a push notification
                    // or wake the app first.
                    NSLog("[COYL][EAP] requestAppIntent(\(name)) — no foreground scene")
                    promise.resolve(false)
                    return
                }

                // userActivity must be set on a UIResponder in the
                // scene's hierarchy. Root view controller is the
                // canonical attachment point; the window itself is
                // a valid fallback (also a UIResponder).
                let window = windowScene.windows.first(where: { $0.isKeyWindow })
                    ?? windowScene.windows.first
                if let target: UIResponder = window?.rootViewController ?? window {
                    target.userActivity = activity
                    promise.resolve(true)
                } else {
                    NSLog("[COYL][EAP] requestAppIntent(\(name)) — no UIResponder in scene")
                    promise.resolve(false)
                }
            }
        }
    }
}
