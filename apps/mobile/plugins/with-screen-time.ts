/**
 * Expo config plugin for COYL's iOS Screen Time interception (Edge Layer 4).
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │  DO NOT REGISTER THIS PLUGIN IN app.json YET.                       │
 * │                                                                     │
 * │  The `com.apple.developer.family-controls` entitlement this plugin  │
 * │  adds is GATED by Apple. Development builds signed with a normal    │
 * │  team work fine, BUT any DISTRIBUTION profile (TestFlight / App     │
 * │  Store) will fail to sign — and therefore the EAS build will fail — │
 * │  until Apple grants the Family Controls distribution entitlement to │
 * │  the app's bundle id. The Account Holder must apply via Apple's     │
 * │  entitlement request form first.                                    │
 * │                                                                     │
 * │  Registration is a deliberate, one-line act the founder takes       │
 * │  ONLY AFTER the grant lands. See:                                   │
 * │    docs/mobile/screen-time-entitlement.md                          │
 * │  The exact line to add to expo.plugins in app.json:                 │
 * │    "./plugins/with-screen-time"                                     │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * What this plugin does (when registered):
 *   - Entitlements
 *       com.apple.developer.family-controls = true
 *     This is the single entitlement that unlocks the FamilyControls,
 *     DeviceActivity, and ManagedSettings frameworks. Without it, calls
 *     into AuthorizationCenter / DeviceActivityCenter / ManagedSettingsStore
 *     throw at runtime, and a DeviceActivityMonitor extension cannot run.
 *
 * What this plugin does NOT do — must be done manually:
 *   - It does NOT add the DeviceActivityMonitor app-extension target. That
 *     is a native Swift target (not a file) and `expo prebuild` will not
 *     synthesize it into project.pbxproj. The extension that performs the
 *     real interception — "DoorDash opened at 23:42 in a danger window →
 *     shield / local notification" — is hand-added in Xcode (or via an EAS
 *     custom build that carries the extension target). See the entitlement
 *     doc for the named pieces (DeviceActivityCenter schedule, the
 *     DeviceActivityMonitor subclass, ManagedSettingsStore shield).
 *   - It does NOT add the matching NSFamilyControlsUsageDescription string.
 *     That usage copy is owned by with-coyl-health-permissions.ts so all
 *     permission prompts stay consistent in one place.
 *
 * Why a plugin and not app.json's `ios.entitlements`:
 *   - Keeping the gated entitlement in its own file makes it trivially
 *     reversible and impossible to enable by accident: the entitlement
 *     only exists in a generated build if THIS plugin is registered.
 */
import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins'

const FAMILY_CONTROLS_ENTITLEMENT = 'com.apple.developer.family-controls'

const withScreenTime: ConfigPlugin = (config) => {
  config = withEntitlementsPlist(config, (cfg) => {
    // Boolean `true` — Apple's Family Controls entitlement is a flag, not
    // an array of identifiers. Idempotent: setting it twice is harmless.
    cfg.modResults[FAMILY_CONTROLS_ENTITLEMENT] = true
    return cfg
  })

  return config
}

export default withScreenTime
