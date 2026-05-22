/**
 * POST /api/v1/scope/revoke
 *
 * User-initiated, Clerk-authenticated consent revoke. Soft-revokes
 * one or more scopes previously granted to an LLM partner.
 * Idempotent: revoking a scope that was never granted (or already
 * revoked) is a silent no-op — the scope simply doesn't appear in
 * the returned `revoked` array.
 *
 * Request body:
 *   {
 *     "llmPartnerSlug": "anthropic-claude-sonnet-3.7",
 *     "scope": "proactive_food" | ["proactive_food", "edge:watch:haptic"]
 *   }
 *
 * Response:
 *   { "revoked": ["proactive_food", "edge:watch:haptic"] }
 *
 * Writes one EAPAuditEntry per successful scope revoke via
 * revokeScope() in lib/scope-grants.ts.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { revokeScope } from '@/lib/scope-grants'
import { checkRateLimit } from '@/lib/rate-limit'

const SCOPE_PATTERN = /^[a-z0-9_:\-.]{1,128}$/i

const bodySchema = z.object({
  llmPartnerSlug: z.string().min(1).max(128),
  scope: z.union([
    z.string().regex(SCOPE_PATTERN),
    z.array(z.string().regex(SCOPE_PATTERN)).min(1).max(32),
  ]),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkRateLimit('auth', clerkId)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  let bodyJson: unknown
  try {
    bodyJson = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(bodyJson)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const scopes = Array.isArray(parsed.data.scope)
    ? parsed.data.scope
    : [parsed.data.scope]
  const uniqueScopes = Array.from(new Set(scopes))

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const partner = await prisma.lLMPartner.findUnique({
    where: { slug: parsed.data.llmPartnerSlug },
    select: { id: true, slug: true, name: true, publisher: true },
  })
  if (!partner) {
    return NextResponse.json(
      { error: 'LLM partner not found' },
      { status: 404 },
    )
  }

  const ipAddress = extractIp(req)
  const userAgent = req.headers.get('user-agent')

  const revoked: string[] = []
  for (const scope of uniqueScopes) {
    try {
      // revokeScope() is internally idempotent; we still surface
      // only the scopes that were actually flipped (i.e. existed
      // and were active before this call). Use a pre-check so the
      // returned array reflects state change, not just intent.
      const before = await prisma.scopeGrant.findUnique({
        where: {
          userId_llmPartnerId_scope: {
            userId: user.id,
            llmPartnerId: partner.id,
            scope,
          },
        },
        select: { active: true, revokedAt: true },
      })

      if (before && before.active && before.revokedAt === null) {
        await revokeScope({
          userId: user.id,
          llmPartnerId: partner.id,
          scope,
          ipAddress,
          userAgent,
        })
        revoked.push(scope)
      }
    } catch (err) {
      console.error('[POST /api/v1/scope/revoke] revokeScope failed', {
        userId: user.id,
        llmPartnerId: partner.id,
        scope,
        err: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  return NextResponse.json({ revoked })
}

function extractIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')
}
