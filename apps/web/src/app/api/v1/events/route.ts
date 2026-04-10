import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  try {
    const { eventType, metadata } = await req.json()

    if (!eventType || typeof eventType !== 'string') {
      return Response.json({ error: 'eventType required' }, { status: 400 })
    }

    // Allowlist of trackable events
    const allowed = [
      'PAYWALL_SEEN', 'UPGRADE_STARTED', 'FEATURE_USED',
      'ASSESSMENT_RUN', 'CHAT_SESSION', 'MORNING_REVIEW', 'NIGHT_REVIEW',
    ]
    if (!allowed.includes(eventType)) {
      return Response.json({ error: 'Invalid event type' }, { status: 400 })
    }

    await prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType,
        ...(metadata ? { outputJson: metadata } : {}),
      },
    })

    // Update lastActiveAt for churn tracking
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
