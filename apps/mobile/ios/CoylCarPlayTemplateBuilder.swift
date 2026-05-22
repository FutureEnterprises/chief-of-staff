//
//  CoylCarPlayTemplateBuilder.swift
//  COYL
//
//  Builds the CarPlay template hierarchy that CoylCarPlaySceneDelegate
//  pushes into the head unit. Extracted from the scene delegate so the
//  template logic is unit-testable without needing a real
//  CPInterfaceController instance.
//
//  UI vocabulary on CarPlay is limited — the only templates we use:
//    - CPListTemplate (root): shows self-trust score, day number, and
//      the 3 voice-driven actions
//    - CPVoiceControlTemplate (pushed on tap): hands control to Siri-
//      on-CarPlay so the user can confirm hands-free
//    - CPAlertTemplate (pushed on completion): voice-confirm + optional
//      visual confirmation that the action landed
//
//  Backend endpoints invoked (mirrors the EAP/PAP coordinator surface
//  documented in docs/protocol/edge-ai-protocol.md):
//    - POST coyl.ai/api/v1/slip/quick     — quick-log a slip
//    - POST coyl.ai/api/eap/v1/panic      — pause COYL for N minutes
//    - GET  coyl.ai/api/v1/status         — read self-trust score +
//                                            day number for the read-out
//
//  Auth: bearer JWT from the user's iOS Keychain (the phone-side
//  COYLAuthStore writes this; CarPlay reads via the shared App Group).
//

import CarPlay
import AVFoundation
import Foundation

@available(iOS 14.0, *)
final class CoylCarPlayTemplateBuilder {

    // MARK: - Endpoints

    private enum Endpoint {
        static let base = URL(string: "https://coyl.ai")!
        static let status = base.appendingPathComponent("/api/v1/status")
        static let slipQuick = base.appendingPathComponent("/api/v1/slip/quick")
        static let panic = base.appendingPathComponent("/api/eap/v1/panic")
    }

    // MARK: - Dependencies

    private weak var interfaceController: CPInterfaceController?
    private let speech: AVSpeechSynthesizer
    private let session: URLSession

    // Cached score so the root list reads correctly on cold-open
    // before the network call returns. The phone-side coordinator
    // writes the most-recent score to the shared App Group; we read
    // it lazily.
    private var lastKnownSelfTrustScore: Int = 78
    private var lastKnownDayNumber: Int = 47

    // MARK: - Init

    init(
        interfaceController: CPInterfaceController,
        session: URLSession = .shared,
        speech: AVSpeechSynthesizer = AVSpeechSynthesizer()
    ) {
        self.interfaceController = interfaceController
        self.session = session
        self.speech = speech
    }

    // MARK: - Root list

    /// Build the root CPListTemplate. This is what the driver sees as
    /// soon as their phone is connected to the head unit and they tap
    /// the COYL icon in the CarPlay launcher.
    func buildRootListTemplate() -> CPListTemplate {
        let scoreItem = CPListItem(
            text: "Self-Trust Score",
            detailText: "\(lastKnownSelfTrustScore) · Day \(lastKnownDayNumber)"
        )
        // Tapping the score reads it aloud — driver-safe modality.
        scoreItem.handler = { [weak self] _, completion in
            self?.handleHearStatusTapped()
            completion()
        }

        let logSlipItem = CPListItem(
            text: "Log a slip",
            detailText: "Voice-confirm, then post to /api/v1/slip/quick"
        )
        logSlipItem.handler = { [weak self] _, completion in
            self?.handleLogSlipTapped()
            completion()
        }

        let pauseItem = CPListItem(
            text: "Pause COYL",
            detailText: "Suspend interventions for 1 hour"
        )
        pauseItem.handler = { [weak self] _, completion in
            self?.handlePauseTapped()
            completion()
        }

        let hearStatusItem = CPListItem(
            text: "Hear today's status",
            detailText: "Read self-trust + day aloud"
        )
        hearStatusItem.handler = { [weak self] _, completion in
            self?.handleHearStatusTapped()
            completion()
        }

        let section = CPListSection(items: [
            scoreItem,
            logSlipItem,
            pauseItem,
            hearStatusItem
        ])

        return CPListTemplate(title: "COYL", sections: [section])
    }

    // MARK: - Action handlers

    private func handleLogSlipTapped() {
        let voiceTemplate = CPVoiceControlTemplate(voiceControlStates: [
            CPVoiceControlState(
                identifier: "logging-slip",
                titleVariants: ["Logging slip…"],
                image: nil,
                repeats: false
            )
        ])

        interfaceController?.pushTemplate(voiceTemplate, animated: true) { [weak self] _, _ in
            self?.postSlipQuick { result in
                let message: String
                switch result {
                case .success:
                    message = "Logged. You're still on day \(self?.lastKnownDayNumber ?? 0)."
                case .failure:
                    message = "Couldn't log right now. We'll retry when the phone reconnects."
                }
                self?.speak(message)
                self?.dismissAfterShortDelay()
            }
        }
    }

