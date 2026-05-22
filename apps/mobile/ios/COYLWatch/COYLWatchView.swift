//
//  COYLWatchView.swift
//  COYLWatch
//
//  Minimal wrist UI — three stacked elements:
//
//    TOP    — small "COYL" wordmark (Geist Mono if bundled, else
//             system monospaced fallback)
//    MIDDLE — large Self-Trust Score, read from the shared App Group
//    BOTTOM — "Today: Day N. {identitySentence}" — the daily-number
//             payload synced from the phone
//
//  Data source: UserDefaults(suiteName: "group.com.coyl.shared").
//  Phone-side writes happen via CoylWatch.syncDailyNumber() — see
//  apps/mobile/modules/coyl-watch/ios/CoylWatch.swift.
//
//  The view re-reads the App Group on every appear and also when the
//  COYLHapticIntervention notifies us a fresh payload arrived
//  (so an interrupt haptic + immediate update both refresh the UI).
//

import SwiftUI

@available(watchOS 10.0, *)
struct COYLWatchView: View {
    @EnvironmentObject private var intervention: COYLHapticIntervention

    // Mirror of the App Group payload. nil values render placeholders.
    @State private var selfTrustScore: Int? = nil
    @State private var dayNumber: Int? = nil
    @State private var identitySentence: String = ""

    // Pulse state — flashes briefly after a successful haptic interrupt
    // so the watcher gets visual confirmation the wrist fired.
    @State private var pulseOpacity: Double = 1.0

    var body: some View {
        VStack(alignment: .center, spacing: 6) {
            // TOP — wordmark
            Text("COYL")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .tracking(2)
                .foregroundStyle(.secondary)

            Spacer(minLength: 0)

            // MIDDLE — Self-Trust Score (the headline number)
            Text(selfTrustScore.map { "\($0)" } ?? "—")
                .font(.system(size: 56, weight: .semibold, design: .rounded))
                .foregroundStyle(.primary)
                .opacity(pulseOpacity)
                .animation(.easeInOut(duration: 0.35), value: pulseOpacity)
                .accessibilityLabel(
                    selfTrustScore.map { "Self-Trust Score \($0) out of 100" }
                        ?? "Self-Trust Score unavailable"
                )

            Text("/100")
                .font(.system(size: 11, weight: .regular, design: .monospaced))
                .foregroundStyle(.secondary)

            Spacer(minLength: 0)

            // BOTTOM — daily-number sentence
            VStack(spacing: 2) {
                if let day = dayNumber {
                    Text("Today: Day \(day)")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.primary)
                }
                if !identitySentence.isEmpty {
                    Text(identitySentence)
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(3)
                        .minimumScaleFactor(0.85)
                }
            }
            .padding(.bottom, 2)
        }
        .padding(.horizontal, 8)
        .onAppear(perform: refresh)
        .onChange(of: intervention.lastEventId) { _, _ in
            // A new WCSession message arrived. Re-read the App Group
            // (the phone may have written a fresh daily number) and
            // fire the visual pulse.
            refresh()
            pulse()
        }
    }

    /// Re-reads the App Group payload. Cheap — UserDefaults is in-memory
    /// after first access. Called on appear and after every WC message.
    private func refresh() {
        guard let defaults = UserDefaults(suiteName: "group.com.coyl.shared") else {
            // App Group not provisioned. Leave placeholders.
            return
        }

        // The phone writes these keys via CoylWatch.syncDailyNumber().
        // Keep key names in lockstep with that file.
        let score = defaults.object(forKey: "coyl.selfTrustScore") as? Int
        let day = defaults.object(forKey: "coyl.dayNumber") as? Int
        let sentence = defaults.string(forKey: "coyl.identitySentence") ?? ""

        self.selfTrustScore = score
        self.dayNumber = day
        self.identitySentence = sentence
    }

    /// Brief opacity dip to confirm an interrupt landed. The complication
    /// also pulses via COYLComplication's timeline refresh.
    private func pulse() {
        pulseOpacity = 0.35
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            pulseOpacity = 1.0
        }
    }
}

@available(watchOS 10.0, *)
#Preview {
    COYLWatchView()
        .environmentObject(COYLHapticIntervention())
}
