/**
 * model-snapshot — the day-30 / 60 / 90 deliverable.
 *
 * This is the artifact users SHOW PEOPLE. The Self-Trust Score is the
 * daily heartbeat of the moat; the Model Snapshot is the
 * top-of-funnel — a personalized report card the user can screenshot,
 * post, or hand to a friend / clinician / partner. It's the single
 * highest-leverage word-of-mouth surface in COYL.
 *
 * Shape ships intact through three render paths:
 *   1. Email body (model-snapshot cron — Resend HTML/text)
 *   2. In-app snapshot card (<SnapshotCard /> client component)
 *   3. JSON API (/api/v1/model-snapshot/[id]) for the snapshot page
 *
 * Pure data builder. No AI call on the hot path — every field is
 * derivable from existing Prisma tables (User, DangerWindow,
 * SlipRecord, Commitment, ProductivityEvent, Excuse). The
 * `identityClaim` sentence IS AI-generated, but it's an optional
 * field — buildModelSnapshot doesn't depend on the AI call returning
 * before it can ship the rest of the snapshot. Callers can populate
 * identityClaim asynchronously and re-persist.
 *
 * Tightness: keep the data set under ~10KB. It rides on
 * ProductivityEvent.metadataJson, which is fine for that size, and
 * the email render does not paginate.
 */

import { prisma } from '@repo/database'
import type { ArchetypeFamily } from '@/lib/audit-archetype'

// ─────────────────────────── public types ───────────────────────────

export type SnapshotPeriod = 30 | 60 | 90

export type SnapshotWindow = {
  /** Human-readable label e.g. "Late-night kitchen" */
  label: string
  /** 0=Sun..6=Sat, -1 = all days */
  dayOfWeek: number
  /** Hour range string, e.g. "21:00-23:00" — pre-formatted for render. */
  hours: string
  /** How many interrupts fired inside this window in the period. */
  firingCount: number
  /** % the user marked 'caught_me' (manual or inferred). 0-100. */
  holdRate: number
}

export type SnapshotExcuse = {
  category: string
  count: number
  /** AI-shaped or copy-shelf reading of the user's most-used excuse */
  narrativeRead: string
}

export type SnapshotIntervention = {
  /** Mode tag e.g. 'high_arousal' | 'low_arousal' | 'post_slip' | 'calm' */
  mode: string
  /** Copy template that landed for this user (the line they responded to) */
  copyTemplate: string
  /** 0-100, % of fires in this mode the user marked 'caught_me'. */
  holdRate: number
}

export type SnapshotDecayCurve = {
  patternName: string
  week1Strength: number
  currentStrength: number
  /** Negative = decay (good), positive = growing (bad). */
  deltaPct: number
}

export type SnapshotTrustPoint = {
  /** ISO string (we don't pre-format — render decides) */
  date: string
  /** 0-100 */
  score: number
}

export type ModelSnapshot = {
  userId: string
  periodStart: string // ISO
  periodEnd: string // ISO
  daysOnPlatform: number

  archetype: string
  archetypeChanged: boolean

  topWindows: SnapshotWindow[]
  topExcuses: SnapshotExcuse[]
  topWorkingInterventions: SnapshotIntervention[]

  decayCurves: SnapshotDecayCurve[]
  selfTrustTrend: SnapshotTrustPoint[]

  identityClaim: string
}

// ──────────────────────── builder ────────────────────────

/**
 * Build a Model Snapshot for the user over the past `periodDays`
 * days. periodDays is 30/60/90 in production but accepts any
 * positive integer for ad-hoc render.
 *
 * Performance budget: ≤ ~500ms per user on warm Postgres. Each
 * sub-query is bounded by the user's row count over the period.
 */
