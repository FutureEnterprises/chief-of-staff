//
//  CoylLiveActivityModule.swift
//  CoylLiveActivity (Expo Module)
//
//  React Native ↔ ActivityKit bridge for COYL's danger-window
//  Live Activity. Exposes four functions to JS:
//
//    start(attributes)            → Promise<String activityId>
//    update(id, state)            → Promise<void>
//    end(id, options?)            → Promise<void>
//    isSupported()                → Bool
//    setAuthToken(token)          → Promise<void>
//
//  The Activity's data shape is defined by COYLInterruptAttributes,
//  which lives in the COYLWidget target. Because that target is a
//  separate compilation unit, the type isn't directly importable
//  here. We mirror its layout literally below as a local
//  declaration — both copies are tiny and any drift will surface
//  immediately when the widget tries to decode the activity payload.
//
//  iOS 16.1+ for Activity.request and ActivityAuthorizationInfo.
//  isSupported() gracefully returns false on older versions; the
//  async functions reject with UNSUPPORTED_IOS_VERSION there.
//

import ActivityKit
import ExpoModulesCore
import Foundation

// MARK: - Activity attribute mirrors
//
// IMPORTANT: keep field names and types in sync with
// apps/mobile/ios/COYLWidget/COYLInterruptAttributes.swift.
// ActivityKit identifies activities by attribute *type*, so the
// struct here must serialize identically. We use the same name
// (`COYLInterruptAttributes`) so when the widget extension target
// also compiles this file as a member (the project links the
// module against both targets) there's a single source of truth;
// if the bridge ever needs to be standalone we'll rename.

@available(iOS 16.1, *)
private struct COYLInterruptAttributesLocal: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var headline: String
        var subhead: String
        var timeRemainingSec: Int
        var interruptId: String
    }

    var archetype: String
    var startedAtIso: String
}

