/**
 * GET /api/rap/v1/audit — user reads their RAP assessment history.
 *
 * User-authenticated (Clerk session). Mirrors the UAP audit primitive:
 * the user owns the audit trail of every risk classification the
 * partner ecosystem has made about them. Append-only, queryable
 * without partner involvement.
 *
 * Query params:
 *   limit — default 50, max 500
 *   since — ISO 8601 timestamp; entries created on/after only
 *
 * Returns each assessment's risk class, routing envelope (if any),
 * coaching-path-closed state, and timestamp. The signal chain itself
 * is NOT returned here — per RAP-0.1.md §3 the rationale signature
 * (a sha256 hash of the chain) is the audit-replay primitive, not the
 * raw signals. The user can request the raw chain through a separate
 * data-export ceremony.
 */

import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { loadUserAssessments } from '@/lib/rap/store'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 500

export async function GET(req: Request) {
  let user
  try {
    user = await requireDbUser()
  } catch {
    return errorResponse(401, 'unauthenticated', 'Sign in required.')
  }

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

  let assessments
  try {
    assessments = await loadUserAssessments({
      userId: user.id,
      since,
      limit,
    })
  } catch (err) {
    console.error('[rap/audit] loadUserAssessments failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId: user.id,
    })
    return errorResponse(
      500,
      'load_failed',
      'Unable to load RAP assessment history.',
    )
  }

  return NextResponse.json({
    assessments: assessments.map((a) => ({
      id: a.id,
      risk_class: a.riskClass,
      classifier_version: a.classifierVersion,
      routing_envelope: a.routingEnvelope,
      coaching_path_closed: a.coachingPathClosed,
      created_at: a.createdAt instanceof Date
        ? a.createdAt.toISOString()
        : a.createdAt,
    })),
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
