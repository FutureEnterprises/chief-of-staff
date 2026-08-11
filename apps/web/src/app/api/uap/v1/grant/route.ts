/**
 * POST /api/uap/v1/grant — UAP v0.1 issue a new standing grant.
 *
 * Partner-authenticated (Bearer `coyl_uap_*`). Validates the request
 * envelope, persists a UAPGrant + its inline rules in one shot,
 * writes an audit row (operation='grant'), and returns the grant
 * handle + companion URLs.
 *
 * Per UAP-0.1.md §5 wire format. The grant's max lifetime is 90
 * days from issue — anything farther out is rejected as a v0.1
 * constraint (renewal is a separate consent ceremony in §4).
 *
 * Hard invariants we enforce here (per §3):
 *  - explicit consent artifact present + user_response === 'explicit_grant'
 *  - every requested scope is in UAP_SCOPES
 *  - expires_at within 90 days of now
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { createGrant } from '@/lib/uap/grant-store'
import { writeAuditEntry } from '@/lib/uap/audit'
import {
  UAP_SCOPES,
  isUAPRuleKind,
  type UAPScope,
  type UAPRuleKind,
  type UAPConsentClass,
} from '@/lib/uap/types'
import { validateRuleParams } from '@/lib/uap/rule-params'

const MAX_GRANT_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

type Body = {
  user_id?: string
  partner_id?: string
  scopes?: string[]
  expires_at?: string
  rules?: Array<{ kind?: string; params?: Record<string, unknown> }>
  consent_artifact?: {
    version?: string
    shown_to_user_at?: string
    user_response?: string
    ui_surface?: string
    [k: string]: unknown
  }
}

export async function POST(req: Request) {
  // Two documented issuance paths, two auth modes:
  //
  //   1. PARTNER (Bearer coyl_uap_*) — the §5 partner-side call. The
  //      partner names the target user and supplies the consent
  //      artifact it collected. The artifact here is PARTNER-ATTESTED:
  //      the party that benefits from the grant is also the only
  //      witness that consent happened (T8). The path stays open for
  //      SDK compatibility, but the grant is now stamped
  //      `consentClass: 'partner_attested'` and the coordinator refuses
  //      irreversibility-floor actions under it
  //      (`consent_class_insufficient`). See lib/uap/consent-class.ts.
  //
  //   2. USER SESSION (Clerk cookie) — the COYL-hosted consent
  //      ceremony at /consent/uap. This is the T8 mitigation path:
  //      the consent artifact is produced by a COYL-hosted page under
  //      the USER'S OWN authenticated session, and the grant's userId
  //      is derived from that session — a caller cannot mint a grant
  //      binding someone else's identity. The form names the receiving
  //      partner via `partner_id`.
  let body: Body
  const hasBearer = !!(
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  )

  let issuerKind: 'partner' | 'user'
  let llmPartnerId: string
  let grantUserId: string

  if (hasBearer) {
    const authResult = await authenticateUAPPartner(req)
    if (authResult.error) return authResult.error
    const partner = authResult.partner

    try {
      body = (await req.json()) as Body
    } catch {
      return errorResponse(400, 'invalid_json', 'Request body is not valid JSON.')
    }
    if (!body.user_id || typeof body.user_id !== 'string') {
      return errorResponse(400, 'missing_user_id', 'Field `user_id` is required.')
    }
    issuerKind = 'partner'
    llmPartnerId = partner.id
    grantUserId = body.user_id
  } else {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return errorResponse(401, 'unauthenticated', 'Sign in required.')
    }
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return errorResponse(404, 'user_not_found', 'No matching user.')
    }

    try {
      body = (await req.json()) as Body
    } catch {
      return errorResponse(400, 'invalid_json', 'Request body is not valid JSON.')
    }
    if (
      !body.partner_id ||
      typeof body.partner_id !== 'string' ||
      !/^[a-z0-9]{1,64}$/.test(body.partner_id)
    ) {
      return errorResponse(
        400,
        'missing_partner_id',
        'Field `partner_id` is required on user-session grant issuance.',
      )
    }
    // A stale/foreign user_id in the body must not silently bind the
    // grant to the session user under another id's name.
    if (body.user_id && body.user_id !== user.id) {
      return errorResponse(
        403,
        'user_mismatch',
        'You can only issue grants for your own account.',
      )
    }
    const partnerRow = await prisma.lLMPartner.findUnique({
      where: { id: body.partner_id },
      select: { id: true, active: true },
    })
    if (!partnerRow || !partnerRow.active) {
      return errorResponse(404, 'partner_not_found', 'No active partner with that id.')
    }
    issuerKind = 'user'
    llmPartnerId = partnerRow.id
    grantUserId = user.id
  }

  // The consent class is decided by which door the request came in, and
  // by nothing the caller can put in the body. A partner cannot claim
  // coordinator-verified consent for an artifact it produced itself.
  const consentClass: UAPConsentClass =
    issuerKind === 'user' ? 'coordinator_verified' : 'partner_attested'

  if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
    return errorResponse(
      400,
      'missing_scopes',
      'Field `scopes` must be a non-empty array.',
    )
  }
  if (!body.expires_at || typeof body.expires_at !== 'string') {
    return errorResponse(
      400,
      'missing_expires_at',
      'Field `expires_at` is required (ISO 8601 UTC).',
    )
  }
  if (!body.consent_artifact || typeof body.consent_artifact !== 'object') {
    return errorResponse(
      400,
      'missing_consent_artifact',
      'Field `consent_artifact` is required per UAP-0.1 §3.',
    )
  }

  // ── Scope validation ─────────────────────────────────────────────
  const unknownScopes = body.scopes.filter(
    (s) => !UAP_SCOPES.includes(s as UAPScope),
  )
  if (unknownScopes.length > 0) {
    return errorResponse(
      400,
      'unknown_scope',
      `One or more scopes are not part of UAP-0.1.`,
      { unknown_scopes: unknownScopes, allowed_scopes: UAP_SCOPES },
    )
  }

  // ── Expiry validation ────────────────────────────────────────────
  const now = new Date()
  const expiresAt = new Date(body.expires_at)
  if (Number.isNaN(expiresAt.getTime())) {
    return errorResponse(
      400,
      'invalid_expires_at',
      '`expires_at` is not a valid ISO 8601 date.',
    )
  }
  if (expiresAt.getTime() <= now.getTime()) {
    return errorResponse(
      400,
      'expires_in_past',
      '`expires_at` must be in the future.',
    )
  }
  if (expiresAt.getTime() - now.getTime() > MAX_GRANT_LIFETIME_MS) {
    return errorResponse(
      400,
      'expires_too_far',
      'UAP-0.1 caps grant lifetime at 90 days. Reissue near expiry.',
    )
  }

  // ── Consent artifact validation ──────────────────────────────────
  if (body.consent_artifact.user_response !== 'explicit_grant') {
    return errorResponse(
      400,
      'consent_not_explicit',
      'Consent artifact must record `user_response === "explicit_grant"`.',
    )
  }

  // ── Rule shape validation ────────────────────────────────────────
  // Strict now that rules FAIL CLOSED at decision time: an inline rule
  // this engine cannot evaluate would deny every action under the grant
  // it is attached to. Rejecting it here is the difference between a
  // 400 at issuance and a grant that silently never works.
  const rules: Array<{ kind: UAPRuleKind; params: Record<string, unknown> }> = []
  if (Array.isArray(body.rules)) {
    for (const r of body.rules) {
      if (!r || typeof r !== 'object' || typeof r.kind !== 'string') {
        return errorResponse(
          400,
          'invalid_rule',
          'Each rule needs a `kind` string and a `params` object.',
        )
      }
      if (!isUAPRuleKind(r.kind)) {
        return errorResponse(
          400,
          'unknown_rule_kind',
          'Rule kind is not part of UAP-0.1.',
          { received: r.kind },
        )
      }
      const params = (r.params ?? {}) as Record<string, unknown>
      const validated = validateRuleParams(r.kind, params)
      if (!validated.ok) {
        return errorResponse(
          400,
          'invalid_rule_params',
          'Rule params are not evaluable by this engine; the rule would deny every action under this grant.',
          { kind: r.kind, problem: validated.detail },
        )
      }
      rules.push({ kind: r.kind, params })
    }
  }

  // ── Persist ──────────────────────────────────────────────────────
  let grant
  try {
    grant = await createGrant({
      userId: grantUserId,
      llmPartnerId,
      scopes: body.scopes as UAPScope[],
      expiresAt,
      consentClass,
      consentArtifact: {
        version: typeof (body.consent_artifact as Record<string, unknown>)?.version === 'string'
          ? ((body.consent_artifact as Record<string, unknown>).version as string)
          : 'uap-0.1.1',
        shownToUserAt: typeof (body.consent_artifact as Record<string, unknown>)?.shown_to_user_at === 'string'
          ? new Date((body.consent_artifact as Record<string, unknown>).shown_to_user_at as string)
          : new Date(),
        userResponse: 'explicit_grant' as const,
        uiSurface: typeof (body.consent_artifact as Record<string, unknown>)?.ui_surface === 'string'
          ? ((body.consent_artifact as Record<string, unknown>).ui_surface as string)
          : 'unknown',
      },
      rules,
    })
  } catch (err) {
    console.error('[uap/grant] createGrant failed', {
      err: err instanceof Error ? err.message : 'unknown',
      partnerId: llmPartnerId,
      userId: grantUserId,
    })
    return errorResponse(
      500,
      'grant_persist_failed',
      'Unable to persist grant. The audit log was not written.',
    )
  }

  // ── Audit ────────────────────────────────────────────────────────
  try {
    await writeAuditEntry({
      grantId: grant.id,
      userId: grantUserId,
      llmPartnerId,
      operation: 'grant',
      decision: 'allowed',
      postTermination: false,
    })
  } catch (err) {
    // Audit write failure is logged but doesn't roll back the grant —
    // the grant is real, so the partner needs the handle. The audit
    // gap will surface on the next chain-verify pass.
    console.warn('[uap/grant] audit write failed', {
      err: err instanceof Error ? err.message : 'unknown',
      grantId: grant.id,
    })
  }

  const origin = safeOrigin(req)
  return NextResponse.json(
    {
      grant_id: grant.id,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      // Additive field: tells the partner, at issuance, that a
      // partner-attested grant will not authorize floor actions — so
      // the limitation is discoverable before the first refusal.
      consent_class: consentClass,
      audit_url: `${origin}/audit/uap/${grant.id}`,
      kill_switch_url: `${origin}/kill`,
    },
    { status: 201 },
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

function safeOrigin(req: Request): string {
  try {
    const u = new URL(req.url)
    return `${u.protocol}//${u.host}`
  } catch {
    return 'https://coyl.ai'
  }
}