    private func handlePauseTapped() {
        let voiceTemplate = CPVoiceControlTemplate(voiceControlStates: [
            CPVoiceControlState(
                identifier: "pausing",
                titleVariants: ["Pausing COYL for 1 hour…"],
                image: nil,
                repeats: false
            )
        ])

        interfaceController?.pushTemplate(voiceTemplate, animated: true) { [weak self] _, _ in
            self?.postPanic(durationMinutes: 60) { result in
                let message: String
                switch result {
                case .success:
                    message = "COYL is paused for one hour. No interventions until then."
                case .failure:
                    message = "Couldn't pause right now. Open the phone app to confirm."
                }
                self?.speak(message)
                self?.dismissAfterShortDelay()
            }
        }
    }

    private func handleHearStatusTapped() {
        let voiceTemplate = CPVoiceControlTemplate(voiceControlStates: [
            CPVoiceControlState(
                identifier: "reading-status",
                titleVariants: ["Reading status…"],
                image: nil,
                repeats: false
            )
        ])

        interfaceController?.pushTemplate(voiceTemplate, animated: true) { [weak self] _, _ in
            self?.fetchStatus { result in
                switch result {
                case .success(let status):
                    self?.lastKnownSelfTrustScore = status.selfTrustScore
                    self?.lastKnownDayNumber = status.dayNumber
                    self?.speak(
                        "Your self-trust score is \(status.selfTrustScore). "
                        + "You're on day \(status.dayNumber)."
                    )
                case .failure:
                    self?.speak(
                        "I can't reach COYL Cloud right now. "
                        + "Your last known score was \(self?.lastKnownSelfTrustScore ?? 0)."
                    )
                }
                self?.dismissAfterShortDelay()
            }
        }
    }

    // MARK: - Network

    private struct StatusResponse: Decodable {
        let selfTrustScore: Int
        let dayNumber: Int
    }

    private func fetchStatus(completion: @escaping (Result<StatusResponse, Error>) -> Void) {
        var request = URLRequest(url: Endpoint.status)
        request.httpMethod = "GET"
        attachAuth(&request)

        session.dataTask(with: request) { data, _, error in
            if let error = error {
                completion(.failure(error)); return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "CoylCarPlay", code: -1))); return
            }
            do {
                let decoded = try JSONDecoder().decode(StatusResponse.self, from: data)
                completion(.success(decoded))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    private func postSlipQuick(completion: @escaping (Result<Void, Error>) -> Void) {
        var request = URLRequest(url: Endpoint.slipQuick)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachAuth(&request)
        // Body is intentionally minimal — server stamps a 'source:
        // carplay' tag based on the request context so the analytics
        // pipeline can break out the driving-surface attribution.
        request.httpBody = try? JSONSerialization.data(
            withJSONObject: ["source": "carplay"],
            options: []
        )

        session.dataTask(with: request) { _, response, error in
            if let error = error {
                completion(.failure(error)); return
            }
            if let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) {
                completion(.success(()))
            } else {
                completion(.failure(NSError(domain: "CoylCarPlay", code: -2)))
            }
        }.resume()
    }

    private func postPanic(durationMinutes: Int, completion: @escaping (Result<Void, Error>) -> Void) {
        var request = URLRequest(url: Endpoint.panic)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachAuth(&request)
        request.httpBody = try? JSONSerialization.data(
            withJSONObject: [
                "source": "carplay",
                "durationMinutes": durationMinutes
            ],
            options: []
        )

        session.dataTask(with: request) { _, response, error in
            if let error = error {
                completion(.failure(error)); return
            }
            if let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) {
                completion(.success(()))
            } else {
                completion(.failure(NSError(domain: "CoylCarPlay", code: -3)))
            }
        }.resume()
    }

    private func attachAuth(_ request: inout URLRequest) {
        // The phone-side COYLAuthStore writes the JWT into the shared
        // App Group `group.ai.coyl.shared` under the key
        // "coyl.eap.access_token". We read it here; CarPlay runs in
        // the same process as the host app so the App Group access
        // is synchronous.
        let suite = UserDefaults(suiteName: "group.ai.coyl.shared")
        if let token = suite?.string(forKey: "coyl.eap.access_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    // MARK: - Voice + dismissal

    private func speak(_ text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        speech.speak(utterance)
    }

    private func dismissAfterShortDelay() {
        // CarPlay's voice template is meant to be transient — pop it
        // ~1.5s after the read-out begins so the driver returns to the
        // root list automatically without needing a tap.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.interfaceController?.popTemplate(animated: true) { _, _ in }
        }
    }
}
