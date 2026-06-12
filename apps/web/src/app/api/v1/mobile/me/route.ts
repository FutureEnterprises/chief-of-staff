import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/v1/mobile/me
 *
 * The minimal entitlement + identity payload the mobile app needs to gate
 * signed-in surfaces (plan notice, upgrade prompt, greeting). Kept deliberately
 * small and stable — the heavier /api/v1/user route returns the full autopilot
 * model; this one is just the plan/identity slice the mobile client polls on
 * sign-in and surface focus.
 *
 * Auth: Clerk session token (Bearer). `auth()` reads the Clerk session and
 * resolves the clerkId, which maps to the local User row via User.clerkId.
 *
 * IMPORTANT (Next 16 cacheComponents): `auth()` is kept OUTSIDE any try/catch.
 * The prerender pass throws a dynamic-access sentinel from auth()/headers();
 * catching it makes Next treat the route as static and then the runtime
 * dynamic access throws. The same pattern is used in the sibling
 * /api/v1/autopilot-map/me and /api/v1/user routes.
 *
 * Returns: { planType, email, firstName, onboardingCompleted }
 *   - planType: User.planType (PlanType enum — FREE | CORE | PLUS | PREMIUM | …)
 *   - email: User.email
 *   - firstName: first token of User.name (the schema stores a single `name`
 *     field, not first/last; we split on whitespace for a friendly greeting,
 *     null when name is empty)
 *   - onboardingCompleted: User.onboardingCompleted
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit before any DB query (mirrors /api/v1/user). 'auth' tier =
  // 20 req/min/user — generous for an on-focus poll, tight enough to block
  // enumeration.
  const rl = await checkRateLimit('auth', clerkId)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      planType: true,
      email: true,
      name: true,
      onboardingCompleted: true,
    },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const firstName = user.name.trim().split(/\s+/)[0] || null

  return NextResponse.json({
    planType: user.planType,
    email: user.email,
    firstName,
    onboardingCompleted: user.onboardingCompleted,
  })
}
