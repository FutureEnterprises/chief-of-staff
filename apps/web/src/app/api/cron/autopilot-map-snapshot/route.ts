import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { prisma } from '@repo/database'
import type { PrimaryWedge } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import { recordHeartbeat } from '@/lib/cron-heartbeat'
import { batchProcess } from '@/lib/batch'

export const maxDuration = 300

const PAGE_SIZE = 200
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_WEEK_MS = 7 * ONE_DAY_MS

/**
 * Weekly Autopilot Map snapshot — runs Monday 06:00 UTC.
 *
 * Produces the four-card "Spotify Wrapped for self-sabotage" artifact
 * promised by the /autopilot-map marketing page. One row per user per
 * ISO week, keyed on (userId, weekStart). Re-running is idempotent —
 * upsert preserves the existing shareSlug so any URL already in the
 * wild keeps resolving.
 *
 * Cards rendered from this row:
 *   1. Top excuse this week        — topExcuse + topExcuseCount
 *   2. Peak danger window          — peakWindowLabel + peakWindowSlips
 *   3. Recovery streak             — slipsThisWeek + recoveredCount + recoveryRate
 *   4. Pattern signature sentence  — patternSignature
 *
 * The cron summarizes the week JUST ENDED — when it fires at Mon 06:00,
 * weekStart is the previous Monday 00:00 UTC and weekEnd is today's
 * Monday 00:00 UTC. The user wakes up Monday morning to "your week."
 *
 * Eligibility: onboardingCompleted=true AND lastActiveAt within 30d.
 * Inactive users get no snapshot — there's nothing to summarize and
 * we don't want to email or notify dormant accounts.
 *
 * Per-user signal gate: at least one ProductivityEvent in the week.
 * Otherwise skip — empty cards are worse than no cards.
 *
 * Failure isolation: each user is wrapped in try/catch and processed
 * through batchProcess. One failure does not fail the cron.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const now = new Date()
  const { weekStart, weekEnd } = computeLastWeekRange(now)
  const weekLabel = formatWeekLabel(weekStart)
  const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS)

  let snapshotted = 0
  let skipped = 0
  let failed = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        lastActiveAt: { gte: activeSince },
      },
      select: {
        id: true,
        primaryWedge: true,
      },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (users.length === 0) break

    await batchProcess(users, async (user) => {
      try {
        // Signal gate: any productivity event in the week. If the user
        // generated zero events we have nothing to summarize.
        const eventCount = await prisma.productivityEvent.count({
          where: {
            userId: user.id,
            createdAt: { gte: weekStart, lt: weekEnd },
          },
        })
        if (eventCount === 0) {
          skipped++
          return
        }

        // Parallel aggregation reads — all scoped to this user + week.
        const [excuseGroups, slips] = await Promise.all([
          prisma.excuse.groupBy({
            by: ['category'],
            where: {
              userId: user.id,
              createdAt: { gte: weekStart, lt: weekEnd },
            },
            _count: true,
          }),
          prisma.slipRecord.findMany({
            where: {
              userId: user.id,
              createdAt: { gte: weekStart, lt: weekEnd },
            },
            select: { createdAt: true, recoveredAt: true },
            // Cap at a sane upper bound — most users will have <20 slips
            // in a week; the cap is just a defense against runaway rows.
            take: 500,
          }),
        ])

        // ---- Card 1: top excuse this week ----
        const topExcuseEntry = excuseGroups.sort(
          (a, b) => b._count - a._count,
        )[0]
        const topExcuse = topExcuseEntry?.category ?? null
        const topExcuseCount = topExcuseEntry?._count ?? null

        // ---- Card 2: peak danger window (day-of-week x hour bucket) ----
        // Bucket slips by (dayOfWeek, hour) in UTC. Hours are grouped
        // into two-hour windows so a single late slip doesn't create a
        // one-hour-wide "peak" — the share card is more readable as a
        // small window like "Wed 9-11 PM".
        const peak = computePeakWindow(slips.map((s) => s.createdAt))

        // ---- Card 3: recovery streak ----
        const slipsThisWeek = slips.length
        const recoveredCount = slips.reduce((acc, s) => {
          if (!s.recoveredAt) return acc
          const within24h =
            s.recoveredAt.getTime() - s.createdAt.getTime() <= ONE_DAY_MS
          return within24h ? acc + 1 : acc
        }, 0)
        const recoveryRate =
          slipsThisWeek > 0
            ? Math.round((recoveredCount / slipsThisWeek) * 100)
            : null

        // ---- Card 4: pattern signature ----
        const patternSignature = buildPatternSignature({
          wedge: user.primaryWedge,
          peakLabel: peak?.label ?? null,
          slipsThisWeek,
          recoveredCount,
        })

        // Upsert by (userId, weekStart). On UPDATE we deliberately do
        // NOT overwrite shareSlug or publishedAt — any link already in
        // the wild keeps resolving, and "published" should reflect the
        // first publish time, not the most recent re-aggregation.
        const newShareSlug = randomBytes(8).toString('hex')
        await prisma.autopilotMapSnapshot.upsert({
          where: {
            userId_weekStart: {
              userId: user.id,
              weekStart,
            },
          },
          create: {
            userId: user.id,
            weekStart,
            weekLabel,
            topExcuse,
            topExcuseCount,
            peakWindowLabel: peak?.label ?? null,
            peakWindowSlips: peak?.count ?? null,
            slipsThisWeek,
            recoveredCount,
            recoveryRate,
            patternSignature,
            shareSlug: newShareSlug,
          },
          update: {
            weekLabel,
            topExcuse,
            topExcuseCount,
            peakWindowLabel: peak?.label ?? null,
            peakWindowSlips: peak?.count ?? null,
            slipsThisWeek,
            recoveredCount,
            recoveryRate,
            patternSignature,
            // shareSlug, publishedAt intentionally omitted — preserve.
          },
        })

        snapshotted++
      } catch (err) {
        failed++
        console.warn(
          '[autopilot-map-snapshot] Failed for user %s: %s',
          user.id,
          (err as Error).message,
        )
      }
    })

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  await recordHeartbeat('autopilot-map-snapshot', {
    snapshotted,
    skipped,
    failed,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    weekLabel,
  })

  return NextResponse.json({
    snapshotted,
    skipped,
    failed,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    weekLabel,
    timestamp: now.toISOString(),
  })
}

/**
 * Compute the (weekStart, weekEnd) of the week JUST ENDED in UTC.
 *
 * weekStart = Monday 00:00:00 UTC of the previous ISO week
 * weekEnd   = Monday 00:00:00 UTC of the current ISO week (exclusive)
 *
 * When the cron fires at Mon 06:00 UTC, "current week" started 6 hours
 * ago and the previous Monday is exactly 7 days before that.
 */
