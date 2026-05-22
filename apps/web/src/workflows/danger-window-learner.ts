/**
 * Danger-window learner — durable workflow.
 *
 * Replaces the best-effort cron at /api/cron/danger-window-learner
 * with a Workflow DevKit workflow. Each paginated batch becomes a
 * retryable step. A crashed batch resumes; a transient DB blip no
 * longer drops the whole pass.
 *
 * Why this cron first: it powers the danger-window histogram model
 * surfaced on /how-coyl-knows-you and consumed by the precision
 * interrupt cron. Flaky retries = stale predictions = the moat claim
 * degrades. Durable retries lock the model in.
 *
 * Structure:
 *   - "use workflow" function orchestrates the pagination loop
 *   - "use step" functions do all DB work (workflow sandbox forbids
 *     prisma at the orchestration layer)
 *
 * Batch granularity matches the original cron's PAGE_SIZE = 200, so
 * a 5K-user pass is ~25 steps — small enough to track per-batch,
 * large enough to avoid step-fanout overhead at every user.
 *
 * Triggered via /api/cron/danger-window-learner (the existing cron
 * route, now a thin shim that calls `start(handleDangerWindowLearner)`).
 */
import { prisma } from '@repo/database'

const PAGE_SIZE = 200
const LOOKBACK_DAYS = 30
const MIN_SLIPS_FOR_PATTERN = 3
const MIN_SLOT_COUNT = 2
const MAX_LEARNED_WINDOWS_PER_USER = 3

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type DayKey = (typeof DAY_KEYS)[number]

export type DangerWindowLearnerResult = {
  processed: number
  updated: number
  skippedInsufficient: number
  errors: number
  cutoffDays: number
}

/**
 * Workflow entry point. Loops through paginated user batches. Each
 * batch is a step → independently retried on failure → the loop
 * resumes from the persisted cursor across crashes.
 */
export async function handleDangerWindowLearner(): Promise<DangerWindowLearnerResult> {
  'use workflow'

  let cursor: string | undefined
  let processed = 0
  let updated = 0
  let skippedInsufficient = 0
  let errors = 0

  while (true) {
    const result: BatchResult = await processBatch(cursor)
    processed += result.processed
    updated += result.updated
    skippedInsufficient += result.skippedInsufficient
    errors += result.errors

    if (!result.nextCursor) break
    cursor = result.nextCursor
  }

  await recordHeartbeat({
    processed,
    updated,
    skippedInsufficient,
    errors,
    cutoffDays: LOOKBACK_DAYS,
  })

  return {
    processed,
    updated,
    skippedInsufficient,
    errors,
    cutoffDays: LOOKBACK_DAYS,
  }
}

type BatchResult = {
  processed: number
  updated: number
  skippedInsufficient: number
  errors: number
  nextCursor?: string
}

async function processBatch(cursor: string | undefined): Promise<BatchResult> {
  'use step'

  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

  const users: Array<{
    id: string
    timezone: string
    dangerWindows: unknown
    slipRecords: Array<{ createdAt: Date }>
  }> = await prisma.user.findMany({
    where: {
      onboardingCompleted: true,
      slipRecords: { some: { createdAt: { gte: cutoff } } },
    },
    select: {
      id: true,
      timezone: true,
      dangerWindows: true,
      slipRecords: {
        where: { createdAt: { gte: cutoff } },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    take: PAGE_SIZE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: 'asc' },
  })

  if (users.length === 0) {
    return {
      processed: 0,
      updated: 0,
      skippedInsufficient: 0,
      errors: 0,
    }
  }

  let processed = 0
  let updated = 0
  let skippedInsufficient = 0
  let errors = 0

  for (const user of users) {
    processed++

    if (user.slipRecords.length < MIN_SLIPS_FOR_PATTERN) {
      skippedInsufficient++
      continue
    }

    try {
      const learned = computeDangerWindows(
        user.slipRecords.map((s) => s.createdAt),
        user.timezone || 'UTC',
      )
      const healthStats = await computeHealthCorrelations(
        user.id,
        user.slipRecords.map((s) => s.createdAt),
        cutoff,
      )

      if (Object.keys(learned).length === 0 && !healthStats) {
        skippedInsufficient++
        continue
      }

      const merged = mergeWithExisting(user.dangerWindows, learned)
      if (healthStats) {
        ;(merged as Record<string, unknown>)._health = healthStats
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { dangerWindows: merged },
      })
      updated++
    } catch (err) {
      errors++
      console.error('[danger-window-learner] user', user.id, err)
    }
  }

  return {
    processed,
    updated,
    skippedInsufficient,
    errors,
    nextCursor:
      users.length === PAGE_SIZE ? users[users.length - 1]!.id : undefined,
  }
}

async function recordHeartbeat(stats: {
  processed: number
  updated: number
  skippedInsufficient: number
  errors: number
  cutoffDays: number
}): Promise<void> {
  'use step'

  await prisma.cronHeartbeat.upsert({
    where: { name: 'danger-window-learner' },
    create: {
      name: 'danger-window-learner',
      lastRunAt: new Date(),
      lastRunMeta: stats,
    },
    update: {
      lastRunAt: new Date(),
      lastRunMeta: stats,
    },
  })
}

