//
//  SafariExtension.swift
//  COYL Safari Web Extension
//
//  Principal class for the Safari Web Extension. The extension itself
//  is pure JavaScript (manifest.json + background.js + content.js +
//  popup/options), so this handler is intentionally empty — no native
//  bridging is required for v0.1.
//
//  We keep the class so Xcode has a valid NSExtensionPrincipalClass
//  target for the extension bundle. If v0.2+ needs to call into
//  native Swift (e.g. to read Screen Time data or post to the iOS
//  Apple Watch companion app), wire it through messageReceived below.
//

import SafariServices

class SafariExtensionHandler: SFSafariExtensionHandler {

    override func messageReceived(
        withName messageName: String,
        from page: SFSafariPage,
        userInfo: [String : Any]?
    ) {
        // No native bridging needed — the extension is JS-only.
        // Future: route INTERRUPT_FIRED events to a native sink so the
        // macOS menu-bar app can render a session-level summary.
    }

    override func toolbarItemClicked(in window: SFSafariWindow) {
        // The toolbar popup is declared in manifest.json (action.default_popup),
        // so Safari handles the click itself. Nothing to do here.
    }

    override func validateToolbarItem(
        in window: SFSafariWindow,
        validationHandler: @escaping ((Bool, String) -> Void)
    ) {
        validationHandler(true, "")
    }
}
