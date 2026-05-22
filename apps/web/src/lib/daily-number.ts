import { prisma } from '@repo/database'
import type { DailyNumber } from '@repo/database'

/**
 * daily-number — the Wrapped/Daily-Number ritual mechanic.
 *
 * THE VIRAL COEFFICIENT. Every day at the same local time, each user
 * receives ONE NUMBER (Self-Trust Score change), ONE IDENTITY SENTENCE
 * ("Day 47. You held a 9 PM moment last night."), and ONE-TAP SHARE.
 *
 * Wordle taught us: humans share daily rituals more reliably than
 * moment-triggered events. The number IS the ritual; the sentence IS
 * the identity grounding; the share IS the acquisition wire.
 *
 * One row per (userId, date). The `date` column is UTC-midnight of the
 * user's LOCAL calendar day — that's the unique key. The cron fires
 * hourly and only generates a row for users whose local 8 PM has just
 * passed (one chance per local day to land at the wind-down moment).
 *
 * Composition:
 *   - selfTrustScore     = user.selfTrustScore at generation time
 *   - selfTrustDelta     = change from yesterday's row (or 0 if first day)
 *   - identitySentence   = one of five variants chosen by state machine
 *   - dayNumber          = N-th day of usage (since user.createdAt)
 *   - archetype          = user.primaryWedge slug, for analytics
 *   - topWindowHeld      = label of last-night window the user HELD
 *   - topWindowMissed    = label of last-night window the user MISSED
 *
 * The share-side fields (shareCount, lastSharedAt, shareCode) live on
 * the same row so the public /d/[code] page can read directly.
 */

export type IdentityVariant =
  | 'window_held'
  | 'window_missed'
  | 'flat'
  | 'first_week'
  | 'decay_favorable'

export type GeneratedDailyNumber = DailyNumber & {
  variant: IdentityVariant
}

/**
 * Compute the user-local "date" key — UTC midnight of the user's local
 * calendar day. Two users on the same instant in different time zones
 * get DIFFERENT date keys, which is what the @@unique(userId, date)
 * constraint wants.
 */
export function userLocalDateKey(now: Date, timezone: string): Date {
  // Format the current instant into the user's local YYYY-MM-DD. The
  // 'en-CA' locale produces ISO-shaped dates that we can parse back as
  // UTC midnight without locale parsing surprises.
  const localDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  // localDateStr === "2026-05-21" — parse as UTC midnight.
  return new Date(`${localDateStr}T00:00:00.000Z`)
}

/**
 * Day-number since signup. 1-indexed. Computed against UTC days so a
 * user who signs up on May 1 and asks for Day N on May 12 gets 12,
 * regardless of timezone wraparound.
 */
function computeDayNumber(createdAt: Date, today: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const start = Date.UTC(
    createdAt.getUTCFullYear(),
    createdAt.getUTCMonth(),
    createdAt.getUTCDate(),
  )
  const end = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  )
  return Math.max(1, Math.floor((end - start) / MS_PER_DAY) + 1)
}

/**
 * Identify last night's window state. Walks DangerWindow rows for the
 * user and checks whether any of their RescueSession rows in the last
 * 24h landed inside one of those windows.
 *
 *   - heldLabel:   user was inside a window AND has an INTERRUPTED rescue
 *   - missedLabel: user was inside a window AND has a SLIPPED slip event
 *
 * Returns one label each — the "top" window by recency. If both are
 * present we still return both; the sentence-selector prefers the held
 * variant when delta > 0 and the missed variant when delta < 0.
 */
