/**
 * POST /api/rap/v1/escalation — partner records an escalation outcome.
 *
 * Partner-authenticated (Bearer `coyl_uap_*`). After an assess call
 * returns a non-routine envelope, the partner is responsible for
 * actioning the envelope (showing the crisis card, calling the
 * emergency contact, dialing 988, etc.). This endpoint is how they
 * report back what they actually did so the audit chain captures the
 * full lifecycle of a risk classification.
 *
 * Per RAP-0.1.md §4 the routing envelope is the "what we told you to
 * do." The escalation record is the "what you actually did." Both are
 * required for a complete audit trail — a Trust & Safety reviewer
 * needs to confirm the envelope was honored, not just issued.
 *
 * Body:
 *   assessment_id  — the RAPAssessment row this escalation pairs with
 *   escalated_to   — free-form label of who/what was contacted
 *                    (e.g. "988", "user_emergency_contact:abc123",
 *                    "accountability_pod:xyz")
 *   envelope_kind  — must match the envelope_kind on the assessment
 *                    (crisis_referral | emergency_referral |
 *                    accountability_referral)
 *   outcome        — optional free-form note ("connected",
 *                    "no_answer", "voicemail_left", etc.)
 */

import { NextResponse } from 'next/server'
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { recordEscalation } from '@/lib/rap/store'

type Body = {
  assessment_id?: string
  escalated_to?: string
  envelope_kind?: string
  outcome?: string
}

const VALID_ENVELOPE_KINDS = new Set([
  'crisis_referral',
  'emergency_referral',
  'accountability_referral',
])

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

  if (!body.assessment_id || typeof body.assessment_id !== 'string') {
    return errorResponse(
      400,
      'missing_assessment_id',
      'Field `assessment_id` is required.',
    )
  }
  if (!body.escalated_to || typeof body.escalated_to !== 'string') {
    return errorResponse(
      400,
      'missing_escalated_to',
      'Field `escalated_to` is required.',
    )
  }
  if (!body.envelope_kind || typeof body.envelope_kind !== 'string') {
    return errorResponse(
      400,
      'missing_envelope_kind',
      'Field `envelope_kind` is required.',
    )
  }
  if (!VALID_ENVELOPE_KINDS.has(body.envelope_kind)) {
    return errorResponse(
      400,
      'invalid_envelope_kind',
      '`envelope_kind` must be one of crisis_referral | emergency_referral | accountability_referral.',
      { allowed: [...VALID_ENVELOPE_KINDS] },
    )
  }

  let escalationId: string
  try {
    // partner.id not persisted in v0.1 schema (RAPEscalation has no
    // llmPartnerId column); attribution lives in the RAPAssessment row
    // referenced by assessmentId. v0.2: promote to first-class column.
    void partner
    const result = await recordEscalation({
      assessmentId: body.assessment_id,
      escalatedTo: body.escalated_to,
      envelopeKind: body.envelope_kind as
        | 'crisis_referral'
        | 'emergency_referral'
        | 'accountability_referral',
      outcome:
        typeof body.outcome === 'string' && body.outcome.length > 0
          ? body.outcome
          : undefined,
    })
    escalationId = result.id
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[rap/escalation] recordEscalation failed', {
      err: message,
      partnerId: partner.id,
      assessmentId: body.assessment_id,
    })

    // recordEscalation throws a recognisable error when the assessment
    // doesn't exist or doesn't belong to the calling partner — surface
    // as 404 / 403 rather than 500 so the caller can disambiguate.
    if (/not[_ ]?found/i.test(message)) {
      return errorResponse(
        404,
        'assessment_not_found',
        'No assessment with the supplied id.',
      )
    }
    if (/not[_ ]?authorized|forbidden|partner_mismatch/i.test(message)) {
      return errorResponse(
        403,
        'partner_not_authorized',
        'This assessment was not issued to your partner account.',
      )
    }

    return errorResponse(
      500,
      'escalation_persist_failed',
      'Unable to persist the escalation record.',
    )
  }

  return NextResponse.json({ escalation_id: escalationId }, { status: 201 })
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
