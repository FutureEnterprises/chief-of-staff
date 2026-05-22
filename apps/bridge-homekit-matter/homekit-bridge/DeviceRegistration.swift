//
//  DeviceRegistration.swift
//  COYL HomeKit Bridge
//
//  Builds the EAP manifest for this bridge and POSTs it to
//  /api/eap/v1/device/register. The server upserts on the
//  deviceFingerprint and returns a deviceId we cache in UserDefaults.
//
//  Identity model — v0.1 picks "single EAP device per bridge with
//  many actuators" rather than "one EAP device per HomeKit accessory."
//  Rationale documented in README §7 q1; in short, it keeps the
//  scope grant UX simple (user grants "home:lights:*" once, not
//  per-bulb) and lets us add granularity in v0.2 if needed.
//
//  The actuator + sensor manifests are derived dynamically from the
//  user's HomeKit fleet — we don't claim capabilities the user
//  doesn't have. If the user has no thermostat, "home:thermostat:set"
//  is omitted; the LLM sees the truth.
//
//  Auth — see EAPHTTP.swift. We read COYL_USER_TOKEN from the user's
//  Keychain (same token the macOS desktop coordinator stores under
//  service "com.coyl.app", account "user_token"). If the token is
//  missing the user hasn't onboarded yet; we surface a menu-bar
//  prompt to sign in via coyl.ai.
//

import Foundation
import HomeKit
import IOKit
import os.log

struct DeviceRegistration {
    let deviceId: String
    let deviceFingerprint: String

    private static let log = Logger(subsystem: "com.coyl.bridge.homekit", category: "register")

    static func register(client: HomeKitClient) async throws -> DeviceRegistration {
        let fingerprint = deviceFingerprint()
        let manifest = buildManifest(from: client.accessories)
        let opState = buildOperationalState()

        let body: [String: Any] = [
            "deviceClass": "homekit_bridge",
            "model": "macOS HomeKit Bridge",
            "os": ProcessInfo.processInfo.operatingSystemVersionString,
            "deviceFingerprint": fingerprint,
            "manifest": manifest,
            "operationalState": opState
        ]

        let deviceId = try await EAPHTTP.shared.registerDevice(body: body)
        log.info("register OK fingerprint=\(fingerprint, privacy: .public)")
        return DeviceRegistration(deviceId: deviceId, deviceFingerprint: fingerprint)
    }

    /// Derive a stable per-Mac fingerprint from IOPlatformExpertDevice.
    /// We hash with the bundle id so a second app on the same Mac
    /// (e.g. the desktop coordinator) doesn't collide with the bridge.
    private static func deviceFingerprint() -> String {
        let bundle = Bundle.main.bundleIdentifier ?? "com.coyl.bridge.homekit"
        let platformUUID: String = {
            let service = IOServiceGetMatchingService(
                kIOMasterPortDefault,
                IOServiceMatching("IOPlatformExpertDevice")
            )
            defer { IOObjectRelease(service) }
            if let uuid = IORegistryEntryCreateCFProperty(
                service, kIOPlatformUUIDKey as CFString, kCFAllocatorDefault, 0
            )?.takeRetainedValue() as? String {
                return uuid
            }
            return UUID().uuidString  // fall back to per-launch — never collides but won't dedup
        }()
        let raw = "\(bundle)|\(platformUUID)"
        return raw.djb2Hex()
    }

    /// Walk every accessory and union the supported EAP actuators +
    /// sensors. We use service / characteristic presence as the truth.
    /// If the user has zero lights, "home:lights:dim" is not exposed.
    private static func buildManifest(from accessories: [HMAccessory]) -> [String: Any] {
        var actuators = Set<String>()
        var sensors = Set<String>()
        var grantedScopes = Set<String>()

        for acc in accessories {
            for svc in acc.services {
                switch svc.serviceType {
                case HMServiceTypeLightbulb:
                    actuators.insert("home:lights:on")
                    actuators.insert("home:lights:off")
                    if hasChar(svc, HMCharacteristicTypeBrightness) {
                        actuators.insert("home:lights:dim")
                    }
                    if hasChar(svc, HMCharacteristicTypeHue) {
                        actuators.insert("home:lights:color")
                    }
                    grantedScopes.insert("edge:home:lights_dim")

                case HMServiceTypeLockMechanism:
                    actuators.insert("home:lock:lock")
                    actuators.insert("home:lock:unlock")
                    sensors.insert("home:lock:state")
                    // Lock scope is :irreversible — NEVER auto-grant.
                    // We list it as a requested-but-not-granted scope.

                case HMServiceTypeThermostat:
                    actuators.insert("home:thermostat:set")
                    grantedScopes.insert("edge:home:thermostat")

                case HMServiceTypeSpeaker:
                    actuators.insert("home:speaker:play")
                    actuators.insert("home:speaker:pause")

                case HMServiceTypeMotionSensor:
                    let room = roomKey(acc)
                    sensors.insert("home:motion:\(room)")

                case HMServiceTypeOccupancySensor:
                    let room = roomKey(acc)
                    sensors.insert("home:occupancy:\(room)")

                case HMServiceTypeTemperatureSensor:
                    let room = roomKey(acc)
                    sensors.insert("home:temperature:\(room)")

                case HMServiceTypeHumiditySensor:
                    let room = roomKey(acc)
                    sensors.insert("home:humidity:\(room)")

                case HMServiceTypeLightSensor:
                    let room = roomKey(acc)
                    sensors.insert("home:light_level:\(room)")

                default:
                    continue
                }
            }
        }

        return [
            "sensors": Array(sensors).sorted(),
            "actuators": Array(actuators).sorted(),
            "userGrantedScopes": Array(grantedScopes).sorted()
        ]
    }

    private static func buildOperationalState() -> [String: Any] {
        return [
            "battery": -1,                    // Macs report -1 when on AC w/o battery
            "doNotDisturb": false,            // we don't read DnD here
            "paused": false,
            "bridgeVersion": "0.1.0"
        ]
    }

    private static func hasChar(_ svc: HMService, _ t: String) -> Bool {
        svc.characteristics.contains(where: { $0.characteristicType == t })
    }

    private static func roomKey(_ acc: HMAccessory) -> String {
        (acc.room?.name ?? "unknown")
            .lowercased()
            .replacingOccurrences(of: " ", with: "_")
    }
}

// MARK: - djb2 (cheap, deterministic, no Crypto dep)

private extension String {
    /// 64-bit djb2 hash. Not cryptographic — we only need a stable
    /// fingerprint for the server's idempotency key, not a security
    /// boundary.
    func djb2Hex() -> String {
        var hash: UInt64 = 5381
        for b in self.utf8 {
            hash = ((hash << 5) &+ hash) &+ UInt64(b)
        }
        return String(format: "%016llx", hash)
    }
}
