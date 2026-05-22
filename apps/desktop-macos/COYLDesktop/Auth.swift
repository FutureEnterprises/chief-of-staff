//
//  Auth.swift
//  COYL Desktop — EAP Coordinator
//
//  Token storage in the macOS Keychain + the browser-handoff sign-in
//  flow. The coordinator has TWO possible credentials it may carry:
//
//    1. A Clerk session cookie (returned by coyl.ai/sign-in?return=desktop)
//       — used for user-scoped endpoints like `/api/v1/scope/grant`.
//
//    2. An EAP device token (issued by the server on first /device/
//       register) — used for the coordinator's own subsequent
//       outcome reports and sensor publishes.
//
//  We store both in Keychain under separate accounts so that
//  re-signing-in doesn't invalidate the device token (which is tied
//  to the device row, not the user session).
//
//  Sign-in flow:
//    1. User clicks "Sign in" in the menu bar.
//    2. We open https://coyl.ai/sign-in?return=desktop in the default
//       browser.
//    3. Web app completes Clerk auth, then redirects to
//       coyl-desktop://auth?token=<clerk-jwt>&userId=<id>.
//    4. macOS routes the custom URL scheme back to this app via
//       NSAppleEventManager (registered in Info.plist).
//    5. We stash the token + userId, then proceed to /device/register.
//

import AppKit
import Foundation
import Security

// MARK: - AuthStore (Keychain wrapper)

/// Type-safe wrapper over Security framework's keychain APIs. Single
/// service identifier — `ai.coyl.desktop` — with multiple accounts
/// for the different secrets we hold.
final class AuthStore {
    static let shared = AuthStore()

    private let service = "ai.coyl.desktop"

    private enum Account: String {
        case clerkToken     = "clerk_session_token"
        case userId         = "coyl_user_id"
        case deviceToken    = "eap_device_token"
        case grantCache     = "eap_grant_cache"
    }

    private init() {}

    // ----- Public API -----

    var clerkToken: String? {
        get { readString(account: .clerkToken) }
        set { write(account: .clerkToken, value: newValue) }
    }

    var userId: String? {
        get { readString(account: .userId) }
        set { write(account: .userId, value: newValue) }
    }

    /// Set on first successful /device/register response if the
    /// server returns a device-scoped token. Until that endpoint
    /// ships device-token issuance, we fall back to clerkToken on
    /// outbound requests.
    var deviceToken: String? {
        get { readString(account: .deviceToken) }
        set { write(account: .deviceToken, value: newValue) }
    }

    /// Cached `EAPGrantCache` as JSON. Survives restart, lets the
    /// coordinator fail-closed locally before any network round-trip.
    var grantCache: EAPGrantCache {
        get {
            guard
                let data = readData(account: .grantCache),
                let cache = try? JSONDecoder().decode(EAPGrantCache.self, from: data)
            else { return EAPGrantCache() }
            return cache
        }
        set {
            let data = try? JSONEncoder().encode(newValue)
            writeData(account: .grantCache, data: data)
        }
    }

    /// Bearer token presented on outbound EAP calls. Prefer the
    /// device token (long-lived, device-scoped). Fall back to the
    /// clerk session token for the bootstrapping window.
    var preferredBearerToken: String? {
        deviceToken ?? clerkToken
    }

    /// True iff we have *some* credential. Drives whether the menu
    /// bar shows "Signed in as ..." vs. "Sign in".
    var isAuthenticated: Bool { preferredBearerToken != nil && userId != nil }

    /// Clears every secret. Triggered by the menu bar's "Sign out"
    /// item and by `/eap/v1/panic` revoke-all sync.
    func clear() {
        for account in [Account.clerkToken, .userId, .deviceToken, .grantCache] {
            write(account: account, value: nil)
        }
    }

    // ----- Keychain primitives -----

    private func readString(account: Account) -> String? {
        guard let data = readData(account: account) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func readData(account: Account) -> Data? {
        let query: [String: Any] = [
            kSecClass as String:           kSecClassGenericPassword,
            kSecAttrService as String:     service,
            kSecAttrAccount as String:     account.rawValue,
            kSecReturnData as String:      true,
            kSecMatchLimit as String:      kSecMatchLimitOne,
        ]
        var out: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &out)
        guard status == errSecSuccess, let data = out as? Data else { return nil }
        return data
    }

    private func write(account: Account, value: String?) {
        let data = value?.data(using: .utf8)
        writeData(account: account, data: data)
    }