export async function buildModelSnapshot(
  userId: string,
  periodDays: number,
): Promise<ModelSnapshot> {
  const now = new Date()
  const since = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      createdAt: true,
      primaryWedge: true,
      identityState: true,
      currentStreak: true,
      slipsThisMonth: true,
      selfTrustScore: true,
    },
  })
  if (!user) {
    throw new Error(`model-snapshot: user ${userId} not found`)
  }

  const daysOnPlatform = Math.max(
    1,
    Math.floor((now.getTime() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
  )

  const [
    topWindows,
    topExcuses,
    topWorkingInterventions,
    decayCurves,
    selfTrustTrend,
    { archetype, archetypeChanged },
  ] = await Promise.all([
    buildTopWindows(userId, since),
    buildTopExcuses(userId, since),
    buildTopWorkingInterventions(userId, since),
    buildDecayCurves(userId, periodDays),
    buildSelfTrustTrend(userId, since),
    buildArchetypeBlock(userId, user.primaryWedge, since),
  ])

  const identityClaim = synthesizeIdentityClaim({
    archetype,
    topWindow: topWindows[0],
    topExcuse: topExcuses[0],
    selfTrustNow: selfTrustTrend.at(-1)?.score ?? 0,
    selfTrustStart: selfTrustTrend[0]?.score ?? 0,
    streak: user.currentStreak,
    daysOnPlatform,
  })

  return {
    userId,
    periodStart: since.toISOString(),
    periodEnd: now.toISOString(),
    daysOnPlatform,
    archetype,
    archetypeChanged,
    topWindows,
    topExcuses,
    topWorkingInterventions,
    decayCurves,
    selfTrustTrend,
    identityClaim,
  }
}

// ──────────────────────── sub-builders ────────────────────────

async function buildTopWindows(userId: string, since: Date): Promise<SnapshotWindow[]> {
  const windows = await prisma.dangerWindow.findMany({
    where: { userId, active: true },
    select: {
      id: true,
      label: true,
      dayOfWeek: true,
      startHour: true,
      endHour: true,
    },
  })
  if (windows.length === 0) return []

  const interrupts = await prisma.productivityEvent.findMany({
    where: { userId, eventType: 'AUTOPILOT_INTERRUPTED', createdAt: { gte: since } },
    select: { createdAt: true, metadataJson: true },
  })

  // Per-window aggregation. We attribute an interrupt to a window
  // by (dayOfWeek × hour) match — the same logic
  // danger-window-interrupt and self-trust-score use.
  const out: SnapshotWindow[] = []
  for (const w of windows) {
    let firings = 0
    let held = 0
    for (const e of interrupts) {
      const day = e.createdAt.getUTCDay()
      if (w.dayOfWeek !== -1 && w.dayOfWeek !== day) continue
      const hour = e.createdAt.getUTCHours()
      const inRange =
        w.endHour <= w.startHour
          ? hour >= w.startHour || hour < w.endHour
          : hour >= w.startHour && hour < w.endHour
      if (!inRange) continue
      firings++
      const meta = readMeta(e.metadataJson)
      if (meta.feedback === 'caught_me') held++
    }
    out.push({
      label: w.label,
      dayOfWeek: w.dayOfWeek,
      hours: `${pad2(w.startHour)}:00-${pad2(w.endHour)}:00`,
      firingCount: firings,
      holdRate: firings === 0 ? 0 : Math.round((held / firings) * 100),
    })
  }

  // Sort by firingCount descending — busiest windows first — and cap
  // at 3. Decoration over completeness: this is a card, not a report.
  return out.sort((a, b) => b.firingCount - a.firingCount).slice(0, 3)
}

async function buildTopExcuses(userId: string, since: Date): Promise<SnapshotExcuse[]> {
  const grouped = await prisma.excuse.groupBy({
    by: ['category'],
    where: { userId, createdAt: { gte: since } },
    _count: true,
  })
  return grouped
    .sort((a, b) => b._count - a._count)
    .slice(0, 3)
    .map((g) => ({
      category: g.category,
      count: g._count,
      narrativeRead: excuseNarrative(g.category, g._count),
    }))
}

async function buildTopWorkingInterventions(
  userId: string,
  since: Date,
): Promise<SnapshotIntervention[]> {
  // Pull interrupts that have a feedback tag — we can only score
  // "what worked" from the tagged subset.
  const interrupts = await prisma.productivityEvent.findMany({
    where: {
      userId,
      eventType: 'AUTOPILOT_INTERRUPTED',
      createdAt: { gte: since },
    },
    select: { metadataJson: true },
    take: 500,
  })

  type Bucket = { fired: number; held: number; sampleCopy: string | null }
  const byMode = new Map<string, Bucket>()

  for (const e of interrupts) {
    const meta = readMeta(e.metadataJson)
    const mode = typeof meta.mode === 'string' ? meta.mode : null
    if (!mode) continue
    const bucket = byMode.get(mode) ?? { fired: 0, held: 0, sampleCopy: null }
    bucket.fired++
    if (meta.feedback === 'caught_me') bucket.held++
    if (!bucket.sampleCopy && typeof meta.copyTemplate === 'string') {
      bucket.sampleCopy = meta.copyTemplate
    } else if (!bucket.sampleCopy && typeof meta.label === 'string') {
      bucket.sampleCopy = meta.label
    }
    byMode.set(mode, bucket)
  }

  return Array.from(byMode.entries())
    .filter(([, b]) => b.fired >= 2) // need ≥2 fires to compute a meaningful rate
    .map(([mode, b]) => ({
      mode,
      copyTemplate: b.sampleCopy ?? '',
      holdRate: Math.round((b.held / b.fired) * 100),
    }))
    .sort((a, b) => b.holdRate - a.holdRate)
    .slice(0, 3)
}

async function buildDecayCurves(
  userId: string,
  periodDays: number,
): Promise<SnapshotDecayCurve[]> {
  // For each active DangerWindow, compare slip volume in the first 7
  // days of the period (the user's "week 1 strength") to the most
  // recent 7 days ("current strength"). A negative deltaPct means
  // the pattern is weakening — exactly what the user wants to see.
  const windows = await prisma.dangerWindow.findMany({
    where: { userId, active: true },
    select: { label: true, dayOfWeek: true, startHour: true, endHour: true },
  })
  if (windows.length === 0) return []

  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
  const week1End = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  const recent7Start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const slips = await prisma.slipRecord.findMany({
    where: { userId, createdAt: { gte: periodStart } },
    select: { createdAt: true },
  })

  const out: SnapshotDecayCurve[] = []
  for (const w of windows) {
    let week1 = 0
    let recent = 0
    for (const s of slips) {
      if (!slipMatchesWindow(s.createdAt, w)) continue
      if (s.createdAt < week1End) week1++
      if (s.createdAt >= recent7Start) recent++
    }
    if (week1 === 0 && recent === 0) continue
    // Normalize to 0-100 "strength" — slips/week capped at 7 (one/day)
    const week1Strength = Math.min(100, (week1 / 7) * 100)
    const currentStrength = Math.min(100, (recent / 7) * 100)
    const deltaPct =
      week1Strength === 0 ? 0 : Math.round(((currentStrength - week1Strength) / week1Strength) * 100)
    out.push({ patternName: w.label, week1Strength, currentStrength, deltaPct })
  }

  return out.slice(0, 4)
}

async function buildSelfTrustTrend(
  userId: string,
  since: Date,
): Promise<SnapshotTrustPoint[]> {
  // Sparse weekly sampling: walk back through the persisted
  // self_trust_score events, picking the most recent score in each
  // 7-day bucket so the trend reads as a clean weekly sparkline.
  const events = await prisma.productivityEvent.findMany({
    where: {
      userId,
      eventType: 'FEATURE_USED',
      eventValue: 'self_trust_score',
      createdAt: { gte: since },
    },
    select: { createdAt: true, metadataJson: true },
    orderBy: { createdAt: 'asc' },
  })

  if (events.length === 0) return []

  const weekMs = 7 * 24 * 60 * 60 * 1000
  const buckets = new Map<number, { ts: Date; score: number }>()
  const base = since.getTime()
  for (const e of events) {
    const meta = readMeta(e.metadataJson)
    const score = typeof meta.score === 'number' ? meta.score : null
    if (score === null) continue
    const weekIdx = Math.floor((e.createdAt.getTime() - base) / weekMs)
    // Most recent wins per week (we iterate asc, so just overwrite).
    buckets.set(weekIdx, { ts: e.createdAt, score })
  }
  return Array.from(buckets.values())
    .sort((a, b) => a.ts.getTime() - b.ts.getTime())
    .map((b) => ({ date: b.ts.toISOString(), score: b.score }))
}

async function buildArchetypeBlock(
  userId: string,
  primaryWedge: string,
  since: Date,
): Promise<{ archetype: string; archetypeChanged: boolean }> {
  // Archetype rolls forward from DailyNumber.archetype (the freshest
  // snapshot value, set by the daily-number cron) and falls back to
  // primaryWedge text when no daily-number row exists yet.
  const latest = await prisma.dailyNumber.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { archetype: true, date: true },
  })
  const archetype = latest?.archetype ?? primaryWedge

  // Detect a change: did the archetype string differ at the start of
  // the period vs the end? "the-deserver" → "the-monday-resetter"
  // would flip the bit. If we don't have a daily-number row at-or-
  // before the period start, treat as unchanged (no data = no claim).
  const earlier = await prisma.dailyNumber.findFirst({
    where: { userId, date: { lte: since } },
    orderBy: { date: 'desc' },
    select: { archetype: true },
  })
  const archetypeChanged =
    earlier?.archetype && latest?.archetype ? earlier.archetype !== latest.archetype : false

  return { archetype, archetypeChanged }
}

