/**
 * SignalCluster assembly + persistence.
 *
 * A SignalCluster is the multivariate snapshot of *what we see right
 * now* — HRV state, motion state, unlock state, location, time, meeting
 * load. The cluster is built immediately after a HealthKit batch lands
 * and (eventually) labeled retroactively when we observe whether a slip
 * occurred within 30/60 minutes.
 *
 * Layer 1 of the "Honest Gap" architecture: the substrate the predictive
 * model trains on.
 */
import { prisma, type SignalCluster } from '@repo/database'
import {
  classifyLocation,
  classifyWeekdayStress,
  computeHRVBaseline,
  computeHRVDelta,
  computeSedentaryMins,
  computeUnlockRateDelta,
  type LocationInput,
  type RawHealthSample,
} from './health-signals'

const ONE_HOUR_MS = 60 * 60 * 1000
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

// =====================================================================
// Build
// =====================================================================

export type BuildClusterContext = {
  /** Override "now" for testing or replay */
  now?: Date
  /** iOS-resolved location classification for this moment */
  location?: LocationInput | null
}

/**
 * Gather the last 60 minutes of raw health samples for `userId`,
 * compute every derived signal, and persist a fresh SignalCluster row.
 *
 * Best-effort: callers should `.catch()` and not block the user request
 * on cluster construction. If we can't compute anything meaningful
 * (no samples, no baseline), we still write a contextual row — the
 * day-of-week / hour-of-day / location-kind dimensions are useful on
 * their own for the prediction model.
 */
