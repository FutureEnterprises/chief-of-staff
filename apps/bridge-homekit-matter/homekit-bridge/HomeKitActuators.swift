//
//  HomeKitActuators.swift
//  COYL HomeKit Bridge
//
//  Maps an incoming EAPAction (actuator + params) onto an HMCharacteristic
//  write. This is the heart of the bridge — every EAP "do something in
//  the house" call lands here.
//
//  Dispatch table (kept in sync with README §2 "Actuator mappings"):
//
//    home:lights:on          -> HMCharacteristicTypePowerState  = true
//    home:lights:off         -> HMCharacteristicTypePowerState  = false
//    home:lights:dim         -> HMCharacteristicTypeBrightness  = params.brightness (0..100)
//    home:lights:color       -> HMCharacteristicTypeHue + Saturation
//    home:lock:lock          -> HMCharacteristicTypeLockTargetState = secured  (IRREVERSIBLE)
//    home:lock:unlock        -> HMCharacteristicTypeLockTargetState = unsecured (IRREVERSIBLE)
//    home:thermostat:set     -> HMCharacteristicTypeTargetTemperature (Celsius)
//    home:speaker:play       -> HMCharacteristicTypeMute = false (best-effort)
//    home:speaker:pause      -> HMCharacteristicTypeMute = true  (best-effort)
//
//  All :irreversible actuators (locks) require a fresh per-action
//  confirmation token from the server. The server-side coordinator
//  attaches the confirmation to the EAPAction; we trust the server's
//  decision and refuse if the token is absent. We do NOT issue our
//  own consent UI here — that's the COYL iOS app's job.
//

import Foundation
import HomeKit
import os.log

enum HomeKitActuators {
    private static let log = Logger(subsystem: "com.coyl.bridge.homekit", category: "actuators")

    /// Single entry point. Dispatches on the actuator string and writes
    /// the right HMCharacteristic. Always returns an EAPActionOutcome
    /// the caller can POST back to /api/eap/v1/action/outcome.
    static func dispatch(_ action: EAPAction, client: HomeKitClient) async -> EAPActionOutcome {
        guard let accessoryId = action.params["accessoryId"]?.string else {
            return .rejected(action.executionToken, reason: "missing_accessoryId")
        }
        guard let accessory = client.accessory(by: accessoryId) else {
            return .rejected(action.executionToken, reason: "accessory_not_found")
        }

        // Reject irreversible writes that lack a fresh confirm token.
        // Coordinator server-side should already have stamped this; if
        // it's missing we treat it as a misconfigured call, not a deny,
        // and report 'rejected' so the audit log is clear.
        if isIrreversible(action.actuator) {
            guard action.params["perActionConfirmToken"]?.string != nil else {
                return .rejected(action.executionToken, reason: "irreversible_requires_confirm")
            }
        }

        log.info("dispatch \(action.actuator, privacy: .public) on \(accessory.name, privacy: .public)")

        switch action.actuator {
        case "home:lights:on":
            return await writeBool(action, client: client, accessory: accessory,
                                   service: HMServiceTypeLightbulb,
                                   characteristic: HMCharacteristicTypePowerState,
                                   value: true)

        case "home:lights:off":
            return await writeBool(action, client: client, accessory: accessory,
                                   service: HMServiceTypeLightbulb,
                                   characteristic: HMCharacteristicTypePowerState,
                                   value: false)

        case "home:lights:dim":
            guard let pct = action.params["brightness"]?.int ?? action.params["level"]?.int else {
                return .rejected(action.executionToken, reason: "missing_brightness")
            }
            let clamped = max(0, min(100, pct))
            return await writeInt(action, client: client, accessory: accessory,
                                  service: HMServiceTypeLightbulb,
                                  characteristic: HMCharacteristicTypeBrightness,
                                  value: clamped)

        case "home:lights:color":
            // hue 0..360, saturation 0..100. Default to a "warm calm" hue
            // if the LLM didn't pick — useful for the wind-down scenario.
            let hue = action.params["hue"]?.number ?? 30
            let sat = action.params["saturation"]?.number ?? 60
            return await writeHueSat(action, client: client, accessory: accessory,
                                     hue: hue, saturation: sat)

        case "home:lock:lock":
            // 1 = secured per Apple constants — write to LockTargetState,
            // not LockCurrentState (current is read-only).
            return await writeInt(action, client: client, accessory: accessory,
                                  service: HMServiceTypeLockMechanism,
                                  characteristic: HMCharacteristicTypeTargetLockMechanismState,
                                  value: 1)

        case "home:lock:unlock":
            return await writeInt(action, client: client, accessory: accessory,
                                  service: HMServiceTypeLockMechanism,
                                  characteristic: HMCharacteristicTypeTargetLockMechanismState,
                                  value: 0)

        case "home:thermostat:set":
            guard let tempC = action.params["temperatureCelsius"]?.number
                    ?? action.params["temperature"]?.number else {
                return .rejected(action.executionToken, reason: "missing_temperature")
            }
            return await writeDouble(action, client: client, accessory: accessory,
                                     service: HMServiceTypeThermostat,
                                     characteristic: HMCharacteristicTypeTargetTemperature,
                                     value: tempC)

        case "home:speaker:play":
            return await writeBool(action, client: client, accessory: accessory,
                                   service: HMServiceTypeSpeaker,
                                   characteristic: HMCharacteristicTypeMute,
                                   value: false)

        case "home:speaker:pause":
            return await writeBool(action, client: client, accessory: accessory,
                                   service: HMServiceTypeSpeaker,
                                   characteristic: HMCharacteristicTypeMute,
                                   value: true)

        default:
            return .rejected(action.executionToken, reason: "unsupported_actuator:\(action.actuator)")
        }
    }

