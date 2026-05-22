//
//  ActuatorRouter.swift
//  COYL Desktop — EAP Coordinator
//
//  The "actuator switch" — turns an EAPAction into a side effect on
//  the user's Mac. Each case here corresponds to one entry in the
//  device manifest. Failures are caught + reported as
//  outcome=failed:<reason> so the LLM learns what didn't work.
//
//  macOS actuator coverage per EAP spec (~80%):
//    - notification          UNUserNotificationCenter
//    - voice_tts             NSSpeechSynthesizer (compat with macOS 13)
//    - open_app              NSWorkspace.openApplication
//    - open_url              NSWorkspace.open(URL)
//    - run_shortcut          `shortcuts run <name>` CLI
//    - applescript_execute   NSAppleScript
//    - dim_screen            DisplayServices best-effort
//    - do_not_disturb_toggle Shortcut-bridged (macOS 14 blocks
//                            direct toggle)
//
//  Documented gaps (return outcome=failed:unsupported):
//    - send_message:irreversible   requires Messages.app via a user-
//                                  installed Shortcut
//    - modify_system_pref          blocked since macOS 14
//

import AppKit
import Foundation
import UserNotifications

#if canImport(AVFoundation)
import AVFoundation
#endif

@MainActor
final class ActuatorRouter {
    private let notificationCenter = UNUserNotificationCenter.current()
    private let speechSynth = NSSpeechSynthesizer(voice: nil)

    /// Dispatch entry point. Always returns an outcome — never throws.
    func execute(action: EAPAction) async -> EAPActionOutcome {
        switch action.actuator {
        case "notification":
            return await fireNotification(action: action)
        case "voice_tts":
            return fireVoiceTTS(action: action)
        case "open_app":
            return await fireOpenApp(action: action)
        case "open_url":
            return fireOpenURL(action: action)
        case "run_shortcut":
            return fireRunShortcut(action: action)
        case "applescript_execute":
            return fireAppleScript(action: action)
        case "dim_screen", "system_dim_screen":
            return fireDimScreen(action: action)
        case "do_not_disturb_toggle":
            return fireDoNotDisturbToggle(action: action)
        case "send_message", "send_message_irreversible":
            // macOS doesn't expose programmatic iMessage send. The
            // user must install a Shortcut and the LLM should
            // re-emit as run_shortcut.
            return .failed(
                action.executionToken,
                reason: "unsupported:send_message_requires_shortcut"
            )
        default:
            return .failed(
                action.executionToken,
                reason: "unknown_actuator:\(action.actuator)"
            )
        }
    }

    // MARK: - notification

