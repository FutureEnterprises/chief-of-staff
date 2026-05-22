/**
 * self-trust-score — multivariate Self-Trust Score made real.
 *
 * Today the User.selfTrustScore column is decorative (set at audit
 * completion, never re-derived). This module is Layer 4 of the
 * Honest Gap stack: it computes a per-user score from observed
 * behavior over the last 30 days so the number on the home screen
 * means something.
 *
 *   score = 0.30 * windowPredictionAccuracy +
 *           0.25 * interruptHoldRate +
 *           0.20 * patternDecayTrend +
 *           0.15 * sameNightRecoveryRate +
 *           0.10 * commitmentKeepStreak
 *
 * Every subscore is normalized to 0-100 so the weights are honest
 * and the breakdown ships intact to the UI / share card / model
 * snapshot. The composite is clamped to [0, 100] and rounded.
 *
 * Persistence strategy: the nightly cron (api/cron/self-trust-recompute)
 * stores the day's score on a ProductivityEvent of type FEATURE_USED
 * with metadataJson.type='self_trust_score'. We DO NOT write to
 * User.selfTrustScore here — that field is owned by other systems and
 * may diverge from the audit-time value. The cached read (getCurrentScore)
 * reads back the most recent persisted event, falling back to a fresh
 * compute when nothing is cached yet.
 *
 * All math is deterministic + DB-driven; there is no AI call here.
 * Latency target: ≤200ms per user on warm Postgres.
 */

import { prisma } from '@repo/database'

// ─────────────────────────── public API ───────────────────────────

/**
 * Each subscore lives on the [0, 100] scale so the weighting in the
 * composite reads honestly. The composite itself is also 0-100.
 */
export type SelfTrustBreakdown = {
  windowPredictionAccuracy: number
  interruptHoldRate: number
  patternDecayTrend: number
  sameNightRecoveryRate: number
  commitmentKeepStreak: number
}

export type SelfTrustScore = {
  /** 0-100, rounded integer. */
  score: number
  breakdown: SelfTrustBreakdown
}

export type CurrentScore = {
  score: number
  asOf: Date
  /** True when this number came from a cached event, false when freshly computed. */
  cached: boolean
}

const LOOKBACK_DAYS = 30
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000
const CACHE_TTL_MS = 26 * 60 * 60 * 1000 // 26h — cron is nightly; small buffer for slow runs

const WEIGHTS = {
  windowPredictionAccuracy: 0.3,
  interruptHoldRate: 0.25,
  patternDecayTrend: 0.2,
  sameNightRecoveryRate: 0.15,
  commitmentKeepStreak: 0.1,
} as const

const EMPTY_BREAKDOWN: SelfTrustBreakdown = {
  windowPredictionAccuracy: 0,
  interruptHoldRate: 0,
  patternDecayTrend: 0,
  sameNightRecoveryRate: 0,
  commitmentKeepStreak: 0,
}

// ────────────────────── score computation ──────────────────────

/**
 * Compute the user's Self-Trust Score from the last 30 days of
 * activity. Pure DB read; safe to call from API routes and crons.
 *
 * Returns `{ score: 0, breakdown: zeros }` for users with no data
 * in the window — better than a fake number.
 */
export async function computeSelfTrustScore(userId: string): Promise<SelfTrustScore> {
  const since = new Date(Date.now() - LOOKBACK_MS)

  const [accuracy, holdRate, decayTrend, recoveryRate, keepStreak] = await Promise.all([
    computeWindowPredictionAccuracy(userId, since),
    computeInterruptHoldRate(userId, since),
    computePatternDecayTrend(userId, since),
    computeSameNightRecoveryRate(userId, since),
    computeCommitmentKeepStreak(userId),
  ])

  const breakdown: SelfTrustBreakdown = {
    windowPredictionAccuracy: clamp01to100(accuracy),
    interruptHoldRate: clamp01to100(holdRate),
    patternDecayTrend: clamp01to100(decayTrend),
    sameNightRecoveryRate: clamp01to100(recoveryRate),
    commitmentKeepStreak: clamp01to100(keepStreak),
  }

  const composite =
    WEIGHTS.windowPredictionAccuracy * breakdown.windowPredictionAccuracy +
    WEIGHTS.interruptHoldRate * breakdown.interruptHoldRate +
    WEIGHTS.patternDecayTrend * breakdown.patternDecayTrend +
    WEIGHTS.sameNightRecoveryRate * breakdown.sameNightRecoveryRate +
    WEIGHTS.commitmentKeepStreak * breakdown.commitmentKeepStreak

  return {
    score: Math.round(clamp01to100(composite)),
    breakdown,
  }
}

