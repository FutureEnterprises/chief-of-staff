/**
 * GET /api/pap/v1/observation/[userId] — read the Behavioral Context
 * Object (BCO).
 *
 * Primitive #1 of the Proactive AI Protocol. Any PAP-authorized LLM
 * partner can call this to read the user's current behavioral state.
 * The BCO is the substrate for every other PAP call — it's what the
 * LLM evaluates before emitting a Proposal (§2).
 *
 * Auth:
 *   - Bearer token (LLM partner API key). authenticateLLMPartner()
 *     handles parsing + verification + failed-auth audit writes.
 *   - Scope: the user must have granted `read_observation` to this
 *     partner. assertScopeGrant() throws ScopeNotGrantedError when not.
 *
 * Caching:
 *   - 60s s-maxage on the response so multi-LLM hammering doesn't pin
 *     the database. The BCO is moment-scoped but the freshness
 *     requirement of "what's the user doing right now" is ~minutes,
 *     not seconds.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { buildBehavioralContextObject } from '@/lib/pap/bco'
import { authenticateLLMPartner } from '@/lib/llm-partner-auth'
import { assertScopeGrant, ScopeNotGrantedError } from '@/lib/scope-grants'

export const maxDuration = 15

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  if (!userId) {
    return NextResponse.json({ error: 'missing_user_id' }, { status: 400 })
  }

  const authResult = await authenticateLLMPartner(req)
  if (authResult.error) return authResult.error
  const partner = authResult.partner

  // Confirm the user exists; 404 if not so we don't leak which IDs
  // are reachable to a partner that hasn't been granted them.
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!userExists) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }

  // Scope check — partner must hold read_observation against this user.
  try {
    await assertScopeGrant({
      userId,
      llmPartnerId: partner.id,
      scope: 'read_observation',
    })
  } catch (err) {
    if (err instanceof ScopeNotGrantedError) {
      return NextResponse.json(
        { error: 'scope_not_granted', scope: 'read_observation' },
        { status: 403 },
      )
    }
    throw err
  }

  const bco = await buildBehavioralContextObject(userId)

  return NextResponse.json(bco, {
    headers: {
      // 60s cache so LLM partners polling at high frequency don't
      // exhaust the database. Edge cache will revalidate in the
      // background; partners always see at-most-60s-stale data.
      'Cache-Control': 'private, max-age=60, s-maxage=60',
    },
  })
}
