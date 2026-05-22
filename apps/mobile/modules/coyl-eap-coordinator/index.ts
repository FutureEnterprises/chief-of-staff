/**
 * JS bridge for the CoylEAPCoordinator native module.
 *
 * On iOS this resolves to a Swift module defined in
 * `./ios/CoylEAPCoordinator.swift`. On Android and on environments
 * where the native module is not yet linked (Expo Go, web, fresh
 * prebuild) we export a no-op shim — every method returns the same
 * shape the native module would on an unsupported-platform check so
 * the JS coordinator never has to gate on `Platform.OS === 'ios'`.
 *
 * The native module's job is to surface the things ONLY native iOS
 * can answer:
 *
 *   - getDeviceFingerprint()
 *       Reads or generates the persistent UUID we use as the device
 *       identity in EAP. Stored in Keychain so it survives reinstall
 *       (we don't want a fresh fingerprint after every uninstall —
 *       that defeats EAPAuditEntry continuity).
 *
 *   - getOperationalState()
 *       Battery, DND mode, foreground bundle id — the bits the EAP
 *       device.register manifest needs to populate.
 *
 *   - setUserGrantedScopes() / getUserGrantedScopes()
 *       Writes the EAP scope list into the shared App Group so the
 *       widget extension + Watch app can read the same source of
 *       truth (matching the existing `coyl.authToken` pattern from
 *       CoylLiveActivityModule.setAuthToken).
 *
 *   - requestAppIntent()
 *       Invokes a named App Intent via NSUserActivity — the
 *       'open_app_intent' actuator path.
 *
 * Action execution, sensor publication, /api/eap/v1/* HTTP calls,
 * and BGTaskScheduler registration all live in the JS-side
 * coordinator at apps/mobile/lib/eap-coordinator.ts. This module is
 * intentionally thin — it owns only the operations that can't be
 * done from JS at all.
 */
import { Platform } from 'react-native'
import { requireNativeModule } from 'expo-modules-core'

/**
 * Snapshot of the device's operational state at the moment
 * device/register fires. Mirrors the JSON shape in the EAP spec's
 * `operationalState` field. All booleans default to false / numbers
 * default to 100 / strings default to "" rather than reject — the
 * EAP server tolerates a partial manifest, and missing values would
 * just look like "unknown" which is harmless.
 */
export interface CoylEAPOperationalState {
  /** Battery percentage 0-100. -1 if unknown (simulator / not monitored). */
  battery: number
  /**
   * True if the user has Do Not Disturb / a Focus mode active.
   * iOS doesn't expose the *kind* of Focus to third-party apps —
   * we surface only the binary on/off.
   */
  doNotDisturb: boolean
  /** Foreground app bundle id. Always "com.coyl.app" while we're running. */
  foregroundApp: string
}

export interface CoylEAPCoordinatorNativeModule {
  /**
   * Reads the persistent device fingerprint from Keychain. Generates
   * + stores one on first call. The fingerprint is a lower-case UUID
   * string (no braces). Resolves with the same value across every
   * call for the lifetime of this device install.
   */
  getDeviceFingerprint(): Promise<string>

  /** Returns the snapshot used to populate device.register's
   *  `operationalState` field. Cheap — call it whenever you re-POST. */
  getOperationalState(): Promise<CoylEAPOperationalState>

  /**
   * Writes the user-granted EAP scope list into the shared App
   * Group's UserDefaults under key "coyl.eap.userGrantedScopes" so
   * the widget extension's App Intents + the Watch app can read
   * the same source of truth. Scopes are EAP scope strings, e.g.
   * "edge:phone:haptic". Replaces any previous list.
   */
  setUserGrantedScopes(scopes: string[]): Promise<void>

  /** Reads the scope list previously written by setUserGrantedScopes.
   *  Empty array if nothing's been written yet. */
  getUserGrantedScopes(): Promise<string[]>

  /**
   * Invokes a named App Intent via NSUserActivity. This is the
   * sanctioned channel for the `open_app_intent` actuator — the LLM
   * cannot reach into another app's intents directly, but it CAN
   * ask COYL to invoke one of OUR registered intents (e.g. the same
   * Caught me / I slipped / Not now intents the widget exposes).
   *
   * `params` are forwarded into the NSUserActivity.userInfo
   * dictionary; the receiving Intent reads them with the same keys.
   *
   * Resolves true if the intent was dispatched, false if no intent
   * with that name is registered on this build.
   */
  requestAppIntent(name: string, params: Record<string, unknown>): Promise<boolean>
}

/**
 * No-op stub. Every method resolves with safe defaults so JS callers
 * don't have to special-case non-iOS / unlinked-module environments.
 */
const stub: CoylEAPCoordinatorNativeModule = {
  async getDeviceFingerprint() {
    // Use a stable per-process pseudo-fingerprint so JS code paths
    // that key off this value (registration cache, etc.) at least see
    // *something*. Won't be persistent but won't crash either.
    return '00000000-0000-0000-0000-000000000000'
  },
  async getOperationalState() {
    return { battery: -1, doNotDisturb: false, foregroundApp: 'com.coyl.app' }
  },
  async setUserGrantedScopes() {
    /* no-op */
  },
  async getUserGrantedScopes() {
    return []
  },
  async requestAppIntent() {
    return false
  },
}

function load(): CoylEAPCoordinatorNativeModule {
  if (Platform.OS !== 'ios') return stub
  try {
    return requireNativeModule<CoylEAPCoordinatorNativeModule>('CoylEAPCoordinator')
  } catch {
    // Native module hasn't been built / linked yet (Expo Go, web,
    // fresh prebuild that hasn't been rebuilt). Return the stub
    // instead of crashing — callers don't have to gate.
    return stub
  }
}

const CoylEAPCoordinator: CoylEAPCoordinatorNativeModule = load()

export default CoylEAPCoordinator
