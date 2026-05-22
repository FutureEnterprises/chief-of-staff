//
//  COYLWatchApp.swift
//  COYLWatch
//
//  Entry point for the watchOS app target. Single root scene that
//  hosts COYLWatchView. The view itself owns the WatchConnectivity
//  session via COYLHapticIntervention — we instantiate the
//  intervention listener here as a StateObject so it lives for the
//  duration of the app process and never gets torn down by view
//  re-renders.
//
//  watchOS 10.0+ — released Sept 2023. SwiftUI App lifecycle.
//

import SwiftUI

@main
@available(watchOS 10.0, *)
struct COYLWatchApp: App {
    // Owned at the app level so the WCSession delegate stays alive
    // for the full process lifetime. If we put this on the View
    // instead, SwiftUI's diffing could deallocate it mid-message
    // and we'd drop interrupt haptics on the floor.
    @StateObject private var intervention = COYLHapticIntervention()

    var body: some Scene {
        WindowGroup {
            COYLWatchView()
                .environmentObject(intervention)
                .onAppear {
                    // Kick the WCSession activation on first render.
                    // Idempotent — safe to call repeatedly.
                    intervention.activate()
                }
        }
    }
}
