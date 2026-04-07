/**
 * Mobile API v1 — User profile and entitlement
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { PLAN_LIMITS } from '@/lib/services/entitlement.service'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      timezone: true,
      morningCheckinTime: true,
      nightCheckinTime: true,
      briefingTime: true,
      reminderIntensity: true,
      planType: true,
      aiAssistsUsed: true,
      aiAssistsResetAt: true,
      trialEndsAt: true,
      onboardingCompleted: true,
      createdAt: true,
      billingSubscription: {
        select: { status: true, renewsAt: true, cancelledAt: true, planType: true },
      },
    },
  })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const limits = PLAN_LIMITS[user.planType] ?? PLAN_LIMITS.FREE!

  return NextResponse.json({
    ...user,
    entitlements: {
      maxActiveTasks: limits.maxActiveTasks === Infinity ? null : limits.maxActiveTasks,
      aiAssistsPerMonth: limits.aiAssistsPerMonth === Infinity ? null : limits.aiAssistsPerMonth,
      followUpAutomation: limits.followUpAutomation,
      notificationEscalation: limits.notificationEscalation,
      advancedInsights: limits.advancedInsights,
      emailSummaries: limits.emailSummaries,
    },
  })
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { updateUserSchema } = await import('@/lib/validations')
  const parsed = updateUserSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: user.id }, data })
  return NextResponse.json({ success: true })
}
