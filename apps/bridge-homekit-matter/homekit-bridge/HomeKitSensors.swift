//
//  HomeKitSensors.swift
//  COYL HomeKit Bridge
//
//  Reads sensor states from HomeKit accessories and publishes them as
//  EAP sensor events. The mapping is the inverse of HomeKitActuators —
//  instead of "write a characteristic on command," we "subscribe to a
//  characteristic and POST to /api/eap/v1/sensor/publish when it changes."
//
//  Sensor map (kept in sync with README §2):
//
//    home:motion:<room>          <- HMCharacteristicTypeMotionDetected
//    home:lock:state             <- HMCharacteristicTypeLockCurrentState
//    home:temperature:<room>     <- HMCharacteristicTypeCurrentTemperature
//    home:occupancy:<room>       <- HMCharacteristicTypeOccupancyDetected
//    home:light_level:<room>     <- HMCharacteristicTypeCurrentLightLevel
//    home:humidity:<room>        <- HMCharacteristicTypeCurrentRelativeHumidity
//
//  Why event-driven rather than poll? HomeKit's HMCharacteristic supports
//  enableNotification(_:completionHandler:), which fires the delegate's
//  characteristicDidUpdate callback any time the value changes server-
//  side. This is dramatically cheaper than polling N characteristics
//  every few seconds and respects the user's Home Hub bandwidth budget.
//
//  Rate limit: we throttle outbound sensor publish to one POST per
//  sensor per 5 seconds, to avoid flooding the EAP cloud when a motion
//  sensor goes wild. The throttle is local; the server-side sensor
//  subscription filter (EAP §5 filter.deltaPctMin etc.) is independent.
//

import Foundation
import HomeKit
import os.log

final class HomeKitSensors: NSObject, HMAccessoryDelegate {
    private let client: HomeKitClient
    private let deviceId: String
    private let log = Logger(subsystem: "com.coyl.bridge.homekit", category: "sensors")

    /// Per-sensor last-publish timestamp, used for the 5 s local throttle.
    private var lastPublishAt: [String: Date] = [:]
    private let publishThrottleSec: TimeInterval = 5

    init(client: HomeKitClient, deviceId: String) {
        self.client = client
        self.deviceId = deviceId
        super.init()
    }

    /// Walk every accessory and enable notifications on every supported
    /// characteristic. Called once after registration.
    func subscribeAll() async {
        for accessory in client.accessories {
            accessory.delegate = self
            for service in accessory.services {
                for char in service.characteristics where isSubscribable(char) {
                    do {
                        try await char.enableNotification(true)
                    } catch {
                        log.error("enableNotification failed: \(error.localizedDescription, privacy: .public)")
                    }
                }
            }
        }
    }

    // MARK: - HMAccessoryDelegate

    func accessory(_ accessory: HMAccessory, service: HMService,
                   didUpdateValueFor characteristic: HMCharacteristic) {
        guard let sensorKey = sensorKey(for: characteristic, accessory: accessory) else {
            return
        }
        // Local throttle.
        let now = Date()
        if let last = lastPublishAt[sensorKey],
           now.timeIntervalSince(last) < publishThrottleSec {
            return
        }
        lastPublishAt[sensorKey] = now

        let value = characteristic.value
        Task {
            do {
                try await EAPHTTP.shared.publishSensor(
                    deviceId: deviceId, sensor: sensorKey, value: value
                )
                log.info("publish \(sensorKey, privacy: .public)")
            } catch {
                log.error("sensor publish failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    // MARK: - Mapping

    /// Translate (characteristic, accessory) -> EAP sensor key, or nil
    /// if we don't care about this characteristic. Room name is read
    /// from HMAccessory.room.name; nil rooms become "unknown".
    private func sensorKey(for c: HMCharacteristic, accessory: HMAccessory) -> String? {
        let room = (accessory.room?.name ?? "unknown")
            .lowercased()
            .replacingOccurrences(of: " ", with: "_")
        switch c.characteristicType {
        case HMCharacteristicTypeMotionDetected:
            return "home:motion:\(room)"
        case HMCharacteristicTypeLockCurrentState:
            return "home:lock:state"
        case HMCharacteristicTypeCurrentTemperature:
            return "home:temperature:\(room)"
        case HMCharacteristicTypeOccupancyDetected:
            return "home:occupancy:\(room)"
        case HMCharacteristicTypeCurrentLightLevel:
            return "home:light_level:\(room)"
        case HMCharacteristicTypeCurrentRelativeHumidity:
            return "home:humidity:\(room)"
        default:
            return nil
        }
    }

    private func isSubscribable(_ c: HMCharacteristic) -> Bool {
        switch c.characteristicType {
        case HMCharacteristicTypeMotionDetected,
             HMCharacteristicTypeLockCurrentState,
             HMCharacteristicTypeCurrentTemperature,
             HMCharacteristicTypeOccupancyDetected,
             HMCharacteristicTypeCurrentLightLevel,
             HMCharacteristicTypeCurrentRelativeHumidity:
            return c.properties.contains(HMCharacteristicPropertySupportsEventNotification)
        default:
            return false
        }
    }
}