async function findLastNightWindowState(args: {
  userId: string
  timezone: string
  now: Date
}): Promise<{ heldLabel: string | null; missedLabel: string | null }> {
  const twentyFourHoursAgo = new Date(args.now.getTime() - 24 * 60 * 60 * 1000)

  // Pull the lightweight context — windows + recent events.
  const [windows, rescues, slips] = await Promise.all([
    prisma.dangerWindow.findMany({
      where: { userId: args.userId, active: true },
      select: { label: true, startHour: true, endHour: true, dayOfWeek: true },
    }),
    prisma.rescueSession.findMany({
      where: {
        userId: args.userId,
        outcome: 'INTERRUPTED',
        startedAt: { gte: twentyFourHoursAgo },
      },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.slipRecord.findMany({
      where: {
        userId: args.userId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (windows.length === 0) return { heldLabel: null, missedLabel: null }

  // Helper — does a given date fall inside any of the user's windows
  // (interpreted in the user's local timezone)?
  function findWindowFor(d: Date): string | null {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: args.timezone || 'UTC',
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(d)
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
    const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    }
    const day = dayMap[weekdayStr] ?? 0
    const hour = parseInt(hourStr, 10)

    const match = windows.find(
      (w) =>
        (w.dayOfWeek === -1 || w.dayOfWeek === day) &&
        hour >= w.startHour &&
        hour < w.endHour,
    )
    return match?.label ?? null
  }

  const heldLabel = rescues.length > 0 ? findWindowFor(rescues[0]!.startedAt) : null
  const missedLabel = slips.length > 0 ? findWindowFor(slips[0]!.createdAt) : null

  return { heldLabel, missedLabel }
}

/**
 * Compute self-trust delta from yesterday's DailyNumber. Falls back to
 * 0 when there's no prior row (Day 1, or first-time-after-feature-ship).
 */
async function computeDeltaFromYesterday(args: {
  userId: string
  todayDateKey: Date
  currentScore: number
}): Promise<{ delta: number; hasYesterday: boolean }> {
  const yesterdayKey = new Date(args.todayDateKey.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayRow = await prisma.dailyNumber.findUnique({
    where: { userId_date: { userId: args.userId, date: yesterdayKey } },
    select: { selfTrustScore: true },
  })
  if (!yesterdayRow) return { delta: 0, hasYesterday: false }
  return {
    delta: args.currentScore - yesterdayRow.selfTrustScore,
    hasYesterday: true,
  }
}

/**
 * Pick the identity sentence variant. Five variants:
 *
 *   1. window_held       — delta > 0 + topWindowHeld present
 *   2. window_missed     — delta < 0 + topWindowMissed present
 *   3. flat              — delta === 0
 *   4. first_week        — dayNumber <= 7 (overrides other branches)
 *   5. decay_favorable   — dayNumber > 7 AND no window data AND delta >= 0
 *
 * The decay branch reads as "the {pattern} pattern is loosening" —
 * pulls primaryWedge as the pattern descriptor.
 */
export function pickIdentitySentence(args: {
  dayNumber: number
  delta: number
  heldLabel: string | null
  missedLabel: string | null
  archetype: string | null
}): { sentence: string; variant: IdentityVariant } {
  // Day 1-7: the model-is-learning frame supersedes everything. New
  // users without yesterday data hit this branch automatically.
  if (args.dayNumber <= 7) {
    return {
      sentence: `Day ${args.dayNumber}. The model is learning your shape.`,
      variant: 'first_week',
    }
  }

  if (args.delta > 0 && args.heldLabel) {
    return {
      sentence: `You held a ${args.heldLabel} moment last night.`,
      variant: 'window_held',
    }
  }

  if (args.delta < 0 && args.missedLabel) {
    return {
      sentence: `You met a ${args.missedLabel} moment last night.`,
      variant: 'window_missed',
    }
  }

  if (args.delta === 0) {
    return {
      sentence: `Day ${args.dayNumber}. Held the ground.`,
      variant: 'flat',
    }
  }

  // delta != 0 but no window data — interpret as a favorable
  // decay-trend sentence using the archetype as the pattern descriptor.
  const pattern = archetypeToPatternLabel(args.archetype)
  return {
    sentence: `Day ${args.dayNumber}. The ${pattern} pattern is loosening.`,
    variant: 'decay_favorable',
  }
}

/**
 * Translate a PrimaryWedge enum value into a human-readable pattern
 * label. Falls back to "autopilot" when the wedge is missing.
 */
function archetypeToPatternLabel(archetype: string | null): string {
  if (!archetype) return 'autopilot'
  const map: Record<string, string> = {
    PRODUCTIVITY: 'distraction',
    OVEREATING: 'late-night',
    SUBSTANCE_USE: 'craving',
    NICOTINE: 'craving',
    ALCOHOL: 'evening',
    DOOMSCROLL: 'scroll',
    OVERSPENDING: 'impulse',
    AVOIDANCE: 'avoidance',
    GAMBLING: 'urge',
    WORKAHOLISM: 'overwork',
  }
  return map[archetype.toUpperCase()] ?? 'autopilot'
}

/**
 * Generate (or fetch existing) DailyNumber for a user on a given UTC
 * date key. Idempotent — calling twice with the same args returns the
 * same row.
 *
 * Uses upsert with the @@unique(userId, date) compound key so the
 * caller doesn't have to think about race conditions when multiple
 * crons or client routes call this at once.
 */
export async function generateDailyNumber(
  userId: string,
  dateUTC: Date,
): Promise<GeneratedDailyNumber> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      timezone: true,
      selfTrustScore: true,
      primaryWedge: true,
      createdAt: true,
    },
  })
  if (!user) throw new Error(`User not found: ${userId}`)

  // Short-circuit: if a row already exists, return it as-is. The
  // sentence + delta are computed once-per-day and immutable thereafter
  // so the user sees the same number all day. (Re-running the picker
  // mid-day would flip the sentence if their score moved, which would
  // break the "ONE number per day" contract.)
  const existing = await prisma.dailyNumber.findUnique({
    where: { userId_date: { userId, date: dateUTC } },
  })
  if (existing) {
    return { ...existing, variant: inferVariantFromRow(existing) }
  }

  const dayNumber = computeDayNumber(user.createdAt, dateUTC)
  const { delta } = await computeDeltaFromYesterday({
    userId,
    todayDateKey: dateUTC,
    currentScore: user.selfTrustScore,
  })
  const { heldLabel, missedLabel } = await findLastNightWindowState({
    userId,
    timezone: user.timezone,
    now: new Date(),
  })

  const { sentence, variant } = pickIdentitySentence({
    dayNumber,
    delta,
    heldLabel,
    missedLabel,
    archetype: user.primaryWedge,
  })

  // Upsert protects against a thundering-herd race where the cron and
  // an in-app /api/v1/daily-number/today call hit at the same instant
  // for a brand-new row. The unique constraint will reject the loser;
  // upsert turns that into a find.
  const row = await prisma.dailyNumber.upsert({
    where: { userId_date: { userId, date: dateUTC } },
    update: {}, // existing row wins — never overwrite mid-day
    create: {
      userId,
      date: dateUTC,
      selfTrustScore: user.selfTrustScore,
      selfTrustDelta: delta,
      identitySentence: sentence,
      dayNumber,
      archetype: user.primaryWedge ?? null,
      topWindowHeld: heldLabel,
      topWindowMissed: missedLabel,
    },
  })

  return { ...row, variant }
}

/**
 * Get today's DailyNumber for a user. If none exists, generate it on
 * the fly — lets the in-app daily-card show something even if the cron
 * hasn't fired yet (e.g. the user opens the app before 8 PM local).
 */
export async function getTodaysDailyNumber(
  userId: string,
): Promise<GeneratedDailyNumber | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, timezone: true },
  })
  if (!user) return null

  const todayKey = userLocalDateKey(new Date(), user.timezone || 'UTC')
  return generateDailyNumber(userId, todayKey)
}

