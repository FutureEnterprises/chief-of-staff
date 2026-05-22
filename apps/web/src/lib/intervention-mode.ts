/**
 * intervention-mode — Layer 3 of "Honest Gap".
 *
 * The wedge: same interrupt regardless of state = fails. A 9 PM person
 * standing wired in their kitchen needs a different cue than a 4 PM
 * person who has been on the couch for two hours. We classify the
 * current SignalCluster into a behavioral state, then pick an
 * intervention mode matched to that state (and to the archetype, when
 * the archetype shifts the priority).
 *
 * The classifier is a pure function so it can run in API routes, in
 * cron jobs, in tests, anywhere. It does NOT call the database. The
 * `recentMode` helper IS database-aware — used to suppress firing the
 * same mode twice in quick succession (which makes interventions feel
 * mechanical and trains the user to ignore them).
 *
 * STATE CLASSIFICATION
 *   high_arousal — sympathetic spike. HRV crashed OR phone unlock rate
 *                  surged OR contextual signal says high-stress weekday
 *                  window. The user is wound up; we want to drop them
 *                  out of the body sensation.
 *   low_arousal  — collapse / drift. Sedentary for >90 min AND screen
 *                  use low AND HRV stable. The user has gone limp; we
 *                  want to surface a redirect, not a stop sign.
 *   post_slip    — a SlipRecord exists within the last 6 hours. The
 *                  spiral window. The state of the body is irrelevant
 *                  compared to the state of the story they're telling.
 *   calm         — none of the above. We do not fire interrupts here.
 *
 * MODE SELECTION
 *   Modes are 1:1 with classified state for the common case. The one
 *   exception is the Spiral Extender archetype, whose entire failure
 *   mode is "I already messed up anyway" — for them, post_slip is the
 *   HIGHEST priority window. We promote it past other concurrent
 *   states. Other archetypes can layer in additional biasing as the
 *   model learns.
 */

import { prisma } from '@repo/database'

export type InterventionMode = 'high_arousal' | 'low_arousal' | 'post_slip' | 'calm'

/**
 * Subset of SignalCluster fields the classifier consumes. Stays loose
 * because the Prisma model still has many optional/null fields and we
 * don't want callers having to pass the full row.
 */
export type SignalSnapshot = {
  hrvDeltaPct?: number | null
  unlockRateDelta?: number | null
  weekdayStress?: string | null
  sedentaryMins?: number | null
  screenOnMins?: number | null
}

/** Minimal SlipRecord shape used by the post-slip check. */
export type RecentSlip = {
  createdAt: Date
}

/**
 * classifyState — pure rule-based mapping from a SignalCluster snapshot
 * (+ optional recent slip) to an intervention mode.
 *
 * Order matters:
 *   1. A recent slip dominates whatever the body is doing — the spiral
 *      story is the active risk surface.
 *   2. High-arousal signals beat low-arousal because being wound up is
 *      easier for us to interrupt usefully than being limp.
 *   3. Low-arousal requires ALL three sub-signals (sedentary, low
 *      screen, stable HRV) — being just sedentary isn't enough; we'd
 *      false-fire on people working at a desk.
 *   4. Otherwise: calm.
 */
export function classifyState(
  cluster: SignalSnapshot,
  recentSlip?: RecentSlip | null,
): InterventionMode {
  if (recentSlip && hoursSince(recentSlip.createdAt) < 6) {
    return 'post_slip'
  }

  const hrvDelta = cluster.hrvDeltaPct ?? 0
  const unlockDelta = cluster.unlockRateDelta ?? 0
  const stressLevel = cluster.weekdayStress ?? null

  // High-arousal: any one of these is enough. HRV-crash threshold of
  // >15% is the conservative end of the literature (see Phase 1
  // protocol notes); unlock-rate doubling is the textbook anxious
  // checking signature; explicit 'high' weekdayStress is whatever the
  // contextual classifier upstream decides — we honor its label.
  if (hrvDelta > 15 || unlockDelta > 200 || stressLevel === 'high') {
    return 'high_arousal'
  }

  const sedentary = cluster.sedentaryMins ?? 0
  const screenOn = cluster.screenOnMins ?? Number.POSITIVE_INFINITY
  // Low-arousal: needs the trifecta. Sedentary alone is too coarse.
  if (sedentary > 90 && screenOn < 30 && Math.abs(hrvDelta) < 5) {
    return 'low_arousal'
  }

  return 'calm'
}

