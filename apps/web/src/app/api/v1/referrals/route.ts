import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { randomBytes } from 'crypto'

function makeCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } })
  if (user?.referralCode) return user.referralCode

  // Retry if collision
  for (let i = 0; i < 5; i++) {
    const code = makeCode()
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } })
      return code
    } catch {
      // collision, retry
    }
  }
  throw new Error('Failed to generate referral code')
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, referralCode: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const code = user.referralCode ?? (await ensureReferralCode(user.id))

  const [made, converted] = await Promise.all([
    prisma.referral.count({ where: { referrerId: user.id } }),
    prisma.referral.count({ where: { referrerId: user.id, converted: true } }),
  ])

  const shareUrl = `https://coyl.ai/?ref=${code}`

  return Response.json({
    code,
    shareUrl,
    stats: { sent: made, converted, creditsEarnedCents: converted * 1000 },
  })
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
