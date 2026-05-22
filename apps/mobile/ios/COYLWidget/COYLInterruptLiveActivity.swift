//
//  COYLInterruptLiveActivity.swift
//  COYLWidget
//
//  The widget that ActivityKit hands a danger-window interrupt to.
//  Renders three places at once:
//
//    1. Lock-screen banner — full layout with headline / subhead /
//       three action buttons (Held it / Slipped / Snooze).
//    2. Dynamic Island expanded — same content laid out for the
//       expanded long-press pill.
//    3. Dynamic Island compact + minimal — flame glyph + countdown.
//
//  Color discipline:
//    - Cream background       #fafaf7
//    - Signature orange       #ff6600
//    - Warm dark (DI bg)      #0e0d0b
//
//  Typography:
//    Tries Instrument Serif first, falls back to system serif. The
//    font file must be added to the widget target and registered via
//    Info.plist (UIAppFonts) for the custom face to resolve.
//
//  iOS 17.0+ — required for `Button(intent:)` inside a Live Activity.
//  ActivityKit itself shipped in 16.1, but interactive widget buttons
//  bound to App Intents are a 17.0 feature. The widget target's
//  Deployment Target must be 17.0 or later.
//

import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Color tokens

@available(iOS 17.0, *)
private extension Color {
    static let coylCream = Color(red: 0xFA / 255.0, green: 0xFA / 255.0, blue: 0xF7 / 255.0)
    static let coylOrange = Color(red: 0xFF / 255.0, green: 0x66 / 255.0, blue: 0x00 / 255.0)
    static let coylWarmDark = Color(red: 0x0E / 255.0, green: 0x0D / 255.0, blue: 0x0B / 255.0)
}

// MARK: - Typography

@available(iOS 17.0, *)
private extension Font {
    /// Instrument Serif if loaded into the bundle, otherwise system
    /// serif at the same size. Designers can drop the .ttf into the
    /// widget target without code changes.
    static func coylSerif(size: CGFloat) -> Font {
        if UIFont(name: "InstrumentSerif-Regular", size: size) != nil {
            return .custom("InstrumentSerif-Regular", size: size)
        }
        return .system(size: size, weight: .regular, design: .serif)
    }
}

// MARK: - Widget

@available(iOS 17.0, *)
public struct COYLInterruptLiveActivity: Widget {
    public init() {}

    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: COYLInterruptAttributes.self) { context in
            // Lock-screen / banner presentation
            LockScreenView(
                state: context.state,
                attributes: context.attributes
            )
            .activityBackgroundTint(Color.coylCream)
            .activitySystemActionForegroundColor(Color.coylWarmDark)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded — long press
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(Color.coylOrange)
                        .font(.title2)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    CountdownPill(seconds: context.state.timeRemainingSec)
                        .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.headline)
                        .font(.coylSerif(size: 18))
                        .foregroundStyle(Color.coylCream)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ActionButtonRow(interruptId: context.state.interruptId)
                        .padding(.horizontal, 4)
                        .padding(.bottom, 4)
                }
            } compactLeading: {
                Image(systemName: "flame.fill")
                    .foregroundStyle(Color.coylOrange)
            } compactTrailing: {
                Text(formatCountdown(context.state.timeRemainingSec))
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color.coylOrange)
                    .monospacedDigit()
            } minimal: {
                Image(systemName: "flame.fill")
                    .foregroundStyle(Color.coylOrange)
            }
            .keylineTint(Color.coylOrange)
        }
    }
}

// MARK: - Lock-screen layout

@available(iOS 17.0, *)
private struct LockScreenView: View {
    let state: COYLInterruptAttributes.ContentState
    let attributes: COYLInterruptAttributes

    var body: some View {
        ZStack {
            Color.coylCream

            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(Color.coylOrange)
                        .font(.title3)

                    Text(state.headline)
                        .font(.coylSerif(size: 22))
                        .foregroundStyle(Color.coylWarmDark)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)

                    Spacer(minLength: 8)

                    CountdownPill(seconds: state.timeRemainingSec)
                }

                Text(state.subhead)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(Color.coylWarmDark.opacity(0.72))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                ActionButtonRow(interruptId: state.interruptId)
                    .padding(.top, 2)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }
}

// MARK: - Action buttons

@available(iOS 17.0, *)
private struct ActionButtonRow: View {
    let interruptId: String

    var body: some View {
        HStack(spacing: 8) {
            Button(intent: HeldItIntent(interruptId: interruptId)) {
                ActionLabel(title: "Held it", style: .primary)
            }
            .buttonStyle(.plain)

            Button(intent: SlippedIntent(interruptId: interruptId)) {
                ActionLabel(title: "Slipped", style: .secondary)
            }
            .buttonStyle(.plain)

            Button(intent: SnoozeIntent(interruptId: interruptId)) {
                ActionLabel(title: "Snooze", style: .tertiary)
            }
            .buttonStyle(.plain)
        }
    }
}

@available(iOS 17.0, *)
private struct ActionLabel: View {
    enum Style {
        case primary    // signature orange fill
        case secondary  // outlined orange
        case tertiary   // subtle dark
    }

    let title: String
    let style: Style

    var body: some View {
        Text(title)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
    }

    private var foreground: Color {
        switch style {
        case .primary: return Color.coylCream
        case .secondary: return Color.coylOrange
        case .tertiary: return Color.coylWarmDark.opacity(0.78)
        }
    }

    private var background: Color {
        switch style {
        case .primary: return Color.coylOrange
        case .secondary: return Color.clear
        case .tertiary: return Color.coylWarmDark.opacity(0.06)
        }
    }

    private var borderColor: Color {
        switch style {
        case .primary: return Color.clear
        case .secondary: return Color.coylOrange
        case .tertiary: return Color.clear
        }
    }

    private var borderWidth: CGFloat {
        switch style {
        case .secondary: return 1
        default: return 0
        }
    }
}

// MARK: - Countdown pill

@available(iOS 17.0, *)
private struct CountdownPill: View {
    let seconds: Int

    var body: some View {
        Text(formatCountdown(seconds))
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.coylOrange)
            .monospacedDigit()
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.coylOrange.opacity(0.12))
            .clipShape(Capsule())
    }
}

@available(iOS 17.0, *)
private func formatCountdown(_ seconds: Int) -> String {
    let clamped = max(0, seconds)
    let m = clamped / 60
    let s = clamped % 60
    return String(format: "%d:%02d", m, s)
}