// ────────────────────── identity claim ──────────────────────

type IdentityClaimInput = {
  archetype: string
  topWindow?: SnapshotWindow
  topExcuse?: SnapshotExcuse
  selfTrustNow: number
  selfTrustStart: number
  streak: number
  daysOnPlatform: number
}

/**
 * Synthesize the one-line identity claim that anchors the snapshot.
 *
 * This is intentionally deterministic (no AI dependency on the
 * builder hot path). The cron CAN overlay an LLM-generated line by
 * calling the AI helper after buildModelSnapshot and overwriting
 * `identityClaim` before persistence. Keeping the default
 * deterministic means the snapshot ships even when the AI provider
 * is degraded.
 *
 * Template strategy: 3 lenses, picked in priority order —
 *   1. Trust climbing significantly → "you are catching yourself faster"
 *   2. Top window present + decent hold rate → "you held X"
 *   3. Streak ≥ 7 → "you've been consistent for N days"
 *   4. Fallback → archetype + day count
 */
function synthesizeIdentityClaim(input: IdentityClaimInput): string {
  const delta = input.selfTrustNow - input.selfTrustStart
  if (delta >= 10) {
    return `Day ${input.daysOnPlatform}. Your Self-Trust Score climbed ${delta} points. You're catching yourself faster than you did a month ago.`
  }
  if (input.topWindow && input.topWindow.holdRate >= 60) {
    return `Day ${input.daysOnPlatform}. You held ${input.topWindow.label} ${input.topWindow.holdRate}% of the time this period. That window doesn't run you anymore.`
  }
  if (input.streak >= 7) {
    return `Day ${input.daysOnPlatform}. ${input.streak}-day streak. You're still here, and the loop knows it.`
  }
  if (input.topExcuse) {
    return `Day ${input.daysOnPlatform}. Your most-used excuse is still ${humanExcuse(input.topExcuse.category)} (${input.topExcuse.count}× this period). The script is named — that's how it loses power.`
  }
  return `Day ${input.daysOnPlatform}. You're showing up. Showing up changes the math.`
}

