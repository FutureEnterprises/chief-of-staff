//
//  MenuBarController.swift
//  COYL Desktop — EAP Coordinator
//
//  The visible surface of the coordinator. Owns the NSStatusItem
//  (the icon in the menu bar) and the dropdown NSMenu users open
//  when they click it.
//
//  Menu structure (top to bottom):
//    [icon ▾]
//      • Self-Trust Score: 78
//      • Today: 3 actions fired, 2 caught
//      ───────
//      • Scope grants…              → opens ConsentWindow
//      ───────
//      • Pause for 1 hour
//      • Pause until tomorrow
//      • Resume                     (only when paused)
//      ───────
//      • Sign in / Sign out         (depending on AuthStore.isAuthenticated)
//      • Quit COYL
//
//  Pause toggles a local boolean (mirrored to the server's
//  panicSwitch flag for hard fail-closed) AND stops the coordinator's
//  poll timer so we don't pull new actions while paused.
//

import AppKit
import Foundation

@MainActor
final class MenuBarController: NSObject {
    private var statusItem: NSStatusItem!
    private let menu = NSMenu()

    // Items that need state-driven updates.
    private var scoreItem: NSMenuItem!
    private var statusItemRow: NSMenuItem!
    private var signInItem: NSMenuItem!
    private var pauseHourItem: NSMenuItem!
    private var pauseTomorrowItem: NSMenuItem!
    private var resumeItem: NSMenuItem!

    /// Current pause window. Nil = not paused.
    private(set) var pausedUntil: Date?

    /// Hold a strong ref to the ConsentWindow so the SwiftUI window
    /// doesn't get torn down between menu opens.
    private var consentWindow: ConsentWindow?

    func install() {
        statusItem = NSStatusBar.system.statusItem(
            withLength: NSStatusItem.variableLength
        )

        if let button = statusItem.button {
            button.image = NSImage(
                systemSymbolName: "circle.hexagongrid",
                accessibilityDescription: "COYL"
            )
            button.image?.isTemplate = true
            button.toolTip = "COYL — proactive AI coordinator"
        }

        buildMenu()
        statusItem.menu = menu
        refresh()

        // Sign-in callback refreshes the menu (label changes).
        NotificationCenter.default.addObserver(
            forName: URLSchemeHandler.didCompleteSignIn,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.refresh() }
        }
    }

    // MARK: - Building

    private func buildMenu() {
        scoreItem = NSMenuItem(
            title: "Self-Trust Score: —",
            action: nil,
            keyEquivalent: ""
        )
        scoreItem.isEnabled = false
        menu.addItem(scoreItem)

        statusItemRow = NSMenuItem(
            title: "Today: 0 actions fired",
            action: nil,
            keyEquivalent: ""
        )
        statusItemRow.isEnabled = false
        menu.addItem(statusItemRow)

        menu.addItem(.separator())

        let scopeItem = NSMenuItem(
            title: "Scope grants…",
            action: #selector(openScopeWindow),
            keyEquivalent: ","
        )
        scopeItem.target = self
        menu.addItem(scopeItem)

        menu.addItem(.separator())

        pauseHourItem = NSMenuItem(
            title: "Pause for 1 hour",
            action: #selector(pauseOneHour),
            keyEquivalent: ""
        )
        pauseHourItem.target = self
        menu.addItem(pauseHourItem)

        pauseTomorrowItem = NSMenuItem(
            title: "Pause until tomorrow",
            action: #selector(pauseUntilTomorrow),
            keyEquivalent: ""
        )
        pauseTomorrowItem.target = self
        menu.addItem(pauseTomorrowItem)

        resumeItem = NSMenuItem(
            title: "Resume",
            action: #selector(resume),
            keyEquivalent: ""
        )
        resumeItem.target = self
        resumeItem.isHidden = true
        menu.addItem(resumeItem)

        menu.addItem(.separator())

        signInItem = NSMenuItem(
            title: "Sign in…",
            action: #selector(toggleSignIn),
            keyEquivalent: ""
        )
        signInItem.target = self
        menu.addItem(signInItem)

        let quitItem = NSMenuItem(
            title: "Quit COYL",
            action: #selector(quit),
            keyEquivalent: "q"
        )
        quitItem.target = self
        menu.addItem(quitItem)
    }

    // MARK: - State

    func refresh() {
        // Sign-in label.
        signInItem.title = AuthStore.shared.isAuthenticated
            ? "Sign out"
            : "Sign in…"

        // Pause-state visibility.
        let isPaused = pausedUntil != nil
        pauseHourItem.isHidden = isPaused
        pauseTomorrowItem.isHidden = isPaused
        resumeItem.isHidden = !isPaused

        if let until = pausedUntil {
            let formatter = DateFormatter()
            formatter.timeStyle = .short
            formatter.dateStyle = .none
            statusItemRow.title = "Paused until \(formatter.string(from: until))"
        }
    }

    /// Called by the coordinator after each action dispatches. Bumps
    /// the today-counter row.
    func recordActionFired() {
        // Lightweight in-memory counter; persistence is server-side.
        let bumped = (statusItemRow.title as NSString).integerValue + 1
        statusItemRow.title = "Today: \(bumped) actions fired"
    }

    /// Called by anything that updates the self-trust score from
    /// the server.
    func setSelfTrustScore(_ score: Int?) {
        if let s = score {
            scoreItem.title = "Self-Trust Score: \(s)"
        } else {
            scoreItem.title = "Self-Trust Score: —"
        }
    }

    // MARK: - Menu actions

    @objc private func openScopeWindow() {
        if consentWindow == nil {
            consentWindow = ConsentWindow()
        }
        consentWindow?.show()
    }

    @objc private func pauseOneHour() {
        pausedUntil = Date().addingTimeInterval(3600)
        EAPCoordinator.shared.stopPolling()
        SensorPublisher.shared.stop()
        refresh()
    }

    @objc private func pauseUntilTomorrow() {
        let cal = Calendar.current
        let tomorrowMorning = cal.date(
            byAdding: .day,
            value: 1,
            to: cal.startOfDay(for: Date())
        ) ?? Date().addingTimeInterval(43200)
        pausedUntil = tomorrowMorning
        EAPCoordinator.shared.stopPolling()
        SensorPublisher.shared.stop()
        refresh()
    }

    @objc private func resume() {
        pausedUntil = nil
        EAPCoordinator.shared.beginPolling()
        SensorPublisher.shared.start()
        refresh()
    }

    @objc private func toggleSignIn() {
        if AuthStore.shared.isAuthenticated {
            // Sign out: clear local state AND inform the server's
            // panic switch so any cached grants are dropped.
            AuthStore.shared.clear()
            Task { @MainActor in
                let url = EAPCoordinator.shared.baseURL
                    .appendingPathComponent("/api/eap/v1/panic")
                var req = URLRequest(url: url)
                req.httpMethod = "POST"
                _ = try? await URLSession.shared.data(for: req)
            }
            refresh()
        } else {
            SignInLauncher.openBrowser()
        }
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }
}