    // MARK: - Primitive writers

    private static func writeBool(
        _ action: EAPAction, client: HomeKitClient, accessory: HMAccessory,
        service: String, characteristic: String, value: Bool
    ) async -> EAPActionOutcome {
        guard let c = client.characteristic(on: accessory, serviceType: service, characteristicType: characteristic) else {
            return .failed(action.executionToken, reason: "characteristic_unavailable")
        }
        return await withCheckedContinuation { cont in
            c.writeValue(value as NSNumber) { error in
                if let error {
                    cont.resume(returning: .failed(action.executionToken, reason: error.localizedDescription))
                } else {
                    cont.resume(returning: .executed(action.executionToken))
                }
            }
        }
    }

    private static func writeInt(
        _ action: EAPAction, client: HomeKitClient, accessory: HMAccessory,
        service: String, characteristic: String, value: Int
    ) async -> EAPActionOutcome {
        guard let c = client.characteristic(on: accessory, serviceType: service, characteristicType: characteristic) else {
            return .failed(action.executionToken, reason: "characteristic_unavailable")
        }
        return await withCheckedContinuation { cont in
            c.writeValue(value as NSNumber) { error in
                if let error {
                    cont.resume(returning: .failed(action.executionToken, reason: error.localizedDescription))
                } else {
                    cont.resume(returning: .executed(action.executionToken))
                }
            }
        }
    }

    private static func writeDouble(
        _ action: EAPAction, client: HomeKitClient, accessory: HMAccessory,
        service: String, characteristic: String, value: Double
    ) async -> EAPActionOutcome {
        guard let c = client.characteristic(on: accessory, serviceType: service, characteristicType: characteristic) else {
            return .failed(action.executionToken, reason: "characteristic_unavailable")
        }
        return await withCheckedContinuation { cont in
            c.writeValue(value as NSNumber) { error in
                if let error {
                    cont.resume(returning: .failed(action.executionToken, reason: error.localizedDescription))
                } else {
                    cont.resume(returning: .executed(action.executionToken))
                }
            }
        }
    }

    /// Color writes are split because we need two characteristic writes
    /// to land — hue and saturation — and we want to surface failure if
    /// either fails.
    private static func writeHueSat(
        _ action: EAPAction, client: HomeKitClient, accessory: HMAccessory,
        hue: Double, saturation: Double
    ) async -> EAPActionOutcome {
        guard
            let hueChar = client.characteristic(on: accessory,
                                                serviceType: HMServiceTypeLightbulb,
                                                characteristicType: HMCharacteristicTypeHue),
            let satChar = client.characteristic(on: accessory,
                                                serviceType: HMServiceTypeLightbulb,
                                                characteristicType: HMCharacteristicTypeSaturation)
        else {
            return .failed(action.executionToken, reason: "color_characteristics_unavailable")
        }

        let hueOK = await write(hueChar, hue)
        let satOK = await write(satChar, saturation)
        if hueOK && satOK {
            return .executed(action.executionToken)
        }
        return .failed(action.executionToken, reason: "color_partial_write")
    }

    private static func write(_ c: HMCharacteristic, _ value: Double) async -> Bool {
        await withCheckedContinuation { cont in
            c.writeValue(value as NSNumber) { error in
                cont.resume(returning: error == nil)
            }
        }
    }

    // MARK: - Policy

    /// Actuators in this set carry the EAP `:irreversible` scope category.
    /// They never auto-fire — the server attaches a per-action confirm
    /// token; we refuse the call if it's missing.
    private static func isIrreversible(_ actuator: String) -> Bool {
        switch actuator {
        case "home:lock:lock", "home:lock:unlock":
            return true
        default:
            return false
        }
    }
}
