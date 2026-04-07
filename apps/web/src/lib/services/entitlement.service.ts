import { prisma } from '@repo/database'

type PlanFeatures = {
  maxActiveTasks: number
  aiAssistsPerMonth: number
  maxProjects: number
  followUpAutomation: boolean
  notificationEscalation: boolean
  advancedInsights: boolean
  emailSummaries: boolean
}

export const PLAN_LIMITS: Record<string, PlanFeatures> = {
  FREE: {
    maxActiveTasks: 50,
    aiAssistsPerMonth: 20,
    maxProjects: 3,
    followUpAutomation: false,
    notificationEscalation: false,
    advancedInsights: false,
    emailSummaries: false,
  },
  PRO: {
    maxActiveTasks: Infinity,
    aiAssistsPerMonth: Infinity,
    maxProjects: Infinity,
    followUpAutomation: true,
    notificationEscalation: true,
    advancedInsights: true,
    emailSummaries: true,
  },
  TEAM: {
    maxActiveTasks: Infinity,
    aiAssistsPerMonth: Infinity,
    maxProjects: Infinity,
    followUpAutomation: true,
    notificationEscalation: true,
    advancedInsights: true,
    emailSummaries: true,
  },
}

export type EntitlementFeature = keyof PlanFeatures

export async function checkAiQuota(
  userId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { planType: true, aiAssistsUsed: true, aiAssistsResetAt: true },
  })
  if (!user) return { allowed: false, used: 0, limit: 0 }

  const limits = PLAN_LIMITS[user.planType] ?? PLAN_LIMITS.FREE!
  const monthlyLimit = limits.aiAssistsPerMonth

  if (monthlyLimit === Infinity) return { allowed: true, used: user.aiAssistsUsed, limit: -1 }

  // Reset counter if the reset window has passed (30-day rolling)
  const now = new Date()
  if (user.aiAssistsResetAt < now) {
    const nextReset = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: userId },
      data: { aiAssistsUsed: 0, aiAssistsResetAt: nextReset },
    })
    return { allowed: true, used: 0, limit: monthlyLimit }
  }

  return {
    allowed: user.aiAssistsUsed < monthlyLimit,
    used: user.aiAssistsUsed,
    limit: monthlyLimit,
  }
}

/**
 * Atomically check + consume one AI assist.
 * Returns false if over quota (no increment performed).
 */
export async function consumeAiAssistAtomic(
  userId: string
): Promise<{ consumed: boolean; used: number; limit: number }> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { planType: true, aiAssistsUsed: true, aiAssistsResetAt: true },
  })
  if (!user) return { consumed: false, used: 0, limit: 0 }

  const limits = PLAN_LIMITS[user.planType] ?? PLAN_LIMITS.FREE!
  const monthlyLimit = limits.aiAssistsPerMonth

  if (monthlyLimit === Infinity) {
    await prisma.user.update({
      where: { id: userId },
      data: { aiAssistsUsed: { increment: 1 } },
    })
    return { consumed: true, used: user.aiAssistsUsed + 1, limit: -1 }
  }

  // Reset counter if window passed
  const now = new Date()
  if (user.aiAssistsResetAt < now) {
    const nextReset = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: userId },
      data: { aiAssistsUsed: 1, aiAssistsResetAt: nextReset },
    })
    return { consumed: true, used: 1, limit: monthlyLimit }
  }

  // Atomic conditional increment: only if under limit
  const result = await prisma.user.updateMany({
    where: { id: userId, aiAssistsUsed: { lt: monthlyLimit } },
    data: { aiAssistsUsed: { increment: 1 } },
  })

  if (result.count === 0) {
    return { consumed: false, used: user.aiAssistsUsed, limit: monthlyLimit }
  }

  return { consumed: true, used: user.aiAssistsUsed + 1, limit: monthlyLimit }
}

/** @deprecated Use consumeAiAssistAtomic instead */
export async function consumeAiAssist(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { aiAssistsUsed: { increment: 1 } },
  })
}

export async function checkTaskLimit(
  userId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const [user, count] = await Promise.all([
    prisma.user.findFirst({ where: { id: userId }, select: { planType: true } }),
    prisma.task.count({
      where: { userId, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
    }),
  ])
  if (!user) return { allowed: false, count: 0, limit: 0 }

  const limits = PLAN_LIMITS[user.planType] ?? PLAN_LIMITS.FREE!
  const maxTasks = limits.maxActiveTasks

  return {
    allowed: count < maxTasks,
    count,
    limit: maxTasks === Infinity ? -1 : maxTasks,
  }
}

export async function hasFeature(userId: string, feature: EntitlementFeature): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { planType: true },
  })
  if (!user) return false
  const limits = PLAN_LIMITS[user.planType] ?? PLAN_LIMITS.FREE!
  const value = limits[feature]
  return value === true || value === Infinity
}

export class EntitlementError extends Error {
  constructor(
    public readonly feature: EntitlementFeature | 'ai_quota' | 'task_limit',
    message: string
  ) {
    super(message)
    this.name = 'EntitlementError'
  }
}
