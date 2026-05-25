/**
 * POST /api/rap/v1/assess — RAP v0.1 classify a behavioral moment.
 *
 * Partner-authenticated (Bearer `coyl_uap_*`). The partner submits a
 * BIP-style signal chain plus the candidate action they were about to
 * propose, and the RAP classifier returns one of the four risk classes
 * (routine_friction / pattern_relapse / crisis_indication /
 * legal_or_medical_emergency) along with a routing envelope when the
 * risk class warrants one.
 *
 * Per RAP-0.1.md §3 wire format. On any risk class above
 * routine_friction the assessment is persisted via writeAssessment so
 * the user's coaching-path state is queryable on subsequent requests
 * (see /api/rap/v1/status).
 *
 * Auth note: v0.1 reuses authenticateUAPPartner — a partner holding a
 * UAP key has implicit authority to call RAP-assess for users they
 * have grants on. RAP-only partner keys are a v0.2 follow-up so labs
 * can integrate the safety layer without also taking on the full UAP
 * surface.
 */

import { NextResponse } from 'next/server'
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { classify } from '@/lib/rap/classifier'
import { buildEnvelope } from '@/lib/rap/router'
import { writeAssessment } from '@/lib/rap/store'

type Signal = {
  kind?: string
  text?: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

type Body = {
  user_id?: string
  proposed_action?: {
    kind?: string
    headline?: string
    refId?: string
  }
  signal_chain?: Signal[]
  jurisdiction?: string
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

  // ── Required fields ──────────────────────────────────────────────
  if (!body.user_id || typeof body.user_id !== 'string') {
    return errorResponse(400, 'missing_user_id', 'Field `user_id` is required.')
  }
  if (!Array.isArray(body.signal_chain) || body.signal_chain.length === 0) {
    return errorResponse(
      400,
      'missing_signal_chain',
      'Field `signal_chain` must be a non-empty array.',
    )
  }

  // Light shape validation on each signal — the classifier is the
  // ultimate consumer but we reject obviously malformed payloads here
  // so the partner gets a clear 400 rather than a generic 500.
  for (let i = 0; i < body.signal_chain.length; i++) {
    const s = body.signal_chain[i]
    if (!s || typeof s !== 'object' || typeof s.kind !== 'string') {
      return errorResponse(
        400,
        'invalid_signal',
        `signal_chain[${i}] requires a string \`kind\`.`,
      )
    }
  }

  // jurisdiction defaults to 'US' (per RAP-0.1.md §2 — the v0.1
  // reference routing tables are US-centric; international curation is
  // an open question in §5).
  const jurisdiction =
    typeof body.jurisdiction === 'string' && body.jurisdiction.length > 0
      ? body.jurisdiction
      : 'US'

  // proposed_action is optional — the partner may be calling assess as
  // a standalone safety check (e.g. inbound chat message) with no
  // candidate intervention attached.
  const proposedAction =
    body.proposed_action && typeof body.proposed_action === 'object'
      ? {
          kind: typeof body.proposed_action.kind === 'string'
            ? body.proposed_action.kind
            : 'unknown',
          headline: typeof body.proposed_action.headline === 'string'
            ? body.proposed_action.headline
            : undefined,
          refId: typeof body.proposed_action.refId === 'string'
            ? body.proposed_action.refId
            : undefined,
        }
      : undefined

  // ── Classify ─────────────────────────────────────────────────────
  let classification
  try {
    classification = await classify({
      userId: body.user_id,
      proposedAction,
      signalChain: body.signal_chain.map((s) => ({
        kind: s.kind as string,
        text: typeof s.text === 'string' ? s.text : undefined,
        metadata: (s.metadata ?? {}) as Record<string, unknown>,
        timestamp: typeof s.timestamp === 'string'
          ? s.timestamp
          : new Date().toISOString(),
      })),
      jurisdiction,
    })
  } catch (err) {
    console.error('[rap/assess] classify failed', {
      err: err instanceof Error ? err.message : 'unknown',
      partnerId: partner.id,
      userId: body.user_id,
    })
    return errorResponse(
      500,
      'classify_failed',
      'Classifier threw evaluating the signal chain.',
    )
  }

  // ── Build routing envelope ───────────────────────────────────────
  // Contact tokens are nulled out in v0.1 — UAP scope wiring for
  // accountability + emergency contacts is a v0.2 follow-up. The
  // envelope still resolves jurisdictional crisis lines, holding
  // pattern, and coaching-path-closed state.
  let routingEnvelope
  try {
    routingEnvelope = buildEnvelope({
      riskClass: classification.riskClass,
      jurisdiction,
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
  } catch (err) {
    console.error('[rap/assess] buildEnvelope failed', {
      err: err instanceof Error ? err.message : 'unknown',
      riskClass: classification.riskClass,
      jurisdiction,
    })
    return errorResponse(
      500,
      'envelope_failed',
      'Routing envelope construction failed.',
    )
  }

  // ── Persist ──────────────────────────────────────────────────────
  let assessment
  try {
    // partner.id not persisted on RAPAssessment row in v0.1 schema —
    // attribution via the triggerRefId pointer to the partner's PAPProposal/
    // EAPActionRequest row. v0.2: promote llmPartnerId to first-class column.
    void partner
    assessment = await writeAssessment({
      userId: body.user_id,
      riskClass: classification.riskClass,
      rationaleSignature: classification.rationaleSignature,
      classifierVersion: classification.classifierVersion,
      routingEnvelope,
      triggerKind: ((): 'pap_proposal' | 'eap_action_request' | 'manual' | 'bip_signal' => {
        const k = proposedAction?.kind
        if (k === 'pap_proposal' || k === 'eap_action_request' || k === 'manual' || k === 'bip_signal') return k
        return 'manual'
      })(),
      // jurisdiction not persisted on RAPAssessment row in v0.1 schema —
      // the routing envelope already encodes jurisdictional lines.
      // v0.2: promote to first-class column for cross-jurisdiction audit.
      signalChain: body.signal_chain,
      ttlSeconds: classification.ttlSeconds,
    })
  } catch (err) {
    console.error('[rap/assess] writeAssessment failed', {
      err: err instanceof Error ? err.message : 'unknown',
      partnerId: partner.id,
      userId: body.user_id,
      riskClass: classification.riskClass,
    })
    return errorResponse(
      500,
      'assessment_persist_failed',
      'Unable to persist the assessment.',
    )
  }

  return NextResponse.json(
    {
      assessment_id: assessment.id,
      risk_class: classification.riskClass,
      rationale_signature: classification.rationaleSignature,
      classifier_version: classification.classifierVersion,
      routing_envelope: routingEnvelope,
      coaching_path_closed: assessment.coachingPathClosed,
      ttl_seconds: classification.ttlSeconds,
    },
    { status: 200 },
  )
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