    private func fireNotification(action: EAPAction) async -> EAPActionOutcome {
        let title = action.params["title"]?.string ?? "COYL"
        let body = action.textParam
            ?? action.params["body"]?.string
            ?? "Reminder from a connected AI partner."

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: action.executionToken,
            content: content,
            trigger: nil
        )
        do {
            try await notificationCenter.add(request)
            return .executed(action.executionToken)
        } catch {
            return .failed(
                action.executionToken,
                reason: "notification_center_error:\(error.localizedDescription)"
            )
        }
    }

    // MARK: - voice_tts

    private func fireVoiceTTS(action: EAPAction) -> EAPActionOutcome {
        guard let text = action.textParam, !text.isEmpty else {
            return .failed(action.executionToken, reason: "missing_text_param")
        }
        // NSSpeechSynthesizer is the simplest, most-compatible path on
        // macOS 13+. AVSpeechSynthesizer is also available; we prefer
        // NSSpeechSynthesizer here because it doesn't require the
        // AVFoundation audio session boilerplate.
        let ok = speechSynth?.startSpeaking(text) ?? false
        return ok
            ? .executed(action.executionToken)
            : .failed(action.executionToken, reason: "speech_failed")
    }

    // MARK: - open_app

    private func fireOpenApp(action: EAPAction) async -> EAPActionOutcome {
        guard let bundleId = action.params["bundleId"]?.string
                ?? action.params["bundle_id"]?.string
        else {
            return .failed(action.executionToken, reason: "missing_bundle_id")
        }
        guard let appURL = NSWorkspace.shared
            .urlForApplication(withBundleIdentifier: bundleId)
        else {
            return .failed(
                action.executionToken,
                reason: "app_not_installed:\(bundleId)"
            )
        }
        let cfg = NSWorkspace.OpenConfiguration()
        cfg.activates = true
        return await withCheckedContinuation { cont in
            NSWorkspace.shared.openApplication(at: appURL, configuration: cfg) { _, err in
                if let err = err {
                    cont.resume(returning: .failed(
                        action.executionToken,
                        reason: "open_app_error:\(err.localizedDescription)"
                    ))
                } else {
                    cont.resume(returning: .executed(action.executionToken))
                }
            }
        }
    }

    // MARK: - open_url

    private func fireOpenURL(action: EAPAction) -> EAPActionOutcome {
        guard
            let raw = action.params["url"]?.string,
            let url = URL(string: raw)
        else {
            return .failed(action.executionToken, reason: "invalid_url")
        }
        let ok = NSWorkspace.shared.open(url)
        return ok
            ? .executed(action.executionToken)
            : .failed(action.executionToken, reason: "workspace_refused_url")
    }

    // MARK: - run_shortcut

    private func fireRunShortcut(action: EAPAction) -> EAPActionOutcome {
        guard let name = action.params["name"]?.string, !name.isEmpty else {
            return .failed(action.executionToken, reason: "missing_shortcut_name")
        }
        // `shortcuts` CLI ships with Shortcuts.app on macOS 12+. We
        // invoke by name; the user must have created the Shortcut.
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/usr/bin/shortcuts")
        proc.arguments = ["run", name]
        if let input = action.params["input"]?.string {
            proc.arguments?.append(contentsOf: ["--input-path", "-"])
            let pipe = Pipe()
            proc.standardInput = pipe
            do {
                try pipe.fileHandleForWriting.write(contentsOf: Data(input.utf8))
                try pipe.fileHandleForWriting.close()
            } catch {
                return .failed(
                    action.executionToken,
                    reason: "shortcut_stdin_error:\(error.localizedDescription)"
                )
            }
        }
        do {
            try proc.run()
            proc.waitUntilExit()
            if proc.terminationStatus == 0 {
                return .executed(action.executionToken)
            }
            return .failed(
                action.executionToken,
                reason: "shortcut_exit:\(proc.terminationStatus)"
            )
        } catch {
            return .failed(
                action.executionToken,
                reason: "shortcut_spawn_error:\(error.localizedDescription)"
            )
        }
    }

    // MARK: - applescript_execute

    /// AppleScript is the most powerful actuator on macOS. It can
    /// drive any scriptable app — Mail, Music, Notes, Finder, Safari
    /// — and is gated by the per-app Automation TCC prompt the user
    /// sees on first use. The coordinator surfaces this in the
    /// consent UI: "AppleScript is powerful — audit every use."
    private func fireAppleScript(action: EAPAction) -> EAPActionOutcome {
        guard
            let source = action.params["script"]?.string
                ?? action.params["source"]?.string,
            !source.isEmpty
        else {
            return .failed(action.executionToken, reason: "missing_script")
        }
        guard let script = NSAppleScript(source: source) else {
            return .failed(action.executionToken, reason: "applescript_parse_failed")
        }
        var errorDict: NSDictionary?
        _ = script.executeAndReturnError(&errorDict)
        if let errorDict = errorDict {
            let msg = (errorDict[NSAppleScript.errorMessage] as? String)
                ?? "unknown_applescript_error"
            return .failed(
                action.executionToken,
                reason: "applescript:\(msg)"
            )
        }
        return .executed(action.executionToken)
    }

    // MARK: - dim_screen

    /// Best-effort brightness control. CoreDisplay's
    /// DisplayServicesSetBrightness is a private framework — we link
    /// dynamically and fall back to an AppleScript brightness key
    /// stroke if the private symbol isn't resolvable on this macOS.
    /// The fallback uses AppleScript "System Events" → "key code 145"
    /// (brightness down).
    private func fireDimScreen(action: EAPAction) -> EAPActionOutcome {
        let pct = action.params["brightnessPct"]?.int
            ?? action.params["brightness_pct"]?.int
            ?? 30
        let clamped = max(0, min(100, pct))

        // Try AppleScript brightness-down keystroke. Each press dims
        // by ~6%, so loop until we've crossed the target threshold.
        // Imprecise but reliable; precise control requires private
        // CoreDisplay APIs we don't link against by default.
        let pressesNeeded = max(1, (100 - clamped) / 6)
        let scriptSource = """
        tell application "System Events"
            repeat \(pressesNeeded) times
                key code 145
            end repeat
        end tell
        """
        guard let script = NSAppleScript(source: scriptSource) else {
            return .failed(action.executionToken, reason: "dim_script_parse_failed")
        }
        var errorDict: NSDictionary?
        _ = script.executeAndReturnError(&errorDict)
        if let errorDict = errorDict {
            return .failed(
                action.executionToken,
                reason: "dim_failed:\(errorDict[NSAppleScript.errorMessage] ?? "")"
            )
        }
        return .executed(action.executionToken)
    }

    // MARK: - do_not_disturb_toggle

    /// macOS 14+ removed the public DND-toggle path. The supported
    /// route is to invoke a user-installed Shortcut named "Toggle
    /// DND" (or pass the name in params). If the Shortcut doesn't
    /// exist, we surface that as the failure reason so the LLM
    /// learns and the user can fix.
    private func fireDoNotDisturbToggle(action: EAPAction) -> EAPActionOutcome {
        let name = action.params["shortcutName"]?.string ?? "Toggle Do Not Disturb"
        let bridged = EAPAction(
            id: action.id,
            executionToken: action.executionToken,
            actuator: "run_shortcut",
            params: .object([
                "name": .string(name)
            ]),
            scopeRequested: action.scopeRequested,
            reasoning: action.reasoning,
            confidence: action.confidence,
            willExecuteAt: action.willExecuteAt,
            ttlSeconds: action.ttlSeconds,
            llmPartnerId: action.llmPartnerId
        )
        return fireRunShortcut(action: bridged)
    }
}
