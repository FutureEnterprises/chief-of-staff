/**
 * RAP store — persistence + integration helpers for the Risk Assessment
 * Protocol (RAP v0.1) reference engine. Owns the row lifecycle for
 * RAPAssessment + RAPEscalation and exposes the coaching-path-closed
 * query that PAP uses to refuse new proposals while RAP has the path
 * locked open for human review.
 *
 * Every assessment is recorded as a stateless, per-moment row. The
 * signal chain that drove the classification is stored verbatim so a
 * Trust & Safety reviewer can re-run the classifier months later and
 * confirm reproducibility (RAP-0.1.md §3 — the audit replay requirement).
 *
 * Strict separation:
 *   - This module does NOT classify (that's the RAP classifier).
 *   - This module does NOT decide whether to coach (that's PAP, which
 *     queries `isUserCoachingPathClosed` and refuses proposals if true).
 *   - This module does NOT route the user (that's the routing layer,
 *     which records the concrete escalation via `recordEscalation`).
 *
 * It just owns the row lifecycle and the path-closed state.
 *
 * See docs/protocol/RAP-0.1.md.
 */

import { prisma } from '@repo/database'
import type {
  RAPRiskClass,
  RAPAssessment,
  RAPEscalation,
} from '@repo/database'

/* ──────────────────── ttlSeconds defaults ──────────────────── */

/**
 * Default TTL (in seconds) for an assessment by risk class. The TTL is
 * advisory metadata captured on the row — it tells downstream consumers
 * how long this classification should be considered fresh before a
 * re-classification is warranted.
 *
 * Crisis + emergency are short (60s) — the next signal must re-classify
 * fresh so we don't act on a stale assessment if conditions shift.
 * Pattern-relapse persists longer (600s = 10 min) since the signal
 * comes from a slower-moving behavioral pattern. Routine friction
 * persists longest (1800s = 30 min) — the default coaching context.
 */
function defaultTtlSeconds(riskClass: RAPRiskClass): number {
  switch (riskClass) {
    case 'LEGAL_OR_MEDICAL_EMERGENCY':
    case 'CRISIS_INDICATION':
      return 60
    case 'PATTERN_RELAPSE':
      return 600
    case 'ROUTINE_FRICTION':
    default:
      return 1800
  }
}

/**
 * Whether a risk class implies the coaching path should be closed by
 * default. Crisis + emergency assessments close the path until a
 * human-reviewed re-open is logged (RAP-0.1.md §2 — "Coaching path
 * closed for the session" / "ai_must_refuse_coaching").
 */
function defaultCoachingPathClosed(riskClass: RAPRiskClass): boolean {
  return (
    riskClass === 'CRISIS_INDICATION' ||
    riskClass === 'LEGAL_OR_MEDICAL_EMERGENCY'
  )
}

/* ──────────────────── writeAssessment ──────────────────── */

/**
 * Persist a single RAPAssessment row. Auto-derives `coachingPathClosed`
 * and `ttlSeconds` from `riskClass` when the caller doesn't override.
 *
 * Caller is responsible for:
 *   - producing the `rationaleSignature` (sha256 of the canonical
 *     signal chain) — recorded for audit replay.
 *   - producing the `classifierVersion` string so a reviewer knows
 *     which classifier revision drove this row.
 *   - constructing the `routingEnvelope` per RAP-0.1.md §4 (null for
 *     ROUTINE_FRICTION; populated for the other three classes).
 *
 * The signal chain is stored verbatim as Json so the assessment is
 * reproducible against the same classifier version (RAP-0.1.md §3).
 */
export async function writeAssessment(input: {
  userId: string
  riskClass: RAPRiskClass
  rationaleSignature: string
  classifierVersion: string
  signalChain: unknown[]
  ttlSeconds?: number
  triggerKind: 'pap_proposal' | 'eap_action_request' | 'manual' | 'bip_signal'
  triggerRefId?: string
  routingEnvelope?: Record<string, unknown> | null
  coachingPathClosed?: boolean
}): Promise<RAPAssessment> {
  const ttl = input.ttlSeconds ?? defaultTtlSeconds(input.riskClass)
  const pathClosed =
    input.coachingPathClosed ?? defaultCoachingPathClosed(input.riskClass)

  return prisma.rAPAssessment.create({
    data: {
      userId: input.userId,
      riskClass: input.riskClass,
      rationaleSignature: input.rationaleSignature,
      classifierVersion: input.classifierVersion,
      signalChain: input.signalChain as object,
      ttlSeconds: ttl,
      triggerKind: input.triggerKind,
      triggerRefId: input.triggerRefId ?? null,
      routingEnvelope:
        input.routingEnvelope === undefined
          ? null
          : (input.routingEnvelope as object | null),
      coachingPathClosed: pathClosed,
    },
  })
}

