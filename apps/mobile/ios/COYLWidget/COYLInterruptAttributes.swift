//
//  COYLInterruptAttributes.swift
//  COYLWidget
//
//  Defines the shape of data that flows through a Live Activity for a
//  COYL danger-window interrupt. The main app starts an activity with
//  these attributes; the OS hands the same shape back to the widget
//  process so the lock-screen UI can render.
//
//  ContentState is the mutable part — anything that can change during
//  the activity's lifetime (countdown, headline copy, etc.).
//  The top-level Attributes are immutable for the duration of the
//  activity (archetype tag, when it started).
//
//  iOS 16.1+ — ActivityKit availability.
//

import ActivityKit
import Foundation

@available(iOS 16.1, *)
public struct COYLInterruptAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// Primary line, e.g. "Your pattern is building."
        public var headline: String

        /// Secondary line, e.g. "You've been here before."
        public var subhead: String

        /// Seconds remaining until the danger window closes.
        /// The widget renders this as a live countdown via .timer style
        /// where appropriate; this field stays accurate as a snapshot.
        public var timeRemainingSec: Int

        /// Server-side ProductivityEvent id — the interrupt's primary
        /// key on coyl.ai. App Intents POST feedback against this id.
        public var interruptId: String

        public init(
            headline: String,
            subhead: String,
            timeRemainingSec: Int,
            interruptId: String
        ) {
            self.headline = headline
            self.subhead = subhead
            self.timeRemainingSec = timeRemainingSec
            self.interruptId = interruptId
        }
    }

    /// Archetype slug, e.g. "the-9pm-negotiator". Used purely as
    /// metadata today; future widget variants may key off this.
    public var archetype: String

    /// ISO8601 timestamp captured when the activity started. Useful
    /// for "elapsed since start" calculations in the widget.
    public var startedAtIso: String

    public init(archetype: String, startedAtIso: String) {
        self.archetype = archetype
        self.startedAtIso = startedAtIso
    }
}
