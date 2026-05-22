//
//  ConsentWindow.swift
//  COYL Desktop — EAP Coordinator
//
//  The scope-grant UI. A SwiftUI window listing every EAP scope for
//  macos_laptop with per-LLM toggles. Granting writes to the local
//  cache (via AuthStore) AND POSTs to /api/v1/scope/grant so the
//  server's coordinator can enforce.
//
//  Layout:
//    ┌────────────────────────────────────────────────────────┐
//    │ Scope grants                                           │
//    │ Pick which LLMs can do what on this Mac.               │
//    │                                                        │
//    │  LLM partner: [ Claude       ▾ ]                       │
//    │                                                        │
//    │  Actuators                                             │
//    │  [ ] Show notifications                                │
//    │  [ ] Speak through speaker                             │
//    │  [ ] Open apps                                         │
//    │  [ ] Open URLs                                         │
//    │  [ ] Run macOS Shortcuts                               │
//    │  [ ] Run AppleScript                                   │
//    │  [ ] Dim the screen                                    │
//    │  [ ] Toggle Do Not Disturb                             │
//    │                                                        │
//    │  Sensors                                               │
//    │  [ ] Screen on/off                                     │
//    │  [ ] Foreground app                                    │
//    │  [ ] Battery                                           │
//    │  [ ] Calendar density                                  │
//    │  [ ] Typing pace                                       │
//    └────────────────────────────────────────────────────────┘
//

import AppKit
import SwiftUI

// MARK: - Window wrapper

@MainActor
final class ConsentWindow {
    private var window: NSWindow?

    func show() {
        if let window = window {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }
        let root = ConsentSettingsView()
        let hosting = NSHostingController(rootView: root)
        let window = NSWindow(contentViewController: hosting)
        window.title = "COYL — Scope grants"
        window.styleMask = [.titled, .closable]
        window.setContentSize(NSSize(width: 540, height: 560))
        window.center()
        window.isReleasedWhenClosed = false
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        self.window = window
    }
}

// MARK: - SwiftUI view

/// Single SwiftUI view backing both the standalone consent window and
/// the App scene's hidden Settings binding (for ⌘, accelerator).
struct ConsentSettingsView: View {
    @State private var grants: EAPGrantCache = AuthStore.shared.grantCache
    @State private var selectedPartnerId: String = "anthropic-claude-sonnet-3-7"
    @State private var pendingSync: Bool = false

    private let knownPartners: [(id: String, label: String)] = [
        ("anthropic-claude-sonnet-3-7", "Anthropic Claude"),
        ("openai-gpt-5", "OpenAI GPT"),
        ("google-gemini-2-0", "Google Gemini"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Scope grants").font(.title2).bold()
            Text("Pick which LLMs can act on this Mac. You can revoke any time.")
                .foregroundStyle(.secondary)
                .font(.callout)

            Picker("LLM partner", selection: $selectedPartnerId) {
                ForEach(knownPartners, id: \.id) { partner in
                    Text(partner.label).tag(partner.id)
                }
            }
            .pickerStyle(.menu)

            Divider()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    section(
                        title: "Actuators",
                        scopes: EAPScope.allCases.filter { $0.isActuator }
                    )
                    section(
                        title: "Sensors",
                        scopes: EAPScope.allCases.filter { !$0.isActuator }
                    )
                }
            }

            HStack {
                Spacer()
                if pendingSync {
                    ProgressView().controlSize(.small)
                }
                Button("Done") {
                    NSApp.keyWindow?.close()
                }
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .frame(minWidth: 500, minHeight: 520)
    }

    @ViewBuilder
    private func section(title: String, scopes: [EAPScope]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.headline)
            ForEach(scopes) { scope in
                ScopeRow(
                    scope: scope,
                    isGranted: grants.hasGrant(
                        partnerId: selectedPartnerId,
                        scope: scope
                    ),
                    onToggle: { newValue in
                        toggle(scope: scope, granted: newValue)
                    }
                )
            }
        }
    }

    private func toggle(scope: EAPScope, granted: Bool) {
        if granted {
            grants.grant(partnerId: selectedPartnerId, scope: scope)
        } else {
            grants.revoke(partnerId: selectedPartnerId, scope: scope)
        }
        AuthStore.shared.grantCache = grants
        Task { await sync(scope: scope, granted: granted) }
    }

    /// POST /api/v1/scope/grant. Server is the source of truth; local
    /// cache only enables offline fail-closed enforcement.
    private func sync(scope: EAPScope, granted: Bool) async {
        pendingSync = true
        defer { pendingSync = false }
        guard
            let userId = AuthStore.shared.userId,
            let token = AuthStore.shared.preferredBearerToken
        else { return }

        let coord = EAPCoordinator.shared
        let url = coord.baseURL
            .appendingPathComponent("/api/v1/scope/grant")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let body: [String: Any] = [
            "userId": userId,
            "llmPartnerId": selectedPartnerId,
            "scope": scope.rawValue,
            "granted": granted,
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: req)
    }
}

// MARK: - ScopeRow

private struct ScopeRow: View {
    let scope: EAPScope
    let isGranted: Bool
    let onToggle: (Bool) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Toggle(scope.label, isOn: Binding(
                get: { isGranted },
                set: { onToggle($0) }
            ))
            .toggleStyle(.switch)
            Text(scope.explanation)
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.leading, 2)
        }
        .padding(.vertical, 4)
    }
}
