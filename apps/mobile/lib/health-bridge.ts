/**
 * High-level health-bridge API used by the rest of the mobile app.
 *
 * Wraps the `CoylHealthBridge` native module with:
 *   - friendlier names (readRecentHRV vs readHRVSamples)
 *   - sensible defaults (e.g., minutesBack window)
 *   - a `postSignalBatch` helper that POSTs a batch directly to the
 *     Web `/api/v1/health/ingest` endpoint instead of going through
 *     the native flush path. JS callers use this when they have the
 *     Clerk token in hand (e.g., right after sign-in).
 *
 * The flush-via-App-Group path on the native side is for samples
 * captured by background observers, where the token can't be
 * passed through the bridge.
 */
import CoylHealthBridge, {
  type FlushResult,
  type HRVSampleNative,
  type HealthPermissionScope,
  type PermissionResult,
} from '../modules/coyl-health-bridge'

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://coyl.ai'
const INGEST_PATH = '/api/v1/health/ingest'

/** The sample kinds the Web ingest endpoint accepts. Keep in sync with
 *  `ALLOWED_KINDS` in apps/web/src/app/api/v1/health/ingest/route.ts. */
export type HealthSampleKind =
  | 'hrv'
  | 'steps'
  | 'sedentary'
  | 'sleep'
  | 'unlock'
  | 'screen_on'

/** One row in the POST body to `/api/v1/health/ingest`. */
export interface HealthSample {
  kind: HealthSampleKind
  valueNumeric: number
  /** Free-form context (e.g., source identifier, category name). */
  valueText?: string
  /** ISO8601 timestamp the sample applies to. */
  capturedAt: string
}

/** Friendly HRV sample shape with a JS Date instead of an ISO string. */
export interface HRVSample {
  /** SDNN milliseconds. */
  ms: number
  start: Date
  end: Date
}

/**
 * Request the umbrella set of permissions COYL needs for passive
 * signals. Returns the partitioned result so the UI can prompt
 * the user to re-grant any individually-denied scope.
 */
export async function requestHealthPermissions(): Promise<PermissionResult> {
  const scopes: HealthPermissionScope[] = [
    'health',
    'motion',
    'location',
    'screen_time',
  ]
  return CoylHealthBridge.requestPermissions(scopes)
}

/**
 * Read HRV SDNN samples from the last `minutesBack` minutes. We default
 * to 30 minutes which is the predictive window the danger-window model
 * was trained against.
 */
export async function readRecentHRV(
  minutesBack: number = 30,
): Promise<HRVSample[]> {
  const end = new Date()
  const start = new Date(end.getTime() - minutesBack * 60 * 1000)
  const native: HRVSampleNative[] = await CoylHealthBridge.readHRVSamples(
    start.toISOString(),
    end.toISOString(),
  )
  return native.map((s) => ({
    ms: s.value,
    start: new Date(s.startDate),
    end: new Date(s.endDate),
  }))
}

/**
 * Returns contiguous sedentary minutes ending at "now". 0 if the
 * motion permission was denied or the device doesn't support it.
 */
export async function readSedentaryDuration(): Promise<number> {
  return CoylHealthBridge.readSedentaryMinutes(new Date().toISOString())
}

/**
 * POST a batch of samples to coyl.ai/api/v1/health/ingest directly,
 * with a caller-supplied Bearer token. Used by the mobile app when
 * it has the Clerk JWT in hand. The native `flushPendingSamples`
 * path covers the background-observer case.
 */
export async function postSignalBatch(
  samples: HealthSample[],
  token: string,
): Promise<{ ok: boolean; count: number }> {
  if (samples.length === 0) return { ok: true, count: 0 }
  if (!token) return { ok: false, count: 0 }
  try {
    const res = await fetch(`${API_URL}${INGEST_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ samples }),
    })
    return { ok: res.ok, count: samples.length }
  } catch {
    return { ok: false, count: 0 }
  }
}

/**
 * Drains the native-side App-Group queue. Returns counts of
 * { posted, failed } so the caller can log or retry.
 */
export async function flushNativeQueue(): Promise<FlushResult> {
  return CoylHealthBridge.flushPendingSamples()
}
