/**
 * Expo config plugin for COYL's Android port.
 *
 * On `expo prebuild --platform android` (or any time the Android
 * project is regenerated) this plugin patches the generated
 * AndroidManifest.xml + app-level build.gradle so:
 *
 *   1. The manifest declares every permission COYL needs at runtime:
 *      - ACTIVITY_RECOGNITION  -> step / movement classification
 *      - POST_NOTIFICATIONS    -> interrupt notifications (API 33+)
 *      - ACCESS_FINE_LOCATION  -> danger-window geofencing
 *      - ACCESS_BACKGROUND_LOCATION -> geofence triggers while backgrounded
 *      - FITNESS_BODY_READ     -> Google Fit body sensor reads (legacy)
 *
 *   2. The manifest declares <queries> entries so the package
 *      visibility filter on Android 11+ doesn't hide Google Fit /
 *      Health Connect from us when we ask the OS to resolve them.
 *
 *   3. The app-level build.gradle pulls in:
 *      - androidx.health.connect:connect-client (Health Connect SDK,
 *        the modern HealthKit equivalent, Pixel Watch / Galaxy Watch
 *        / Fitbit / Garmin via bridge)
 *      - play-services-fitness (Google Fit fallback for devices
 *        without Health Connect, mostly Android <14)
 *
 * What this plugin does NOT do:
 *   - It does not add any Java/Kotlin source files. Health Connect
 *     reads happen entirely from JS through react-native-health-connect
 *     + lib/health-bridge-android.ts.
 *   - It does not patch Gradle plugin versions or the Android SDK
 *     compile/target levels — those live in app.json's
 *     expo-build-properties config or the project-level gradle files.
 */
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
} from '@expo/config-plugins'

const PERMISSIONS_TO_ADD = [
  'android.permission.ACTIVITY_RECOGNITION',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'com.google.android.gms.permission.FITNESS_BODY_READ',
] as const

// Package names that Android 11+ package-visibility rules require us
// to declare in <queries> so we can resolve their components.
const PACKAGE_QUERIES_TO_ADD = [
  'com.google.android.apps.fitness',
  'com.google.android.apps.healthdata',
] as const

const HEALTH_CONNECT_DEPENDENCY =
  'implementation "androidx.health.connect:connect-client:1.1.0-alpha07"'
const PLAY_SERVICES_FITNESS_DEPENDENCY =
  'implementation "com.google.android.gms:play-services-fitness:21.1.0"'

const withCoylAndroid: ConfigPlugin = (config) => {
  // 1. AndroidManifest — permissions + queries.
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults

    // Permissions.
    manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'] ?? []
    for (const name of PERMISSIONS_TO_ADD) {
      AndroidConfig.Permissions.addPermission(manifest, name)
    }

    // <queries> for package visibility on Android 11+.
    const queriesArr =
      (manifest.manifest.queries as Array<{ package?: Array<{ $: { 'android:name': string } }> }> | undefined) ?? []
    let queries = queriesArr[0]
    if (!queries) {
      queries = { package: [] }
      manifest.manifest.queries = [queries]
    }
    queries.package = queries.package ?? []
    for (const pkg of PACKAGE_QUERIES_TO_ADD) {
      const already = queries.package.some(
        (p) => p?.$?.['android:name'] === pkg,
      )
      if (!already) {
        queries.package.push({ $: { 'android:name': pkg } })
      }
    }

    return cfg
  })

  // 2. app/build.gradle — Health Connect + Google Fit dependencies.
  config = withAppBuildGradle(config, (cfg) => {
    const src = cfg.modResults.contents

    let next = src
    if (!next.includes('androidx.health.connect:connect-client')) {
      next = next.replace(
        /dependencies\s*\{/,
        `dependencies {\n    ${HEALTH_CONNECT_DEPENDENCY}`,
      )
    }
    if (!next.includes('play-services-fitness')) {
      next = next.replace(
        /dependencies\s*\{/,
        `dependencies {\n    ${PLAY_SERVICES_FITNESS_DEPENDENCY}`,
      )
    }
    cfg.modResults.contents = next
    return cfg
  })

  return config
}

export default withCoylAndroid
