/**
 * POST /api/uap/v1/precheck — "would this action be allowed?"
 *
 * Pure decision endpoint. Partner-authenticated. Calls the coordinator
 * without writing an audit row — per UAP-0.1.md §2: "PRECHECK has no
 * side effects. No DB write. Pure decision." This is what LLM partners
 * use to roundtrip a candidate action before committing to it.
 *
 * The decision envelope is the canonical UAPDecision shape from
 * lib/uap/types.ts so the partner sees the same body shape they'd
 * see in EXECUTE (minus the audit_id + executed_at).
 */

import { NextResponse } from 'next/server'
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { decideExecute } from '@/lib/uap/coordinator'
import { loadGrant, loadRules } from '@/lib/uap/grant-store'
import { isUserKilled } from '@/lib/uap/kill-switch'
import type { UAPExecuteInput } from '@/lib/uap/types'

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

  // Load the grant + rules + kill state up front so the coordinator
  // is a pure function over already-fetched inputs.
  let grant
  try {
    grant = await loadGrant(body.grant_id)
  } catch (err) {
    console.error('[uap/precheck] loadGrant failed', {
      err: err instanceof Error ? err.message : 'unknown',
    })
    return errorResponse(500, 'load_failed', 'Unable to load grant.')
  }
  if (!grant) {
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

  const [rules, killed] = await Promise.all([
    loadRules({ userId: grant.userId, grantId: grant.id }),
    isUserKilled(grant.userId),
  ])

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

  let decision
  try {
    decision = await decideExecute(input, {
      grant,
      rules,
      userKilled: killed,
      now: new Date(),
    })
  } catch (err) {
    console.error('[uap/precheck] decideExecute threw', {
      err: err instanceof Error ? err.message : 'unknown',
      grantId: grant.id,
    })
    return errorResponse(
      500,
      'coordinator_failed',
      'Coordinator threw evaluating the action.',
    )
  }

  // PRECHECK has no side effects — return verbatim, no audit row.
  return NextResponse.json(decision)
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