/* ──────────────────── loadAssessment ──────────────────── */

/**
 * Fetch a single assessment by id. Returns null if the row doesn't
 * exist. Used by audit / replay tooling and by the routing layer to
 * look up the assessment that produced a given escalation.
 */
export async function loadAssessment(
  assessmentId: string
): Promise<RAPAssessment | null> {
  return prisma.rAPAssessment.findUnique({ where: { id: assessmentId } })
}

/* ──────────────────── isUserCoachingPathClosed ──────────────────── */

/**
 * Returns true if the user has an active crisis/emergency assessment
 * whose coaching path has not been reopened. Used by the PAP coordinator
 * to refuse new proposals when RAP has closed the path.
 *
 * Sliding-window: only assessments from the last hour count. Old crises
 * don't permanently lock the user out — if the user crossed back into
 * ROUTINE_FRICTION naturally over time without an explicit human re-open,
 * the window expires and PAP can resume. (The explicit re-open via
 * `reopenCoachingPath` is the audited path for clinician sign-off; this
 * sliding window is the safety-net fallback for routine recovery.)
 */
export async function isUserCoachingPathClosed(
  userId: string
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const row = await prisma.rAPAssessment.findFirst({
    where: {
      userId,
      coachingPathClosed: true,
      pathReopenedAt: null,
      createdAt: { gte: oneHourAgo },
    },
    select: { id: true },
  })

  return row !== null
}

/* ──────────────────── reopenCoachingPath ──────────────────── */

/**
 * Reopen the coaching path after a human review (e.g. clinician
 * sign-off, user explicit re-engagement after the crisis window).
 * Records the reopen reason on every still-closed assessment for the
 * user so the audit trail captures who authorized the resume and why.
 *
 * Returns the number of rows updated — typically 1, but >1 is possible
 * if multiple crises stacked before a single review reopened them all.
 */
export async function reopenCoachingPath(params: {
  userId: string
  reason: string
}): Promise<{ reopenedCount: number }> {
  const now = new Date()

  const result = await prisma.rAPAssessment.updateMany({
    where: {
      userId: params.userId,
      coachingPathClosed: true,
      pathReopenedAt: null,
    },
    data: {
      pathReopenedAt: now,
      pathReopenedReason: params.reason,
    },
  })

  return { reopenedCount: result.count }
}

/* ──────────────────── recordEscalation ──────────────────── */

/**
 * Record a concrete escalation event tied to an assessment. One
 * assessment can produce multiple escalations (e.g., 988 + user
 * emergency contact + clinician), so each call appends a new row.
 *
 * `escalatedTo` is the target identifier — "988", "741741", "911",
 * "user_emergency_contact", "clinician", "pod_accountability", or any
 * other callable consumer of the routing envelope.
 *
 * `envelopeKind` mirrors the routing envelope discriminator from
 * RAP-0.1.md §4 ("crisis_referral", "emergency_referral",
 * "pattern_relapse_signal", "accountability_referral").
 */
export async function recordEscalation(input: {
  assessmentId: string
  escalatedTo: string
  envelopeKind: string
  outcome?: string
}): Promise<RAPEscalation> {
  return prisma.rAPEscalation.create({
    data: {
      assessmentId: input.assessmentId,
      escalatedTo: input.escalatedTo,
      envelopeKind: input.envelopeKind,
      outcome: input.outcome ?? null,
      outcomeNotedAt: input.outcome ? new Date() : null,
    },
  })
}

/* ──────────────────── loadUserAssessments ──────────────────── */

/**
 * Query the user's last N assessments for an audit-trail view.
 * Returns rows in createdAt DESC order — newest first.
 *
 * `limit` defaults to 50, capped at 500 to keep audit-trail page loads
 * bounded. `since` optionally restricts the window to recent activity
 * (useful when the audit UI paginates by date range rather than count).
 */
export async function loadUserAssessments(params: {
  userId: string
  limit?: number
  since?: Date
}): Promise<RAPAssessment[]> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 500)

  return prisma.rAPAssessment.findMany({
    where: {
      userId: params.userId,
      ...(params.since ? { createdAt: { gte: params.since } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
