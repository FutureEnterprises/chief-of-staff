/**
 * Expo config plugin for COYL's iOS Live Activity feature.
 *
 * Plain JS (CommonJS) on purpose: Expo's static-config plugin resolver
 * cannot reliably load `.ts` plugins inside a pnpm monorepo (it fails to
 * register ts-node, so `expo config` / `eas build` throw "Failed to
 * resolve plugin"). A JS plugin has zero ts-node dependency and loads
 * everywhere — locally and on EAS build servers.
 *
 * On `expo prebuild` (or any time the iOS project is regenerated) this
 * plugin patches the main app target's Info.plist and entitlements so
 * ActivityKit can run and so the main app + widget extension can share
 * data through an App Group.
 *
 * What it does:
 *   1. Info.plist
 *      - NSSupportsLiveActivities = YES (Activity.request() works)
 *      - NSSupportsLiveActivitiesFrequentUpdates = YES (no throttle on
 *        the danger-window countdown refreshes)
 *   2. Entitlements
 *      - com.apple.security.application-groups → group.com.coyl.shared
 *        so the widget extension's App Intents (Caught me / I slipped /
 *        Not now) can read the auth token the main app writes at sign-in.
 *
 * What it does NOT do — must be done manually in Xcode: add the Widget
 * Extension target itself (see apps/mobile/ios/COYLWidget/README.md).
 */
const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins')

const APP_GROUP_ID = 'group.com.coyl.shared'

const withCoylLiveActivity = (config) => {
  // 1. Info.plist — enable ActivityKit on the main app target.
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSSupportsLiveActivities = true
    cfg.modResults.NSSupportsLiveActivitiesFrequentUpdates = true
    return cfg
  })

  // 2. Entitlements — App Group shared with the widget extension so both
  // processes can read/write the auth token via a UserDefaults suite.
  config = withEntitlementsPlist(config, (cfg) => {
    const existing = cfg.modResults['com.apple.security.application-groups'] ?? []
    if (!existing.includes(APP_GROUP_ID)) {
      cfg.modResults['com.apple.security.application-groups'] = [...existing, APP_GROUP_ID]
    }
    return cfg
  })

  return config
}

module.exports = withCoylLiveActivity
