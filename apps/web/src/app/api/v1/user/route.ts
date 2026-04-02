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
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const body = await req.json()
  const allowed = [
    'timezone',
    'morningCheckinTime',
    'nightCheckinTime',
    'briefingTime',
    'reminderIntensity',
    'emailBriefingEnabled',
    'emailBriefingDays',
  ] as const

  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  if (Object.keys(data).length === 0) {
    return new NextResponse('No updatable fields provided', { status: 400 })
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data })
  return NextResponse.json({ success: true, user: updated })
}
