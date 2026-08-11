/**
 * POST /api/uap/v1/execute — execute action under a standing grant.
 *
 * Partner-authenticated. The decision/persistence flow is:
 *
 *   1. Authenticate partner.
 *   2. Idempotency check — when the partner supplies `idempotency_key`,
 *      the audit id is a deterministic function of (partner, key). A
 *      replay of an already-recorded EXECUTE returns the ORIGINAL
 *      decision + envelope without re-deciding or re-signing (threat
 *      model T5: "replays return the original decision without
 *      re-executing").
 *   3. Load grant + FULL merged rule set (grant-scoped + user-level)
 *      fresh, never cached — T2. User-level rules (RULE_DECLARE with
 *      grant_id=null) MUST reach the coordinator or negative authority
 *      is advisory.
 *   4. coordinator.decideExecute() — pure decision over those inputs.
 *   5. If allowed AND action is a representation action: provenance-sign
 *      the outgoing payload, then persist the audit row WITH provenance.
 *   6. If denied / needs_per_action_confirmation: persist anyway —
 *      denials are audit-worthy per UAP-0.1.md §3.
 *   7. Return decision + audit_id + provenance envelope (when present).
 *
 * The audit id is pre-minted and embedded in the provenance payload
 * before signing, and writeAuditEntry persists that exact id — so the
 * public verifier at GET /api/uap/v1/provenance/{audit_id} resolves the
 * same id the recipient holds in the signed envelope.
 */

import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { decideExecute } from '@/lib/uap/coordinator'
import { isUserCoachingPathClosed } from '@/lib/rap/store'
import { loadGrant, loadGrantWithAllRules } from '@/lib/uap/grant-store'
import { isUserKilledGlobally } from '@/lib/uap/kill-switch'
import { isPanicActive } from '@/lib/coordinator/panic-check'
import { isInQuietHours } from '@/lib/coordinator/quiet-hours'
import {
  checkUAPPartnerRateLimit,
  countAllowedExecutesInWindow,
} from '@/lib/uap/rate-limit'
import {
  writeAuditEntry,
  loadAuditEntry,
  UAPFrequencyCapExceededError,
} from '@/lib/uap/audit'
import { signProvenance } from '@/lib/uap/provenance'
import { collectFrequencyGuards } from '@/lib/uap/rule-params'
import { consentClassLabel } from '@/lib/uap/consent-class'
import { issueExecutionReceipt } from '@/lib/uap/execution-receipt'
import {
  UAP_REPRESENTATION_ACTIONS,
  type UAPDecision,
  type UAPExecuteInput,
  type UAPRepresentationAction,
} from '@/lib/uap/types'
import type { UAPAuditEntry } from '@repo/database'

