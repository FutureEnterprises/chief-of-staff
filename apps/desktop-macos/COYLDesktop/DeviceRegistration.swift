//
//  DeviceRegistration.swift
//  COYL Desktop — EAP Coordinator
//
//  Builds the EAPDeviceRegistration body for this Mac, posts it to
//  /api/eap/v1/device/register, and persists the returned deviceId
//  in UserDefaults. Re-registration is idempotent on the device
//  fingerprint, so we can re-post on every launch to refresh the
//  manifest + operational state without creating duplicates.
//
//  We deliberately do NOT block app launch on registration — the
//  menu bar appears immediately; registration runs async on a
//  background queue and posts a notification when it completes (or
//  fails). The Coordinator listens and starts polling on success.
//

import AppKit
import Foundation
import IOKit
import IOKit.ps
#if canImport(CryptoKit)
import CryptoKit
#endif

enum DeviceRegistration {
    /// Posted after a successful /device/register. EAPCoordinator
    /// starts polling on this signal.
    static let didRegister = Notification.Name("COYLDesktop.didRegisterDevice")

    /// Persistent key for the local device-state cache.
    private static let localStateKey = "COYLDesktop.localDeviceState"

    /// Returns the locally-cached device row, if we've previously
    /// registered. Used by the polling coordinator to avoid duplicate
    /// re-registrations on every launch.
    static func cachedLocalState() -> EAPLocalDeviceState? {
        guard let data = UserDefaults.standard.data(forKey: localStateKey) else { return nil }
        return try? JSONDecoder().decode(EAPLocalDeviceState.self, from: data)
    }

    /// Builds the manifest from compile-time constants + the live
    /// grant cache. The actuator/sensor lists are intentionally
    /// static — the server validates against them.
    static func buildRegistration(userId: String) -> EAPDeviceRegistration {
        let fingerprint = makeDeviceFingerprint()
        let grants = AuthStore.shared.grantCache.flatScopeStrings()

        return EAPDeviceRegistration(
            userId: userId,
            deviceClass: "macos_laptop",
            model: readHardwareModel(),
            os: readOSString(),
            deviceFingerprint: fingerprint,
            manifest: EAPManifest(
                sensors: [
                    "screen_state",
                    "battery",
                    "foreground_app",
                    "calendar_meeting_density",
                    "typing_pace",
                ],
                actuators: [
                    "notification",
                    "voice_tts",
                    "open_app",
                    "open_url",
                    "run_shortcut",
                    "applescript_execute",
                    "dim_screen",
                    "do_not_disturb_toggle",
                ],
                userGrantedScopes: grants
            ),
            operationalState: EAPOperationalState(
                battery: readBatteryPercent(),
                doNotDisturb: false,
                foregroundApp: NSWorkspace.shared
                    .frontmostApplication?
                    .bundleIdentifier,
                paused: false,
                pausedUntil: nil
            ),
            pushToken: nil
        )
    }

    /// Fires the registration call. Safe to invoke repeatedly; the
    /// server upserts on deviceFingerprint.
    static func register(coordinator: EAPCoordinator) async {
        guard let userId = AuthStore.shared.userId,
              AuthStore.shared.preferredBearerToken != nil
        else {
            // Not signed in yet — caller will retry once URLSchemeHandler
            // fires didCompleteSignIn.
            return
        }
        let body = buildRegistration(userId: userId)
        do {
            let response = try await coordinator.postDeviceRegister(body: body)
            // Persist the server-minted EAP device token. Once stored,
            // AuthStore.preferredBearerToken prefers it over the Clerk JWT
            // for every machine call (pending-actions, sensor publish).
            if let token = response.device.token, !token.isEmpty {
                AuthStore.shared.deviceToken = token
            }
            let local = EAPLocalDeviceState(
                deviceId: response.device.id,
                deviceFingerprint: body.deviceFingerprint,
                registeredAt: Date()
            )
            if let data = try? JSONEncoder().encode(local) {
                UserDefaults.standard.set(data, forKey: localStateKey)
            }
            NotificationCenter.default.post(
                name: didRegister,
                object: nil,
                userInfo: ["deviceId": response.device.id]
            )
        } catch {
            // Quiet failure — coordinator surfaces it in the menu bar.
            NSLog("[COYLDesktop] device registration failed: \(error)")
        }
    }

    // MARK: - Hardware fingerprinting

    /// Stable per-Mac identifier. We read the platform UUID from
    /// IOPlatformExpertDevice and hash it with the bundle id so two
    /// reinstalls of the COYL app on the same Mac collapse to one
    /// row, but two different apps on the same Mac don't collide.
    private static func makeDeviceFingerprint() -> String {
        let platformUUID = readPlatformUUID() ?? UUID().uuidString
        let salt = Bundle.main.bundleIdentifier ?? "ai.coyl.desktop"
        let raw = "\(platformUUID)|\(salt)"
        #if canImport(CryptoKit)
        let digest = SHA256.hash(data: Data(raw.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
        #else
        // Pre-CryptoKit fallback — unlikely on macOS 13+. Hex-encode
        // the UTF-8 bytes directly; loses crypto strength but keeps
        // the field stable.
        return Data(raw.utf8).map { String(format: "%02x", $0) }.joined()
        #endif
    }

    private static func readPlatformUUID() -> String? {
        let entry = IOServiceGetMatchingService(
            kIOMainPortDefault,
            IOServiceMatching("IOPlatformExpertDevice")
        )
        guard entry != 0 else { return nil }
        defer { IOObjectRelease(entry) }
        let prop = IORegistryEntryCreateCFProperty(
            entry,
            kIOPlatformUUIDKey as CFString,
            kCFAllocatorDefault,
            0
        )
        return prop?.takeRetainedValue() as? String
    }

    private static func readHardwareModel() -> String {
        var size = 0
        sysctlbyname("hw.model", nil, &size, nil, 0)
        guard size > 0 else { return "Mac" }
        var buf = [CChar](repeating: 0, count: size)
        sysctlbyname("hw.model", &buf, &size, nil, 0)
        return String(cString: buf)
    }

    private static func readOSString() -> String {
        let v = ProcessInfo.processInfo.operatingSystemVersion
        return "macOS \(v.majorVersion).\(v.minorVersion).\(v.patchVersion)"
    }

    private static func readBatteryPercent() -> Int {
        guard
            let snapshot = IOPSCopyPowerSourcesInfo()?.takeRetainedValue(),
            let sources = IOPSCopyPowerSourcesList(snapshot)?.takeRetainedValue()
                as? [CFTypeRef]
        else { return -1 }

        for source in sources {
            guard
                let desc = IOPSGetPowerSourceDescription(snapshot, source)?
                    .takeUnretainedValue() as? [String: Any],
                let capacity = desc[kIOPSCurrentCapacityKey] as? Int
            else { continue }
            return capacity
        }
        return -1
    }
}
