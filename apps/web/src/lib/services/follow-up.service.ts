import { prisma } from '@repo/database'
import { hasFeature } from './entitlement.service'

/**
 * Mark a follow-up as complete and schedule the next one if repeating.
 */
export async function completeFollowUp(taskId: string, userId: string): Promise<void> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, followUpRequired: true },
  })
  if (!task) throw new Error('Follow-up task not found')

  const now = new Date()

  if (task.followUpMode === 'REPEATING' && task.followUpIntervalDays) {
    // Schedule next follow-up
    const next = new Date(now.getTime() + task.followUpIntervalDays * 24 * 60 * 60 * 1000)
    await prisma.task.update({
      where: { id: taskId },
      data: { nextFollowUpAt: next, lastTouchedAt: now },
    })
  } else if (task.followUpMode === 'ESCALATING' && task.followUpIntervalDays) {
    // Shorten interval on each cycle (escalate urgency)
    const newInterval = Math.max(1, Math.floor(task.followUpIntervalDays * 0.75))
    const next = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000)
    await prisma.task.update({
      where: { id: taskId },
      data: {
        nextFollowUpAt: next,
        followUpIntervalDays: newInterval,
        lastTouchedAt: now,
      },
    })
  } else {
    // One-time follow-up — mark done
    await prisma.task.update({
      where: { id: taskId },
      data: { followUpRequired: false, nextFollowUpAt: null, lastTouchedAt: now },
    })
  }

  await prisma.productivityEvent.create({
    data: { userId, taskId, eventType: 'FOLLOW_UP_COMPLETED' },
  })
}

/**
 * Get all follow-ups that are overdue (past nextFollowUpAt and not completed/archived).
 */
export async function getOverdueFollowUps(userId: string): Promise<Awaited<ReturnType<typeof prisma.task.findMany>>> {
  return prisma.task.findMany({
    where: {
      userId,
      followUpRequired: true,
      status: { notIn: ['COMPLETED', 'ARCHIVED'] },
      nextFollowUpAt: { lt: new Date() },
    },
    orderBy: { nextFollowUpAt: 'asc' },
  })
}

/**
 * Escalate a follow-up — increases urgency, logs event, and optionally shortens the interval.
 * Only available on Pro plan (notificationEscalation feature).
 */
export async function escalateFollowUp(taskId: string, userId: string): Promise<void> {
  const canEscalate = await hasFeature(userId, 'notificationEscalation')
  if (!canEscalate) return // silently skip on free plan

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, followUpRequired: true },
  })
  if (!task) return

  const now = new Date()
  // Bump up priority if not already critical
  const escalatedPriority =
    task.priority === 'LOW'
      ? 'MEDIUM'
      : task.priority === 'MEDIUM'
        ? 'HIGH'
        : task.priority === 'HIGH'
          ? 'CRITICAL'
          : task.priority

  // Move follow-up to today if it's already past
  const nextFollowUp =
    !task.nextFollowUpAt || task.nextFollowUpAt < now ? now : task.nextFollowUpAt

  await prisma.task.update({
    where: { id: taskId },
    data: {
      priority: escalatedPriority as any,
      nextFollowUpAt: nextFollowUp,
      lastTouchedAt: now,
    },
  })

  await prisma.productivityEvent.create({
    data: { userId, taskId, eventType: 'FOLLOW_UP_ESCALATED' },
  })
}

/**
 * Get follow-up stats for a user — used in insights.
 */
export async function getFollowUpStats(userId: string) {
  const [total, overdue, completedThisMonth] = await Promise.all([
    prisma.task.count({
      where: { userId, followUpRequired: true, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
    }),
    prisma.task.count({
      where: {
        userId,
        followUpRequired: true,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        nextFollowUpAt: { lt: new Date() },
      },
    }),
    prisma.productivityEvent.count({
      where: {
        userId,
        eventType: 'FOLLOW_UP_COMPLETED',
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ])

  return { total, overdue, completedThisMonth }
}
