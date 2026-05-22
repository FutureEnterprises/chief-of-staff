/**
 * POST /api/v1/scope/grant
 *
 * User-initiated, Clerk-authenticated consent grant. The end user
 * authorizes one or more scopes for a specific LLM partner (looked
 * up by slug). Idempotent: re-granting an already-granted scope is
 * a no-op that refreshes the consent-version metadata.
 *
 * Request body:
 *   {
 *     "llmPartnerSlug": "anthropic-claude-sonnet-3.7",
 *     "scope": "proactive_food" | ["proactive_food", "edge:watch:haptic"],
 *     "consentScreenVersion": "v1.2"   // optional, defaults to "v1"
 *   }
 *
 * Response:
 *   {
 *     "granted": ["proactive_food", "edge:watch:haptic"],
 *     "partner": { "slug": "...", "name": "...", "publisher": "..." }
 *   }
 *
 * Writes one EAPAuditEntry per successful scope grant via
 * grantScope() in lib/scope-grants.ts.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { grantScope } from '@/lib/scope-grants'
import { checkRateLimit } from '@/lib/rate-limit'

const SCOPE_PATTERN = /^[a-z0-9_:\-.]{1,128}$/i

const bodySchema = z.object({
  llmPartnerSlug: z.string().min(1).max(128),
  scope: z.union([
    z.string().regex(SCOPE_PATTERN),
    z.array(z.string().regex(SCOPE_PATTERN)).min(1).max(32),
  ]),
  consentScreenVersion: z.string().min(1).max(32).optional(),
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
  const consentScreenVersion = parsed.data.consentScreenVersion ?? 'v1'

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const partner = await prisma.lLMPartner.findUnique({
    where: { slug: parsed.data.llmPartnerSlug },
    select: { id: true, slug: true, name: true, publisher: true, active: true },
  })
  if (!partner) {
    return NextResponse.json(
      { error: 'LLM partner not found' },
      { status: 404 },
    )
  }
  if (!partner.active) {
    return NextResponse.json(
      { error: 'LLM partner is not active' },
      { status: 409 },
    )
  }

  const ipAddress = extractIp(req)
  const userAgent = req.headers.get('user-agent')

  const granted: string[] = []
  for (const scope of uniqueScopes) {
    try {
      await grantScope({
        userId: user.id,
        llmPartnerId: partner.id,
        scope,
        consentScreenVersion,
        ipAddress,
        userAgent,
      })
      granted.push(scope)
    } catch (err) {
      console.error('[POST /api/v1/scope/grant] grantScope failed', {
        userId: user.id,
        llmPartnerId: partner.id,
        scope,
        err: err instanceof Error ? err.message : 'unknown',
      })
      // Continue with remaining scopes — partial success is better
      // than abort-all when the user has approved a bundle of 5
      // and one is invalid.
    }
  }

  return NextResponse.json({
    granted,
    partner: { slug: partner.slug, name: partner.name, publisher: partner.publisher },
  })
}

function extractIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')
}
