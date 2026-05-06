import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'

export const maxDuration = 120

const PAGE_SIZE = 200
const LOOKBACK_DAYS = 30
const MIN_SLIPS_FOR_PATTERN = 3 // need ≥3 slips total to bother computing
const MIN_SLOT_COUNT = 2 // need ≥2 slips in the same (day, hour) slot
const MAX_LEARNED_WINDOWS_PER_USER = 3

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type DayKey = typeof DAY_KEYS[number]

/**
 * Heuristic Danger-Window Learner.
 *
 * Runs daily at 03:00 UTC. For every user with onboarding complete + at
 * least MIN_SLIPS_FOR_PATTERN slips in the last LOOKBACK_DAYS days,
 * builds a (day-of-week × hour-of-day) histogram from the slip
 * timestamps converted to the user's local timezone, then writes the
 * top MAX_LEARNED_WINDOWS_PER_USER peak slots back to user.dangerWindows
 * as a JSON map of `{ "mon": ["21:00-23:00"], "sat": ["14:00-17:00"] }`.
 *
 * Why heuristic instead of ML:
 *   • At <5K active users with <30 days of slip history, an ML model
 *     overfits to noise — there isn't enough signal yet.
 *   • Histograms are interpretable: we can show users WHY their
 *     "Saturday 9pm" window was learned ("we saw you slip 3 times
 *     between Saturday 8pm and 11pm in the last month").
 *   • Heuristics are good enough to drive the precision-interrupt cron's
 *     firing schedule. Upgrade to a learned model when there's >100K
 *     slips in the system.
 *
 * Merge policy: learned windows OVERWRITE user-self-reported windows
 * for the same day-of-week. Behavioral data > self-report. Days the
 * user reported but we have no data for stay untouched. Comment in the
 * dangerWindows JSON marks which windows were learned vs reported by
 * keying them under `_learned` / `_reported` (we keep the simple flat
 * shape for backward compat — see the parser in /api/v1/user route).
 *
 * Idempotent. Safe to run repeatedly. Computes from scratch each pass
 * so a user whose pattern stops will have their learned windows fade
 * out as old slips age past the LOOKBACK_DAYS window.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

  let cursor: string | undefined
  let processed = 0
  let updated = 0
  let skippedInsufficient = 0
  let errors = 0

  // Cursor pagination so we don't load 100K users into memory at once.
  // Same pattern as the other crons in this directory.
  while (true) {
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

    if (users.length === 0) break
    cursor = users[users.length - 1]!.id

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

        if (Object.keys(learned).length === 0) {
          // No slot reached MIN_SLOT_COUNT — slips were too dispersed to
          // call a pattern. Don't touch the user's existing windows.
          skippedInsufficient++
          continue
        }

        const merged = mergeWithExisting(user.dangerWindows, learned)

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

    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({
    ok: true,
    processed,
    updated,
    skippedInsufficient,
    errors,
    cutoffDays: LOOKBACK_DAYS,
  })
}

/**
 * Convert a list of slip timestamps + a timezone to a danger-windows
 * map. Histograms by (day, hour) and emits the top peak slots as
 * 2-hour windows centered on each peak.
 *
 * Exported shape: `{ mon: ["21:00-23:00"], sat: ["14:00-16:00"] }`.
 */
function computeDangerWindows(
  timestamps: Date[],
  timezone: string,
): Record<DayKey, string[]> {
  // (day, hour) → count
  const slots = new Map<string, { day: DayKey; hour: number; count: number }>()

  for (const ts of timestamps) {
    let local: Date
    try {
      // Re-parse `ts` through the user's timezone. Safe across DST in
      // every locale we care about because en-US toLocaleString returns
      // the wall-clock time, not UTC.
      local = new Date(ts.toLocaleString('en-US', { timeZone: timezone }))
    } catch {
      // Bad timezone → fall back to UTC so we still produce SOMETHING.
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

  // Sort by count desc, take top N that meet MIN_SLOT_COUNT
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
    // 2-hour window centered on the peak hour, clamped to [00, 23].
    const start = Math.max(0, slot.hour - 0)
    const end = Math.min(23, slot.hour + 2)
    const range = `${pad(start)}:00-${pad(end)}:00`
    if (!out[slot.day].includes(range)) {
      out[slot.day].push(range)
    }
  }

  // Strip empty days so the wire format stays small.
  const result: Record<DayKey, string[]> = {} as Record<DayKey, string[]>
  for (const day of DAY_KEYS) {
    if (out[day].length > 0) result[day] = out[day]
  }
  return result
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/**
 * Merge learned windows over existing user.dangerWindows JSON.
 *
 * For each day-of-week present in `learned`, REPLACE that day's array
 * (behavioral data wins). Days only in `existing` are preserved (user
 * may have reported them in onboarding for a wedge we don't have slip
 * data on yet — keep the signal).
 */
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
