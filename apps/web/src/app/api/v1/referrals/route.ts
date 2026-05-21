import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { getReferralStats } from '@/lib/referrals'

/**
 * GET /api/v1/referrals
 *
 * Returns the authenticated user's referral code, share URL, and stats.
 * Uses the shared lib/referrals helper so the Crockford-code format and
 * the /r/[code] share URL stay aligned with the cookie-based redirect
 * route. Older hex-format codes from the previous implementation are
 * preserved on existing users — the redirect handler accepts any code
 * string.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const stats = await getReferralStats(user.id)
  return Response.json(stats)
}

/**
 * Accept a referral code when a new user signs up.
 * Called during onboarding (server-side) to link referredByUserId.
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, referredByUserId: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  if (user.referredByUserId) {
    return Response.json({ error: 'Already has referrer' }, { status: 409 })
  }

  const { code } = (await req.json()) as { code?: string }
  if (!code) return Response.json({ error: 'code required' }, { status: 400 })

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: { id: true, email: true },
  })
  if (!referrer || referrer.id === user.id) {
    return Response.json({ error: 'Invalid code' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { referredByUserId: referrer.id },
  })

  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: user.id,
      code: code.toUpperCase(),
      converted: false,
    },
  })

  await prisma.productivityEvent
    .create({ data: { userId: referrer.id, eventType: 'REFERRAL_SENT', eventValue: user.id } })
    .catch(() => {})

  return Response.json({ ok: true })
}
