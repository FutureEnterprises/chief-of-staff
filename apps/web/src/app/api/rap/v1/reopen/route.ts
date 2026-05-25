/**
 * POST /api/rap/v1/reopen — reopen a closed coaching path.
 *
 * User-authenticated (Clerk session). When a RAP assessment classifies
 * a moment as crisis_indication or legal_or_medical_emergency, the
 * user's coaching path is closed: no PAP proposals fire, no EAP
 * actions trigger, until a human-reviewed reopen is logged.
 *
 * This endpoint is that reopen. Per RAP-0.1.md §4 the coaching path
 * is `coaching_path_closed_until: "human_reopen_required"` after a
 * crisis envelope is issued — the only way out is a deliberate human
 * action. v0.1 lets the user themselves perform the reopen (the human
 * is the user); v0.2 will route to a clinician-attestation flow for
 * emergency-envelope reopens.
 *
 * Body:
 *   user_id — must equal the authenticated user's id
 *   reason  — free-form explanation for the audit record (required —
 *             "I felt better an hour later," "talked with my partner,"
 *             "crisis pattern was a false-positive on song lyrics," etc.)
 *
 * Returns the number of open assessments that were reopened. Typically
 * 1, but a user with multiple closing assessments stacked up gets them
 * all cleared in one call so they don't have to reopen each one.
 */

import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { reopenCoachingPath } from '@/lib/rap/store'

type Body = {
  user_id?: string
  reason?: string
}

export async function POST(req: Request) {
  let user
  try {
    user = await requireDbUser()
  } catch {
    return errorResponse(401, 'unauthenticated', 'Sign in required.')
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body is not valid JSON.')
  }

  if (!body.user_id || typeof body.user_id !== 'string') {
    return errorResponse(400, 'missing_user_id', 'Field `user_id` is required.')
  }
  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    return errorResponse(
      400,
      'missing_reason',
      'Field `reason` is required so the reopen is auditable.',
    )
  }

  // v0.1: the user must reopen their own coaching path. v0.2 adds an
  // admin/clinician path for emergency-envelope reopens.
  if (body.user_id !== user.id) {
    return errorResponse(
      403,
      'forbidden',
      'You can only reopen your own coaching path.',
    )
  }

  let reopenedCount: number
  try {
    const result = await reopenCoachingPath({
      userId: user.id,
      actorUserId: user.id,
      reason: body.reason.trim(),
    })
    reopenedCount = result.reopenedCount
  } catch (err) {
    console.error('[rap/reopen] reopenCoachingPath failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId: user.id,
    })
    return errorResponse(
      500,
      'reopen_failed',
      'Unable to reopen the coaching path.',
    )
  }

  return NextResponse.json({ reopened_count: reopenedCount }, { status: 200 })
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