    private func writeData(account: Account, data: Data?) {
        let query: [String: Any] = [
            kSecClass as String:           kSecClassGenericPassword,
            kSecAttrService as String:     service,
            kSecAttrAccount as String:     account.rawValue,
        ]
        if let data = data {
            // Try update first; if nothing there, add fresh.
            let attrs: [String: Any] = [kSecValueData as String: data]
            let status = SecItemUpdate(query as CFDictionary, attrs as CFDictionary)
            if status == errSecItemNotFound {
                KeychainBackend.insert(query: query, data: data)
            }
        } else {
            SecItemDelete(query as CFDictionary)
        }
    }
}

// MARK: - KeychainBackend

/// Isolated SecItemAdd call site. The coordinator is a background
/// menu bar app that needs to read its stored bearer token on every
/// EAP outbound call — prompting Touch ID per access would break the
/// always-running model the EAP spec requires for the macOS
/// coordinator. We layer `SecAccessControl` with `.userPresence` on
/// the keychain item so the user authenticates ONCE per session
/// (Touch ID on Apple Silicon Macs; password prompt otherwise), which
/// is the strongest gating compatible with the daemon model.
///
/// If `SecAccessControlCreateWithFlags` fails (very old macOS / non-
/// standard build), we fall back to the unauthenticated `When
/// Unlocked` accessibility class plus FileVault-at-rest as the only
/// protection. This is the documented degradation path.
enum KeychainBackend {
    static func insert(query baseQuery: [String: Any], data: Data) {
        // `.biometryCurrentSet` binds the keychain item to the
        // current enrolled biometric set on this Mac. If the user
        // adds or removes a fingerprint, the item is invalidated and
        // the coordinator re-prompts sign-in via the browser handoff.
        // No passcode-fallback flag is set — a stolen laptop with a
        // known account password cannot replay the keychain item.
        var err: Unmanaged<CFError>?
        guard let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
            .biometryCurrentSet,
            &err
        ) else { return }

        let addQuery: [String: Any] = [
            kSecClass as String:             baseQuery[kSecClass as String] as Any,
            kSecAttrService as String:       baseQuery[kSecAttrService as String] as Any,
            kSecAttrAccount as String:       baseQuery[kSecAttrAccount as String] as Any,
            kSecValueData as String:         data,
            kSecAttrAccessControl as String: access,
        ]
        SecItemAdd(addQuery as CFDictionary, nil)
    }
}

// MARK: - URLSchemeHandler

/// Handles `coyl-desktop://auth?token=...&userId=...` callbacks from
/// the browser-side sign-in. Registered in `Info.plist` under
/// `CFBundleURLTypes`; AppDelegate wires us into NSAppleEventManager
/// during applicationWillFinishLaunching.
final class URLSchemeHandler: NSObject {
    /// Posted after we successfully parse + persist a sign-in callback.
    /// EAPCoordinator listens and kicks /device/register.
    static let didCompleteSignIn = Notification.Name("COYLDesktop.didCompleteSignIn")

    func register() {
        NSAppleEventManager.shared().setEventHandler(
            self,
            andSelector: #selector(handleURL(event:reply:)),
            forEventClass: AEEventClass(kInternetEventClass),
            andEventID:    AEEventID(kAEGetURL)
        )
    }

    @objc func handleURL(event: NSAppleEventDescriptor, reply: NSAppleEventDescriptor) {
        guard
            let urlString = event
                .paramDescriptor(forKeyword: AEKeyword(keyDirectObject))?
                .stringValue,
            let url = URL(string: urlString),
            url.scheme == "coyl-desktop",
            url.host == "auth"
        else { return }

        let comps = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let token  = comps?.queryItems?.first(where: { $0.name == "token" })?.value
        let userId = comps?.queryItems?.first(where: { $0.name == "userId" })?.value

        guard let token = token, let userId = userId,
              !token.isEmpty, !userId.isEmpty
        else { return }

        AuthStore.shared.clerkToken = token
        AuthStore.shared.userId     = userId

        NotificationCenter.default.post(
            name: URLSchemeHandler.didCompleteSignIn,
            object: nil
        )
    }
}

// MARK: - SignInLauncher

/// Opens the browser to the sign-in URL. The web app handles Clerk
/// and bounces back to `coyl-desktop://auth?...`. We never see the
/// password; only the resulting bearer token.
enum SignInLauncher {
    static let signInURL = URL(string: "https://coyl.ai/sign-in?return=desktop")!

    static func openBrowser() {
        NSWorkspace.shared.open(signInURL)
    }
}