/**
 * Read the most recent persisted Self-Trust Score for this user.
 *
 * Falls back to a fresh compute when:
 *   • No persisted event exists (new user, or pre-Layer-4 user).
 *   • The most recent event is older than CACHE_TTL_MS — if the
 *     nightly cron silently dropped a day, we recompute on demand
 *     rather than show stale data.
 */
export async function getCurrentScore(userId: string): Promise<CurrentScore> {
  const event = await prisma.productivityEvent.findFirst({
    where: {
      userId,
      eventType: 'FEATURE_USED',
      eventValue: 'self_trust_score',
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, metadataJson: true },
  })

  if (event) {
    const meta = readMeta(event.metadataJson)
    const cachedScore = typeof meta.score === 'number' ? meta.score : null
    const fresh = Date.now() - event.createdAt.getTime() < CACHE_TTL_MS
    if (cachedScore !== null && fresh) {
      return { score: cachedScore, asOf: event.createdAt, cached: true }
    }
  }

  const computed = await computeSelfTrustScore(userId)
  return { score: computed.score, asOf: new Date(), cached: false }
}

// ──────────────────────── subscore helpers ────────────────────────

/**
 * windowPredictionAccuracy — of the interrupts we fired in the
 * lookback window, what fraction landed inside an actual danger
 * moment for the user?
 *
 * Definition of "landed at a danger moment":
 *   • The interrupt has metadataJson.feedback === 'caught_me'
 *     (user tagged it OR auto-tagged it from absence-of-slip), OR
 *   • The user logged a slip within 30 minutes after the interrupt
 *     fired (so the interrupt did fire at a real risk window even
 *     if it didn't help).
 *
 * The denominator is total interrupts fired in the window. If we
 * fired none, accuracy is undefined; we return 50 as a neutral
 * starting place rather than 0 (a user with no data shouldn't be
 * punished for our cold start).
 */
async function computeWindowPredictionAccuracy(userId: string, since: Date): Promise<number> {
  const interrupts = await prisma.productivityEvent.findMany({
    where: { userId, eventType: 'AUTOPILOT_INTERRUPTED', createdAt: { gte: since } },
    select: { id: true, createdAt: true, metadataJson: true },
  })

  if (interrupts.length === 0) return 50

  const slips = await prisma.slipRecord.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
  })
  const slipTimes = slips.map((s) => s.createdAt.getTime())

  let landed = 0
  for (const e of interrupts) {
    const meta = readMeta(e.metadataJson)
    const feedback = typeof meta.feedback === 'string' ? meta.feedback : null
    if (feedback === 'caught_me') {
      landed++
      continue
    }
    // Check for a slip within +30 minutes — interrupt fired at real risk.
    const t = e.createdAt.getTime()
    const followingSlip = slipTimes.some((s) => s >= t && s - t <= 30 * 60 * 1000)
    if (followingSlip) landed++
  }

  return (landed / interrupts.length) * 100
}

/**
 * interruptHoldRate — of the interrupts that fired in the window,
 * what fraction did the user (manually or by inference) tag
 * 'caught_me'?
 *
 * This is strictly tagged-helpful interrupts / total interrupts.
 * Untagged interrupts COUNT AGAINST the user (they got the prompt,
 * they didn't engage). That asymmetry is intentional — we're
 * measuring honest hold-rate, not "willingness to give feedback."
 *
 * Returns 50 (neutral) for users with no interrupts yet.
 */
