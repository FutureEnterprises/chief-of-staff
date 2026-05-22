/**
 * Expo config plugin: COYL passive-signals iOS permissions.
 *
 * On `expo prebuild` this patches the iOS app target's Info.plist
 * with the four permission usage strings the CoylHealthBridge
 * native module needs. The COPY is taken from
 * /how-coyl-knows-you's "Permission moment" framing — each prompt
 * is an explicit value-exchange, not a generic "we need access".
 *
 * Permissions added:
 *   - NSHealthShareUsageDescription
 *       HealthKit reads (HRV, sleep, step count, active energy).
 *   - NSMotionUsageDescription
 *       CoreMotion / CMMotionActivityManager — sedentary detection.
 *   - NSLocationWhenInUseUsageDescription
 *       CoreLocation — geofence-only home/kitchen classification.
 *   - NSFamilyControlsUsageDescription (iOS 17.0+)
 *       DeviceActivity — anonymized app-category usage counts.
 *
 * NOTE on registration: Expo plugins are loaded from `expo.plugins`
 * in app.json. The expo-module.config.json colocated with the
 * native module tells the autolinker to compile the Swift target,
 * but it does NOT register the plist-patching plugin — that has
 * to be referenced by path in app.json. Since the task constraint
 * forbids touching app.json, the founder must add this line to
 * the `plugins` array manually:
 *
 *   "./plugins/with-coyl-health-permissions"
 *
 * If/when this plugin is wired up, expo prebuild --clean will
 * apply the four Info.plist strings on the next build.
 *
 * TODO(founder): Add "./plugins/with-coyl-health-permissions" to
 * expo.plugins in apps/mobile/app.json, then run
 * `npm --prefix apps/mobile run prebuild -- --clean`.
 */
import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins'

const PERMISSION_COPY = {
  NSHealthShareUsageDescription:
    'COYL reads HRV, sleep, and activity from Apple Health to predict your danger windows 15-20 minutes before they fire.',
  NSMotionUsageDescription:
    'COYL reads accelerometer activity to detect sedentary states that precede behavioral autopilot.',
  NSLocationWhenInUseUsageDescription:
    'COYL uses geofence-only home and kitchen detection. Your exact location never leaves your device.',
  NSFamilyControlsUsageDescription:
    'COYL reads anonymized app-category usage counts to predict phone-unlock spikes that precede slips.',
} as const

const withCoylHealthPermissions: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (cfg) => {
    // Overwrite each key. If an earlier plugin set the same key with
    // weaker copy, ours wins — these strings show in App Store review
    // and we want consistency with /how-coyl-knows-you.
    for (const [key, value] of Object.entries(PERMISSION_COPY)) {
      ;(cfg.modResults as Record<string, unknown>)[key] = value
    }
    return cfg
  })

  return config
}

export default withCoylHealthPermissions
