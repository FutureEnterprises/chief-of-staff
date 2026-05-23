/**
 * Cohort retention computation — used by the /admin/retention dashboard
 * (point-in-time live values) and by the retention-snapshot cron (daily
 * historical record so the dashboard can show trend).
 *
 * Cohort definitions (cohort registered (S - earlier, S - later], active in (S - later, S]):
 *
 *   D1  — cohort: registered (S-2d, S-1d];  active in (S-1d, S]
 *   D7  — cohort: registered (S-14d, S-7d]; active in (S-7d, S]
 *   D14 — cohort: registered (S-28d, S-14d]; active in (S-14d, S]
 *   D30 — cohort: registered (S-60d, S-30d]; active in (S-30d, S]
 *
 * Per the founder action master list: cohorts smaller than ~20 are
 * noisy. The dashboard surfaces a "low-signal" tag below that floor so
 * point-in-time jumps don't trigger reactive change.
 */
import { prisma } from '@repo/database'

const DAY_MS = 24 * 60 * 60 * 1000

export type CohortKind = 'D1' | 'D7' | 'D14' | 'D30'

export type CohortMetric = {
  cohortKind: CohortKind
  cohortStartAt: Date
  cohortEndAt: Date
  cohortSize: number
  retainedCount: number
  retentionPct: number | null
  lowSignal: boolean
  asOf: Date
}

const COHORT_CONFIG: Record<
  CohortKind,
  { registeredDaysAgoStart: number; registeredDaysAgoEnd: number; activeWindowDays: number }
> = {
  D1: { registeredDaysAgoStart: 2, registeredDaysAgoEnd: 1, activeWindowDays: 1 },
  D7: { registeredDaysAgoStart: 14, registeredDaysAgoEnd: 7, activeWindowDays: 7 },
  D14: { registeredDaysAgoStart: 28, registeredDaysAgoEnd: 14, activeWindowDays: 14 },
  D30: { registeredDaysAgoStart: 60, registeredDaysAgoEnd: 30, activeWindowDays: 30 },
}

const LOW_SIGNAL_THRESHOLD = 20

/**
 * Compute a single cohort metric as-of the given timestamp. `asOf`
 * defaults to "now" — for the daily snapshot cron, pass a stable
 * timestamp (UTC midnight) so two runs on the same day produce the
 * same answer.
 */
export async function computeCohortMetric(
  kind: CohortKind,
  asOf: Date = new Date(),
): Promise<CohortMetric> {
  const cfg = COHORT_CONFIG[kind]
  const cohortStartAt = new Date(asOf.getTime() - cfg.registeredDaysAgoStart * DAY_MS)
  const cohortEndAt = new Date(asOf.getTime() - cfg.registeredDaysAgoEnd * DAY_MS)
  const activeWindowStart = cohortEndAt
  // active by definition = lastActiveAt >= activeWindowStart && <= asOf

  const cohortSize = await prisma.user.count({
    where: {
      onboardingCompleted: true,
      createdAt: { gte: cohortStartAt, lt: cohortEndAt },
    },
  })

  const retainedCount = await prisma.user.count({
    where: {
      onboardingCompleted: true,
      createdAt: { gte: cohortStartAt, lt: cohortEndAt },
      lastActiveAt: { gte: activeWindowStart, lte: asOf },
    },
  })

  const retentionPct =
    cohortSize > 0 ? Number(((retainedCount / cohortSize) * 100).toFixed(1)) : null

  return {
    cohortKind: kind,
    cohortStartAt,
    cohortEndAt,
    cohortSize,
    retainedCount,
    retentionPct,
    lowSignal: cohortSize < LOW_SIGNAL_THRESHOLD,
    asOf,
  }
}

/** All four cohort kinds, computed live. Used by /admin/retention. */
export async function computeAllCohorts(asOf: Date = new Date()): Promise<CohortMetric[]> {
  return Promise.all(
    (['D1', 'D7', 'D14', 'D30'] as CohortKind[]).map((k) => computeCohortMetric(k, asOf)),
  )
}

/**
 * Persist a cohort metric as a daily snapshot. Idempotent on
 * (snapshotDate, cohortKind) — re-runs overwrite. Used by the
 * retention-snapshot cron.
 */
export async function persistCohortSnapshot(metric: CohortMetric): Promise<void> {
  // Normalize snapshotDate to UTC date-only (00:00) so multiple calls
  // within a single UTC day map to one row.
  const snapshotDate = new Date(
    Date.UTC(
      metric.asOf.getUTCFullYear(),
      metric.asOf.getUTCMonth(),
      metric.asOf.getUTCDate(),
    ),
  )

  await prisma.retentionSnapshot.upsert({
    where: {
      snapshotDate_cohortKind: {
        snapshotDate,
        cohortKind: metric.cohortKind,
      },
    },
    create: {
      snapshotDate,
      cohortKind: metric.cohortKind,
      cohortSize: metric.cohortSize,
      retainedCount: metric.retainedCount,
      retentionPct: metric.retentionPct ?? 0,
      cohortStartAt: metric.cohortStartAt,
      cohortEndAt: metric.cohortEndAt,
    },
    update: {
      cohortSize: metric.cohortSize,
      retainedCount: metric.retainedCount,
      retentionPct: metric.retentionPct ?? 0,
      cohortStartAt: metric.cohortStartAt,
      cohortEndAt: metric.cohortEndAt,
    },
  })
}

/** Read the last N days of snapshots for a single cohort. Trend chart input. */
export async function readCohortTrend(
  kind: CohortKind,
  days: number = 30,
): Promise<Array<{ date: Date; cohortSize: number; retainedCount: number; retentionPct: number }>> {
  const cutoff = new Date(Date.now() - days * DAY_MS)
  const rows = await prisma.retentionSnapshot.findMany({
    where: {
      cohortKind: kind,
      snapshotDate: { gte: cutoff },
    },
    orderBy: { snapshotDate: 'asc' },
    select: {
      snapshotDate: true,
      cohortSize: true,
      retainedCount: true,
      retentionPct: true,
    },
  })
  return rows.map((r) => ({
    date: r.snapshotDate,
    cohortSize: r.cohortSize,
    retainedCount: r.retainedCount,
    retentionPct: r.retentionPct,
  }))
}
