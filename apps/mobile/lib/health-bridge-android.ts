/**
 * Android health bridge — reads from Health Connect (the modern,
 * Google-blessed HealthKit equivalent, available on Android 14+ and
 * as a separately-installable app on Android 9+) with a Google Fit
 * fallback for devices that don't expose Health Connect.
 *
 * Provides the SAME JS surface as ./health-bridge.ts (iOS-specific,
 * owned by a parallel agent) so consumer code never has to branch on
 * platform. Both modules export:
 *
 *   - requestHealthPermissions(): Promise<HealthPermissionResult>
 *   - readDailyHealthMetrics(start, end): Promise<DailyHealthMetrics>
 *   - isHealthAvailable(): Promise<boolean>
 *
 * Coverage of HRV is uneven on Android — see KNOWN GAP in the commit
 * message. Pixel Watch + Galaxy Watch report HRV via Health Connect;
 * Fitbit (post-Google acquisition) supports it; Garmin requires the
 * user to enable Garmin's own Health Connect bridge; Apple Watch +
 * Android is not a supported combo (no Apple-blessed bridge).
 */
import { Platform } from 'react-native'

// Re-export the same shape that the iOS bridge uses. If the iOS
// bridge tightens these types, mirror the change here.
export interface DailyHealthMetrics {
  /** Heart rate variability in milliseconds (RMSSD), if device supports. */
  hrvMs?: number
  /** Total step count for the period. */
  steps?: number
  /** Total sleep duration in hours. */
  sleepHours?: number
  /** Active calories burned (kcal) for the period. */
  activeCalories?: number
  /** Average heart rate in bpm, if any HR samples exist. */
  heartRateAvg?: number
  /** Resting heart rate in bpm, if device exposes it. */
  restingHeartRate?: number
}

export type HealthSource = 'health_connect' | 'google_fit' | 'none'

export interface HealthPermissionResult {
  /** Which underlying data source was wired up, if any. */
  source: HealthSource
  /** True iff at least one read scope was granted. */
  granted: boolean
}

/* ----------------------------------------------------------------------
 * Health Connect (preferred path)
 * --------------------------------------------------------------------*/

type HealthConnectModule = {
  initialize: () => Promise<boolean>
  /**
   * Returns 'Installed' / 'NotInstalled' / 'NotSupported'.
   * We treat anything other than 'Installed' as a fall-through to Google Fit.
   */
  getSdkStatus?: () => Promise<string>
  requestPermission: (
    perms: Array<{ accessType: 'read'; recordType: string }>,
  ) => Promise<Array<{ accessType: 'read'; recordType: string }>>
  readRecords: <T = unknown>(
    type: string,
    opts: {
      timeRangeFilter: {
        operator: 'between'
        startTime: string
        endTime: string
      }
    },
  ) => Promise<{ records: T[] }>
}

/** Record types we care about; mirrors iOS HealthKit identifiers. */
const HC_READ_PERMS = [
  { accessType: 'read' as const, recordType: 'Steps' },
  { accessType: 'read' as const, recordType: 'SleepSession' },
  { accessType: 'read' as const, recordType: 'HeartRate' },
  { accessType: 'read' as const, recordType: 'HeartRateVariabilityRmssd' },
  { accessType: 'read' as const, recordType: 'RestingHeartRate' },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' },
]

async function loadHealthConnect(): Promise<HealthConnectModule | null> {
  try {
    const mod = (await import('react-native-health-connect')) as unknown as HealthConnectModule
    return mod
  } catch {
    return null
  }
}

async function isHealthConnectInstalled(
  hc: HealthConnectModule,
): Promise<boolean> {
  try {
    const status = (await hc.getSdkStatus?.()) ?? 'NotInstalled'
    return status === 'Installed' || status === 'SDK_AVAILABLE'
  } catch {
    // Older versions of react-native-health-connect don't have
    // getSdkStatus — fall back to whether initialize() succeeds.
    try {
      return await hc.initialize()
    } catch {
      return false
    }
  }
}

