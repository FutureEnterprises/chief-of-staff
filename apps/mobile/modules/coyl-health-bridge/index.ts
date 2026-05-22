/**
 * JS bridge for the CoylHealthBridge native module.
 *
 * On iOS (16.1+) this resolves to the Swift module defined in
 * `./ios/CoylHealthBridge.swift`. On Android and in environments
 * where the native module isn't linked yet (web, Expo Go, or a
 * fresh prebuild that hasn't been rebuilt), we return a no-op
 * stub that resolves each call with a safe default so callers
 * don't have to gate on `Platform.OS === 'ios'`.
 *
 * The module's job is to bridge passive signals — HRV, sedentary
 * minutes, category-level screen time, geofence classification —
 * from native iOS APIs to JS, and to drain any queued samples to
 * the Web `/api/v1/health/ingest` endpoint.
 */
import { Platform } from 'react-native'
import { requireNativeModule } from 'expo-modules-core'

/** Permission scopes recognized by the native module. */
export type HealthPermissionScope =
  | 'health'
  | 'motion'
  | 'location'
  | 'screen_time'

/** Result of a permission request — the native side never throws
 *  on a denied scope, it just bucketsm the scope into `denied`. */
export interface PermissionResult {
  granted: HealthPermissionScope[]
  denied: HealthPermissionScope[]
}

/** A single HKQuantitySample for HRV (HRV SDNN), in milliseconds. */
export interface HRVSampleNative {
  /** SDNN value in milliseconds. */
  value: number
  /** ISO8601 timestamp the sample window started. */
  startDate: string
  /** ISO8601 timestamp the sample window ended. */
  endDate: string
}

/** Geofence input. Radius defaults to 50m on the native side. */
export interface GeofenceCoord {
  lat: number
  lng: number
  /** Meters. Native side enforces a 50m floor. */
  radius?: number
}

/** Inferred location kind from the currently entered geofence. */
export type LocationKind = 'home' | 'kitchen' | 'work' | 'unknown'

/** Result shape from `flushPendingSamples`. */
export interface FlushResult {
  posted: number
  failed: number
}

/** Native module surface. Exposed exactly as Swift defines it. */
export interface CoylHealthBridgeModule {
  requestPermissions(
    scopes: HealthPermissionScope[],
  ): Promise<PermissionResult>
  readHRVSamples(
    startDate: string,
    endDate: string,
  ): Promise<HRVSampleNative[]>
  readSedentaryMinutes(now: string): Promise<number>
  readScreenTimeCategoryUsage(
    startDate: string,
  ): Promise<Record<string, number>>
  setupGeofences(
    home: GeofenceCoord | null,
    kitchen: GeofenceCoord | null,
  ): Promise<void>
  currentLocationKind(): Promise<LocationKind>
  flushPendingSamples(): Promise<FlushResult>
}

/**
 * No-op stub. Resolves every call with a defaults-only shape so
 * non-iOS / unbuilt environments don't have to special-case.
 */
const stub: CoylHealthBridgeModule = {
  async requestPermissions() {
    return { granted: [], denied: [] }
  },
  async readHRVSamples() {
    return []
  },
  async readSedentaryMinutes() {
    return 0
  },
  async readScreenTimeCategoryUsage() {
    return {}
  },
  async setupGeofences() {
    /* no-op */
  },
  async currentLocationKind() {
    return 'unknown'
  },
  async flushPendingSamples() {
    return { posted: 0, failed: 0 }
  },
}

function load(): CoylHealthBridgeModule {
  if (Platform.OS !== 'ios') return stub
  try {
    return requireNativeModule<CoylHealthBridgeModule>('CoylHealthBridge')
  } catch {
    // Module not linked yet (Expo Go, web, fresh prebuild). Return
    // the stub instead of crashing — JS callers don't have to gate.
    return stub
  }
}

const CoylHealthBridge: CoylHealthBridgeModule = load()

export default CoylHealthBridge
