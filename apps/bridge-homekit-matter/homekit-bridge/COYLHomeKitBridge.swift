//
//  COYLHomeKitBridge.swift
//  COYL HomeKit Bridge — EAP smart-home coordinator (HomeKit side)
//
//  Entry point. A SwiftUI app that lives as a menu bar agent
//  (LSUIElement = true in Info.plist — no Dock icon, no main window).
//  On launch we ask the OS for HomeKit access (the system prompt is
//  un-bypassable; user has to grant per-Mac), spin up the HomeKitClient
//  which becomes the HMHomeManager delegate, and start the EAP loop.
//
//  The EAP loop is intentionally simple in v0.1:
//    1. POST /api/eap/v1/device/register with the manifest derived from
//       the user's HomeKit accessory fleet.
//    2. Poll GET /api/eap/v1/devices/<id>/pending-actions every 3 s.
//    3. Route each action through HomeKitActuators.
//    4. POST /api/eap/v1/action/outcome with the executionToken.
//
//  Why poll instead of WebSocket? EAP v0.1 §1 spec leaves the
//  transport upgradeable. Poll is dumb, robust, and matches what the
//  macOS desktop coordinator (apps/desktop-macos/) already does. We
//  swap to WebSocket once the action volume justifies it.
//
//  Why menu bar instead of full app? HomeKit access works fine in a
//  background-only LSUIElement. A full app would force a Dock icon
//  the user doesn't want — this is infrastructure, not a user app.
//

import SwiftUI
import HomeKit
import os.log

@main
struct COYLHomeKitBridge: App {
    /// Single shared client. NSApplicationDelegateAdaptor would also work
    /// but for a menu-bar-only app SwiftUI's `.menuBarExtra` scene is the
    /// cleanest entry point on macOS 13+.
    @StateObject private var client = HomeKitClient()

    /// EAP loop driver. Holds the registration state + the poll Task.
    @StateObject private var coordinator = EAPLoop()

    var body: some Scene {
        MenuBarExtra("COYL", systemImage: "house.lodge") {
            MenuBarContent()
                .environmentObject(client)
                .environmentObject(coordinator)
                .onAppear {
                    // HomeKit delegate is set inside HomeKitClient.init().
                    // Kick the EAP loop once we have at least one accessory
                    // discovered (or after a 5 s timeout — empty homes are
                    // legitimate and we still want to be registered).
                    coordinator.start(client: client)
                }
        }
        .menuBarExtraStyle(.window)
    }
}

/// The dropdown content. Intentionally thin — most of the value of
/// the bridge is in the background loop, not the UI.
struct MenuBarContent: View {
    @EnvironmentObject var client: HomeKitClient
    @EnvironmentObject var coordinator: EAPLoop

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle()
                    .fill(coordinator.isConnected ? .green : .orange)
                    .frame(width: 8, height: 8)
                Text(coordinator.isConnected ? "Connected to coyl.ai" : "Offline")
                    .font(.caption)
            }

            Divider()

            Text("HomeKit fleet")
                .font(.headline)
            Text("\(client.accessoryCount) accessories")
                .font(.caption)
                .foregroundStyle(.secondary)

            Divider()

            if let last = coordinator.lastAction {
                Text("Last action").font(.headline)
                Text(last.actuator)
                    .font(.caption.monospaced())
                Text(last.reasoning ?? "—")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
                Divider()
            }

            Button("Pause for 1 hour") {
                coordinator.pause(durationSec: 3600)
            }
            Button("Open consent settings on coyl.ai") {
                if let url = URL(string: "https://coyl.ai/settings/eap") {
                    NSWorkspace.shared.open(url)
                }
            }
            Button("Quit") {
                NSApplication.shared.terminate(nil)
            }
        }
        .padding(12)
        .frame(width: 260)
    }
}

// MARK: - EAPLoop

/// Drives the four-step poll loop. Owns the URLSession, the auth
/// token, and the active polling Task. Restart-safe: calling start()
/// twice cancels the first task.
final class EAPLoop: ObservableObject {
    @Published var isConnected: Bool = false
    @Published var lastAction: EAPAction?
    @Published var pausedUntil: Date?

    private var pollTask: Task<Void, Never>?
    private var registration: DeviceRegistration?
    private let log = Logger(subsystem: "com.coyl.bridge.homekit", category: "eap")

    func start(client: HomeKitClient) {
        // Cancel any previous loop. SwiftUI may call onAppear more than once
        // (window reopens), so we always idempotently reset.
        pollTask?.cancel()

        pollTask = Task { [weak self] in
            guard let self else { return }

            // Wait briefly for HomeKit to enumerate accessories before we
            // build the manifest — otherwise we register a zero-accessory
            // device and the LLM has nothing to address.
            try? await Task.sleep(nanoseconds: 5_000_000_000)

            do {
                let reg = try await DeviceRegistration.register(client: client)
                await MainActor.run { self.registration = reg; self.isConnected = true }
                self.log.info("EAP register OK — deviceId=\(reg.deviceId, privacy: .public)")
            } catch {
                self.log.error("EAP register failed: \(error.localizedDescription, privacy: .public)")
                await MainActor.run { self.isConnected = false }
                return
            }

            while !Task.isCancelled {
                if self.isPaused() {
                    try? await Task.sleep(nanoseconds: 5_000_000_000)
                    continue
                }
                do {
                    let pending = try await self.fetchPending()
                    for action in pending {
                        await MainActor.run { self.lastAction = action }
                        await self.execute(action, client: client)
                    }
                } catch {
                    self.log.error("poll error: \(error.localizedDescription, privacy: .public)")
                }
                try? await Task.sleep(nanoseconds: 3_000_000_000)
            }
        }
    }

    func pause(durationSec: TimeInterval) {
        pausedUntil = Date().addingTimeInterval(durationSec)
    }

    private func isPaused() -> Bool {
        if let until = pausedUntil, until > Date() { return true }
        return false
    }

    private func fetchPending() async throws -> [EAPAction] {
        guard let reg = registration else { return [] }
        return try await EAPHTTP.shared.fetchPendingActions(deviceId: reg.deviceId)
    }

    private func execute(_ action: EAPAction, client: HomeKitClient) async {
        let result = await HomeKitActuators.dispatch(action, client: client)
        do {
            try await EAPHTTP.shared.postOutcome(result)
        } catch {
            log.error("post outcome failed: \(error.localizedDescription, privacy: .public)")
        }
    }
}
