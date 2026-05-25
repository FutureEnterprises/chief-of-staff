/**
 * POST /api/uap/v1/execute — execute action under a standing grant.
 *
 * Partner-authenticated. The decision/persistence flow is:
 *
 *   1. Authenticate partner.
 *   2. Load grant + rules + kill-state (fresh, never cached — T2).
 *   3. coordinator.decideExecute() — pure decision over those inputs.
 *   4. If allowed AND action is a representation action: provenance-sign
 *      the outgoing payload, then persist the audit row WITH provenance.
 *   5. If allowed AND action is internal: persist audit row without sig.
 *   6. If denied / needs_per_action_confirmation: persist anyway —
 *      denials are audit-worthy per UAP-0.1.md §3.
 *   7. Return decision + audit_id + provenance envelope (when present).
 *
 * To avoid a double-write for representation actions, we pre-mint the
 * auditId, embed it in the provenance payload before signing, then
 * persist the audit row once with the signature attached.
 */

import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { decideExecute } from '@/lib/uap/coordinator'
import { isUserCoachingPathClosed } from '@/lib/rap/store'
import { loadGrant } from '@/lib/uap/grant-store'
import { isUserKilledGlobally } from '@/lib/uap/kill-switch'
import { isPanicActive } from '@/lib/coordinator/panic-check'
import { isInQuietHours } from '@/lib/coordinator/quiet-hours'
import { checkLLMPartnerRateLimit } from '@/lib/coordinator/rate-limit'
import { writeAuditEntry } from '@/lib/uap/audit'
import { signProvenance } from '@/lib/uap/provenance'
import {
  UAP_REPRESENTATION_ACTIONS,
  type UAPExecuteInput,
  type UAPRepresentationAction,
} from '@/lib/uap/types'

type Body = {
  grant_id?: string
  action?: {
    kind?: string
    operation?: string
    reversibility?: string
    params?: Record<string, unknown>
  }
  context?: {
    trigger?: string
    confidence?: number
    reasoning?: string
  }
  recipient?: {
    kind?: string
    hint?: string
  }
}

