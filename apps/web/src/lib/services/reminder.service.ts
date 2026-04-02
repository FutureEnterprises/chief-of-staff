import { prisma } from '@repo/database'

type AttentionEventType =
  | 'DUE_SOON'
  | 'DUE_NOW'
  | 'OVERDUE'
  | 'OVERDUE_ESCALATED'
  | 'FOLLOW_UP'
  | 'FOLLOW_UP_ESCALATED'
  | 'SNOOZE_END'
  | 'WAITING_STALE'
  | 'MORNING_CHECKIN'
  | 'NIGHT_CHECKIN'
  | 'WEEKLY_REVIEW'

const REMINDER_TYPE_MAP: Record<AttentionEventType, string> = {
  DUE_SOON: 'DUE_SOON',
  DUE_NOW: 'DUE_NOW',
  OVERDUE: 'OVERDUE',
  OVERDUE_ESCALATED: 'OVERDUE_ESCALATED',
  FOLLOW_UP: 'FOLLOW_UP',
  FOLLOW_UP_ESCALATED: 'FOLLOW_UP_ESCALATED',
  SNOOZE_END: 'SNOOZE_END',
  WAITING_STALE: 'WAITING_STALE',
  MORNING_CHECKIN: 'MORNING_CHECKIN',
  NIGHT_CHECKIN: 'NIGHT_CHECKIN',
  WEEKLY_REVIEW: 'WEEKLY_REVIEW',
}

/**
 * Idempotently create a reminder only if no pending one exists for the same
 * (userId, taskId, reminderType) within the last 12 hours.
 */
async function createReminderIfAbsent(params: {
  userId: string
  taskId?: string
  reminderType: string
  scheduledAt: Date
  metadataJson?: Record<string, unknown>
}): Promise<boolean> {
  const windowStart = new Date(Date.now() - 12 * 60 * 60 * 1000)

  const existing = await prisma.reminder.findFirst({
    where: {
      userId: params.userId,
      ...(params.taskId ? { taskId: params.taskId } : {}),
      reminderType: params.reminderType as any,
      status: { in: ['PENDING', 'SENT'] },
      createdAt: { gte: windowStart },
    },
  })

  if (existing) return false

  await prisma.reminder.create({
    data: {
      userId: params.userId,
      taskId: params.taskId,
      reminderType: params.reminderType as any,
      scheduledAt: params.scheduledAt,
      channel: 'IN_APP',
      status: 'PENDING',
      metadataJson: params.metadataJson as any,
    },
  })

  return true
}

/**
 * Compute and schedule all attention events for a single user.
 * This is deterministic and idempotent — safe to run multiple times per hour.
 * Returns a count of new reminders created.
 */
