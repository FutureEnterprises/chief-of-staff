/**
 * Coordinator entry points — the decision brain for PAP + EAP.
 *
 * Five independent gate functions compose into three orchestrators:
 *
 *   evaluateProposal       — PAP layer (LLM-emitted intervention)
 *   evaluateAction         — EAP layer (single-device action)
 *   evaluateOrchestration  — EAP multi-device composite flow
 *
 * Strict gate ordering, safety-floor first, then cheapest → most expensive:
 *
 *   0. RAP coaching-path closed  (1 indexed DB row, absolute deny — PAP only)
 *   1. panic                     (1 indexed DB row, absolute deny)
 *   2. quiet hours               (1 indexed DB row, absolute deny)
 *   3. confidence                (pure compute, no DB)
 *   4. rate limit                (4 count queries: partner+global × proposal+action)
 *   5. dedup                     (find_many + TF-cosine on up to 50 rows)
 *
 * Why this order: the RAP coaching-path closure is the absolute floor —
 * a crisis-class assessment closes the path and ALL coaching must stop
 * until a human re-opens it (RAP-0.1.md §2). After that, panic + quiet
 * hours are absolute denies users opted into — they should NEVER be
 * overridden by anything cheaper. Confidence is next because it's free
 * (no DB hit) and the LLM's own score is the fastest signal we have.
 * Rate limit and dedup require multiple DB hits each, so they run last
 * to short-circuit on cheaper denies above.
 *
 * NOTE on transactions: each gate is read-only. The coordinator does
 * NOT write the PAPProposal / ActionRequest row — that's the caller's
 * job (the PAP/EAP endpoints), which lets the caller record the
 * decision verbatim alongside the inserted row in a single statement.
 */

import { isPanicActive } from './panic-check'
import { isInQuietHours } from './quiet-hours'
import { isAboveConfidenceThreshold, DEFAULT_CONFIDENCE_THRESHOLD } from './confidence-gate'
import { checkLLMPartnerRateLimit } from './rate-limit'
import { checkProposalDedup } from './dedup'
import { isUserCoachingPathClosed as defaultIsUserCoachingPathClosed } from '@/lib/rap/store'

// Re-export the gates so callers/tests can use them individually.
export { isPanicActive } from './panic-check'
export { isInQuietHours } from './quiet-hours'
export {
  isAboveConfidenceThreshold,
  DEFAULT_CONFIDENCE_THRESHOLD,
} from './confidence-gate'
export {
  checkLLMPartnerRateLimit,
  GLOBAL_USER_DAILY_LIMIT,
} from './rate-limit'
export {
  checkProposalDedup,
  DEDUP_WINDOW_MS,
  DEDUP_SIMILARITY_THRESHOLD,
} from './dedup'

// ─────────────────────── Result types ───────────────────────

export type AllowedDecision = { decision: 'allowed' }
export type DeniedDecision = {
  decision: 'denied'
  reason: DenialReason
  detail?: string
}
export type QueuedDecision = {
  decision: 'queued'
  reason: QueueReason
  competingProposals: string[]
}

export type CoordinatorDecision = AllowedDecision | DeniedDecision | QueuedDecision

export type DenialReason =
  | 'panic_active'
  | 'quiet_hours'
  | 'confidence_too_low'
  | 'rate_limited'
  | 'partner_inactive'
  | 'rap_coaching_path_closed'

export type QueueReason = 'deduplication_pending'

// ─────────────────────── Proposal input shape ───────────────────────

export type ProposalInput = {
  llmPartnerId: string
  userId: string
  scopeRequested: string[]
  action: { headline?: string; subhead?: string; mode?: string }
  context: { confidence?: number }
}

/**
 * Optional dependency-injection slot for the RAP coaching-path gate.
 * Defaults to the real Prisma-backed store lookup; tests substitute a
 * stub so they don't need a DB connection to verify the wiring.
 */
export type EvaluateProposalDeps = {
  isUserCoachingPathClosed?: (userId: string) => Promise<boolean>
}

export async function evaluateProposal(
  proposal: ProposalInput,
  asOf: Date = new Date(),
  deps: EvaluateProposalDeps = {},
): Promise<CoordinatorDecision> {
  const isCoachingPathClosed =
    deps.isUserCoachingPathClosed ?? defaultIsUserCoachingPathClosed

  // 0. RAP coaching-path closure — absolute floor. A CRISIS_INDICATION
  // or LEGAL_OR_MEDICAL_EMERGENCY assessment that closed the coaching
  // path must silence ALL subsequent PAP proposals for the same user
  // until a human-reviewed reopen lands (see docs/protocol/RAP-0.1.md
  // §2). This runs BEFORE panic/quiet-hours/confidence/rate-limit/dedup
  // because crisis closure supersedes every other gate.
  if (await isCoachingPathClosed(proposal.userId)) {
    return { decision: 'denied', reason: 'rap_coaching_path_closed' }
  }

  // 1. Panic — absolute deny
  if (await isPanicActive(proposal.userId, asOf)) {
    return { decision: 'denied', reason: 'panic_active' }
  }

  // 2. Quiet hours — absolute deny
  if (await isInQuietHours(proposal.userId, asOf)) {
    return { decision: 'denied', reason: 'quiet_hours' }
  }

  // 3. Confidence — pure compute
  if (
    proposal.context.confidence !== undefined &&
    !isAboveConfidenceThreshold(
      { context: proposal.context },
      DEFAULT_CONFIDENCE_THRESHOLD,
    )
  ) {
    return {
      decision: 'denied',
      reason: 'confidence_too_low',
      detail: `score=${proposal.context.confidence}`,
    }
  }

  // 4. Rate limit
  const rateCheck = await checkLLMPartnerRateLimit(
    proposal.llmPartnerId,
    proposal.userId,
    asOf,
  )
  if (!rateCheck.allowed) {
    return {
      decision: 'denied',
      reason: rateCheck.band === 'partner_hourly' && rateCheck.remaining === 0
        ? 'rate_limited'
        : 'rate_limited',
      detail: `band=${rateCheck.band} resetAt=${rateCheck.resetAt.toISOString()}`,
    }
  }

  // 5. Dedup — queued rather than denied, so the caller can score the
  // competitors later and pick the winner.
  const dedupCheck = await checkProposalDedup(
    { userId: proposal.userId, action: proposal.action },
    asOf,
  )
  if (dedupCheck.isDuplicate) {
    return {
      decision: 'queued',
      reason: 'deduplication_pending',
      competingProposals: dedupCheck.competingProposals.map((p) => p.id),
    }
  }

  return { decision: 'allowed' }
}

