/**
 * GET /api/uap/v1/grant/[id]    — read grant metadata + current status.
 * DELETE /api/uap/v1/grant/[id] — user-initiated revoke.
 *
 * GET is dual-authenticated: a partner Bearer (sees grants they
 * issued) OR a Clerk user session (sees grants they granted). DELETE
 * is user-only — the user is the only party that can take their
 * authority back per UAP-0.1.md §3.
 *
 * GET returns the live status, not a cached snapshot — `expired` is
 * computed from `expiresAt` on each read (the engine will also have
 * a sweeper, but reads must self-correct between sweeps).
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { loadGrant, revokeGrant } from '@/lib/uap/grant-store'
import { writeAuditEntry } from '@/lib/uap/audit'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  if (!id) return errorResponse(400, 'missing_grant_id', 'Grant id is required.')

  // Authenticate either partner or user. The presence of an
  // Authorization header signals partner intent; otherwise we fall
  // back to Clerk session.
  const hasBearer = !!(
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  )

  let viewerKind: 'partner' | 'user'
  let viewerId: string

  if (hasBearer) {
    const partnerAuth = await authenticateUAPPartner(req)
    if (partnerAuth.error) return partnerAuth.error
    viewerKind = 'partner'
    viewerId = partnerAuth.partner.id
  } else {
    const { userId: clerkId } = await auth()
    if (!clerkId) return errorResponse(401, 'unauthenticated', 'Sign in required.')
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) return errorResponse(404, 'user_not_found', 'No matching user.')
    viewerKind = 'user'
    viewerId = user.id
  }

  let grant
  try {
    grant = await loadGrant(id)
  } catch (err) {
    console.error('[uap/grant/[id]] loadGrant failed', {
      err: err instanceof Error ? err.message : 'unknown',
      grantId: id,
    })
    return errorResponse(500, 'load_failed', 'Unable to load grant.')
  }
  if (!grant) {
    return errorResponse(404, 'grant_not_found', `No grant with id ${id}.`)
  }

  // Ownership check — partner only sees grants they issued, user
  // only sees grants they granted.
  if (viewerKind === 'partner' && grant.llmPartnerId !== viewerId) {
    return errorResponse(
      403,
      'not_grant_partner',
      'This grant was not issued to your partner account.',
    )
  }
  if (viewerKind === 'user' && grant.userId !== viewerId) {
    return errorResponse(
      403,
      'not_grant_user',
      'This grant does not belong to you.',
    )
  }

  // Compute live status — expired flips to `expired` on read even
  // before the sweeper notices.
  const liveStatus = computeLiveStatus(grant)

  const origin = safeOrigin(req)
  return NextResponse.json({
    grant_id: grant.id,
    user_id: grant.userId,
    llm_partner_id: grant.llmPartnerId,
    scopes: grant.scopes,
    status: liveStatus,
    expires_at: grant.expiresAt.toISOString(),
    created_at: grant.createdAt.toISOString(),
    terminated_at: grant.terminatedAt ? grant.terminatedAt.toISOString() : null,
    termination_reason: grant.terminationReason ?? null,
    consent_artifact: grant.consentArtifact,
    audit_url: `${origin}/audit/uap/${grant.id}`,
    kill_switch_url: `${origin}/kill`,
  })
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  if (!id) return errorResponse(400, 'missing_grant_id', 'Grant id is required.')

  // User-only — partners cannot revoke their own grants per §3.
  const { userId: clerkId } = await auth()
  if (!clerkId) return errorResponse(401, 'unauthenticated', 'Sign in required.')
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return errorResponse(404, 'user_not_found', 'No matching user.')

  let grant
  try {
    grant = await loadGrant(id)
  } catch (err) {
    console.error('[uap/grant/[id]] loadGrant failed', {
      err: err instanceof Error ? err.message : 'unknown',
      grantId: id,
    })
    return errorResponse(500, 'load_failed', 'Unable to load grant.')
  }
  if (!grant) {
    return errorResponse(404, 'grant_not_found', `No grant with id ${id}.`)
  }
  if (grant.userId !== user.id) {
    return errorResponse(
      403,
      'not_grant_user',
      'This grant does not belong to you.',
    )
  }

  // Idempotent — re-revoking an already-revoked grant just returns
  // its current terminal state without writing another audit row.
  if (grant.status !== 'ACTIVE') {
    return NextResponse.json({
      grant_id: grant.id,
      status: grant.status.toLowerCase(),
      terminatedAt: grant.terminatedAt
        ? grant.terminatedAt.toISOString()
        : null,
    })
  }

  let revoked
  try {
    revoked = await revokeGrant(id, { reason: 'user_initiated' })
  } catch (err) {
    console.error('[uap/grant/[id]] revokeGrant failed', {
      err: err instanceof Error ? err.message : 'unknown',
      grantId: id,
    })
    return errorResponse(500, 'revoke_failed', 'Unable to revoke grant.')
  }

  try {
    await writeAuditEntry({
      grantId: revoked.id,
      userId: user.id,
      llmPartnerId: revoked.llmPartnerId,
      operation: 'revoke',
      decision: 'allowed',
      decisionReason: 'user_initiated',
      postTermination: false,
    })
  } catch (err) {
    console.warn('[uap/grant/[id]] audit write failed', {
      err: err instanceof Error ? err.message : 'unknown',
      grantId: revoked.id,
    })
  }

  return NextResponse.json({
    grant_id: revoked.id,
    status: 'revoked',
    terminatedAt: revoked.terminatedAt
      ? revoked.terminatedAt.toISOString()
      : new Date().toISOString(),
  })
}

function computeLiveStatus(grant: {
  status: string
  expiresAt: Date
}): 'active' | 'revoked' | 'expired' | 'killed_globally' {
  if (grant.status === 'REVOKED_BY_USER') return 'revoked'
  if (grant.status === 'KILLED_GLOBALLY') return 'killed_globally'
  if (grant.status === 'EXPIRED') return 'expired'
  if (grant.expiresAt.getTime() <= Date.now()) return 'expired'
  return 'active'
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