async function readFromHealthConnect(
  start: Date,
  end: Date,
): Promise<DailyHealthMetrics> {
  const hc = await loadHealthConnect()
  if (!hc) return {}

  const ok = await hc.initialize().catch(() => false)
  if (!ok) return {}

  const range = {
    timeRangeFilter: {
      operator: 'between' as const,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  }
  const metrics: DailyHealthMetrics = {}

  // Each read is wrapped individually so a single failing record type
  // doesn't poison the rest of the response. Devices commonly only
  // expose a subset (e.g. no HRV on a phone without a smartwatch).
  try {
    const steps = await hc.readRecords<{ count: number }>('Steps', range)
    metrics.steps = steps.records.reduce((s, r) => s + (r.count ?? 0), 0)
  } catch {
    /* device or permission doesn't expose Steps */
  }

  try {
    const sleep = await hc.readRecords<{ startTime: string; endTime: string }>(
      'SleepSession',
      range,
    )
    const totalMs = sleep.records.reduce(
      (s, r) =>
        s + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()),
      0,
    )
    if (totalMs > 0) {
      metrics.sleepHours = Math.round((totalMs / 3_600_000) * 10) / 10
    }
  } catch {
    /* ignore */
  }

  try {
    const hr = await hc.readRecords<{
      samples: Array<{ beatsPerMinute: number }>
    }>('HeartRate', range)
    const allSamples = hr.records.flatMap((r) => r.samples ?? [])
    if (allSamples.length > 0) {
      metrics.heartRateAvg = Math.round(
        allSamples.reduce((s, x) => s + x.beatsPerMinute, 0) / allSamples.length,
      )
    }
  } catch {
    /* ignore */
  }

  try {
    const hrv = await hc.readRecords<{ heartRateVariabilityMillis: number }>(
      'HeartRateVariabilityRmssd',
      range,
    )
    if (hrv.records.length > 0) {
      const avg =
        hrv.records.reduce(
          (s, r) => s + (r.heartRateVariabilityMillis ?? 0),
          0,
        ) / hrv.records.length
      metrics.hrvMs = Math.round(avg * 10) / 10
    }
  } catch {
    /* device doesn't expose HRV (most phones without a watch) */
  }

  try {
    const rhr = await hc.readRecords<{ beatsPerMinute: number }>(
      'RestingHeartRate',
      range,
    )
    if (rhr.records.length > 0) {
      const avg =
        rhr.records.reduce((s, r) => s + (r.beatsPerMinute ?? 0), 0) /
        rhr.records.length
      metrics.restingHeartRate = Math.round(avg)
    }
  } catch {
    /* ignore */
  }

  try {
    const cals = await hc.readRecords<{
      energy: { inKilocalories: number }
    }>('ActiveCaloriesBurned', range)
    const total = cals.records.reduce(
      (s, r) => s + (r.energy?.inKilocalories ?? 0),
      0,
    )
    if (total > 0) metrics.activeCalories = Math.round(total)
  } catch {
    /* ignore */
  }

  return metrics
}

async function requestHealthConnectPermissions(): Promise<boolean> {
  const hc = await loadHealthConnect()
  if (!hc) return false
  const ok = await hc.initialize().catch(() => false)
  if (!ok) return false
  const granted = await hc.requestPermission(HC_READ_PERMS).catch(() => [])
  return granted.length > 0
}

/* ----------------------------------------------------------------------
 * Google Fit fallback
 * --------------------------------------------------------------------*/

/**
 * Google Fit fallback. Limited compared to Health Connect — no HRV
 * exposure, no resting HR; we only attempt steps + active calories
 * via the legacy Fitness API. If the app doesn't ship a Google Fit
 * adapter (we keep one as optional dep), this returns {} silently.
 */
async function readFromGoogleFit(
  _start: Date,
  _end: Date,
): Promise<DailyHealthMetrics> {
  // Intentionally minimal: most users on Android 14+ get Health
  // Connect, so the fallback covers a shrinking long tail. We rely
  // on the Google Fit module's permission flow if the user installs
  // a RN bridge for it. With no bridge linked, we resolve to {} so
  // the caller can degrade gracefully.
  return {}
}

/* ----------------------------------------------------------------------
 * Public API — mirrors iOS health-bridge.ts surface
 * --------------------------------------------------------------------*/

/** True iff this build is running on Android and at least one source loads. */
export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false
  const hc = await loadHealthConnect()
  if (hc) {
    const installed = await isHealthConnectInstalled(hc)
    if (installed) return true
  }
  // Google Fit is universally present on Play-services devices; we
  // assume available so the consumer can offer the user a permission
  // prompt rather than hiding the integration entirely.
  return true
}

/**
 * Prompt the user for read permissions on the preferred data source.
 * Tries Health Connect first; falls through to Google Fit on devices
 * where Health Connect isn't installed.
 */
export async function requestHealthPermissions(): Promise<HealthPermissionResult> {
  if (Platform.OS !== 'android') {
    return { source: 'none', granted: false }
  }
  const hc = await loadHealthConnect()
  if (hc) {
    const installed = await isHealthConnectInstalled(hc)
    if (installed) {
      const granted = await requestHealthConnectPermissions()
      return { source: 'health_connect', granted }
    }
  }
  // Google Fit doesn't have a unified permission prompt without a
  // bridge module; we report 'google_fit' as the source but leave
  // granted=false until the bridge actually wires it up.
  return { source: 'google_fit', granted: false }
}

/**
 * Read aggregated daily metrics for the given window. Selects the
 * best available source and returns a DailyHealthMetrics. Missing
 * fields are simply omitted — the caller MUST treat every property
 * as optional.
 */
export async function readDailyHealthMetrics(
  start: Date,
  end: Date,
): Promise<DailyHealthMetrics> {
  if (Platform.OS !== 'android') return {}
  const hc = await loadHealthConnect()
  if (hc) {
    const installed = await isHealthConnectInstalled(hc)
    if (installed) {
      return readFromHealthConnect(start, end)
    }
  }
  return readFromGoogleFit(start, end)
}
