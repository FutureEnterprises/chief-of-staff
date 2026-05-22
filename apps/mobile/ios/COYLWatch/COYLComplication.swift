//
//  COYLComplication.swift
//  COYLWatch
//
//  WidgetKit complication for watchOS 10+. Three families:
//
//    accessoryCircular     — corner / circular-small slot, just the
//                            Self-Trust Score as a single number
//    accessoryRectangular  — wider slot: number + tiny "Day N" line
//    accessoryInline       — single-line: "COYL · Day N · 78/100"
//
//  Timeline strategy: read the App Group at startup, then refresh
//  hourly. The phone can also force-refresh via WidgetCenter when
//  CoylWatch.syncDailyNumber() runs — the bridge invokes
//  WidgetCenter.shared.reloadAllTimelines() after writing.
//
//  watchOS 10.0+ — WidgetKit complications API replaced the legacy
//  ClockKit complications in watchOS 9; we target the modern API.
//

import SwiftUI
import WidgetKit

// MARK: - Timeline entry
//
// One snapshot of the wrist payload. WidgetKit hands these to the
// view at render time.

@available(watchOS 10.0, *)
struct COYLComplicationEntry: TimelineEntry {
    let date: Date
    let selfTrustScore: Int?
    let dayNumber: Int?
    let identitySentence: String

    static let placeholder = COYLComplicationEntry(
        date: .now,
        selfTrustScore: 78,
        dayNumber: 12,
        identitySentence: "You're showing up."
    )

    static let empty = COYLComplicationEntry(
        date: .now,
        selfTrustScore: nil,
        dayNumber: nil,
        identitySentence: ""
    )
}

// MARK: - Timeline provider
//
// We don't try to predict future scores — the phone is the source
// of truth. We just emit the current snapshot and ask the system
// to refresh us in one hour. If the phone pushes an updated
// payload sooner, WidgetCenter.reloadAllTimelines() will invalidate
// this timeline and call getTimeline again.

@available(watchOS 10.0, *)
struct COYLComplicationProvider: TimelineProvider {
    func placeholder(in context: Context) -> COYLComplicationEntry {
        .placeholder
    }

    func getSnapshot(
        in context: Context,
        completion: @escaping (COYLComplicationEntry) -> Void
    ) {
        completion(readCurrentEntry())
    }

    func getTimeline(
        in context: Context,
        completion: @escaping (Timeline<COYLComplicationEntry>) -> Void
    ) {
        let entry = readCurrentEntry()
        // Refresh in 1h. WidgetKit may choose to update sooner if
        // budget allows, or later if it doesn't — this is a hint.
        let nextRefresh = Date().addingTimeInterval(60 * 60)
        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
        completion(timeline)
    }

    /// Reads the App Group payload synchronously. Returns `.empty`
    /// if the App Group isn't provisioned or no value has been
    /// written yet.
    private func readCurrentEntry() -> COYLComplicationEntry {
        guard let defaults = UserDefaults(suiteName: "group.com.coyl.shared") else {
            return .empty
        }
        let score = defaults.object(forKey: "coyl.selfTrustScore") as? Int
        let day = defaults.object(forKey: "coyl.dayNumber") as? Int
        let sentence = defaults.string(forKey: "coyl.identitySentence") ?? ""
        return COYLComplicationEntry(
            date: Date(),
            selfTrustScore: score,
            dayNumber: day,
            identitySentence: sentence
        )
    }
}

// MARK: - Family-specific views
//
// Each complication family gets its own SwiftUI view so the layout
// can specialize for its slot. We bind to entry.* fields directly.

@available(watchOS 10.0, *)
struct COYLCircularView: View {
    let entry: COYLComplicationEntry

    var body: some View {
        ZStack {
            // accessoryCircular family shows a small disc; we paint the
            // score numerically inside it. No background — the OS
            // applies the slot's vibrancy treatment automatically.
            Text(entry.selfTrustScore.map { "\($0)" } ?? "—")
                .font(.system(size: 22, weight: .semibold, design: .rounded))
                .minimumScaleFactor(0.6)
                .accessibilityLabel(
                    entry.selfTrustScore.map { "Self-Trust \($0)" }
                        ?? "Self-Trust unavailable"
                )
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

@available(watchOS 10.0, *)
struct COYLRectangularView: View {
    let entry: COYLComplicationEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(entry.selfTrustScore.map { "\($0)" } ?? "—")
                    .font(.system(size: 24, weight: .semibold, design: .rounded))
                Text("/100")
                    .font(.system(size: 10, weight: .regular, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            if let day = entry.dayNumber {
                Text("Day \(day)")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
        }
        .containerBackground(.fill.tertiary, for: .widget)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            entry.selfTrustScore.map {
                "Self-Trust \($0). Day \(entry.dayNumber ?? 0)."
            } ?? "COYL Self-Trust unavailable"
        )
    }
}

@available(watchOS 10.0, *)
struct COYLInlineView: View {
    let entry: COYLComplicationEntry

    var body: some View {
        // Inline family is a single line of text rendered by the OS
        // in the slot above the clock face. Keep it short and dense.
        let day = entry.dayNumber.map { "Day \($0)" } ?? "Day —"
        let score = entry.selfTrustScore.map { "\($0)/100" } ?? "—/100"
        Text("COYL · \(day) · \(score)")
            .containerBackground(.fill.tertiary, for: .widget)
    }
}

// MARK: - Widget configuration
//
// Three Widget conformances bundled together. Each declares the
// supported family (or families) and points at the shared timeline
// provider. The user picks one slot per complication; we ship all
// three so any face layout works.

@available(watchOS 10.0, *)
struct COYLCircularComplication: Widget {
    let kind = "COYLCircularComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: COYLComplicationProvider()) { entry in
            COYLCircularView(entry: entry)
        }
        .configurationDisplayName("COYL Self-Trust")
        .description("Your Self-Trust Score on the watch face.")
        .supportedFamilies([.accessoryCircular, .accessoryCorner])
    }
}

@available(watchOS 10.0, *)
struct COYLRectangularComplication: Widget {
    let kind = "COYLRectangularComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: COYLComplicationProvider()) { entry in
            COYLRectangularView(entry: entry)
        }
        .configurationDisplayName("COYL Today")
        .description("Self-Trust Score and current day number.")
        .supportedFamilies([.accessoryRectangular])
    }
}

@available(watchOS 10.0, *)
struct COYLInlineComplication: Widget {
    let kind = "COYLInlineComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: COYLComplicationProvider()) { entry in
            COYLInlineView(entry: entry)
        }
        .configurationDisplayName("COYL Inline")
        .description("Day N · score in the inline slot.")
        .supportedFamilies([.accessoryInline])
    }
}

// MARK: - Widget bundle
//
// The @main entry for the complication. watchOS bundles all
// Widget conformances declared inside the body — the user can
// then choose any of the three when customizing their face.

@available(watchOS 10.0, *)
@main
struct COYLComplicationBundle: WidgetBundle {
    var body: some Widget {
        COYLCircularComplication()
        COYLRectangularComplication()
        COYLInlineComplication()
    }
}
