/**
 * GET /api/rap/v1/status — is the user's coaching path currently closed?
 *
 * Dual-auth endpoint. The partner needs to call this BEFORE every PAP
 * proposal — if the coaching path is closed (RAP previously fired a
 * crisis or emergency envelope and a human reopen hasn't happened),
 * the partner must not propose any intervention. The user needs to
 * call it to see their own state.
 *
 * Auth order:
 *   1. Try UAP-partner Bearer token first (header present + parses
 *      cleanly + maps to an active partner row).
 *   2. Fall back to Clerk session.
 *   3. Neither → 401.
 *
 * Partner auth allows querying any user_id (the partner needs to gate
 * proposals across all users they have grants on). User-session auth
 * restricts to the authenticated user's own id — a user can't probe
 * another user's coaching-path state.
 *
 * Returns the boolean plus a checked_at timestamp the caller can
 * cache against. The state is updated atomically by writeAssessment
 * and reopenCoachingPath so the response is always current.
 */

import { NextResponse } from 'next/server'
import { authenticateUAPPartner } from '@/lib/uap/uap-partner-auth'
import { requireDbUser } from '@/lib/auth'
import { isUserCoachingPathClosed } from '@/lib/rap/store'

export async function GET(req: Request) {
  const { searchParams } = safeUrlOrEmpty(req.url)
  const userId = searchParams.get('user_id')
  if (!userId || userId.length === 0) {
    return errorResponse(
      400,
      'missing_user_id',
      'Query parameter `user_id` is required.',
    )
  }

  // ── Resolve auth ──────────────────────────────────────────────────
  // Try partner auth first if the Authorization header is present and
  // looks like a UAP Bearer token. If the header is missing OR the
  // partner auth returns a 401, fall through to user-session auth.
  let authedAs: 'partner' | 'user' | null = null
  let authedUserId: string | null = null

  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (authHeader && /^Bearer\s+coyl_uap_/i.test(authHeader.trim())) {
    const partnerResult = await authenticateUAPPartner(req)
    if (partnerResult.error) {
      // The header was present and looked like a UAP token but auth
      // failed — return the partner-auth 401 directly rather than
      // silently falling through to user auth. A malformed/expired
      // partner token should not be allowed to opportunistically
      // succeed via a cookie that happens to be on the request.
      return partnerResult.error
    }
    authedAs = 'partner'
  } else {
    // No partner header → try user session.
    let user
    try {
      user = await requireDbUser()
    } catch {
      return errorResponse(401, 'unauthenticated', 'Authentication required.')
    }
    authedAs = 'user'
    authedUserId = user.id
  }

  // ── Authorization (user-id binding) ───────────────────────────────
  if (authedAs === 'user' && authedUserId !== userId) {
    return errorResponse(
      403,
      'forbidden',
      'You can only check your own coaching-path state.',
    )
  }

  // ── Look up state ─────────────────────────────────────────────────
  let closed: boolean
  try {
    closed = await isUserCoachingPathClosed(userId)
  } catch (err) {
    console.error('[rap/status] isUserCoachingPathClosed failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId,
    })
    return errorResponse(
      500,
      'status_lookup_failed',
      'Unable to determine coaching-path state.',
    )
  }

  return NextResponse.json({
    user_id: userId,
    coaching_path_closed: closed,
    checked_at: new Date().toISOString(),
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
