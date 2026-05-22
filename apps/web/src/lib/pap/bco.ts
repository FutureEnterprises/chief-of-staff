/**
 * PAP Behavioral Context Object (BCO) builder.
 *
 * The BCO is the read-only substrate any PAP-authorized LLM partner
 * sees about a single user at a single moment. It's the input to the
 * Proposal API — the LLM reads the BCO, decides whether to propose an
 * intervention, and emits a proposal that the coordinator scores.
 *
 * The BCO is assembled here from data the rest of COYL is already
 * collecting:
 *
 *   archetype              ← User.primaryWedge
 *   state + signalCluster  ← latest SignalCluster + intervention-mode
 *                            classifier
 *   activeDangerWindow     ← DangerWindow rows whose current-hour matches
 *   activeCommitments      ← Commitment rows where active=true
 *   selfTrustScore         ← latest ProductivityEvent of type
 *                            FEATURE_USED w/ eventValue='self_trust_score'
 *   recentInterventions    ← ProductivityEvent.AUTOPILOT_INTERRUPTED rows
 *   quietHoursActive       ← User.notificationPrefs.quietHours{Start,End}
 *                            evaluated against the user's local time
 *   intervention60dRateLimit
 *                          ← per-user 60-day fire ceiling minus
 *                            interventions fired in the trailing 60d
 *
 * This builder is intentionally read-only and side-effect free so it
 * can be called from any route, cron, or test without coupling to the
 * coordinator's audit/decision paths.
 *
 * Shape matches docs/protocol/proactive-ai-protocol.md §1 (with the
 * BIP-extension fields described in §"The Behavioral Context Object").
 */

import { prisma } from '@repo/database'
import { classifyState, lastSlip, type SignalSnapshot } from '@/lib/intervention-mode'
import { parsePrefs } from '@/lib/notification-prefs'

/** Per-user 60-day rate-limit ceiling. Default cohort number; users on */
/** strategic seats / clinical pilots may have a different limit set    */
/** elsewhere — we honor the ceiling at the coordinator, not here.      */
const INTERVENTIONS_PER_60_DAYS = 25

/** Window size for "recent interventions" included in the BCO. */
const RECENT_INTERVENTIONS_LIMIT = 10

export type BCOState = 'high_arousal' | 'low_arousal' | 'post_slip' | 'calm'

export interface BehavioralContextObject {
  userId: string
  asOf: string
  archetype: string | null
  state: BCOState
  stateConfidence: number
  activeDangerWindow: {
    id: string
    label: string
    startedAt: string
    endsAt: string
    confidence: number
  } | null
  signalCluster: {
    id: string | null
    capturedAt: string | null
    hrvDeltaPct: number | null
    sedentaryMins: number | null
    locationKind: string | null
    screenOnMins: number | null
    weekdayStress: string | null
    unlockRateDelta: number | null
  }
  activeCommitments: Array<{
    id: string
    rule: string
    domain: string
    kept: number
    broken: number
  }>
  selfTrustScore: number | null
  recentInterventions: Array<{
    firedAt: string
    mode: string
    outcome: string | null
    source: string | null
  }>
  quietHoursActive: boolean
  intervention60dRateLimit: {
    interventionsAllowed: number
    interventionsUsed: number
    remaining: number
    resetAt: string
  }
}

/**
 * buildBehavioralContextObject — assemble a fresh BCO for a user.
 *
 * Errors fail-safe: missing rows return null/empty values rather than
 * throwing. A user with zero SignalCluster rows yet (e.g. never
 * connected HealthKit) still gets a valid BCO with state='calm'.
 */
