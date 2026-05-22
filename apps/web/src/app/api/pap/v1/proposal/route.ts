/**
 * POST /api/pap/v1/proposal — LLM emits a proposed intervention.
 *
 * Primitive #2 of the Proactive AI Protocol. This is the gatekeeper:
 * even if 5 LLMs all want to fire in the same window, the coordinator
 * picks (rate limits, dedups, respects panic + quiet hours + confidence
 * threshold + scope grants).
 *
 * Auth:
 *   - Bearer LLM-partner token.
 *
 * Idempotency:
 *   - proposalKey is unique per LLM proposal. Re-sending with the same
 *     proposalKey returns the original decision verbatim. This keeps
 *     network retries safe.
 *
 * Decision flow:
 *   1. Authenticate the partner.
 *   2. Parse + validate the body.
 *   3. If proposalKey already exists for any partner, return its
 *      decision (idempotent replay).
 *   4. Panic gate (absolute deny via coordinator).
 *   5. Scope grants — every scope in scopeRequested must be granted.
 *   6. Coordinator evaluation (rate limit + dedup + quiet hours +
 *      confidence threshold).
 *   7. Persist the PAPProposal row with the decision; mint an
 *      executionToken when allowed.
 *   8. Write EAPAuditEntry (event: 'pap_proposal_received').
 *   9. Return { decision, executionToken?, scheduledFor?, ... }.
 */

import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { prisma } from '@repo/database'
import { authenticateLLMPartner } from '@/lib/llm-partner-auth'
import { assertScopeGrant, ScopeNotGrantedError } from '@/lib/scope-grants'
import { evaluateProposal, isPanicActive } from '@/lib/coordinator'

export const maxDuration = 15

type Body = {
  proposalKey?: string
  userId?: string
  scopeRequested?: string[]
  action?: {
    kind?: string
    modality?: string
    mode?: string
    headline?: string
    subhead?: string
    [k: string]: unknown
  }
  context?: {
    trigger?: string
    confidence?: number
    reasoning?: string
    [k: string]: unknown
  }
}

export async function POST(req: Request) {
  const authResult = await authenticateLLMPartner(req)
  if (authResult.error) return authResult.error
  const partner = authResult.partner

  let body: Body = {}
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.proposalKey || typeof body.proposalKey !== 'string') {
    return NextResponse.json({ error: 'missing_proposal_key' }, { status: 400 })
  }
  if (!body.userId || typeof body.userId !== 'string') {
    return NextResponse.json({ error: 'missing_user_id' }, { status: 400 })
  }
  if (!Array.isArray(body.scopeRequested) || body.scopeRequested.length === 0) {
    return NextResponse.json({ error: 'missing_scope_requested' }, { status: 400 })
  }
  if (!body.action || typeof body.action !== 'object') {
    return NextResponse.json({ error: 'missing_action' }, { status: 400 })
  }

  const proposalKey = body.proposalKey
  const userId = body.userId
  const scopeRequested = body.scopeRequested.filter((s): s is string => typeof s === 'string')
  const action = body.action
  const context = body.context ?? {}

  // Idempotency — replay returns the original decision verbatim.
  const existing = await prisma.pAPProposal.findUnique({
    where: { proposalKey },
    select: {
      id: true,
      decision: true,
      decisionReason: true,
      executionToken: true,
      scheduledFor: true,
      llmPartnerId: true,
      userId: true,
    },
  })
  if (existing) {
    // Lock idempotency to the original partner/user — if another
    // partner reuses the key, treat it as a conflict.
    if (existing.llmPartnerId !== partner.id || existing.userId !== userId) {
      return NextResponse.json(
        { error: 'proposal_key_conflict' },
        { status: 409 },
      )
    }
    return NextResponse.json(serializeDecision(existing))
  }

  // Confirm the user exists. We do this AFTER idempotency check so a
  // legitimate retry of a still-valid proposal doesn't 404.
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!userExists) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }

  const now = new Date()

  // Panic check first — even before scope, because panic supersedes
  // every grant. (The coordinator also re-checks panic; this is a
  // belt-and-suspenders deny so we 403 with a clear reason.)
  if (await isPanicActive(userId, now)) {
    const row = await persistDecision({
      proposalKey,
      partnerId: partner.id,
      userId,
      scopeRequested,
      action,
      context,
      decision: 'denied',
      decisionReason: 'panic_active',
      scheduledFor: null,
      executionToken: null,
    })
    await writeAudit({
      userId,
      llmPartnerId: partner.id,
      referenceId: row.id,
      payload: {
        kind: 'pap_proposal_received',
        decision: 'denied',
        reason: 'panic_active',
        scopeRequested,
      },
      req,
    })
    return NextResponse.json({
      decision: 'denied',
      reason: 'panic_active',
    })
  }

  // Scope check — every requested scope must be granted by this user
  // to this partner. We fail closed on the first missing scope so the
  // LLM can re-request narrower authority on retry.
  for (const scope of scopeRequested) {
    try {
      await assertScopeGrant({
        userId,
        llmPartnerId: partner.id,
        scope,
      })
    } catch (err) {
      if (err instanceof ScopeNotGrantedError) {
        const row = await persistDecision({
          proposalKey,
          partnerId: partner.id,
          userId,
          scopeRequested,
          action,
          context,
          decision: 'denied',
          decisionReason: 'scope_not_granted',
          scheduledFor: null,
          executionToken: null,
        })
        await writeAudit({
          userId,
          llmPartnerId: partner.id,
          referenceId: row.id,
          payload: {
            kind: 'pap_proposal_received',
            decision: 'denied',
            reason: 'scope_not_granted',
            scope,
            scopeRequested,
          },
          req,
        })
        return NextResponse.json(
          { decision: 'denied', reason: 'scope_not_granted', scope },
          { status: 403 },
        )
      }
      throw err
    }
  }

  // Coordinator evaluation. The coordinator owns rate-limit + dedup +
  // quiet-hours + confidence-threshold semantics; we just call it.
  const decision = await evaluateProposal(
    {
      llmPartnerId: partner.id,
      userId,
      scopeRequested,
      action: {
        headline: typeof action.headline === 'string' ? action.headline : undefined,
        subhead: typeof action.subhead === 'string' ? action.subhead : undefined,
        mode: typeof action.mode === 'string' ? action.mode : undefined,
      },
      context: {
        confidence:
          typeof context.confidence === 'number' ? context.confidence : undefined,
      },
    },
    now,
  )

  // Mint an executionToken only when allowed. scheduledFor is "now" in
  // v0.1 — future versions may schedule fires onto a different clock
  // (e.g. wait until quiet hours end).
  const executionToken =
    decision.decision === 'allowed' ? mintExecutionToken() : null
  const scheduledFor =
    decision.decision === 'allowed' ? now : null

  const row = await persistDecision({
    proposalKey,
    partnerId: partner.id,
    userId,
    scopeRequested,
    action,
    context,
    decision: decision.decision,
    decisionReason:
      decision.decision === 'denied'
        ? decision.reason
        : decision.decision === 'queued'
          ? decision.reason
          : null,
    scheduledFor,
    executionToken,
  })

  await writeAudit({
    userId,
    llmPartnerId: partner.id,
    referenceId: row.id,
    payload: {
      kind: 'pap_proposal_received',
      decision: decision.decision,
      reason:
        decision.decision === 'denied'
          ? decision.reason
          : decision.decision === 'queued'
            ? decision.reason
            : null,
      scopeRequested,
      headline: typeof action.headline === 'string' ? action.headline : null,
      confidence:
        typeof context.confidence === 'number' ? context.confidence : null,
    },
    req,
  })

  if (decision.decision === 'allowed') {
    return NextResponse.json({
      decision: 'allowed',
      executionToken,
      scheduledFor: scheduledFor!.toISOString(),
    })
  }
  if (decision.decision === 'queued') {
    return NextResponse.json({
      decision: 'queued',
      reason: decision.reason,
      competingProposals: decision.competingProposals,
    })
  }
  return NextResponse.json({
    decision: 'denied',
    reason: decision.reason,
    detail: decision.detail,
  })
}

