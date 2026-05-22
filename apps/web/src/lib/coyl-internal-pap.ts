/**
 * COYL Internal PAP partner — server-side proposal helper.
 *
 * Lets COYL's own server emit PAPProposal rows as if it were an
 * external LLM partner. First production integration of PAP: every
 * call here creates a persisted row in pap_proposals with
 * llmPartnerId = 'coyl_internal'. /protocol points at a live row
 * count as proof the spec is a running surface, not a doc.
 *
 * Bypasses the Bearer-token auth step (the 'coyl_internal' partner
 * has a sentinel apiKeyHash that cannot match any bcrypt'd real key).
 * All other coordinator gates — panic, quiet hours, rate limit,
 * dedup, confidence — still apply against the real user state.
 *
 * Fire-and-forget by design. Wrap callers in try/catch; a proposal
 * failure must NEVER break a user-facing render.
 */
import { randomBytes } from 'node:crypto'
import { prisma } from '@repo/database'
import { evaluateProposal } from '@/lib/coordinator'
import type { CoordinatorDecision } from '@/lib/coordinator'

export const COYL_INTERNAL_PARTNER_ID = 'coyl_internal'

export type CoylInternalAction = {
  kind: string
  modality: string
  mode: string
  headline: string
  subhead?: string
}

export type CoylInternalContext = {
  trigger: string
  confidence?: number
  reasoning?: string
}

/**
 * Propose an intervention as COYL Internal. Returns the coordinator
 * decision and the persisted PAPProposal row id (when persisted).
 *
 * Idempotency: caller supplies proposalKey. Same key returns the
 * existing row's decision verbatim — safe to call inside a server
 * component render that may be re-evaluated.
 */
export async function proposeAsCoylInternal(params: {
  userId: string
  proposalKey: string
  scopeRequested: string[]
  action: CoylInternalAction
  context: CoylInternalContext
}): Promise<{ decision: CoordinatorDecision; proposalId?: string }> {
  const existing = await prisma.pAPProposal.findUnique({
    where: { proposalKey: params.proposalKey },
    select: { id: true, decision: true, decisionReason: true },
  })
  if (existing) {
    return {
      decision: {
        decision: existing.decision as 'allowed' | 'denied' | 'queued',
        reason: existing.decisionReason ?? undefined,
      } as CoordinatorDecision,
      proposalId: existing.id,
    }
  }

  const decision = await evaluateProposal({
    llmPartnerId: COYL_INTERNAL_PARTNER_ID,
    userId: params.userId,
    scopeRequested: params.scopeRequested,
    action: {
      headline: params.action.headline,
      subhead: params.action.subhead,
      mode: params.action.mode,
    },
    context: { confidence: params.context.confidence },
  })

  // Persist regardless of decision — denied rows are useful audit
  // signal for the admin dashboard and the /protocol live count.
  const row = await prisma.pAPProposal.create({
    data: {
      proposalKey: params.proposalKey,
      llmPartnerId: COYL_INTERNAL_PARTNER_ID,
      userId: params.userId,
      scopeRequested: params.scopeRequested,
      actionJson: params.action as unknown as object,
      contextJson: params.context as unknown as object,
      decision: decision.decision,
      decisionReason:
        decision.decision === 'allowed'
          ? null
          : 'reason' in decision
            ? decision.reason
            : null,
      executionToken:
        decision.decision === 'allowed' ? mintExecutionToken() : null,
    },
    select: { id: true },
  })

  return { decision, proposalId: row.id }
}

function mintExecutionToken(): string {
  return `coyl_exec_${randomBytes(16).toString('hex')}`
}