export async function POST(req: Request) {
  const authResult = await authenticateUAPPartner(req)
  if (authResult.error) return authResult.error
  const partner = authResult.partner

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body is not valid JSON.')
  }

  if (!body.grant_id || typeof body.grant_id !== 'string') {
    return errorResponse(400, 'missing_grant_id', 'Field `grant_id` is required.')
  }
  if (!body.action || typeof body.action !== 'object') {
    return errorResponse(400, 'missing_action', 'Field `action` is required.')
  }
  const action = body.action
  if (
    typeof action.kind !== 'string' ||
    typeof action.operation !== 'string' ||
    typeof action.reversibility !== 'string'
  ) {
    return errorResponse(
      400,
      'invalid_action',
      '`action.kind`, `action.operation`, and `action.reversibility` are required.',
    )
  }
  if (
    action.reversibility !== 'reversible' &&
    action.reversibility !== 'irreversible' &&
    action.reversibility !== 'reversible_within_window'
  ) {
    return errorResponse(
      400,
      'invalid_reversibility',
      '`action.reversibility` must be reversible | irreversible | reversible_within_window.',
    )
  }

  // ── Fresh-load grant + rules + kill state (T2 defense) ───────────
  let grant
  try {
    grant = await loadGrant(body.grant_id)
  } catch (err) {
    console.error('[uap/execute] loadGrant failed', {
      err: err instanceof Error ? err.message : 'unknown',
    })
    return errorResponse(500, 'load_failed', 'Unable to load grant.')
  }
  if (!grant) {
    // No grant id to attach an audit row to — return the bare denial.
    return NextResponse.json(
      { decision: 'denied', reason: 'grant_not_found' },
      { status: 200 },
    )
  }
  if (grant.llmPartnerId !== partner.id) {
    return errorResponse(
      403,
      'partner_not_authorized',
      'This grant was not issued to your partner account.',
    )
  }

  // Coordinator loads rules + checks kill-switch itself via injected
  // deps (see decideExecute call below). No pre-load needed.

  const input: UAPExecuteInput = {
    grantId: grant.id,
    partnerId: partner.id,
    userId: grant.userId,
    action: {
      kind: action.kind,
      operation: action.operation,
      reversibility: action.reversibility,
      params: (action.params ?? {}) as Record<string, unknown>,
    },
    context: body.context ?? {},
    recipient:
      body.recipient && typeof body.recipient === 'object'
        ? {
            kind: body.recipient.kind as
              | 'external_email'
              | 'external_phone'
              | 'internal_user'
              | 'external_url'
              | 'external_handle',
            hint: String(body.recipient.hint ?? ''),
          }
        : undefined,
  }

  const now = new Date()
  let decision
  try {
    decision = await decideExecute(input, {
      loadGrantWithRules: loadGrant,
      isUserKilledGlobally,
      isPanicActive,
      isInQuietHours,
      checkPartnerRateLimit: checkLLMPartnerRateLimit,
      isUserCoachingPathClosed,
      now: () => now,
    })
  } catch (err) {
    console.error('[uap/execute] decideExecute threw', {
      err: err instanceof Error ? err.message : 'unknown',
      grantId: grant.id,
    })
    return errorResponse(
      500,
      'coordinator_failed',
      'Coordinator threw evaluating the action.',
    )
  }

  // ── Pre-mint the audit id so we can embed it in the provenance
  //    payload BEFORE signing. The audit lib accepts an externally
  //    supplied id (`auditId`) when present, or generates one when
  //    omitted. This keeps representation-action persistence to one
  //    audit write per execute.
  const auditId = `aud_${randomBytes(12).toString('hex')}`

  const isRepresentation = UAP_REPRESENTATION_ACTIONS.includes(
    action.kind as UAPRepresentationAction,
  )

  let provenanceEnvelope: Awaited<ReturnType<typeof signProvenance>> | null =
    null
  if (decision.decision === 'allowed' && isRepresentation) {
    try {
      provenanceEnvelope = await signProvenance({
        partnerId: partner.id,
        userId: grant.userId,
        grantId: grant.id,
        auditId,
        actionKind: action.kind,
        recipientHint: input.recipient?.hint ?? '',
      })
    } catch (err) {
      console.error('[uap/execute] provenance sign failed', {
        err: err instanceof Error ? err.message : 'unknown',
        auditId,
      })
      return errorResponse(
        500,
        'provenance_sign_failed',
        'Representation provenance signing failed. Do not transmit the action.',
      )
    }
  }

  // Single audit write — provenance fields populated only on
  // signed representation actions. Denials still persist (§3).
  let auditRow
  try {
    auditRow = await writeAuditEntry({
      auditId,
      grantId: grant.id,
      userId: grant.userId,
      llmPartnerId: partner.id,
      operation: 'execute',
      actionKind: action.kind,
      decision: decision.decision,
      decisionReason:
        decision.decision === 'denied' ||
        decision.decision === 'needs_per_action_confirmation'
          ? decision.reason
          : undefined,
      postTermination: grant.status !== 'ACTIVE',
      ...(provenanceEnvelope
        ? {
            provenanceSignature: provenanceEnvelope.signature,
            provenancePublicKey: provenanceEnvelope.publicKey,
            provenanceAlgorithm: provenanceEnvelope.algorithm,
            provenancePayload: provenanceEnvelope.payload,
          }
        : {}),
    } as Parameters<typeof writeAuditEntry>[0])
  } catch (err) {
    console.error('[uap/execute] audit write failed', {
      err: err instanceof Error ? err.message : 'unknown',
      grantId: grant.id,
      auditId,
    })
    return errorResponse(
      500,
      'audit_write_failed',
      'Unable to write audit row; execution rolled back.',
    )
  }

  return NextResponse.json({
    decision: decision.decision,
    ...(decision.decision === 'denied' ||
    decision.decision === 'needs_per_action_confirmation'
      ? { reason: decision.reason, detail: decision.detail }
      : {}),
    audit_id: auditRow.id,
    executed_at: now.toISOString(),
    ...(provenanceEnvelope
      ? {
          provenance: {
            payload: provenanceEnvelope.payload,
            signature: provenanceEnvelope.signature,
            public_key: provenanceEnvelope.publicKey,
            algorithm: provenanceEnvelope.algorithm,
          },
        }
      : {}),
  })
}

function errorResponse(
  status: number,
  error: string,
  message: string,
  detail?: unknown,
) {
  return NextResponse.json(
    detail !== undefined ? { error, message, detail } : { error, message },
    { status },
  )
}

function safeOrigin(req: Request): string {
  try {
    const u = new URL(req.url)
    return `${u.protocol}//${u.host}`
  } catch {
    return 'https://coyl.ai'
  }
}
