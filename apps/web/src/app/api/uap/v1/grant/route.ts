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
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { createGrant } from '@/lib/uap/grant-store'
import { writeAuditEntry } from '@/lib/uap/audit'
import { UAP_SCOPES, type UAPScope, type UAPRuleKind } from '@/lib/uap/types'

const MAX_GRANT_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

type Body = {
  user_id?: string
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

  // ── Rule shape validation (light — store does the real work) ─────
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
      rules.push({
        kind: r.kind as UAPRuleKind,
        params: (r.params ?? {}) as Record<string, unknown>,
      })
    }
  }

  // ── Persist ──────────────────────────────────────────────────────
  let grant
  try {
    grant = await createGrant({
      userId: body.user_id,
      llmPartnerId: partner.id,
      scopes: body.scopes as UAPScope[],
      expiresAt,
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
      partnerId: partner.id,
      userId: body.user_id,
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
      userId: body.user_id,
      llmPartnerId: partner.id,
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
