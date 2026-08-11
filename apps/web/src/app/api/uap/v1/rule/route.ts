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
import { validateRuleParams } from '@/lib/uap/rule-params'
import { UAP_RULE_KINDS, isUAPRuleKind } from '@/lib/uap/types'
import type { UAPRuleKind } from '@/lib/uap/types'

/**
 * Every kind is accepted and every kind is enforced. The list is the
 * one declared in lib/uap/types.ts, not a second copy of it.
 *
 * There used to be an UNENFORCED_RULE_KINDS set here holding
 * `frequency_cap`: the coordinator's case was a no-op, so rather than
 * record a pre-decline nothing would check, the route refused the kind
 * outright. The coordinator now counts the trailing window against the
 * audit log and denies with `frequency_cap_exceeded`, with an atomic
 * re-check under the audit advisory lock, so the refusal is gone and
 * the documented rule kind works. If a kind is ever added to
 * UAP_RULE_KINDS without a coordinator case, the drift test in
 * lib/uap/__tests__/rule-fail-closed.test.ts fails CI — that test, not
 * a hand-maintained deny-list, is what keeps this route honest.
 */
const ALLOWED_RULE_KINDS: readonly UAPRuleKind[] = UAP_RULE_KINDS

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
  if (!isUAPRuleKind(body.kind)) {
    return errorResponse(
      400,
      'unknown_rule_kind',
      'Rule kind is not part of UAP-0.1.',
      { allowed_kinds: ALLOWED_RULE_KINDS, received: body.kind },
    )
  }
  const kind: UAPRuleKind = body.kind

  const params =
    body.params && typeof body.params === 'object'
      ? (body.params as Record<string, unknown>)
      : {}

  // Params must be EVALUABLE, not merely present. The coordinator now
  // denies with `rule_unevaluable` on a params blob it cannot parse —
  // which is the correct posture at decision time, but it means a
  // typo'd rule stored here would silently deny every action under
  // every affected grant. Catch it at the only moment a human is
  // present to fix it.
  const validated = validateRuleParams(kind, params)
  if (!validated.ok) {
    return errorResponse(
      400,
      'invalid_rule_params',
      'Rule params are not evaluable by this engine. A stored rule the coordinator cannot evaluate would deny every affected action, so it is refused here instead.',
      { kind, problem: validated.detail },
    )
  }

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
      kind,
      params,
    })
  } catch (err) {
    console.error('[uap/rule] addRule failed', {
      err: err instanceof Error ? err.message : 'unknown',
      userId: user.id,
      kind,
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
