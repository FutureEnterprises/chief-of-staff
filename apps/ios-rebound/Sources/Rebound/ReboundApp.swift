//
//  ReboundApp.swift
//  Rebound
//
//  SwiftUI app entry point. v0.5 surfaces:
//    - First-launch: HealthKit authorization request + email capture
//    - Home: today's danger window list + recent interrupts
//    - Settings: kill switch + audit log export
//
//  Wired but not implemented in this scaffold — the views below are
//  intentional placeholders that compile and surface the architecture
//  without inventing UX that the founder hasn't approved yet.
//

import SwiftUI
import ReboundDomain

@main
struct ReboundApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

struct RootView: View {
    @State private var hasAuthorizedHealthKit = false

    var body: some View {
        NavigationStack {
            if hasAuthorizedHealthKit {
                HomeView()
            } else {
                OnboardingView(onAuthorized: { hasAuthorizedHealthKit = true })
            }
        }
    }
}

struct OnboardingView: View {
    let onAuthorized: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Catch yourself before you do it again.")
                .font(.system(size: 32, weight: .semibold, design: .serif))
                .lineSpacing(2)

            Text("Rebound watches for your danger windows and catches them in three seconds. Free. Forever. Your data stays yours.")
                .font(.system(size: 17))
                .foregroundStyle(.secondary)

            Spacer()

            Button(action: requestAuthorization) {
                Text("Grant HealthKit access")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(red: 1.0, green: 0.4, blue: 0.0))
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            }

            Text("Your HealthKit data stays on your device. We use it to detect danger windows. We never sync it off your phone.")
                .font(.system(size: 13))
                .foregroundStyle(.tertiary)
        }
        .padding(24)
    }

    private func requestAuthorization() {
        Task {
            let granted = await HealthKitClient.shared.requestAuthorization()
            if granted {
                onAuthorized()
            }
        }
    }
}

struct HomeView: View {
    var body: some View {
        List {
            Section("Today's windows") {
                Text("No windows detected today.")
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
            }
            Section("Recent interrupts") {
                Text("No interrupts fired yet.")
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
            }
            Section {
                NavigationLink("Kill switch") { KillSwitchView() }
                NavigationLink("Audit log") { AuditLogView() }
            }
        }
        .navigationTitle("Rebound")
    }
}

struct KillSwitchView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("One tap. Everything stops.")
                .font(.system(size: 24, weight: .semibold, design: .serif))
            Text("Rebound will stop firing interrupts immediately. Your audit log stays. Re-enable any time.")
                .font(.system(size: 15))
                .foregroundStyle(.secondary)
            Spacer()
            Button("Stop everything", role: .destructive) {
                // TODO: wire to InterruptDelivery.killSwitch()
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding(24)
        .navigationTitle("Kill switch")
    }
}

struct AuditLogView: View {
    var body: some View {
        List {
            Text("Audit log is empty.")
                .font(.system(size: 15))
                .foregroundStyle(.secondary)
        }
        .navigationTitle("Audit log")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Export") {
                    // TODO: export the log as signed JSON
                }
            }
        }
    }
}
