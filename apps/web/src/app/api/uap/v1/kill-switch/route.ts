/**
 * POST /api/uap/v1/kill-switch — global revoke across every LLM partner.
 *
 * User-authenticated (Clerk session). NOT partner-authenticated — per
 * UAP-0.1.md §5 the kill switch is the user's primitive, not the
 * partner's. The endpoint is rate-limit-exempt and returns within
 * 1 second; propagation to connected EAP surfaces fires within 5
 * seconds via the kill-switch lib.
 *
 * Spec invariant (§3): kill supersedes every grant, every rule,
 * every in-flight action. The lib flips every active grant for the
 * user to KILLED_GLOBALLY in a single transaction.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { initiateKillSwitch } from '@/lib/uap/kill-switch'
import { writeAuditEntry } from '@/lib/uap/audit'

type Body = {
  user_id?: string
  reason?: string
}

export async function POST(req: Request) {
  // User auth only — partner Bearer tokens are rejected at this surface.
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

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body is not valid JSON.')
  }

  if (!body.user_id || typeof body.user_id !== 'string') {
    return errorResponse(400, 'missing_user_id', 'Field `user_id` is required.')
  }
  // Authorization check: the authenticated user must match the
  // user_id in the body. The kill switch is a SELF-service primitive.
  if (body.user_id !== user.id) {
    return errorResponse(
      403,
      'user_mismatch',
      'You can only kill your own standing authority.',
    )
  }

  const reason =
    typeof body.reason === 'string' && body.reason.length > 0
      ? body.reason
      : 'user_initiated'

  let result
  try {
    result = await initiateKillSwitch({ userId: user.id, reason })
  } catch (err) {
    console.error('[uap/kill-switch] initiateKillSwitch failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId: user.id,
    })
    return errorResponse(
      500,
      'kill_switch_failed',
      'Kill switch could not be initiated. Try again immediately.',
    )
  }

  // Write a single audit row per kill event. The kill itself
  // supersedes individual grants, so this row is keyed off a
  // synthetic grantId='__kill__' or the first affected grant —
  // the lib decides. We write best-effort: audit failure must NOT
  // block the kill response (the user needs the 1s SLA).
  try {
    await writeAuditEntry({
      grantId: result.affectedGrantIds[0] ?? '__kill__',
      userId: user.id,
      llmPartnerId: '__kill__',
      operation: 'kill',
      decision: 'allowed',
      decisionReason: reason,
      postTermination: false,
    })
  } catch (err) {
    console.warn('[uap/kill-switch] audit write failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId: user.id,
    })
  }

  const origin = safeOrigin(req)
  return NextResponse.json({
    killed_at: result.killedAt.toISOString(),
    affected_grant_ids: result.affectedGrantIds,
    audit_url: `${origin}/audit/uap?user_id=${encodeURIComponent(user.id)}`,
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

function safeOrigin(req: Request): string {
  try {
    const u = new URL(req.url)
    return `${u.protocol}//${u.host}`
  } catch {
    return 'https://coyl.ai'
  }
}
