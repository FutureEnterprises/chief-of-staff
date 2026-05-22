//
//  CoylCarPlaySceneDelegate.swift
//  COYL
//
//  CarPlay scene delegate — the entry point Apple invokes when the
//  user plugs their phone into a CarPlay-capable head unit AND the
//  COYL app has been granted the `com.apple.developer.carplay-
//  communication` entitlement (or whichever final-category entitlement
//  Apple approves us under; see CARPLAY_ANDROID_AUTO.md for the
//  approval-application playbook).
//
//  Honest scope: CarPlay is one of the most restricted surfaces in
//  Apple's platform. We get ~30% actuator coverage per the EAP spec
//  (docs/protocol/edge-ai-protocol.md §"Per platform" table). What we
//  CAN do here:
//    - Render a CPListTemplate with the user's current self-trust
//      score + day number (passive status)
//    - Hand control to CPVoiceControlTemplate so the user can ask
//      "How am I doing today?" or say "I'm slipping" or "Pause COYL"
//      hands-free
//    - Fire HTTP calls to coyl.ai/api/v1/slip/quick and /api/eap/v1/
//      panic in response to those voice commands
//    - Voice-confirm via AVSpeechSynthesizer that the action landed
//
//  What we CANNOT do (Apple-enforced):
//    - Fire intervention overlays or modal screens mid-drive — CarPlay
//      blocks driver-distracting visuals from third parties
//    - Show notifications that block the driver's primary task
//      (navigation, music)
//    - Access HealthKit while the phone is locked — CarPlay runs in a
//      restricted execution context that doesn't satisfy HealthKit's
//      foreground-+-unlocked requirement
//    - Display arbitrary custom UI; we are bound to CarPlay's template
//      vocabulary (CPListTemplate, CPGridTemplate, CPAlertTemplate,
//      CPVoiceControlTemplate, CPInformationTemplate, CPNowPlaying-
//      Template)
//
//  The CoylCarPlaySceneDelegate is intentionally thin — template
//  construction lives in CoylCarPlayTemplateBuilder so it's easier to
//  preview / unit-test without spinning up a CPInterfaceController.
//
//  iOS 14.0+. Requires UIApplicationSceneManifest entry in Info.plist
//  with role CPTemplateApplicationSceneSessionRoleApplication once the
//  CarPlay entitlement is granted.
//

import CarPlay
import UIKit

@available(iOS 14.0, *)
final class CoylCarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {

    // The interface controller is owned by CarPlay — we keep a weak
    // reference so the template builder can push voice templates
    // (CPVoiceControlTemplate) in response to user taps on the list.
    private weak var interfaceController: CPInterfaceController?

    // Template builder is constructed lazily once the interface
    // controller hands us a window. Holding it as a property keeps
    // it alive for the lifetime of the CarPlay session.
    private var templateBuilder: CoylCarPlayTemplateBuilder?

    // MARK: - CPTemplateApplicationSceneDelegate

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController

        let builder = CoylCarPlayTemplateBuilder(interfaceController: interfaceController)
        self.templateBuilder = builder

        // Push the root list — self-trust score + day number + the
        // 3 voice-driven actions (log slip, pause, hear status).
        let rootTemplate = builder.buildRootListTemplate()

        interfaceController.setRootTemplate(rootTemplate, animated: false) { _, error in
            if let error = error {
                // We don't have a logger wired into the CarPlay process
                // boundary yet; print is fine for now and will be
                // replaced by COYLLogger once that's extracted into a
                // module shared between phone + CarPlay scenes.
                print("[CoylCarPlay] setRootTemplate failed: \(error.localizedDescription)")
            }
        }
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController: CPInterfaceController
    ) {
        // Tear down anything CarPlay-scoped. The phone app continues
        // to run in the background; we just lose access to the head
        // unit's screen + Siri-on-CarPlay voice channel.
        self.interfaceController = nil
        self.templateBuilder = nil
    }
}