function computeLastWeekRange(now: Date): { weekStart: Date; weekEnd: Date } {
  // getUTCDay() returns 0 (Sun) .. 6 (Sat). Shift so Mon=0 .. Sun=6.
  const dayIdx = (now.getUTCDay() + 6) % 7
  const currentWeekStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - dayIdx,
      0,
      0,
      0,
      0,
    ),
  )
  const weekStart = new Date(currentWeekStart.getTime() - ONE_WEEK_MS)
  const weekEnd = currentWeekStart
  return { weekStart, weekEnd }
}

/**
 * "Week of May 19" — short, human-readable, no year (matches the
 * marketing-page register: it's a Wrapped artifact, not a tax form).
 */
function formatWeekLabel(weekStart: Date): string {
  const month = weekStart.toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  })
  const day = weekStart.getUTCDate()
  return `Week of ${month} ${day}`
}

/**
 * Find the busiest two-hour window across the week, expressed as
 * "Wed 9-11 PM". Returns null if there are no slips.
 *
 * Bucketing: group slip timestamps by (dayOfWeek, hourBucket) where
 * hourBucket = floor(hour/2) * 2. A single isolated slip can still win
 * the peak — that's intentional. If you slipped once this week, that's
 * still your peak window.
 */
function computePeakWindow(timestamps: Date[]): {
  label: string
  count: number
} | null {
  if (timestamps.length === 0) return null

  const counts = new Map<string, { day: number; hour: number; n: number }>()
  for (const ts of timestamps) {
    const day = ts.getUTCDay() // 0=Sun..6=Sat
    const hour = Math.floor(ts.getUTCHours() / 2) * 2 // 0,2,4,...,22
    const key = `${day}:${hour}`
    const prev = counts.get(key)
    if (prev) {
      prev.n++
    } else {
      counts.set(key, { day, hour, n: 1 })
    }
  }

  let best: { day: number; hour: number; n: number } | null = null
  for (const entry of counts.values()) {
    if (!best || entry.n > best.n) best = entry
  }
  if (!best) return null

  return {
    label: formatWindowLabel(best.day, best.hour),
    count: best.n,
  }
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatWindowLabel(day: number, hour: number): string {
  const dayLabel = DAY_LABELS[day] ?? 'Day'
  const endHour = hour + 2
  return `${dayLabel} ${formatHour(hour)}-${formatHour(endHour)}`
}

function formatHour(h: number): string {
  // Normalize 24 → 12 AM for the closing edge of a 22-24 window.
  const normalized = h === 24 ? 0 : h
  const period = normalized < 12 ? 'AM' : 'PM'
  const display = normalized % 12 === 0 ? 12 : normalized % 12
  return `${display} ${period}`
}

/**
 * Build the pattern-signature sentence deterministically from the
 * user's primary wedge + the peak window + their recovery numbers.
 * Same inputs always yield the same string — no LLM, no randomness.
 *
 * Format: "<Archetype>: <slips> <wedge-noun> slips, <recovered> recovered"
 *   e.g. "9 PM Negotiator: 4 night-fridge slips, 3 recovered"
 *
 * Falls back to a wedge-only sentence when there are no slips this
 * week — the snapshot can still ship a positive Card 4.
 */
function buildPatternSignature(opts: {
  wedge: PrimaryWedge
  peakLabel: string | null
  slipsThisWeek: number
  recoveredCount: number
}): string {
  const { wedge, peakLabel, slipsThisWeek, recoveredCount } = opts
  const archetype = peakLabel
    ? archetypeForWindow(peakLabel)
    : archetypeForWedge(wedge)
  const noun = slipNounForWedge(wedge)

  if (slipsThisWeek === 0) {
    return `${archetype}: clean week, no slips logged.`
  }
  return `${archetype}: ${slipsThisWeek} ${noun} slip${
    slipsThisWeek === 1 ? '' : 's'
  }, ${recoveredCount} recovered.`
}

/**
 * Map a peak-window label like "Wed 9-11 PM" to a short archetype name.
 * Deterministic — same window always produces the same archetype.
 */
function archetypeForWindow(peakLabel: string): string {
  // Extract leading hour from "<Day> <H> <period>-..."
  const match = peakLabel.match(/^(\w{3}) (\d{1,2}) (AM|PM)/)
  if (!match) return 'Pattern Holder'
  const [, , hourStr, period] = match
  const hourNum = parseInt(hourStr ?? '0', 10)
  const hour24 =
    period === 'PM'
      ? hourNum === 12
        ? 12
        : hourNum + 12
      : hourNum === 12
        ? 0
        : hourNum
  if (hour24 >= 21 || hour24 < 4) return `${hourNum} ${period} Negotiator`
  if (hour24 >= 17) return `${hourNum} ${period} Decompresser`
  if (hour24 >= 13) return `${hourNum} ${period} Drifter`
  if (hour24 >= 9) return `${hourNum} ${period} Stall`
  return `${hourNum} ${period} Snoozer`
}

function archetypeForWedge(wedge: PrimaryWedge): string {
  switch (wedge) {
    case 'WEIGHT_LOSS':
      return 'Weigh-In Avoider'
    case 'CRAVINGS':
      return 'Urge Surfer'
    case 'DESTRUCTIVE_BEHAVIORS':
      return 'Loop Runner'
    case 'CONSISTENCY':
      return 'Monday Resetter'
    case 'SPENDING':
      return 'Cart Filler'
    case 'FOCUS':
      return 'Tab Switcher'
    case 'PRODUCTIVITY':
    default:
      return 'Task Dodger'
  }
}

function slipNounForWedge(wedge: PrimaryWedge): string {
  switch (wedge) {
    case 'WEIGHT_LOSS':
      return 'night-fridge'
    case 'CRAVINGS':
      return 'urge'
    case 'DESTRUCTIVE_BEHAVIORS':
      return 'loop'
    case 'CONSISTENCY':
      return 'skip'
    case 'SPENDING':
      return 'impulse'
    case 'FOCUS':
      return 'distraction'
    case 'PRODUCTIVITY':
    default:
      return 'avoidance'
  }
}