/**
 * Increment shareCount + bump lastSharedAt on the row identified by
 * shareCode. Called when the user (or a viewer of /d/[code]) taps the
 * share button. Idempotent in the sense that repeated calls only push
 * the count — no error or 4xx.
 *
 * Returns the updated count so the caller can echo it back to the
 * client for live UI ("5 friends saw your number").
 */
export async function incrementShareCount(shareCode: string): Promise<number> {
  try {
    const updated = await prisma.dailyNumber.update({
      where: { shareCode },
      data: {
        shareCount: { increment: 1 },
        lastSharedAt: new Date(),
      },
      select: { shareCount: true },
    })
    return updated.shareCount
  } catch {
    // Unknown shareCode — return 0 instead of throwing. The share UI
    // is fire-and-forget and shouldn't break on a bad code.
    return 0
  }
}

/**
 * Reverse-map an existing row into its variant. Used when returning a
 * pre-existing DailyNumber from generate(), since the variant isn't
 * stored on the row itself.
 */
function inferVariantFromRow(row: DailyNumber): IdentityVariant {
  if (row.dayNumber <= 7) return 'first_week'
  if (row.selfTrustDelta > 0 && row.topWindowHeld) return 'window_held'
  if (row.selfTrustDelta < 0 && row.topWindowMissed) return 'window_missed'
  if (row.selfTrustDelta === 0) return 'flat'
  return 'decay_favorable'
}

/**
 * Format the +X / -X / 0 delta label. "+3" / "−2" / "0".
 * Uses the proper Unicode minus (U+2212) for visual weight; falls
 * back to a regular hyphen only when joining for plaintext channels.
 */
export function formatDeltaLabel(delta: number, opts?: { ascii?: boolean }): string {
  if (delta === 0) return '0'
  if (delta > 0) return `+${delta}`
  if (opts?.ascii) return `-${Math.abs(delta)}`
  return `−${Math.abs(delta)}`
}