/** Histogram (day-of-week × hour) → top peak slots as 2-hour windows. */
function computeDangerWindows(
  timestamps: Date[],
  timezone: string,
): Record<DayKey, string[]> {
  const slots = new Map<
    string,
    { day: DayKey; hour: number; count: number }
  >()

  for (const ts of timestamps) {
    let local: Date
    try {
      local = new Date(ts.toLocaleString('en-US', { timeZone: timezone }))
    } catch {
      local = ts
    }
    const day = DAY_KEYS[local.getDay()]
    if (!day) continue
    const hour = local.getHours()
    const key = `${day}-${hour}`
    const existing = slots.get(key)
    if (existing) {
      existing.count++
    } else {
      slots.set(key, { day, hour, count: 1 })
    }
  }

  const sorted = [...slots.values()]
    .filter((s) => s.count >= MIN_SLOT_COUNT)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_LEARNED_WINDOWS_PER_USER)

  const out: Record<DayKey, string[]> = {
    sun: [],
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
  }
  for (const slot of sorted) {
    const start = Math.max(0, slot.hour)
    const end = Math.min(23, slot.hour + 2)
    const range = `${pad(start)}:00-${pad(end)}:00`
    if (!out[slot.day].includes(range)) {
      out[slot.day].push(range)
    }
  }

  const result: Record<DayKey, string[]> = {} as Record<DayKey, string[]>
  for (const day of DAY_KEYS) {
    if (out[day].length > 0) result[day] = out[day]
  }
  return result
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function mergeWithExisting(
  existing: unknown,
  learned: Record<DayKey, string[]>,
): Record<string, string[]> {
  const base: Record<string, string[]> = {}

  if (existing && typeof existing === 'object') {
    for (const [k, v] of Object.entries(existing as Record<string, unknown>)) {
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
        base[k] = v as string[]
      }
    }
  }

  for (const day of DAY_KEYS) {
    if (learned[day] && learned[day].length > 0) {
      base[day] = learned[day]
    }
  }

  return base
}

async function computeHealthCorrelations(
  userId: string,
  slipTimestamps: Date[],
  cutoff: Date,
): Promise<
  | {
      sampleN: number
      avgSleepHours: number | null
      medianSteps: number | null
      slipsAfterLowSleep: number
      slipsAfterLowSteps: number
      totalSlips: number
      lastUpdatedAt: string
    }
  | null
> {
  type HealthMeta = {
    date?: string
    metrics?: { steps?: number; sleepHours?: number }
  }

  const events = await prisma.productivityEvent
    .findMany({
      where: {
        userId,
        eventType: 'FEATURE_USED',
        eventValue: { startsWith: 'health_' },
        createdAt: { gte: cutoff },
      },
      select: { createdAt: true, metadataJson: true },
      orderBy: { createdAt: 'desc' },
    })
    .catch(() => [])

  if (events.length < 7) return null

  const byDay = new Map<string, { sleepHours?: number; steps?: number }>()
  const sleepValues: number[] = []
  const stepValues: number[] = []

  for (const ev of events) {
    const meta = ev.metadataJson as HealthMeta | null
    if (!meta) continue
    const dateKey = (meta.date || ev.createdAt.toISOString()).slice(0, 10)
    const existing = byDay.get(dateKey) ?? {}
    if (typeof meta.metrics?.sleepHours === 'number') {
      existing.sleepHours = meta.metrics.sleepHours
      sleepValues.push(meta.metrics.sleepHours)
    }
    if (typeof meta.metrics?.steps === 'number') {
      existing.steps = meta.metrics.steps
      stepValues.push(meta.metrics.steps)
    }
    byDay.set(dateKey, existing)
  }

  const avgSleepHours =
    sleepValues.length > 0
      ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
      : null
  const medianSteps =
    stepValues.length > 0
      ? [...stepValues].sort((a, b) => a - b)[
          Math.floor(stepValues.length / 2)
        ]!
      : null

  const LOW_SLEEP = 6
  const lowStepsThreshold = medianSteps !== null ? medianSteps * 0.5 : null

  let slipsAfterLowSleep = 0
  let slipsAfterLowSteps = 0
  for (const slipAt of slipTimestamps) {
    const slipDay = slipAt.toISOString().slice(0, 10)
    const prevDay = new Date(slipAt.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    const dayMetrics = byDay.get(slipDay) ?? byDay.get(prevDay)
    if (!dayMetrics) continue
    if (
      typeof dayMetrics.sleepHours === 'number' &&
      dayMetrics.sleepHours < LOW_SLEEP
    ) {
      slipsAfterLowSleep++
    }
    if (
      lowStepsThreshold !== null &&
      typeof dayMetrics.steps === 'number' &&
      dayMetrics.steps < lowStepsThreshold
    ) {
      slipsAfterLowSteps++
    }
  }

  return {
    sampleN: events.length,
    avgSleepHours:
      avgSleepHours !== null ? Number(avgSleepHours.toFixed(2)) : null,
    medianSteps,
    slipsAfterLowSleep,
    slipsAfterLowSteps,
    totalSlips: slipTimestamps.length,
    lastUpdatedAt: new Date().toISOString(),
  }
}