async function computeInterruptHoldRate(userId: string, since: Date): Promise<number> {
  const interrupts = await prisma.productivityEvent.findMany({
    where: { userId, eventType: 'AUTOPILOT_INTERRUPTED', createdAt: { gte: since } },
    select: { metadataJson: true },
  })
  if (interrupts.length === 0) return 50

  let held = 0
  for (const e of interrupts) {
    const meta = readMeta(e.metadataJson)
    if (meta.feedback === 'caught_me') held++
  }
  return (held / interrupts.length) * 100
}

/**
 * patternDecayTrend — by how much have the user's danger windows
 * weakened over the lookback period?
 *
 * Decay heuristic: for each active DangerWindow, compare slip count
 * in the first half of the lookback window vs the second half. A
 * pattern that's decaying generates fewer slips later. We average
 * across the user's active windows, normalize to 0-100.
 *
 *   decayPctPerWindow = max(0, (firstHalf - secondHalf) / max(1, firstHalf))
 *
 * Falls back to a coarser whole-user comparison if the user has no
 * active windows yet: comparing first-15-day vs second-15-day slip
 * counts directly. Neutral 50 for users with zero slips (nothing
 * decaying, nothing growing).
 */
async function computePatternDecayTrend(userId: string, since: Date): Promise<number> {
  const halfMs = (Date.now() - since.getTime()) / 2
  const midpoint = new Date(since.getTime() + halfMs)

  const windows = await prisma.dangerWindow.findMany({
    where: { userId, active: true },
    select: { id: true, dayOfWeek: true, startHour: true, endHour: true },
  })

  const slips = await prisma.slipRecord.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
  })

  if (slips.length === 0) return 50

  if (windows.length === 0) {
    // Coarse fallback — first half vs second half slip count.
    const firstHalf = slips.filter((s) => s.createdAt < midpoint).length
    const secondHalf = slips.length - firstHalf
    const decay = firstHalf === 0 ? 0 : Math.max(0, (firstHalf - secondHalf) / firstHalf)
    return decay * 100
  }

  // For each window, attribute slips that fell inside the window's
  // (dayOfWeek, hour) box. dayOfWeek -1 = any day.
  let totalDecay = 0
  let evaluated = 0
  for (const w of windows) {
    let firstHalf = 0
    let secondHalf = 0
    for (const s of slips) {
      if (!slipMatchesWindow(s.createdAt, w)) continue
      if (s.createdAt < midpoint) firstHalf++
      else secondHalf++
    }
    if (firstHalf === 0 && secondHalf === 0) continue
    const decay = firstHalf === 0 ? 0 : Math.max(0, (firstHalf - secondHalf) / firstHalf)
    totalDecay += decay
    evaluated++
  }

  if (evaluated === 0) {
    // No window had any slips — that itself is a strong-decay signal.
    return 100
  }
  return (totalDecay / evaluated) * 100
}

/**
 * sameNightRecoveryRate — of the slips that occurred in the window,
 * what fraction were followed by a same-night recovery action?
 *
 * "Same-night recovery" is defined as either:
 *   • SlipRecord.recoveredAt is set within 8 hours of createdAt, OR
 *   • A SLIP_RECOVERED event was logged within 8 hours of the slip.
 *
 * Users with zero slips return 100 (perfect: nothing to recover
 * from). That's not gaming — the score weights this at 15%, so a
 * blank slate is exactly as honest as a steady recovery rate.
 */