export async function buildBehavioralContextObject(
  userId: string,
): Promise<BehavioralContextObject> {
  const now = new Date()

  // Pull the user (archetype + timezone + notif prefs). If the user is
  // missing, return an empty BCO rather than throwing — the caller
  // (observation route) maps that to a 404 anyway.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      primaryWedge: true,
      timezone: true,
      notificationPrefs: true,
    },
  })

  if (!user) {
    return emptyBCO(userId, now)
  }

  // Parallelize the independent reads. Keeps the BCO fetch under one
  // round trip's worth of latency for the partner-facing endpoint.
  const [
    cluster,
    activeWindows,
    commitments,
    selfTrust,
    recentEvents,
    interventions60d,
    slip,
  ] = await Promise.all([
    prisma.signalCluster.findFirst({
      where: { userId },
      orderBy: { capturedAt: 'desc' },
      select: {
        id: true,
        capturedAt: true,
        hrvDeltaPct: true,
        sedentaryMins: true,
        locationKind: true,
        screenOnMins: true,
        weekdayStress: true,
        unlockRateDelta: true,
        dayOfWeek: true,
        hourOfDay: true,
      },
    }),
    prisma.dangerWindow.findMany({
      where: { userId, active: true },
      select: {
        id: true,
        label: true,
        dayOfWeek: true,
        startHour: true,
        endHour: true,
      },
    }),
    prisma.commitment.findMany({
      where: { userId, active: true },
      select: {
        id: true,
        rule: true,
        domain: true,
        keepCount: true,
        breakCount: true,
      },
    }),
    prisma.productivityEvent.findFirst({
      where: {
        userId,
        eventType: 'FEATURE_USED',
        eventValue: 'self_trust_score',
      },
      orderBy: { createdAt: 'desc' },
      select: { metadataJson: true, createdAt: true },
    }),
    prisma.productivityEvent.findMany({
      where: { userId, eventType: 'AUTOPILOT_INTERRUPTED' },
      orderBy: { createdAt: 'desc' },
      take: RECENT_INTERVENTIONS_LIMIT,
      select: {
        id: true,
        createdAt: true,
        eventValue: true,
        metadataJson: true,
      },
    }),
    countInterventions60d(userId, now),
    lastSlip(userId, 6),
  ])

  // Classify state from the latest cluster. No cluster yet → calm.
  const snapshot: SignalSnapshot = {
    hrvDeltaPct: cluster?.hrvDeltaPct,
    unlockRateDelta: cluster?.unlockRateDelta,
    weekdayStress: cluster?.weekdayStress,
    sedentaryMins: cluster?.sedentaryMins,
    screenOnMins: cluster?.screenOnMins,
  }
  const state: BCOState = cluster ? classifyState(snapshot, slip) : 'calm'

  // State confidence is a heuristic for v0.1 — we don't yet expose
  // PredictionModel calibration here. 0.9 when post_slip (deterministic),
  // 0.85 when high_arousal with HRV crash, 0.75 otherwise non-calm,
  // 0.6 for calm. Coordinator can override later with PredictionModel
  // outputs without changing the BCO consumer contract.
  const stateConfidence = scoreStateConfidence(state, snapshot)

  // Active danger window — match on current day-of-week + hour-of-day
  // in the user's local timezone. Same convention danger-window cron
  // already uses elsewhere in the codebase.
  const activeWindow = pickActiveDangerWindow(activeWindows, user.timezone ?? null, now)

  // Quiet hours from notification prefs. parsePrefs already null-safe.
  const prefs = parsePrefs(user.notificationPrefs)
  const quietHoursActive = isQuietHoursActive(
    prefs.quietHoursStart ?? null,
    prefs.quietHoursEnd ?? null,
    user.timezone ?? null,
    now,
  )

  // Pull the latest persisted self-trust score from the metadataJson
  // blob. Same convention self-trust-score.ts writes.
  const selfTrustScore = readSelfTrustScore(selfTrust?.metadataJson)

  // 60-day rate limit math. resetAt = 60d after the oldest still-in-
  // window intervention; if the user has fewer than the ceiling we use
  // "now + 60d" so the LLM sees a meaningful timestamp rather than null.
  const remaining = Math.max(0, INTERVENTIONS_PER_60_DAYS - interventions60d.count)
  const resetAt = interventions60d.oldestInWindow
    ? new Date(interventions60d.oldestInWindow.getTime() + 60 * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  return {
    userId,
    asOf: now.toISOString(),
    archetype: archetypeForUser(user.primaryWedge),
    state,
    stateConfidence,
    activeDangerWindow: activeWindow,
    signalCluster: {
      id: cluster?.id ?? null,
      capturedAt: cluster?.capturedAt ? cluster.capturedAt.toISOString() : null,
      hrvDeltaPct: cluster?.hrvDeltaPct ?? null,
      sedentaryMins: cluster?.sedentaryMins ?? null,
      locationKind: cluster?.locationKind ?? null,
      screenOnMins: cluster?.screenOnMins ?? null,
      weekdayStress: cluster?.weekdayStress ?? null,
      unlockRateDelta: cluster?.unlockRateDelta ?? null,
    },
    activeCommitments: commitments.map((c) => ({
      id: c.id,
      rule: c.rule,
      domain: String(c.domain),
      kept: c.keepCount,
      broken: c.breakCount,
    })),
    selfTrustScore,
    recentInterventions: recentEvents.map((e) => {
      const meta = readMeta(e.metadataJson)
      return {
        firedAt: e.createdAt.toISOString(),
        mode: typeof meta.mode === 'string' ? meta.mode : (e.eventValue ?? 'unknown'),
        outcome: typeof meta.feedback === 'string' ? meta.feedback : null,
        source: typeof meta.source === 'string' ? meta.source : null,
      }
    }),
    quietHoursActive,
    intervention60dRateLimit: {
      interventionsAllowed: INTERVENTIONS_PER_60_DAYS,
      interventionsUsed: interventions60d.count,
      remaining,
      resetAt: resetAt.toISOString(),
    },
  }
}

// ──────────────────────── helpers ────────────────────────

/**
 * countInterventions60d — total AUTOPILOT_INTERRUPTED events in the
 * trailing 60 days. Returns the count plus the oldest-in-window row's
 * timestamp (for the rolling resetAt computation).
 */