export async function buildSignalCluster(
  userId: string,
  ctx: BuildClusterContext = {},
): Promise<SignalCluster> {
  const now = ctx.now ?? new Date()
  const since = new Date(now.getTime() - ONE_HOUR_MS)

  // Pull raw samples — last hour only. Cluster represents moment T.
  const events = await prisma.productivityEvent.findMany({
    where: {
      userId,
      eventType: 'FEATURE_USED',
      createdAt: { gte: since, lte: now },
    },
    select: { metadataJson: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  const samples: RawHealthSample[] = []
  for (const e of events) {
    const m = e.metadataJson as Record<string, unknown> | null | undefined
    if (!m || m.type !== 'health_sample') continue
    const kind = m.kind
    const valueNumeric =
      typeof m.valueNumeric === 'number' ? m.valueNumeric : null
    if (
      (kind === 'hrv' ||
        kind === 'steps' ||
        kind === 'sedentary' ||
        kind === 'sleep' ||
        kind === 'unlock' ||
        kind === 'screen_on') &&
      valueNumeric != null
    ) {
      samples.push({
        kind,
        valueNumeric,
        valueText: typeof m.valueText === 'string' ? m.valueText : null,
        capturedAt: e.createdAt,
      })
    }
  }

  // HRV
  const baseline = await computeHRVBaseline(userId)
  const hrvDelta = computeHRVDelta(samples, baseline)
  const hrvSamples = samples
    .filter((s) => s.kind === 'hrv')
    .slice(0, 30)
    .map((s) => ({
      v: s.valueNumeric,
      t: s.capturedAt.toISOString(),
    }))

  // Behavioral
  const sedentaryMins = computeSedentaryMins(samples, now)
  const dailyAvgUnlocks = await computeRecentUnlockHourlyAverage(userId, now)
  const unlockRateDelta = computeUnlockRateDelta(samples, dailyAvgUnlocks)
  const screenOnMins = computeScreenOnMins(samples, now)

  // Contextual
  const locationKind = classifyLocation(ctx.location ?? null)
  const dayOfWeek = now.getDay()
  const hourOfDay = now.getHours()
  const meetingDensity = await countMeetingsToday(userId, now)
  const weekdayStress = classifyWeekdayStress(meetingDensity, dayOfWeek)

  const cluster = await prisma.signalCluster.create({
    data: {
      userId,
      capturedAt: now,
      hrvSamples: hrvSamples.length > 0 ? hrvSamples : undefined,
      hrvBaseline: baseline ?? undefined,
      hrvDeltaPct: hrvDelta ?? undefined,
      sedentaryMins,
      unlockRateDelta,
      screenOnMins,
      locationKind,
      dayOfWeek,
      hourOfDay,
      meetingDensity,
      weekdayStress,
    },
  })

  return cluster
}

// =====================================================================
// Retroactive outcome resolution
// =====================================================================

/**
 * Set the outcome label on a previously-recorded cluster.
 *
 * Called by a future cron that scans for unresolved clusters where the
 * 30- or 60-minute window has elapsed. The cron looks at whether a
 * SlipRecord (or other slip signal) was created within the window and
 * calls this with the appropriate label.
 *
 * Both windows can be resolved independently — a slip at T+45 only
 * sets the 60-min outcome to 'slip' and the 30-min outcome to
 * 'no_slip'. Caller decides which window(s) to update.
 */
export async function resolveClusterOutcome(
  clusterId: string,
  slipOccurred: boolean,
  window: '30' | '60',
): Promise<void> {
  const label = slipOccurred ? 'slip' : 'no_slip'
  const data: {
    outcomeWithin30Min?: string
    outcomeWithin60Min?: string
    outcomeRecordedAt: Date
  } = { outcomeRecordedAt: new Date() }

  if (window === '30') data.outcomeWithin30Min = label
  else data.outcomeWithin60Min = label

  await prisma.signalCluster.update({
    where: { id: clusterId },
    data,
  })
}

// =====================================================================
// Read
// =====================================================================

/**
 * Most recent cluster for `userId` that's still within the 60-minute
 * "active" window. Returns null if the user has no recent cluster — the
 * caller should either build one or fall back to a less-informed
 * prediction.
 */
export async function getActiveCluster(
  userId: string,
): Promise<SignalCluster | null> {
  const since = new Date(Date.now() - ONE_HOUR_MS)
  return prisma.signalCluster.findFirst({
    where: { userId, capturedAt: { gte: since } },
    orderBy: { capturedAt: 'desc' },
  })
}

// =====================================================================
// Internal helpers — derived signals that need DB access
// =====================================================================

/**
 * Average unlocks-per-hour over the last 7 days, used as the
 * denominator for `unlockRateDelta`. Cheap rolling estimate, not a
 * real moving average — good enough for a multiplicative signal.
 */
async function computeRecentUnlockHourlyAverage(
  userId: string,
  now: Date,
): Promise<number> {
  const since = new Date(now.getTime() - SEVEN_DAYS_MS)

  const events = await prisma.productivityEvent.findMany({
    where: {
      userId,
      eventType: 'FEATURE_USED',
      createdAt: { gte: since, lte: now },
    },
    select: { metadataJson: true },
    take: 5000,
  })

  let unlockCount = 0
  for (const e of events) {
    const m = e.metadataJson as Record<string, unknown> | null | undefined
    if (m && m.type === 'health_sample' && m.kind === 'unlock') unlockCount++
  }

  // 7 days * 24 hours = 168 hours
  return unlockCount / 168
}

/**
 * Continuous screen-on minutes in the current window. Reads from
 * `screen_on` samples whose valueNumeric represents minutes-on for the
 * captured interval. Aggregates the last hour.
 */
function computeScreenOnMins(
  samples: RawHealthSample[],
  now: Date,
): number {
  const oneHourAgo = now.getTime() - ONE_HOUR_MS
  let total = 0
  for (const s of samples) {
    if (s.kind !== 'screen_on') continue
    if (s.capturedAt.getTime() < oneHourAgo) continue
    if (s.capturedAt.getTime() > now.getTime()) continue
    if (Number.isFinite(s.valueNumeric) && s.valueNumeric > 0) {
      total += s.valueNumeric
    }
  }
  return Math.min(60, Math.round(total))
}

/**
 * Best-effort count of "meetings today" for the user. We don't have a
 * dedicated calendar table yet — for now, treat any Task scheduled to
 * start between 00:00 and 23:59 of the user's *server-local* day with
 * a `meeting` or `calendar` tag as a meeting. If we can't infer
 * anything, returns 0 (which `classifyWeekdayStress` handles safely).
 *
 * When a dedicated calendar integration lands, swap this out for a
 * direct count against the CalendarEvent table.
 */
async function countMeetingsToday(userId: string, now: Date): Promise<number> {
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const count = await prisma.task.count({
    where: {
      userId,
      dueAt: { gte: startOfDay, lt: endOfDay },
      tags: { some: { tag: { name: { in: ['meeting', 'calendar'] } } } },
    },
  })
  return count
}