// ────────────────────── copy helpers ──────────────────────

function excuseNarrative(category: string, count: number): string {
  switch (category) {
    case 'DELAY':
      return `You ran the "I'll start tomorrow" script ${count}× this period. Tomorrow keeps moving.`
    case 'REWARD':
      return `You told yourself "I deserve it" ${count}× this period. The reward is the trap.`
    case 'MINIMIZATION':
      return `"One time won't matter" — ${count}× this period. It always matters.`
    case 'COLLAPSE':
      return `You said "I already blew it" ${count}× this period. That's the spiral starting.`
    case 'EXHAUSTION':
      return `"I'm too tired" — ${count}× this period. Energy is downstream of identity, not the cause.`
    case 'EXCEPTION':
      return `You called this period an exception ${count}× this period. Exceptions are the rule when they repeat.`
    case 'COMPENSATION':
      return `"I'll make up for it later" — ${count}× this period. Later is fiction.`
    case 'SOCIAL_PRESSURE':
      return `"I can't say no" — ${count}× this period. You can. You haven't.`
    default:
      return `Used ${count}× this period.`
  }
}

function humanExcuse(category: string): string {
  return category.toLowerCase().replace(/_/g, ' ')
}

// ──────────────────── shared utilities ────────────────────

function readMeta(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function slipMatchesWindow(
  ts: Date,
  w: { dayOfWeek: number; startHour: number; endHour: number },
): boolean {
  const day = ts.getUTCDay()
  if (w.dayOfWeek !== -1 && w.dayOfWeek !== day) return false
  const hour = ts.getUTCHours()
  if (w.endHour <= w.startHour) {
    return hour >= w.startHour || hour < w.endHour
  }
  return hour >= w.startHour && hour < w.endHour
}

// Re-export ArchetypeFamily for callers building IDs from family slugs.
// Avoids forcing every consumer to also pull from audit-archetype.
export type { ArchetypeFamily }
