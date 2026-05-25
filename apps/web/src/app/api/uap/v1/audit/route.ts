/**
 * GET /api/uap/v1/audit — user reads their UAP audit history.
 *
 * User-authenticated (Clerk session). One of the two non-negotiable
 * UAP primitives per UAP-0.1.md §2 — the user owns the audit trail,
 * not the LLM partner, not COYL. Append-only, signed, queryable
 * without partner involvement.
 *
 * Query params:
 *   limit   — default 50, max 500
 *   grantId — filter to a specific grant
 *   since   — ISO 8601 timestamp; entries created on/after only
 *
 * Returns the rows plus `chain_valid` — the audit chain integrity
 * check from verifyAuditChain. A `false` here is a critical signal
 * the chain has been tampered with or corrupted.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { loadAuditChain, verifyAuditChain } from '@/lib/uap/audit'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 500

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return errorResponse(401, 'unauthenticated', 'Sign in required.')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return errorResponse(404, 'user_not_found', 'No matching user.')

  const { searchParams } = safeUrlOrEmpty(req.url)

  // limit — int, default 50, clamped to [1, MAX_LIMIT]
  const limitRaw = searchParams.get('limit')
  let limit = DEFAULT_LIMIT
  if (limitRaw !== null) {
    const n = Number.parseInt(limitRaw, 10)
    if (!Number.isFinite(n) || n < 1) {
      return errorResponse(
        400,
        'invalid_limit',
        '`limit` must be a positive integer.',
      )
    }
    limit = Math.min(n, MAX_LIMIT)
  }

  const grantIdRaw = searchParams.get('grantId') ?? searchParams.get('grant_id')
  const grantId =
    grantIdRaw && grantIdRaw.length > 0 ? grantIdRaw : undefined

  const sinceRaw = searchParams.get('since')
  let since: Date | undefined
  if (sinceRaw) {
    const d = new Date(sinceRaw)
    if (Number.isNaN(d.getTime())) {
      return errorResponse(
        400,
        'invalid_since',
        '`since` must be an ISO 8601 timestamp.',
      )
    }
    since = d
  }

  let entries
  try {
    entries = await loadAuditChain({
      userId: user.id,
      grantId,
      since,
      limit,
    })
  } catch (err) {
    console.error('[uap/audit] loadAuditChain failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId: user.id,
    })
    return errorResponse(
      500,
      'load_failed',
      'Unable to load audit entries.',
    )
  }

  let chainValid = false
  try {
    const result = await verifyAuditChain(user.id)
    chainValid = result.valid
  } catch (err) {
    console.warn('[uap/audit] verifyAuditChain failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId: user.id,
    })
    chainValid = false
  }

  return NextResponse.json({
    entries,
    chain_valid: chainValid,
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

function safeUrlOrEmpty(url: string): URL {
  try {
    return new URL(url)
  } catch {
    return new URL('https://coyl.ai/')
  }
}
