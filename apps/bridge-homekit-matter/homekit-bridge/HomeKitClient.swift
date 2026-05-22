//
//  HomeKitClient.swift
//  COYL HomeKit Bridge
//
//  Wraps HMHomeManager. Apple's API is delegate-based and async-y in an
//  ObjC sense, not async/await; we adapt it to ObservableObject so the
//  SwiftUI menu bar surface can observe the accessory count and the
//  rest of the bridge can subscribe to accessory state changes via
//  the published `accessories` array.
//
//  Lifecycle:
//    init() — instantiate HMHomeManager (this is what triggers the OS
//             permission prompt the FIRST time; subsequent launches
//             go straight to delegate callbacks).
//    homeManagerDidUpdateHomes — first signal that the homes / accessories
//             graph is loaded. We pull every accessory across every home
//             into a flat list and republish.
//    homeManagerDidUpdatePrimaryHome — informational only; we don't
//             discriminate between primary and secondary homes — every
//             accessory the user owns is fair game (subject to scope).
//
//  Why flat across homes? EAP doesn't have a concept of "home" — it
//  has devices and rooms. We use the HomeKit `HMRoom.name` as the
//  EAP room hint when registering sensors like `home:motion:living_room`.
//

import Foundation
import HomeKit
import Combine
import os.log

final class HomeKitClient: NSObject, ObservableObject, HMHomeManagerDelegate {
    /// The Apple-side root. Instantiating this object is what triggers
    /// the system permission prompt the first time the app runs.
    private let manager = HMHomeManager()

    /// Flat list of every accessory across every home. Republished
    /// every time the delegate fires.
    @Published private(set) var accessories: [HMAccessory] = []

    /// Convenience for the menu bar UI.
    @Published private(set) var accessoryCount: Int = 0

    /// Errors / state we want to surface up to the UI without bringing
    /// the bridge down.
    @Published private(set) var lastError: String?

    private let log = Logger(subsystem: "com.coyl.bridge.homekit", category: "homekit")

    override init() {
        super.init()
        manager.delegate = self
        log.info("HMHomeManager initialized — awaiting delegate callback")
    }

    // MARK: - HMHomeManagerDelegate

    func homeManagerDidUpdateHomes(_ manager: HMHomeManager) {
        let flat = manager.homes.flatMap { $0.accessories }
        Task { @MainActor in
            self.accessories = flat
            self.accessoryCount = flat.count
        }
        log.info("homes updated — \(flat.count, privacy: .public) accessories total")
    }

    func homeManagerDidUpdatePrimaryHome(_ manager: HMHomeManager) {
        // No-op. We treat every home equally; the primary hint is
        // informational. Refresh accessories anyway in case the
        // primary's contents changed.
        homeManagerDidUpdateHomes(manager)
    }

    // MARK: - Lookups

    /// Resolve an accessory by its HMAccessory.uniqueIdentifier.uuidString.
    /// EAP actions arrive carrying that string in `params.accessoryId`;
    /// the actuator dispatcher uses this to find the live HMAccessory.
    func accessory(by id: String) -> HMAccessory? {
        accessories.first(where: { $0.uniqueIdentifier.uuidString == id })
    }

    /// Find the first characteristic of `kind` on the accessory whose
    /// service is `serviceType`. Most HomeKit accessories only expose
    /// one of each service so first-match is fine; we may add multi-
    /// service disambiguation later (e.g. a light with multiple bulbs).
    func characteristic(
        on accessory: HMAccessory,
        serviceType: String,
        characteristicType: String
    ) -> HMCharacteristic? {
        for service in accessory.services where service.serviceType == serviceType {
            for char in service.characteristics where char.characteristicType == characteristicType {
                return char
            }
        }
        return nil
    }
}
