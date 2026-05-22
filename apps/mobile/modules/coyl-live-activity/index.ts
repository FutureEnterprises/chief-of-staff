/**
 * JS bridge for the CoylLiveActivity native module.
 *
 * On iOS (16.1+) this resolves to a real ActivityKit-backed module
 * defined in `./ios/CoylLiveActivityModule.swift`. On Android and on
 * unsupported iOS versions we export a no-op shim — every call
 * returns the same shape the native module would on a failed
 * isSupported() check, so consumers never have to gate on Platform.
 *
 * Shape mirrors COYLInterruptAttributes.swift in the widget target.
 */
import { Platform } from 'react-native'
import { requireNativeModule } from 'expo-modules-core'

/** Attributes passed when starting a Live Activity. Immutable fields. */
export interface CoylLiveActivityStartAttributes {
  /** Archetype slug, e.g. "the-9pm-negotiator". */
  archetype: string
  /** ISO8601 timestamp when the activity started. */
  startedAtIso: string
  /** Primary headline copy. */
  headline: string
  /** Secondary subhead copy. */
  subhead: string
  /** Seconds remaining until the danger window closes. */
  timeRemainingSec: number
  /** Server-side ProductivityEvent id (the interrupt's PK). */
  interruptId: string
}

/** Partial state passed when updating an active Live Activity. */
export interface CoylLiveActivityUpdateState {
  headline?: string
  subhead?: string
  timeRemainingSec?: number
}

/** Options when ending a Live Activity. */
export interface CoylLiveActivityEndOptions {
  /**
   * - `immediate`: removes the activity from the lock screen instantly.
   * - `default`:   standard fade-out window (a few seconds of grace).
   * - `after`:     reserved for a future date-based variant.
   */
  dismissalPolicy?: 'immediate' | 'default' | 'after'
}

export interface CoylLiveActivityModule {
  /** Returns the activity id assigned by the OS. */
  start(attributes: CoylLiveActivityStartAttributes): Promise<string>
  /** Partial update — only changed fields need to be set. */
  update(activityId: string, state: CoylLiveActivityUpdateState): Promise<void>
  /** Best-effort end; missing ids resolve rather than reject. */
  end(activityId: string, options?: CoylLiveActivityEndOptions): Promise<void>
  /** True iff ActivityKit is available AND the user hasn't disabled it. */
  isSupported(): boolean
  /**
   * Writes the auth token into the shared App Group's UserDefaults so
   * the widget extension's App Intents can authenticate.
   */
  setAuthToken(token: string): Promise<void>
}

/**
 * Stub returned on non-iOS and on environments where the native module
 * is not yet linked (e.g., before `expo prebuild` adds the App Group
 * entitlement). All methods resolve / return defaults rather than
 * throwing so the JS layer can call them unconditionally.
 */
const stub: CoylLiveActivityModule = {
  async start() {
    return ''
  },
  async update() {
    /* no-op */
  },
  async end() {
    /* no-op */
  },
  isSupported() {
    return false
  },
  async setAuthToken() {
    /* no-op */
  },
}

function load(): CoylLiveActivityModule {
  if (Platform.OS !== 'ios') return stub
  try {
    return requireNativeModule<CoylLiveActivityModule>('CoylLiveActivity')
  } catch {
    // The native module hasn't been built yet (Expo Go, web, or a fresh
    // prebuild that hasn't been rebuilt). Return the stub instead of
    // crashing — callers already guard with isSupported().
    return stub
  }
}

const CoylLiveActivity: CoylLiveActivityModule = load()

export default CoylLiveActivity