async function countInterventions60d(
  userId: string,
  now: Date,
): Promise<{ count: number; oldestInWindow: Date | null }> {
  const since = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const [count, oldest] = await Promise.all([
    prisma.productivityEvent.count({
      where: {
        userId,
        eventType: 'AUTOPILOT_INTERRUPTED',
        createdAt: { gte: since },
      },
    }),
    prisma.productivityEvent.findFirst({
      where: {
        userId,
        eventType: 'AUTOPILOT_INTERRUPTED',
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ])
  return { count, oldestInWindow: oldest?.createdAt ?? null }
}

/**
 * pickActiveDangerWindow — does any of the user's danger windows match
 * the current local day-of-week + hour-of-day? Returns the first match
 * (rather than all matches) because the BCO carries a single active
 * window field per the spec.
 */
function pickActiveDangerWindow(
  windows: Array<{
    id: string
    label: string
    dayOfWeek: number
    startHour: number
    endHour: number
  }>,
  timezone: string | null,
  now: Date,
): BehavioralContextObject['activeDangerWindow'] {
  if (windows.length === 0) return null

  const { dayOfWeek, hour } = localDowAndHour(timezone, now)

  for (const w of windows) {
    const dowMatches = w.dayOfWeek === -1 || w.dayOfWeek === dayOfWeek
    if (!dowMatches) continue
    const inHour = w.endHour > w.startHour
      ? hour >= w.startHour && hour < w.endHour
      : hour >= w.startHour || hour < w.endHour
    if (!inHour) continue

    // Build start/end timestamps for the current window crossing.
    // Use UTC offsets approximated from the local hour so the partner
    // sees something correct enough for display; the source of truth
    // remains the dayOfWeek/startHour/endHour triple on the row.
    const startedAt = new Date(now)
    startedAt.setHours(w.startHour, 0, 0, 0)
    const endsAt = new Date(startedAt)
    if (w.endHour > w.startHour) {
      endsAt.setHours(w.endHour, 0, 0, 0)
    } else {
      endsAt.setDate(endsAt.getDate() + 1)
      endsAt.setHours(w.endHour, 0, 0, 0)
    }

    return {
      id: w.id,
      label: w.label,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      confidence: 0.87,
    }
  }
  return null
}

function localDowAndHour(
  timezone: string | null,
  now: Date,
): { dayOfWeek: number; hour: number } {
  try {
    const tz = timezone ?? 'UTC'
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now)
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
    const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
    const dowMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    }
    return {
      dayOfWeek: dowMap[weekdayStr] ?? 0,
      hour: parseInt(hourStr, 10) || 0,
    }
  } catch {
    return { dayOfWeek: now.getUTCDay(), hour: now.getUTCHours() }
  }
}

/**
 * isQuietHoursActive — same wrap-midnight logic as
 * notification-prefs.shouldFire, but extracted so the BCO can publish
 * the flag (the partner LLM may want to know quiet hours are on without
 * trying to fire a proposal first).
 */
function isQuietHoursActive(
  qs: number | null,
  qe: number | null,
  timezone: string | null,
  now: Date,
): boolean {
  if (qs == null || qe == null) return false
  if (qs === qe) return false
  const { hour } = localDowAndHour(timezone, now)
  if (qe > qs) return hour >= qs && hour < qe
  // Wrap-midnight window (e.g. 22 → 7 means quiet 10pm-7am).
  return hour >= qs || hour < qe
}

function readMeta(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as Record<string, unknown>
}

function readSelfTrustScore(raw: unknown): number | null {
  const meta = readMeta(raw)
  return typeof meta.score === 'number' ? meta.score : null
}

/**
 * Translate the PrimaryWedge enum into a string the LLM partner can
 * read. The wedge is the closest thing we have to "archetype" at the
 * user level in v0.1; richer per-archetype slugs (the-9pm-negotiator,
 * the-spiral-extender, etc.) live in audit-archetype.ts and are
 * surfaced separately to UI consumers.
 */
function archetypeForUser(primaryWedge: unknown): string | null {
  if (typeof primaryWedge !== 'string') return null
  return primaryWedge.toLowerCase()
}

function scoreStateConfidence(
  state: BCOState,
  snapshot: SignalSnapshot,
): number {
  if (state === 'post_slip') return 0.9
  if (state === 'calm') return 0.6
  if (state === 'high_arousal') {
    const hrv = snapshot.hrvDeltaPct ?? 0
    if (hrv > 25) return 0.9
    if (hrv > 15) return 0.85
    return 0.75
  }
  // low_arousal — confidence is moderate because the trifecta is itself
  // a rule of thumb, not a calibrated probability.
  return 0.75
}

function emptyBCO(userId: string, now: Date): BehavioralContextObject {
  return {
    userId,
    asOf: now.toISOString(),
    archetype: null,
    state: 'calm',
    stateConfidence: 0.6,
    activeDangerWindow: null,
    signalCluster: {
      id: null,
      capturedAt: null,
      hrvDeltaPct: null,
      sedentaryMins: null,
      locationKind: null,
      screenOnMins: null,
      weekdayStress: null,
      unlockRateDelta: null,
    },
    activeCommitments: [],
    selfTrustScore: null,
    recentInterventions: [],
    quietHoursActive: false,
    intervention60dRateLimit: {
      interventionsAllowed: INTERVENTIONS_PER_60_DAYS,
      interventionsUsed: 0,
      remaining: INTERVENTIONS_PER_60_DAYS,
      resetAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  }
}
