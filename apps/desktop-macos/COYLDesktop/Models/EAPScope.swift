//
//  EAPScope.swift
//  COYL Desktop — EAP Coordinator
//
//  The EAP scope vocabulary for THIS device class (macos_laptop),
//  plus a tiny grant store. Scope strings are the canonical contract
//  between the LLM and the device — the server enforces them at
//  `/action/request` time, but we also enforce locally so we never
//  dispatch an actuator the user hasn't approved.
//
//  Two-tier model:
//    1. The server holds the authoritative `ScopeGrant` rows
//       per (user, llmPartner, scope).
//    2. We cache the user's `userGrantedScopes` locally so the
//       device-side `ActuatorRouter` can fail-closed even when
//       offline — without a cache hit, we report
//       outcome=rejected:offline_no_grant.
//

import Foundation

/// The 9 scope categories on macOS. Mirror the spec's vocabulary
/// exactly — these strings cross the wire. Don't rename without
/// coordinating with `apps/web/src/lib/eap/scope-vocabulary.ts`.
enum EAPScope: String, CaseIterable, Codable, Identifiable {
    // --- Actuator scopes ---
    case notification          = "edge:laptop:notification"
    case dimScreen             = "edge:laptop:dim_screen"
    case doNotDisturbToggle    = "edge:laptop:do_not_disturb_toggle"
    case openApp               = "edge:laptop:open_app"
    case openUrl               = "edge:laptop:open_url"
    case runShortcut           = "edge:laptop:run_shortcut"
    case voiceTts              = "edge:laptop:voice"
    case applescriptExecute    = "edge:laptop:applescript_execute"

    // --- Sensor read scopes ---
    case readScreenState       = "edge:laptop:read:screen_state"
    case readForegroundApp     = "edge:laptop:read:foreground_app"
    case readBattery           = "edge:laptop:read:battery"
    case readCalendar          = "edge:laptop:read:calendar"
    case readTypingPace        = "edge:laptop:read:typing_pace"

    var id: String { rawValue }

    /// User-facing label for the consent window.
    var label: String {
        switch self {
        case .notification:        return "Show notifications"
        case .dimScreen:           return "Dim the screen"
        case .doNotDisturbToggle:  return "Toggle Do Not Disturb"
        case .openApp:             return "Open apps"
        case .openUrl:             return "Open URLs"
        case .runShortcut:         return "Run macOS Shortcuts"
        case .voiceTts:            return "Speak through the speaker"
        case .applescriptExecute:  return "Run AppleScript (powerful — see help)"
        case .readScreenState:     return "Read whether the screen is on"
        case .readForegroundApp:   return "Read which app is in front"
        case .readBattery:         return "Read battery level"
        case .readCalendar:        return "Read calendar meeting density"
        case .readTypingPace:      return "Read typing pace (requires Accessibility)"
        }
    }

    /// Plain-English explanation. Shown in the consent UI under the
    /// scope row.
    var explanation: String {
        switch self {
        case .notification:
            return "Send a banner like the ones from Mail or Slack."
        case .dimScreen:
            return "Reduce display brightness during focus blocks."
        case .doNotDisturbToggle:
            return "Enter or leave Do Not Disturb. macOS 14 may require a Shortcut bridge."
        case .openApp:
            return "Open another app (e.g. Notes when you start a meeting)."
        case .openUrl:
            return "Open a link in your default browser."
        case .runShortcut:
            return "Run a Shortcut you've already installed in Shortcuts.app."
        case .voiceTts:
            return "Speak text out loud through the system speaker."
        case .applescriptExecute:
            return "Run an AppleScript snippet — can control most apps. High capability, audit every use."
        case .readScreenState:
            return "Know if the display is asleep or active."
        case .readForegroundApp:
            return "Know which app is currently focused."
        case .readBattery:
            return "Read battery percentage (laptop only)."
        case .readCalendar:
            return "Count today's meetings to predict afternoon focus collapse. Requires Calendar permission."
        case .readTypingPace:
            return "Sample your typing rhythm. Requires Accessibility permission in System Settings."
        }
    }

    /// True if this scope can map to an actuator that fires from
    /// `ActuatorRouter`. False for read-only sensor scopes.
    var isActuator: Bool {
        switch self {
        case .readScreenState, .readForegroundApp, .readBattery,
             .readCalendar, .readTypingPace:
            return false
        default:
            return true
        }
    }

    /// Map an EAP `actuator` string (as it arrives on EAPAction) to
    /// the scope that gates it. Returns nil if we don't know the
    /// actuator yet — coordinator treats unknown actuators as denied.
    static func forActuator(_ actuator: String) -> EAPScope? {
        switch actuator {
        case "notification":             return .notification
        case "voice_tts":                return .voiceTts
        case "open_app":                 return .openApp
        case "open_url":                 return .openUrl
        case "run_shortcut":             return .runShortcut
        case "applescript_execute":      return .applescriptExecute
        case "dim_screen", "system_dim_screen":
                                         return .dimScreen
        case "do_not_disturb_toggle":    return .doNotDisturbToggle
        default:                         return nil
        }
    }
}

/// Local cache of which scopes the user has granted, scoped by LLM
/// partner id. We persist this to Keychain (Auth.swift) so the cache
/// survives restart and the coordinator can fail-closed when offline.
struct EAPGrantCache: Codable {
    /// Map: llmPartnerId -> set of scope rawValues.
    var grantsByPartner: [String: Set<String>]

    init(grantsByPartner: [String: Set<String>] = [:]) {
        self.grantsByPartner = grantsByPartner
    }

    func hasGrant(partnerId: String, scope: EAPScope) -> Bool {
        grantsByPartner[partnerId]?.contains(scope.rawValue) ?? false
    }

    mutating func grant(partnerId: String, scope: EAPScope) {
        var set = grantsByPartner[partnerId] ?? []
        set.insert(scope.rawValue)
        grantsByPartner[partnerId] = set
    }

    mutating func revoke(partnerId: String, scope: EAPScope) {
        guard var set = grantsByPartner[partnerId] else { return }
        set.remove(scope.rawValue)
        grantsByPartner[partnerId] = set
    }

    mutating func revokeAll(partnerId: String) {
        grantsByPartner[partnerId] = []
    }

    /// Flat list of every granted scope across every partner — used
    /// to build the `manifest.userGrantedScopes` array we send on
    /// `/device/register`. Server reconciles per-partner specifics.
    func flatScopeStrings() -> [String] {
        var s: Set<String> = []
        for set in grantsByPartner.values { s.formUnion(set) }
        return Array(s).sorted()
    }
}