// ─────────────────────── Action (EAP) input shape ───────────────────────

export type ActionInput = {
  llmPartnerId: string
  userId: string
  deviceId: string
  scopeRequested: string
  confidence?: number
  /** Optional headline/subhead so we can dedup at the action layer
   *  too (e.g. two LLMs racing to push the same notification). */
  reasoning?: string
}

export async function evaluateAction(
  action: ActionInput,
  asOf: Date = new Date(),
): Promise<CoordinatorDecision> {
  // 1. Panic — absolute deny
  if (await isPanicActive(action.userId, asOf)) {
    return { decision: 'denied', reason: 'panic_active' }
  }

  // 2. Quiet hours — absolute deny
  if (await isInQuietHours(action.userId, asOf)) {
    return { decision: 'denied', reason: 'quiet_hours' }
  }

  // 3. Confidence — pure compute
  if (
    action.confidence !== undefined &&
    !isAboveConfidenceThreshold(
      { confidence: action.confidence },
      DEFAULT_CONFIDENCE_THRESHOLD,
    )
  ) {
    return {
      decision: 'denied',
      reason: 'confidence_too_low',
      detail: `score=${action.confidence}`,
    }
  }

  // 4. Rate limit (shared across PAP+EAP per the rate-limit module)
  const rateCheck = await checkLLMPartnerRateLimit(
    action.llmPartnerId,
    action.userId,
    asOf,
  )
  if (!rateCheck.allowed) {
    return {
      decision: 'denied',
      reason: 'rate_limited',
      detail: `band=${rateCheck.band} resetAt=${rateCheck.resetAt.toISOString()}`,
    }
  }

  // 5. Dedup — only when reasoning text is provided. EAP actions
  // without user-facing text (e.g. raw haptic) skip dedup; the
  // proposal layer that birthed them already deduped.
  if (action.reasoning) {
    const dedupCheck = await checkProposalDedup(
      {
        userId: action.userId,
        action: { headline: action.reasoning, subhead: '' },
      },
      asOf,
    )
    if (dedupCheck.isDuplicate) {
      return {
        decision: 'queued',
        reason: 'deduplication_pending',
        competingProposals: dedupCheck.competingProposals.map((p) => p.id),
      }
    }
  }

  return { decision: 'allowed' }
}

// ─────────────────────── Orchestration input shape ───────────────────────

export type OrchestrationStep = ActionInput

export type OrchestrationInput = {
  llmPartnerId: string
  userId: string
  atomicity: 'all_or_none' | 'best_effort'
  steps: OrchestrationStep[]
}

export type OrchestrationDecision =
  | { decision: 'allowed'; stepDecisions: CoordinatorDecision[] }
  | {
      decision: 'denied'
      reason: DenialReason | 'atomicity_violation'
      detail?: string
      stepDecisions: CoordinatorDecision[]
    }
  | {
      decision: 'partial'
      stepDecisions: CoordinatorDecision[]
    }

export async function evaluateOrchestration(
  orchestration: OrchestrationInput,
  asOf: Date = new Date(),
): Promise<OrchestrationDecision> {
  const stepDecisions: CoordinatorDecision[] = []
  for (const step of orchestration.steps) {
    const d = await evaluateAction(step, asOf)
    stepDecisions.push(d)
  }

  const allAllowed = stepDecisions.every((d) => d.decision === 'allowed')
  const anyAllowed = stepDecisions.some((d) => d.decision === 'allowed')

  if (allAllowed) {
    return { decision: 'allowed', stepDecisions }
  }

  // atomicity='all_or_none': if any child is denied/queued, the whole
  // orchestration is denied — propagate the first non-allowed reason.
  if (orchestration.atomicity === 'all_or_none') {
    const firstFail = stepDecisions.find((d) => d.decision !== 'allowed')
    if (firstFail && firstFail.decision === 'denied') {
      return {
        decision: 'denied',
        reason: firstFail.reason,
        detail: firstFail.detail,
        stepDecisions,
      }
    }
    // queued under all_or_none = still a no-go for the bundle
    return {
      decision: 'denied',
      reason: 'atomicity_violation',
      detail: 'all_or_none requires every step allowed',
      stepDecisions,
    }
  }

  // best_effort: at least one allowed → partial; zero allowed → denied
  if (anyAllowed) {
    return { decision: 'partial', stepDecisions }
  }
  const firstFail = stepDecisions.find((d) => d.decision === 'denied')
  if (firstFail && firstFail.decision === 'denied') {
    return {
      decision: 'denied',
      reason: firstFail.reason,
      detail: firstFail.detail,
      stepDecisions,
    }
  }
  // All steps queued (dedup) under best_effort — surface as partial
  // so the caller can decide whether to re-run after the dedup window.
  return { decision: 'partial', stepDecisions }
}