export async function scheduleAttentionEvents(userId: string): Promise<number> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)
  const staleCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const criticalOverdueCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const [activeTasks, user] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueAt: true,
        followUpRequired: true,
        nextFollowUpAt: true,
        snoozedUntil: true,
        lastTouchedAt: true,
        updatedAt: true,
        snoozeCount: true,
      },
    }),
    prisma.user.findFirst({
      where: { id: userId },
      select: { planType: true, reminderIntensity: true },
    }),
  ])

  if (!user) return 0

  const isPro = user.planType === 'PRO' || user.planType === 'TEAM'
  let created = 0

  for (const task of activeTasks) {
    // DUE_NOW — due within the next hour
    if (task.dueAt && task.dueAt <= in1h && task.dueAt > now) {
      const added = await createReminderIfAbsent({
        userId,
        taskId: task.id,
        reminderType: REMINDER_TYPE_MAP.DUE_NOW,
        scheduledAt: task.dueAt,
        metadataJson: { title: task.title, dueAt: task.dueAt.toISOString() },
      })
      if (added) created++
    }

    // DUE_SOON — due within next 24 hours (but not within 1 hour)
    if (task.dueAt && task.dueAt > in1h && task.dueAt <= in24h) {
      const added = await createReminderIfAbsent({
        userId,
        taskId: task.id,
        reminderType: REMINDER_TYPE_MAP.DUE_SOON,
        scheduledAt: new Date(task.dueAt.getTime() - 60 * 60 * 1000),
        metadataJson: { title: task.title, dueAt: task.dueAt.toISOString() },
      })
      if (added) created++
    }

    // OVERDUE — past due
    if (task.dueAt && task.dueAt < now && task.status !== 'SNOOZED') {
      // Escalated overdue — high/critical priority, 3+ days overdue (Pro only)
      if (
        isPro &&
        task.dueAt < criticalOverdueCutoff &&
        (task.priority === 'CRITICAL' || task.priority === 'HIGH')
      ) {
        const added = await createReminderIfAbsent({
          userId,
          taskId: task.id,
          reminderType: REMINDER_TYPE_MAP.OVERDUE_ESCALATED,
          scheduledAt: now,
          metadataJson: {
            title: task.title,
            dueAt: task.dueAt.toISOString(),
            daysOverdue: Math.floor((now.getTime() - task.dueAt.getTime()) / 86400000),
          },
        })
        if (added) created++
      } else {
        const added = await createReminderIfAbsent({
          userId,
          taskId: task.id,
          reminderType: REMINDER_TYPE_MAP.OVERDUE,
          scheduledAt: now,
          metadataJson: { title: task.title, dueAt: task.dueAt.toISOString() },
        })
        if (added) created++
      }
    }

    // FOLLOW_UP — follow-up due today or past
    if (task.followUpRequired && task.nextFollowUpAt && task.nextFollowUpAt <= in24h) {
      const isEscalated =
        isPro && task.nextFollowUpAt < now && task.snoozeCount >= 2

      const added = await createReminderIfAbsent({
        userId,
        taskId: task.id,
        reminderType: isEscalated
          ? REMINDER_TYPE_MAP.FOLLOW_UP_ESCALATED
          : REMINDER_TYPE_MAP.FOLLOW_UP,
        scheduledAt: task.nextFollowUpAt <= now ? now : task.nextFollowUpAt,
        metadataJson: {
          title: task.title,
          nextFollowUpAt: task.nextFollowUpAt.toISOString(),
          escalated: isEscalated,
        },
      })
      if (added) created++
    }

    // SNOOZE_END — snooze expiring within 1 hour
    if (task.status === 'SNOOZED' && task.snoozedUntil) {
      if (task.snoozedUntil <= in1h && task.snoozedUntil > now) {
        const added = await createReminderIfAbsent({
          userId,
          taskId: task.id,
          reminderType: REMINDER_TYPE_MAP.SNOOZE_END,
          scheduledAt: task.snoozedUntil,
          metadataJson: { title: task.title, snoozedUntil: task.snoozedUntil.toISOString() },
        })
        if (added) created++
      }

      // Auto-wake expired snoozes
      if (task.snoozedUntil < now) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'OPEN', snoozedUntil: null, lastTouchedAt: now },
        })
        await prisma.productivityEvent.create({
          data: { userId, taskId: task.id, eventType: 'SNOOZE_EXPIRED' },
        })
      }
    }

    // WAITING_STALE — WAITING tasks with no update in 7+ days (Pro only)
    if (isPro && task.status === 'WAITING') {
      const lastActivity = task.lastTouchedAt ?? task.updatedAt
      if (lastActivity < staleCutoff) {
        const added = await createReminderIfAbsent({
          userId,
          taskId: task.id,
          reminderType: REMINDER_TYPE_MAP.WAITING_STALE,
          scheduledAt: now,
          metadataJson: {
            title: task.title,
            daysSinceUpdate: Math.floor(
              (now.getTime() - lastActivity.getTime()) / 86400000
            ),
          },
        })
        if (added) created++
      }
    }
  }

  return created
}

/**
 * Determine if the current UTC time is within `windowMinutes` of a user's configured local time.
 * Used by cron handlers to only process users whose local time matches the target.
 */
export function isWithinUserTimeWindow(
  userTimezone: string,
  targetTime: string,
  windowMinutes = 30
): boolean {
  try {
    const now = new Date()
    const localStr = now.toLocaleString('en-US', { timeZone: userTimezone, hour12: false })
    // localStr format: "M/D/YYYY, H:MM:SS AM/PM" or "M/D/YYYY, HH:MM:SS"
    const timePart = localStr.split(', ')[1] ?? ''
    const [hStr, mStr] = timePart.split(':')
    const localH = parseInt(hStr ?? '0', 10)
    const localM = parseInt(mStr ?? '0', 10)
    const currentMinutes = localH * 60 + localM

    const [tH, tM] = targetTime.split(':').map(Number)
    const targetMinutes = (tH ?? 0) * 60 + (tM ?? 0)

    const diff = Math.abs(currentMinutes - targetMinutes)
    // Account for midnight wrap-around
    const wrappedDiff = Math.min(diff, 1440 - diff)
    return wrappedDiff <= windowMinutes
  } catch {
    return false
  }
}

/**
 * Get pending reminders for a user, ready to be displayed in-app.
 */
export async function getPendingReminders(userId: string) {
  return prisma.reminder.findMany({
    where: {
      userId,
      status: 'PENDING',
      scheduledAt: { lte: new Date() },
    },
    include: { task: { select: { id: true, title: true, priority: true } } },
    orderBy: { scheduledAt: 'asc' },
    take: 20,
  })
}

/**
 * Mark a reminder as seen/dismissed.
 */
export async function dismissReminder(reminderId: string, userId: string): Promise<void> {
  await prisma.reminder.updateMany({
    where: { id: reminderId, userId },
    data: { status: 'SENT', sentAt: new Date() },
  })
}
