/**
 * Screen Time INTERCEPTION contract (Edge Layer 4) — honest JS stub.
 *
 * Naming note: `lib/screen-time.ts` already exists and is a different
 * surface — it READS anonymized app-category usage *counts* via the
 * CoylHealthBridge (a passive Layer-3-adjacent signal). THIS module is the
 * INTERCEPTION surface: scheduling danger-window monitors and reacting to
 * the OS firing "app opened / threshold crossed" events. They are kept in
 * separate files on purpose so the read-path stays untouched.
 *
 * Status: NATIVE SIDE NOT IMPLEMENTED.
 *
 * The real interception — "user opened DoorDash at 23:42, inside a declared
 * danger window → COYL shields the app or fires a local notification" —
 * cannot run in JavaScript. It runs in a native Swift DeviceActivityMonitor
 * app extension, gated behind the `com.apple.developer.family-controls`
 * entitlement (see plugins/with-screen-time.ts and
 * docs/mobile/screen-time-entitlement.md).
 *
 * This file exists so product/UI surfaces can be written against a stable
 * JS contract NOW. Every function fails loudly until the native module +
 * extension land — there is no silent no-op, because a silently-missing
 * shield is a worse failure than a thrown error during development.
 *
 * When the native module lands:
 *   - flip `isScreenTimeInterceptionAvailable()` to probe the real bridge,
 *   - replace each stub body with a call into the native module,
 *   - delete the `unavailable()` throws.
 */

/** Days the monitor is armed. 0 = Sunday … 6 = Saturday (JS getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * A recurring danger-window monitor. Mirrors a DeviceActivitySchedule:
 * `start`/`end` are local wall-clock "HH:mm" 24h strings (the OS evaluates
 * them in the device's local time, which is what we want — a danger window
 * is defined in the user's lived time, not UTC).
 */
export interface WindowSchedule {
  /** Stable id shared with the danger window it mirrors (e.g. ProductivityWindow id). */
  windowId: string
  /** Inclusive local start, "HH:mm" 24h, e.g. "21:30". */
  start: string
  /** Exclusive local end, "HH:mm" 24h, e.g. "23:59". */
  end: string
  /** Days the window is armed. Empty = every day. */
  days: Weekday[]
}

/**
 * Emitted when the OS reports a monitored threshold/event inside a window.
 * In the native impl this is produced by the DeviceActivityMonitor
 * extension's `eventDidReachThreshold` / `intervalDidStart` callbacks and
 * relayed to JS. The JS layer's job is to render the response surface and
 * POST the outcome so it feeds the nightly learners.
 */
export interface ThresholdEvent {
  /** Which WindowSchedule fired. */
  windowId: string
  /** Opaque event name configured on the monitor (e.g. "delivery-apps-opened"). */
  eventName: string
  /** Device-local ISO timestamp of the event. */
  occurredAtIso: string
}

/** Unsubscribe handle returned by `onThresholdEvent`. */
export type Unsubscribe = () => void

/** Result of an authorization request against FamilyControls. */
export type AuthorizationStatus = 'approved' | 'denied' | 'unavailable'

const UNAVAILABLE_MESSAGE =
  '[screen-time-interception] Native DeviceActivity bridge is not implemented. ' +
  'This requires the com.apple.developer.family-controls entitlement (see ' +
  'docs/mobile/screen-time-entitlement.md) and a native Swift ' +
  'DeviceActivityMonitor extension. The JS contract is a stub.'

function unavailable(): never {
  throw new Error(UNAVAILABLE_MESSAGE)
}

/**
 * Whether the interception path is usable on this device/build.
 *
 * Hardcoded `false` for now. Flips to a real check (iOS 16+, entitlement
 * present, native module linked, user authorized) when the native module +
 * DeviceActivityMonitor extension land. Product surfaces should gate every
 * other call in this module behind this.
 */
export function isScreenTimeInterceptionAvailable(): boolean {
  return false
}

/**
 * Request FamilyControls authorization (the system "Allow COYL to access
 * Screen Time?" prompt). The user is shielding their OWN device by consent —
 * this is `.individual` authorization, not parental/guardian control.
 *
 * Stub: throws. Native impl calls AuthorizationCenter.requestAuthorization.
 */
export async function requestAuthorization(): Promise<AuthorizationStatus> {
  return unavailable()
}

/**
 * Arm a recurring danger-window monitor. In the native impl this hands the
 * schedule to a DeviceActivityCenter so the DeviceActivityMonitor extension
 * wakes on the OS's schedule — no JS process needs to be alive.
 *
 * Stub: throws. Native impl calls DeviceActivityCenter.startMonitoring.
 */
export async function defineWindowSchedule(
  schedule: WindowSchedule,
): Promise<void> {
  void schedule
  return unavailable()
}

/**
 * Tear down a previously-armed monitor.
 *
 * Stub: throws. Native impl calls DeviceActivityCenter.stopMonitoring.
 */
export async function clearWindowSchedule(windowId: string): Promise<void> {
  void windowId
  return unavailable()
}

/**
 * Register a callback for threshold/event firings relayed from the native
 * extension. Returns an unsubscribe handle.
 *
 * Stub: throws. Native impl wires this to the bridge's event emitter.
 */
export function onThresholdEvent(
  callback: (event: ThresholdEvent) => void,
): Unsubscribe {
  void callback
  return unavailable()
}