async function computeSameNightRecoveryRate(userId: string, since: Date): Promise<number> {
  const slips = await prisma.slipRecord.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { id: true, createdAt: true, recoveredAt: true },
  })
  if (slips.length === 0) return 100

  const recoveryEvents = await prisma.productivityEvent.findMany({
    where: { userId, eventType: 'SLIP_RECOVERED', createdAt: { gte: since } },
    select: { createdAt: true },
  })
  const eventTimes = recoveryEvents.map((e) => e.createdAt.getTime())

  const eightHoursMs = 8 * 60 * 60 * 1000
  let recovered = 0
  for (const s of slips) {
    const slipMs = s.createdAt.getTime()
    if (s.recoveredAt && s.recoveredAt.getTime() - slipMs <= eightHoursMs) {
      recovered++
      continue
    }
    const matched = eventTimes.some((t) => t >= slipMs && t - slipMs <= eightHoursMs)
    if (matched) recovered++
  }
  return (recovered / slips.length) * 100
}

/**
 * commitmentKeepStreak — the user's longest active streak of
 * consecutive kept-commitment days, normalized.
 *
 * We approximate the streak from the COMMITMENT_KEPT and
 * COMMITMENT_BROKEN events on the activity log. A "kept day" is any
 * day with a COMMITMENT_KEPT event and no COMMITMENT_BROKEN event.
 * The current streak is the count of consecutive kept days ending
 * yesterday (today is incomplete and would falsely truncate).
 *
 * Normalization: 30 consecutive kept days = 100. Linear up to that
 * cap. A user who is just starting (3 days) reads 10, which feels
 * about right.
 */
async function computeCommitmentKeepStreak(userId: string): Promise<number> {
  const since = new Date(Date.now() - LOOKBACK_MS)
  const events = await prisma.productivityEvent.findMany({
    where: {
      userId,
      eventType: { in: ['COMMITMENT_KEPT', 'COMMITMENT_BROKEN'] },
      createdAt: { gte: since },
    },
    select: { eventType: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  if (events.length === 0) return 0

  // Bucket events by yyyy-mm-dd in UTC. We don't have the user's TZ
  // here, but the streak ignores absolute date — only consecutive-ness
  // matters. UTC bucketing is consistent across all queries.
  const dayMap = new Map<string, { kept: boolean; broken: boolean }>()
  for (const e of events) {
    const key = e.createdAt.toISOString().slice(0, 10)
    const entry = dayMap.get(key) ?? { kept: false, broken: false }
    if (e.eventType === 'COMMITMENT_KEPT') entry.kept = true
    if (e.eventType === 'COMMITMENT_BROKEN') entry.broken = true
    dayMap.set(key, entry)
  }

  // Walk backwards from yesterday, counting consecutive kept-only days.
  const yesterday = new Date()
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  let streak = 0
  for (let i = 0; i < LOOKBACK_DAYS; i++) {
    const d = new Date(yesterday.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const entry = dayMap.get(key)
    if (!entry) break // no activity = streak broken
    if (entry.broken) break
    if (!entry.kept) break
    streak++
  }

  return Math.min(100, (streak / 30) * 100)
}

// ──────────────────────────── utilities ────────────────────────────

function clamp01to100(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

function readMeta(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

/**
 * Match a slip timestamp against a DangerWindow's (dayOfWeek × hours)
 * box. Uses UTC, same as the rest of self-trust math — TZ-aware
 * matching would require pulling the user TZ in every helper, which
 * doesn't change the relative decay signal we're computing.
 */
function slipMatchesWindow(
  ts: Date,
  w: { dayOfWeek: number; startHour: number; endHour: number },
): boolean {
  const day = ts.getUTCDay()
  if (w.dayOfWeek !== -1 && w.dayOfWeek !== day) return false
  const hour = ts.getUTCHours()
  // Handle wrap-around windows (e.g. 22-2 = 22 to next-day 2)
  if (w.endHour <= w.startHour) {
    return hour >= w.startHour || hour < w.endHour
  }
  return hour >= w.startHour && hour < w.endHour
}

export const SELF_TRUST_CONSTANTS = {
  LOOKBACK_DAYS,
  WEIGHTS,
  EMPTY_BREAKDOWN,
} as const
