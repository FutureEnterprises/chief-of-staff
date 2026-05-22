/**
 * JS bridge for the CoylWatch native module.
 *
 * On iOS this resolves to a real WatchConnectivity-backed module
 * defined in `./ios/CoylWatch.swift`. On Android and on iOS
 * builds where the module isn't linked we export a no-op shim —
 * every call resolves with the same shape the native module
 * would return on a "no watch paired" check, so consumers never
 * have to gate on Platform or paired state.
 *
 * Three responsibilities:
 *   1. Send intervention haptics to the wrist (kind: "interrupt").
 *   2. Sync the daily-number payload to the watch (kind:
 *      "syncDailyNumber") — writes the App Group locally AND
 *      messages the watch so the complication reloads.
 *   3. Tell the caller whether a watch is currently paired.
 *
 * App Group keys written by this module match those read by:
 *   apps/mobile/ios/COYLWatch/COYLWatchView.swift
 *   apps/mobile/ios/COYLWatch/COYLComplication.swift
 */
import { Platform } from 'react-native'
import { requireNativeModule } from 'expo-modules-core'

/** Intervention modes. Mirror COYLHapticIntervention.swift. */
export type CoylInterventionMode =
  | 'interrupt-high-arousal'
  | 'interrupt-low-arousal'
  | 'interrupt-post-slip'

/** Payload for the daily-number sync to the watch. */
export interface CoylDailyNumberPayload {
  /** Self-Trust Score, 0–100. */
  selfTrustScore: number
  /** Day number since onboarding. */
  dayNumber: number
  /** Identity-sentence rendered on the watch face. */
  identitySentence: string
}

export interface CoylWatchModule {
  /**
   * Fires a haptic interrupt on the paired watch. The headline /
   * subhead are not currently rendered (the wrist is haptic-only
   * today) but are forwarded for forward-compat with a future
   * Watch notification UI.
   *
   * Resolves true if the message was queued for delivery, false if
   * no watch is paired or WCSession isn't reachable.
   */
  sendIntervention(
    mode: CoylInterventionMode,
    headline: string,
    subhead: string,
  ): Promise<boolean>

  /**
   * Persists `payload` to the shared App Group (so the
   * complication / Watch UI re-render on next read) AND messages
   * the watch to nudge an immediate reload. Idempotent — calling
   * with identical values is a no-op from the watch's POV.
   */
  syncDailyNumber(payload: CoylDailyNumberPayload): Promise<void>

  /**
   * True iff a watch is paired AND the Watch app is installed on
   * it. Used by callers to gate "show watch onboarding card" UI.
   */
  isWatchPaired(): Promise<boolean>
}

/**
 * Stub returned on non-iOS and on environments where the native
 * module is not yet linked (e.g., before `expo prebuild` runs).
 * All methods resolve with no-watch defaults rather than throwing
 * so the JS layer can call them unconditionally.
 */
const stub: CoylWatchModule = {
  async sendIntervention() {
    return false
  },
  async syncDailyNumber() {
    /* no-op */
  },
  async isWatchPaired() {
    return false
  },
}

function load(): CoylWatchModule {
  if (Platform.OS !== 'ios') return stub
  try {
    return requireNativeModule<CoylWatchModule>('CoylWatch')
  } catch {
    // Native module hasn't been built yet (Expo Go, web, or a
    // fresh prebuild that hasn't been rebuilt). Return the stub
    // instead of crashing — callers already guard with
    // isWatchPaired().
    return stub
  }
}

const CoylWatch: CoylWatchModule = load()

export default CoylWatch
