/**
 * Daily retention-snapshot cron.
 *
 * Computes D1, D7, D14, D30 cohort retention and upserts one row per
 * cohort into retention_snapshots. Idempotent on (snapshotDate,
 * cohortKind) — safe to re-run.
 *
 * Schedule: 04:00 UTC daily (after the night cron, before the morning
 * cron) — see vercel.json.
 *
 * Best-effort. If one cohort computation fails, the other three still
 * persist. Returns 200 even on partial failure so the Vercel Cron
 * dashboard doesn't enter alarm state; failures are logged + visible
 * in CronHeartbeat metadata.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import {
  computeAllCohorts,
  persistCohortSnapshot,
  type CohortKind,
  type CohortMetric,
} from '@/lib/retention'

export const maxDuration = 30

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const asOf = new Date()
  const errors: Array<{ cohort: CohortKind; message: string }> = []
  const persisted: CohortMetric[] = []

  let cohorts: CohortMetric[] = []
  try {
    cohorts = await computeAllCohorts(asOf)
  } catch (err) {
    console.error('[cron] retention-snapshot compute failed', err)
    return NextResponse.json(
      { ok: false, error: 'compute_failed' },
      { status: 200 },
    )
  }

  for (const metric of cohorts) {
    try {
      await persistCohortSnapshot(metric)
      persisted.push(metric)
    } catch (err) {
      errors.push({
        cohort: metric.cohortKind,
        message: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  await prisma.cronHeartbeat
    .upsert({
      where: { name: 'retention-snapshot' },
      create: {
        name: 'retention-snapshot',
        lastRunAt: new Date(),
        lastRunMeta: {
          asOf: asOf.toISOString(),
          persistedCount: persisted.length,
          errorCount: errors.length,
          cohorts: persisted.map((c) => ({
            kind: c.cohortKind,
            size: c.cohortSize,
            retained: c.retainedCount,
            pct: c.retentionPct,
          })),
        },
      },
      update: {
        lastRunAt: new Date(),
        lastRunMeta: {
          asOf: asOf.toISOString(),
          persistedCount: persisted.length,
          errorCount: errors.length,
          cohorts: persisted.map((c) => ({
            kind: c.cohortKind,
            size: c.cohortSize,
            retained: c.retainedCount,
            pct: c.retentionPct,
          })),
        },
      },
    })
    .catch((err) =>
      console.warn('[cron] retention-snapshot heartbeat upsert failed', err),
    )

  return NextResponse.json({
    ok: errors.length === 0,
    persistedCount: persisted.length,
    errors,
  })
}
