/**
 * Expo config plugin for COYL's iOS Live Activity feature.
 *
 * On `expo prebuild` (or any time the iOS project is regenerated) this
 * plugin patches the main app target's Info.plist and entitlements so
 * ActivityKit can run and so the main app + widget extension can share
 * data through an App Group.
 *
 * What it does:
 *   1. Info.plist
 *      - NSSupportsLiveActivities = YES
 *        Required for `Activity.request(...)` to return a real activity
 *        instead of throwing `.unsupported`.
 *      - NSSupportsLiveActivitiesFrequentUpdates = YES
 *        Lets the system deliver our update pushes without the
 *        budgeted-throttling that would otherwise drop our countdown
 *        refreshes during a danger window.
 *
 *   2. Entitlements
 *      - com.apple.security.application-groups
 *          ↳ group.com.coyl.shared
 *        The widget extension's App Intents (Caught me / I slipped /
 *        Not now buttons) need to read the Clerk auth token written
 *        by the main app at sign-in time. UserDefaults backed by this
 *        suite is the cheapest cross-process channel we have.
 *
 * What it does NOT do — must be done manually in Xcode:
 *   - Add the Widget Extension target itself (a target, not a file).
 *     `expo prebuild` does not regenerate target structure inside
 *     project.pbxproj for custom extensions. See
 *     apps/mobile/ios/COYLWidget/README.md for the one-time Xcode
 *     setup that creates the COYLWidget target, links
 *     COYLInterruptAttributes / COYLInterruptIntents /
 *     COYLInterruptLiveActivity into it, and enables the same App
 *     Group on the extension target.
 *
 * Why a plugin instead of just editing app.json's `ios.infoPlist`:
 *   - Entitlements are not expressible via app.json. The App Group
 *     capability *must* be patched through entitlements plist, which
 *     requires `withEntitlementsPlist`.
 *   - Keeping all Live Activity wiring in one file makes it obvious
 *     what to revert / port if we drop the feature.
 */
import {
  ConfigPlugin,
  withInfoPlist,
  withEntitlementsPlist,
} from '@expo/config-plugins'

const APP_GROUP_ID = 'group.com.coyl.shared'

const withCoylLiveActivity: ConfigPlugin = (config) => {
  // 1. Info.plist — enable ActivityKit on the main app target.
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSSupportsLiveActivities = true
    cfg.modResults.NSSupportsLiveActivitiesFrequentUpdates = true
    return cfg
  })

  // 2. Entitlements — App Group shared with the widget extension so
  // both processes can read/write the auth token through a
  // UserDefaults(suiteName: ...) backed by the same container.
  config = withEntitlementsPlist(config, (cfg) => {
    const existing = (cfg.modResults['com.apple.security.application-groups'] ??
      []) as string[]
    if (!existing.includes(APP_GROUP_ID)) {
      cfg.modResults['com.apple.security.application-groups'] = [
        ...existing,
        APP_GROUP_ID,
      ]
    }
    return cfg
  })

  return config
}

export default withCoylLiveActivity
