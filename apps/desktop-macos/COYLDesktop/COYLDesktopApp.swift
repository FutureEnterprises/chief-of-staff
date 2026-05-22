//
//  COYLDesktopApp.swift
//  COYL Desktop — EAP Coordinator
//
//  SwiftUI App entry point + NSApplicationDelegate. The Settings
//  scene is hidden by default (LSUIElement=YES in Info.plist removes
//  the Dock icon entirely) — users access the consent UI through
//  the menu bar's "Scope grants…" item, which presents the same
//  SwiftUI view in a free-standing NSWindow.
//
//  Launch ordering:
//    1. applicationWillFinishLaunching
//       - register URL scheme handler (must be before launching done)
//    2. applicationDidFinishLaunching
//       - install menu bar
//       - kick EAPCoordinator.start (registers device + begins poll)
//       - kick SensorPublisher.start
//       - request user notification authorization (banner-style; no
//         badge since we have no Dock icon)
//

import AppKit
import SwiftUI
import UserNotifications

@main
struct COYLDesktopApp: App {
    @NSApplicationDelegateAdaptor private var appDelegate: AppDelegate

    var body: some Scene {
        // ⌘, accelerator opens the same SwiftUI view as the menu bar
        // "Scope grants…" item, mostly for keyboard accessibility.
        Settings {
            ConsentSettingsView()
        }
    }
}

// MARK: - AppDelegate

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private let menuBarController = MenuBarController()
    private let urlSchemeHandler = URLSchemeHandler()

    func applicationWillFinishLaunching(_ notification: Notification) {
        // Register the coyl-desktop:// URL scheme handler. Must be
        // wired before the app finishes launching or AppleEvents
        // queued during the launch dance can be dropped.
        urlSchemeHandler.register()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        // No Dock icon. Menu bar only.
        NSApp.setActivationPolicy(.accessory)

        menuBarController.install()

        // Coordinator + sensor loop.
        EAPCoordinator.shared.start()
        SensorPublisher.shared.start()

        // Request user notification permission. macOS shows the
        // system prompt once on first launch; subsequent calls are
        // a no-op.
        Task {
            let center = UNUserNotificationCenter.current()
            _ = try? await center.requestAuthorization(options: [.alert, .sound])
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // Menu bar app: closing the consent window must NOT quit.
        return false
    }
}