type Body = {
  grant_id?: string
  idempotency_key?: string
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

/** Charset + length bound for partner-supplied idempotency keys. */
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_.\-]{1,128}$/

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
  if (
    body.idempotency_key !== undefined &&
    (typeof body.idempotency_key !== 'string' ||
      !IDEMPOTENCY_KEY_PATTERN.test(body.idempotency_key))
  ) {
    return errorResponse(
      400,
      'invalid_idempotency_key',
      '`idempotency_key` must match [A-Za-z0-9_.-]{1,128}.',
    )
  }

  // ── Audit-id minting ─────────────────────────────────────────────
  // With an idempotency key: deterministic over (partner, key), so a
  // replay maps to the SAME audit row — the unique primary key is the
  // dedupe. Without one: random. Either way the id is embedded in the
  // provenance payload before signing and persisted verbatim.
  const auditId = body.idempotency_key
    ? `aud_${createHash('sha256')
        .update(`${partner.id}:${body.idempotency_key}`, 'utf8')
        .digest('hex')
        .slice(0, 24)}`
    : `aud_${randomBytes(12).toString('hex')}`

  // ── Idempotent replay short-circuit ──────────────────────────────
  // T5: a replayed EXECUTE (same partner + same idempotency key) must
  // return the original decision without re-deciding, re-signing, or
  // appending a second audit row.
  if (body.idempotency_key) {
    let existing: UAPAuditEntry | null = null
    try {
      existing = await loadAuditEntry(auditId)
    } catch {
      existing = null // fall through to the normal path
    }
    if (existing) {
      return NextResponse.json(replayResponse(existing))
    }
  }

  // ── Fresh-load grant (T2 defense) ────────────────────────────────
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
  // The MERGED rule set the coordinator actually decided against
  // (grant-scoped + user-level). Captured from the loader rather than
  // re-queried so the frequency guards below are built from exactly the
  // rules that produced the decision — a second load could see a rule
  // the decision never considered.
  let decidedRules: Array<{ kind: string; params: unknown }> = []
  let decision: UAPDecision
  try {
    decision = await decideExecute(input, {
      // Merged loader: grant-scoped rules + user-level rules (grantId
      // NULL). Plain loadGrant drops user-level RULE_DECLARE rows —
      // negative authority must reach the coordinator to be enforced.
      loadGrantWithRules: async (grantId) => {
        const loaded = await loadGrantWithAllRules(grantId)
        if (loaded) decidedRules = loaded.rules
        return loaded
      },
      isUserKilledGlobally,
      isPanicActive,
      isInQuietHours,
      // UAP-aware limiter: counts UAP execute audit rows (the shared
      // PAP/EAP limiter counts tables UAP never writes to, so UAP-only
      // partners were effectively unlimited).
      checkPartnerRateLimit: checkUAPPartnerRateLimit,
      isUserCoachingPathClosed,
      // Trailing-window counter behind `frequency_cap`. Counts ALLOWED
      // execute audit rows only, so denials and prechecks consume
      // nothing against a user's cap.
      countRecentAllowedExecutes: (p) => countAllowedExecutesInWindow(p),
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

  // ── Atomic frequency-cap guard ───────────────────────────────────
  // The coordinator already counted the trailing window, but that count
  // happened before this row existed and outside any transaction: two
  // concurrent EXECUTEs at the boundary would both pass it. Re-checking
  // INSIDE the advisory-locked append transaction serializes count and
  // write, so the second one loses. Only ALLOWED decisions carry guards
  // — a denial consumes nothing and must always be recordable.
  const frequencyGuards =
    decision.decision === 'allowed'
      ? collectFrequencyGuards(decidedRules, grant.id, action.kind)
      : []

  let auditRow: UAPAuditEntry
  const buildAuditInput = (
    finalDecision: UAPDecision,
    provenance: typeof provenanceEnvelope,
  ) => ({
    auditId,
    grantId: grant.id,
    userId: grant.userId,
    llmPartnerId: partner.id,
    operation: 'execute' as const,
    actionKind: action.kind,
    decision: finalDecision.decision,
    decisionReason:
      finalDecision.decision === 'denied' ||
      finalDecision.decision === 'needs_per_action_confirmation'
        ? finalDecision.reason
        : undefined,
    postTermination: grant.status !== 'ACTIVE',
    ...(provenance
      ? {
          provenanceSignature: provenance.signature,
          provenancePublicKey: provenance.publicKey,
          provenanceAlgorithm: provenance.algorithm,
          provenancePayload: provenance.payload,
        }
      : {}),
  })

  // Single audit write — provenance fields populated only on
  // signed representation actions. Denials still persist (§3).
  try {
    auditRow = await writeAuditEntry(
      buildAuditInput(decision, provenanceEnvelope),
      frequencyGuards.length
        ? { frequencyGuards, now }
        : undefined,
    )
  } catch (err) {
    // Lost the race at the cap boundary: another EXECUTE for this user
    // took the last slot while we were deciding. Nothing was written
    // (the guard throws before the insert and the transaction rolls
    // back), so re-record the action as the denial it actually is. The
    // provenance envelope signed above is DISCARDED — it attests to an
    // authorization that did not happen and must never reach the wire.
    if (err instanceof UAPFrequencyCapExceededError) {
      decision = {
        decision: 'denied',
        reason: 'frequency_cap_exceeded',
        detail: err.detail,
      }
      provenanceEnvelope = null
      try {
        auditRow = await writeAuditEntry(buildAuditInput(decision, null))
      } catch (writeErr) {
        console.error('[uap/execute] denial audit write failed', {
          err: writeErr instanceof Error ? writeErr.message : 'unknown',
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
        reason: decision.reason,
        detail: decision.detail,
        audit_id: auditRow.id,
        executed_at: now.toISOString(),
        consent_class: consentClassLabel(grant.consentArtifact),
      })
    }
    // Concurrent replay race: two requests with the same idempotency
    // key can both pass the pre-check; the second insert collides on
    // the primary key. Resolve by returning the winner's stored row.
    if (body.idempotency_key) {
      try {
        const existing = await loadAuditEntry(auditId)
        if (existing) return NextResponse.json(replayResponse(existing))
      } catch {
        // fall through to the 500 below
      }
    }
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

  // ── Single-consumption execution receipt ─────────────────────────
  // On ALLOW the decision stops being advice. The receipt is a
  // single-use capability bound to `action_hash` — a canonical hash of
  // (user, grant, action kind, action params, THIS decision id) — and
  // a COYL-owned executor will not fire an effect without redeeming
  // one that matches the effect it is about to perform. See
  // lib/uap/execution-receipt.ts, including the honest statement of
  // what this does NOT cover (effects a partner performs inside its
  // own infrastructure).
  //
  // Not minted on an idempotent replay: the replay path returns the
  // ORIGINAL decision from the stored audit row and must not hand out
  // a second capability for one authorization.
  const receipt =
    decision.decision === 'allowed'
      ? issueExecutionReceipt({
          auditId: auditRow.id,
          userId: grant.userId,
          grantId: grant.id,
          partnerId: partner.id,
          actionKind: action.kind,
          actionParams: input.action.params,
          now,
        })
      : null

  return NextResponse.json({
    decision: decision.decision,
    ...(decision.decision === 'denied' ||
    decision.decision === 'needs_per_action_confirmation'
      ? { reason: decision.reason, detail: decision.detail }
      : {}),
    audit_id: auditRow.id,
    executed_at: now.toISOString(),
    // Which class of consent backed this decision. `unclassified` means
    // the grant predates consent classing (see lib/uap/consent-class.ts).
    consent_class: consentClassLabel(grant.consentArtifact),
    ...(receipt
      ? {
          action_hash: receipt.actionHash,
          execution_receipt: {
            receipt: receipt.receiptId,
            action_hash: receipt.actionHash,
            expires_at: receipt.expiresAt.toISOString(),
            single_use: true,
          },
        }
      : {}),
    ...(provenanceEnvelope
      ? {
          provenance: {
            payload: provenanceEnvelope.payload,
            signature: provenanceEnvelope.signature,
            public_key: provenanceEnvelope.publicKey,
            algorithm: provenanceEnvelope.algorithm,
            // Unsigned, advisory field: the §5.5 payload is a pinned
            // nine-field contract, so binding the class INTO the
            // signature is a payload-version change (see the report).
            // The authoritative, tamper-evident surface is
            // GET /api/uap/v1/provenance/{audit_id} — whose URL IS
            // inside the signed payload — which returns the same value
            // resolved from the grant.
            consent_class: consentClassLabel(grant.consentArtifact),
          },
        }
      : {}),
  })
}

/**
 * Rebuild the wire response for an idempotent replay from the stored
 * audit row — the ORIGINAL decision, audit id, timestamp, and (for
 * signed representation actions) the original provenance envelope.
 * Nothing is re-decided and nothing is re-signed.
 */
function replayResponse(row: UAPAuditEntry): Record<string, unknown> {
  const isTerminalDenial =
    row.decision === 'denied' ||
    row.decision === 'needs_per_action_confirmation'
  return {
    decision: row.decision,
    ...(isTerminalDenial && row.decisionReason
      ? { reason: row.decisionReason }
      : {}),
    audit_id: row.id,
    executed_at: row.createdAt.toISOString(),
    idempotent_replay: true,
    ...(row.provenanceSignature && row.provenancePublicKey && row.provenancePayload
      ? {
          provenance: {
            payload: row.provenancePayload,
            signature: row.provenanceSignature,
            public_key: row.provenancePublicKey,
            algorithm: row.provenanceAlgorithm ?? 'ed25519',
          },
        }
      : {}),
  }
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
