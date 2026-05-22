//
//  CoylVoice.swift
//  CoylVoice (Expo Module)
//
//  React Native <-> AVSpeechSynthesizer bridge for COYL's three-tier
//  voice mode. Exposes three functions to JS:
//
//    speak(text, voice?)        -> Promise<void>  (resolves when speech ends)
//    isVoiceAvailable()         -> Bool
//    setPreferredVoice(voiceId) -> Promise<void>
//
//  Tier mapping (when no preferred voice is persisted):
//    gentle -> en-US Samantha (soft female), rate 0.45, pitch 1.0
//    firm   -> en-US Daniel   (firm male),   rate 0.50, pitch 1.0
//    urgent -> en-US Daniel   (firm male),   rate 0.55, pitch 1.15
//
//  When the user has called setPreferredVoice() with a real voice id,
//  the tier still controls rate + pitch but the base voice identity
//  is the user-chosen one — this keeps "gentle vs firm" perceptually
//  distinct even within a single voice persona.
//
//  Promise resolution uses AVSpeechSynthesizerDelegate's
//  didFinish/didCancel callbacks. We hold strong refs to the synth +
//  delegate for the lifetime of each speak() call so ARC doesn't
//  release them mid-utterance.
//

import AVFoundation
import ExpoModulesCore
import Foundation

// MARK: - Voice tier mapping

private struct CoylVoiceTier {
    let voiceIdentifier: String?  // nil -> system default
    let voiceLanguage: String      // fallback if identifier unavailable
    let rate: Float                // 0.0 (slow) .. 1.0 (fast); 0.5 is "normal"
    let pitch: Float               // 0.5 .. 2.0; 1.0 is "normal"
}

private let tierGentle = CoylVoiceTier(
    voiceIdentifier: "com.apple.ttsbundle.Samantha-compact",
    voiceLanguage: "en-US",
    rate: 0.45,
    pitch: 1.0
)

private let tierFirm = CoylVoiceTier(
    voiceIdentifier: "com.apple.ttsbundle.Daniel-compact",
    voiceLanguage: "en-US",
    rate: 0.50,
    pitch: 1.0
)

private let tierUrgent = CoylVoiceTier(
    voiceIdentifier: "com.apple.ttsbundle.Daniel-compact",
    voiceLanguage: "en-US",
    rate: 0.55,
    pitch: 1.15
)

private func tierFor(_ name: String) -> CoylVoiceTier {
    switch name {
    case "firm":   return tierFirm
    case "urgent": return tierUrgent
    default:       return tierGentle
    }
}

// MARK: - Delegate that resolves the JS promise on speech end

private final class CoylVoiceDelegate: NSObject, AVSpeechSynthesizerDelegate {
    let promise: Promise
    // Strong self-reference cleared when the delegate is no longer needed,
    // so this class survives the entire async utterance lifecycle.
    var retained: CoylVoiceDelegate?

    init(promise: Promise) {
        self.promise = promise
        super.init()
        self.retained = self
    }

    func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didFinish utterance: AVSpeechUtterance
    ) {
        promise.resolve(nil)
        retained = nil
    }

    func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didCancel utterance: AVSpeechUtterance
    ) {
        // Treat cancellation as success — JS sees a resolve rather than
        // an exception when the OS interrupts (e.g., incoming call).
        promise.resolve(nil)
        retained = nil
    }
}

public class CoylVoice: Module {
    // Single shared synthesizer — AVSpeechSynthesizer queues utterances
    // internally and there's no benefit to spinning up a new one per
    // call. Keeping one instance also lets us cancel cleanly if we
    // ever want to interrupt a long prompt.
    private let synthesizer = AVSpeechSynthesizer()

    // UserDefaults key for the persisted preferred voice id.
    private let preferredVoiceKey = "coyl.voice.preferredVoiceId"

    public func definition() -> ModuleDefinition {
        Name("CoylVoice")

        // MARK: speak
        //
        // Builds an AVSpeechUtterance from the requested tier (and the
        // user's persisted preferred voice, if any), then speaks it.
        // The promise resolves when the utterance finishes via the
        // delegate.
        AsyncFunction("speak") { (text: String, voice: String?, promise: Promise) in
            let tier = tierFor(voice ?? "gentle")
            let utterance = AVSpeechUtterance(string: text)

            // Voice selection: try the user's preferred voice first,
            // then the tier's preferred identifier, then language-only
            // fallback (which lets the OS pick its best en-US voice).
            let prefId = UserDefaults.standard.string(forKey: self.preferredVoiceKey)
            if let prefId = prefId, !prefId.isEmpty,
               let v = AVSpeechSynthesisVoice(identifier: prefId) {
                utterance.voice = v
            } else if let id = tier.voiceIdentifier,
                      let v = AVSpeechSynthesisVoice(identifier: id) {
                utterance.voice = v
            } else {
                utterance.voice = AVSpeechSynthesisVoice(language: tier.voiceLanguage)
            }

            utterance.rate = tier.rate
            utterance.pitchMultiplier = tier.pitch

            // The delegate keeps a strong self-ref until didFinish /
            // didCancel fires, so the promise will always settle.
            let delegate = CoylVoiceDelegate(promise: promise)
            self.synthesizer.delegate = delegate
            self.synthesizer.speak(utterance)
        }

        // MARK: isVoiceAvailable
        //
        // AVSpeechSynthesizer is available on every iOS version we
        // support, but a device with no installed voices for the
        // requested language would render speak() silent. Treat that
        // as unavailable so callers can fall back to a notification.
        Function("isVoiceAvailable") { () -> Bool in
            // speechVoices() returns the system-installed voice list;
            // a non-empty list means at least one voice can speak.
            return !AVSpeechSynthesisVoice.speechVoices().isEmpty
        }

        // MARK: setPreferredVoice
        //
        // Persist the user's chosen voice identifier into UserDefaults
        // so subsequent speak() calls override the tier's default
        // voice with the user's pick. We don't validate the id here —
        // an invalid string just falls back to the tier voice in speak.
        AsyncFunction("setPreferredVoice") { (voiceId: String, promise: Promise) in
            UserDefaults.standard.set(voiceId, forKey: self.preferredVoiceKey)
            UserDefaults.standard.synchronize()
            promise.resolve(nil)
        }
    }
}