public class CoylLiveActivityModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CoylLiveActivity")

        // MARK: start
        //
        // Resolves with the OS-assigned activity id (a UUID string).
        // The JS side stores this so it can later call update / end.
        AsyncFunction("start") { (attributes: [String: Any], promise: Promise) in
            if #available(iOS 16.1, *) {
                guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                    promise.reject(
                        "ACTIVITIES_DISABLED",
                        "User has Live Activities disabled in Settings."
                    )
                    return
                }

                let activityAttrs = COYLInterruptAttributesLocal(
                    archetype: (attributes["archetype"] as? String) ?? "",
                    startedAtIso: (attributes["startedAtIso"] as? String) ?? ""
                )
                let state = COYLInterruptAttributesLocal.ContentState(
                    headline: (attributes["headline"] as? String) ?? "",
                    subhead: (attributes["subhead"] as? String) ?? "",
                    timeRemainingSec: (attributes["timeRemainingSec"] as? Int) ?? 0,
                    interruptId: (attributes["interruptId"] as? String) ?? ""
                )

                do {
                    if #available(iOS 16.2, *) {
                        // Modern API: ActivityContent wraps the state and
                        // lets us set a staleDate (we leave nil — the
                        // backend pushes updates frequently enough).
                        let activity = try Activity.request(
                            attributes: activityAttrs,
                            content: ActivityContent(state: state, staleDate: nil),
                            pushType: .token
                        )
                        promise.resolve(activity.id)
                    } else {
                        // iOS 16.1 only — contentState parameter.
                        let activity = try Activity.request(
                            attributes: activityAttrs,
                            contentState: state,
                            pushType: .token
                        )
                        promise.resolve(activity.id)
                    }
                } catch {
                    promise.reject(
                        "ACTIVITY_START_FAILED",
                        error.localizedDescription
                    )
                }
            } else {
                promise.reject(
                    "UNSUPPORTED_IOS_VERSION",
                    "Live Activities require iOS 16.1 or later."
                )
            }
        }

        // MARK: update
        //
        // Partial update — JS sends only the fields it wants to change.
        // We fetch the current state for missing fields so the widget
        // doesn't render empty strings or zero countdowns.
        AsyncFunction("update") { (activityId: String, state: [String: Any], promise: Promise) in
            if #available(iOS 16.1, *) {
                Task {
                    guard let activity = Activity<COYLInterruptAttributesLocal>
                        .activities
                        .first(where: { $0.id == activityId }) else {
                        promise.reject(
                            "ACTIVITY_NOT_FOUND",
                            "No live activity with id \(activityId)."
                        )
                        return
                    }

                    let current: COYLInterruptAttributesLocal.ContentState
                    if #available(iOS 16.2, *) {
                        current = activity.content.state
                    } else {
                        current = activity.contentState
                    }

                    let next = COYLInterruptAttributesLocal.ContentState(
                        headline: (state["headline"] as? String) ?? current.headline,
                        subhead: (state["subhead"] as? String) ?? current.subhead,
                        timeRemainingSec: (state["timeRemainingSec"] as? Int)
                            ?? current.timeRemainingSec,
                        interruptId: current.interruptId
                    )

                    if #available(iOS 16.2, *) {
                        await activity.update(
                            ActivityContent(state: next, staleDate: nil)
                        )
                    } else {
                        await activity.update(using: next)
                    }
                    promise.resolve(nil)
                }
            } else {
                promise.reject(
                    "UNSUPPORTED_IOS_VERSION",
                    "Live Activities require iOS 16.1 or later."
                )
            }
        }

        // MARK: end
        //
        // Dismissal policy options from JS:
        //   "immediate" → ActivityKit removes the activity instantly
        //   "default"   → standard fade-out window (a few seconds)
        //   "after"     → reserved for future (would need a date arg)
        AsyncFunction("end") { (activityId: String, options: [String: Any]?, promise: Promise) in
            if #available(iOS 16.1, *) {
                Task {
                    guard let activity = Activity<COYLInterruptAttributesLocal>
                        .activities
                        .first(where: { $0.id == activityId }) else {
                        // Already gone — treat as success so JS can call
                        // end() defensively without checking existence.
                        promise.resolve(nil)
                        return
                    }

                    let policyString = (options?["dismissalPolicy"] as? String) ?? "default"
                    let policy: ActivityUIDismissalPolicy
                    switch policyString {
                    case "immediate":
                        policy = .immediate
                    default:
                        policy = .default
                    }

                    if #available(iOS 16.2, *) {
                        let finalState: COYLInterruptAttributesLocal.ContentState =
                            activity.content.state
                        await activity.end(
                            ActivityContent(state: finalState, staleDate: nil),
                            dismissalPolicy: policy
                        )
                    } else {
                        await activity.end(
                            using: activity.contentState,
                            dismissalPolicy: policy
                        )
                    }
                    promise.resolve(nil)
                }
            } else {
                promise.reject(
                    "UNSUPPORTED_IOS_VERSION",
                    "Live Activities require iOS 16.1 or later."
                )
            }
        }

        // MARK: isSupported
        //
        // Synchronous — JS uses this to guard every call. Returns true
        // only if both the OS supports ActivityKit and the user hasn't
        // disabled Live Activities in Settings → Face ID.
        Function("isSupported") { () -> Bool in
            if #available(iOS 16.1, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        // MARK: setAuthToken
        //
        // Writes the Clerk JWT into the shared App Group's UserDefaults
        // under the key "coyl.authToken". The widget extension's App
        // Intents read this same key when posting interrupt feedback
        // to the COYL API directly from the lock screen — without
        // it the Caught me / I slipped / Not now buttons can't auth.
        AsyncFunction("setAuthToken") { (token: String, promise: Promise) in
            if let defaults = UserDefaults(suiteName: "group.com.coyl.shared") {
                defaults.set(token, forKey: "coyl.authToken")
                defaults.synchronize()
                promise.resolve(nil)
            } else {
                promise.reject(
                    "APP_GROUP_UNAVAILABLE",
                    "Could not access group.com.coyl.shared. Verify the entitlement is provisioned."
                )
            }
        }
    }
}