// ──────────────────────── helpers ────────────────────────

/**
 * Mint a cryptographically random, single-use execution token. Carries
 * no information by itself — it's a unique handle the coordinator uses
 * to look up the underlying PAPProposal when /execute is called.
 */
function mintExecutionToken(): string {
  return `et_${randomBytes(24).toString('hex')}`
}

async function persistDecision(args: {
  proposalKey: string
  partnerId: string
  userId: string
  scopeRequested: string[]
  action: Record<string, unknown>
  context: Record<string, unknown>
  decision: string
  decisionReason: string | null
  scheduledFor: Date | null
  executionToken: string | null
}) {
  return prisma.pAPProposal.create({
    data: {
      proposalKey: args.proposalKey,
      llmPartnerId: args.partnerId,
      userId: args.userId,
      scopeRequested: args.scopeRequested,
      actionJson: args.action as object,
      contextJson: args.context as object,
      decision: args.decision,
      decisionReason: args.decisionReason,
      scheduledFor: args.scheduledFor,
      executionToken: args.executionToken,
    },
    select: {
      id: true,
      decision: true,
      decisionReason: true,
      executionToken: true,
      scheduledFor: true,
    },
  })
}

/**
 * Serialize an existing proposal's decision into the response shape.
 * Matches the live-decision branches above so idempotent replays look
 * indistinguishable from the original call.
 */
function serializeDecision(existing: {
  decision: string
  decisionReason: string | null
  executionToken: string | null
  scheduledFor: Date | null
}) {
  if (existing.decision === 'allowed') {
    return {
      decision: 'allowed',
      executionToken: existing.executionToken,
      scheduledFor: existing.scheduledFor?.toISOString() ?? null,
    }
  }
  if (existing.decision === 'queued') {
    return {
      decision: 'queued',
      reason: existing.decisionReason,
    }
  }
  return {
    decision: 'denied',
    reason: existing.decisionReason,
  }
}

async function writeAudit(args: {
  userId: string
  llmPartnerId: string
  referenceId: string
  payload: Record<string, unknown>
  req: Request
}) {
  try {
    await prisma.eAPAuditEntry.create({
      data: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        eventKind: 'pap_proposal_received',
        referenceId: args.referenceId,
        payloadJson: args.payload as object,
        ipAddress: extractIp(args.req),
      },
    })
  } catch (err) {
    console.warn('[pap/proposal] failed to write audit entry', {
      err: err instanceof Error ? err.message : 'unknown',
    })
  }
}

function extractIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')
}
