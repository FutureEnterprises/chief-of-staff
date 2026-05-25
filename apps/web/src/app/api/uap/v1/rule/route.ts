/**
 * POST /api/uap/v1/rule — declare a pre-decline rule.
 *
 * User-authenticated (Clerk session). Per UAP-0.1.md §3: "Negative
 * authority precedes positive authority. A rule that pre-declines an
 * action class is stronger than any grant. RULE_DECLARE writes a row
 * that supersedes every overlapping grant, even fresh ones."
 *
 * When `grant_id` is null/omitted, the rule is USER-LEVEL and
 * applies to every current AND future grant. When `grant_id` is
 * supplied, the rule scopes to that grant only (it dies with the
 * grant via the ON DELETE CASCADE in the schema).
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { addRule, loadGrant } from '@/lib/uap/grant-store'
import type { UAPRuleKind } from '@/lib/uap/types'

const ALLOWED_RULE_KINDS: UAPRuleKind[] = [
  'spending_cap',
  'quiet_hours',
  'irreversible_floor',
  'recipient_allowlist',
  'recipient_denylist',
  'frequency_cap',
  'time_of_day_block',
]

type Body = {
  grant_id?: string | null
  kind?: string
  params?: Record<string, unknown>
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return errorResponse(401, 'unauthenticated', 'Sign in required.')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return errorResponse(404, 'user_not_found', 'No matching user.')

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body is not valid JSON.')
  }

  if (!body.kind || typeof body.kind !== 'string') {
    return errorResponse(400, 'missing_kind', 'Field `kind` is required.')
  }
  if (!ALLOWED_RULE_KINDS.includes(body.kind as UAPRuleKind)) {
    return errorResponse(
      400,
      'unknown_rule_kind',
      'Rule kind is not part of UAP-0.1.',
      { allowed_kinds: ALLOWED_RULE_KINDS, received: body.kind },
    )
  }

  const params =
    body.params && typeof body.params === 'object'
      ? (body.params as Record<string, unknown>)
      : {}

  // grant_id is optional + nullable. null/undefined → user-level rule.
  const grantId =
    typeof body.grant_id === 'string' && body.grant_id.length > 0
      ? body.grant_id
      : null

  // If grant-scoped, the grant must belong to the calling user.
  if (grantId !== null) {
    let grant
    try {
      grant = await loadGrant(grantId)
    } catch (err) {
      console.error('[uap/rule] loadGrant failed', {
        err: err instanceof Error ? err.message : 'unknown',
        grantId,
      })
      return errorResponse(500, 'load_failed', 'Unable to load grant.')
    }
    if (!grant) {
      return errorResponse(404, 'grant_not_found', `No grant with id ${grantId}.`)
    }
    if (grant.userId !== user.id) {
      return errorResponse(
        403,
        'not_grant_user',
        'This grant does not belong to you.',
      )
    }
  }

  let rule
  try {
    rule = await addRule({
      userId: user.id,
      grantId,
      kind: body.kind as UAPRuleKind,
      params,
    })
  } catch (err) {
    console.error('[uap/rule] addRule failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId: user.id,
      kind: body.kind,
    })
    return errorResponse(500, 'rule_persist_failed', 'Unable to persist rule.')
  }

  return NextResponse.json(
    {
      rule_id: rule.id,
      kind: rule.kind,
      params: rule.params,
      applies_to: grantId === null ? 'user' : 'grant',
      ...(grantId === null ? {} : { grant_id: grantId }),
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