/** Hours elapsed between `then` and now. Float, not integer. */
function hoursSince(then: Date): number {
  return (Date.now() - then.getTime()) / (1000 * 60 * 60)
}

/**
 * Reason returned alongside a mode pick so logs + UI debug surfaces
 * can show WHY a given intervention shape was chosen. Keep it human.
 */
export type ModeSelection = {
  mode: InterventionMode
  reason: string
}

/**
 * selectMode — combines the state classifier with archetype-aware
 * biasing and recent-mode suppression.
 *
 * Archetype biasing today:
 *   • the-spiral-extender — post_slip is HIGHEST priority. Even if the
 *     state classifier returns calm/high_arousal, if the user has any
 *     slip in the last 6h we promote to post_slip because the spiral
 *     story IS the failure mode for this archetype.
 *
 * Recent-mode suppression:
 *   If the same mode fired within `suppressionHours`, we downgrade to
 *   calm. This keeps the system from feeling like a stuck whistle. The
 *   caller is responsible for honoring `mode === 'calm' → don't fire`.
 */
export function selectMode(args: {
  state: InterventionMode
  archetype?: string | null
  recentSlip?: RecentSlip | null
  recentInterventionMode?: string | null
  suppressionHours?: number
}): ModeSelection {
  const { state, archetype, recentSlip, recentInterventionMode } = args
  const suppressionHours = args.suppressionHours ?? 2

  let mode: InterventionMode = state
  let reason = `state=${state}`

  // Archetype override: Spiral Extender always sees post-slip first.
  if (
    archetype === 'the-spiral-extender' &&
    recentSlip &&
    hoursSince(recentSlip.createdAt) < 6 &&
    mode !== 'post_slip'
  ) {
    reason = `archetype=spiral-extender promoted state=${state} to post_slip`
    mode = 'post_slip'
  }

  // Suppression: don't fire the same mode in a row. Calm passes through
  // because calm is itself a non-fire — suppressing it would create the
  // wrong inversion ("we were calm, now we're calm again, fire?").
  if (
    mode !== 'calm' &&
    recentInterventionMode === mode &&
    typeof suppressionHours === 'number' &&
    suppressionHours > 0
  ) {
    reason = `suppressed: ${mode} fired within last ${suppressionHours}h`
    mode = 'calm'
  }

  return { mode, reason }
}

/**
 * recentMode — what intervention mode (if any) fired within the last
 * `hours` for this user. Reads the AUTOPILOT_INTERRUPTED productivity
 * event stream and returns the `mode` field from its metadataJson.
 *
 * Returns null when there's no event in the window or when the event
 * was written before we started tagging mode into metadata (legacy
 * events).
 */
export async function recentMode(
  userId: string,
  hours = 24,
): Promise<string | null> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const event = await prisma.productivityEvent.findFirst({
    where: {
      userId,
      eventType: 'AUTOPILOT_INTERRUPTED',
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    select: { metadataJson: true },
  })

  if (!event || !event.metadataJson) return null
  const meta = event.metadataJson
  if (typeof meta !== 'object' || Array.isArray(meta)) return null
  const candidate = (meta as Record<string, unknown>).mode
  return typeof candidate === 'string' ? candidate : null
}

/**
 * lastSlip — convenience wrapper for callers that don't already have
 * the slip in scope. Returns the most recent SlipRecord within `hours`.
 */
export async function lastSlip(
  userId: string,
  hours = 6,
): Promise<RecentSlip | null> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)
  const slip = await prisma.slipRecord.findFirst({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  return slip ?? null
}
