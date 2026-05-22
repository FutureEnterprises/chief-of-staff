/**
 * Health signal computation helpers.
 *
 * Pure functions where possible. The persistence + cluster-assembly
 * orchestration lives in `signal-cluster.ts`; this module isolates the
 * math so it stays unit-testable.
 *
 * All inputs are domain types, not Prisma records — the cluster builder
 * shapes raw `ProductivityEvent` metadata into these shapes before
 * calling in.
 */
import { prisma } from '@repo/database'

export type HealthSampleKind = 'hrv' | 'steps' | 'sedentary' | 'sleep' | 'unlock' | 'screen_on'

export type RawHealthSample = {
  kind: HealthSampleKind
  valueNumeric: number
  valueText?: string | null
  capturedAt: Date
}

export type LocationInput = {
  /** iOS app's classification, if it can resolve one locally */
  kind?: 'home' | 'kitchen' | 'work' | 'unknown' | null
  /** lat/lng + user-configured fences (future). Today, iOS classifies. */
  lat?: number | null
  lng?: number | null
}

// =====================================================================
// HRV
// =====================================================================

/**
 * Rolling median of the user's HRV samples over the lookback window.
 * Median (not mean) so a one-off spike or apnea episode doesn't move
 * baseline.
 *
 * Returns the median or `null` if fewer than 5 samples in window — we
 * don't want to compute a delta against an unstable baseline. Callers
 * should treat null baseline as "insufficient data" and skip the HRV
 * channel for that cluster.
 */
export async function computeHRVBaseline(
  userId: string,
  lookbackDays = 14,
): Promise<number | null> {
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const events = await prisma.productivityEvent.findMany({
    where: {
      userId,
      eventType: 'FEATURE_USED',
      createdAt: { gte: since },
    },
    select: { metadataJson: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 2000,
  })

  const values: number[] = []
  for (const e of events) {
    const m = e.metadataJson as Record<string, unknown> | null | undefined
    if (!m || m.type !== 'health_sample' || m.kind !== 'hrv') continue
    const v = typeof m.valueNumeric === 'number' ? m.valueNumeric : null
    if (v == null || !Number.isFinite(v) || v <= 0) continue
    values.push(v)
  }

  if (values.length < 5) return null
  return median(values)
}

/**
 * Percentage drop in HRV over the last 60 minutes vs the user's
 * baseline.
 *
 * Negative values = HRV is *below* baseline (stress signal).
 * Positive values = HRV is *above* baseline (recovered/relaxed).
 *
 * Returns null when current-window samples or baseline are missing.
 */
export function computeHRVDelta(
  currentSamples: RawHealthSample[],
  baseline: number | null,
): number | null {
  if (baseline == null || baseline <= 0) return null

  const hrv = currentSamples.filter(
    (s) => s.kind === 'hrv' && Number.isFinite(s.valueNumeric) && s.valueNumeric > 0,
  )
  if (hrv.length === 0) return null

  const current = median(hrv.map((s) => s.valueNumeric))
  if (current <= 0) return null

  // % change from baseline; negative when HRV has dropped
  return ((current - baseline) / baseline) * 100
}

// =====================================================================
// Behavioral
// =====================================================================

/**
 * Contiguous sedentary minutes ending at `now`.
 *
 * `motionSamples` should be sedentary or active flags from HealthKit
 * motion / activity classifications. Anything where valueNumeric > 0 is
 * treated as movement (steps in window, active calories above a small
 * floor, or an explicit "stationary=0" flag).
 *
 * Algorithm: walk samples in reverse chronological order; the count is
 * the minutes since the most recent non-sedentary sample. If all
 * samples in the last hour are sedentary (or there are no movement
 * samples), we report up to 60.
 */
export function computeSedentaryMins(
  motionSamples: RawHealthSample[],
  now: Date = new Date(),
): number {
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const samples = motionSamples
    .filter((s) => s.kind === 'sedentary' || s.kind === 'steps')
    .filter((s) => s.capturedAt >= oneHourAgo && s.capturedAt <= now)
    .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())

  if (samples.length === 0) return 0

  // Find most recent movement sample
  for (const s of samples) {
    const isActive =
      (s.kind === 'steps' && s.valueNumeric > 0) ||
      (s.kind === 'sedentary' && s.valueNumeric === 0)
    if (isActive) {
      const mins = Math.floor((now.getTime() - s.capturedAt.getTime()) / 60_000)
      return Math.max(0, Math.min(mins, 60))
    }
  }

  // All sedentary — cap at 60 (we only computed against the last hour)
  return 60
}

/**
 * % change in unlock rate over the last 60 minutes vs the user's
 * recent daily average. Positive values = unlocking more than usual
 * (compulsive checking signal).
 *
 * Returns 0 when daily average is too small to be meaningful (< 1 per
 * hour) to avoid div-by-zero / noise.
 */
export function computeUnlockRateDelta(
  unlockSamples: RawHealthSample[],
  dailyAvg: number,
): number {
  if (!Number.isFinite(dailyAvg) || dailyAvg < 1) return 0

  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000

  const recentUnlocks = unlockSamples.filter(
    (s) =>
      s.kind === 'unlock' &&
      s.capturedAt.getTime() >= oneHourAgo &&
      s.capturedAt.getTime() <= now,
  ).length

  // dailyAvg is unlocks-per-hour averaged across the user's recent days
  return ((recentUnlocks - dailyAvg) / dailyAvg) * 100
}

// =====================================================================
// Contextual
// =====================================================================

/**
 * Classify the user's current location.
 *
 * For now the iOS app does the heavy lifting: it knows the user's
 * home/kitchen/work geofences (configured in onboarding) and ships an
 * already-classified `kind` in the ingest payload. This function exists
 * so the server can defensively normalize / fallback when iOS isn't
 * sure.
 *
 * Returns `'unknown'` if input is missing or unrecognized. We never
 * persist a raw lat/lng on the SignalCluster — PII discipline.
 */
export function classifyLocation(
  geofence: LocationInput | null | undefined,
): 'home' | 'kitchen' | 'work' | 'unknown' {
  if (!geofence) return 'unknown'
  const k = geofence.kind
  if (k === 'home' || k === 'kitchen' || k === 'work') return k
  return 'unknown'
}

/**
 * Derive a weekday-stress level from meeting density and day-of-week.
 *
 * The heuristic: weekday + lots of meetings => high stress.
 * Weekday + few meetings, OR weekend => lower stress unless meeting
 * count is unusually elevated (a Saturday with 4+ meetings is its own
 * red flag).
 *
 * `dayOfWeek` follows JS `Date.getDay()` — 0 = Sunday … 6 = Saturday.
 */
export function classifyWeekdayStress(
  meetingDensity: number | null | undefined,
  dayOfWeek: number,
): 'high' | 'medium' | 'low' {
  const m = typeof meetingDensity === 'number' ? meetingDensity : 0
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isWeekend) {
    if (m >= 4) return 'high' // unusual; flag it
    if (m >= 1) return 'medium'
    return 'low'
  }

  // Weekday
  if (m >= 6) return 'high'
  if (m >= 3) return 'medium'
  return 'low'
}

// =====================================================================
// Small utils
// =====================================================================

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    const a = sorted[mid - 1] ?? 0
    const b = sorted[mid] ?? 0
    return (a + b) / 2
  }
  return sorted[mid] ?? 0
}
