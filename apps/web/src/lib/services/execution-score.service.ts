import { prisma } from '@repo/database'

/**
 * Compute and persist the user's Execution Score (0-100).
 *
 * Weighted formula:
 * - Completion rate (40%): completed / (completed + open) in last 30 days
 * - On-time rate (30%): completed before dueAt / completed with dueAt
 * - Follow-through rate (20%): follow-ups resolved / follow-ups created
 * - Streak bonus (10%): min(currentStreak * 2, 10)
 */
export async function computeExecutionScore(userId: string): Promise<number> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [completedCount, openCount, onTimeData, followUpEvents, user] = await Promise.all([
    prisma.task.count({
      where: { userId, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.task.count({
      where: { userId, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
    }),
    prisma.task.findMany({
      where: { userId, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo }, dueAt: { not: null } },
      select: { dueAt: true, completedAt: true },
    }),
    prisma.productivityEvent.groupBy({
      by: ['eventType'],
      where: {
        userId,
        eventType: { in: ['FOLLOW_UP_COMPLETED', 'FOLLOW_UP_CREATED'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    }),
  ])

  // 1. Completion rate (40%)
  const totalTouched = completedCount + openCount
  const completionRate = totalTouched > 0 ? completedCount / totalTouched : 0

  // 2. On-time rate (30%)
  const withDueDate = onTimeData.length
  const onTime = onTimeData.filter((t) => t.completedAt && t.dueAt && t.completedAt <= t.dueAt).length
  const onTimeRate = withDueDate > 0 ? onTime / withDueDate : 0.5 // default 50% if no due dates

  // 3. Follow-through rate (20%)
  const followUpCreated = followUpEvents.find((e) => e.eventType === 'FOLLOW_UP_CREATED')?._count ?? 0
  const followUpCompleted = followUpEvents.find((e) => e.eventType === 'FOLLOW_UP_COMPLETED')?._count ?? 0
  const followThroughRate = followUpCreated > 0 ? followUpCompleted / followUpCreated : 0.5

  // 4. Streak bonus (10%)
  const streak = user?.currentStreak ?? 0
  const streakBonus = Math.min(streak * 2, 10) / 10

  // Weighted score
  const raw = completionRate * 0.4 + onTimeRate * 0.3 + followThroughRate * 0.2 + streakBonus * 0.1
  const score = Math.round(Math.max(0, Math.min(100, raw * 100)))

  // Persist
  await prisma.user.update({
    where: { id: userId },
    data: { executionScore: score },
  })

  return score
}

/**
 * Update the user's streak on task completion.
 * A streak = consecutive calendar days (in user's TZ) with at least 1 completion.
 */
export async function updateStreak(
  userId: string,
  userTimezone: string
): Promise<{ currentStreak: number; longestStreak: number; milestone: number | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastCompletionDate: true },
  })
  if (!user) return { currentStreak: 0, longestStreak: 0, milestone: null }

  const now = new Date()

  // Get "today" and "yesterday" in user's timezone
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: userTimezone }) // YYYY-MM-DD
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: userTimezone })

  const lastDateStr = user.lastCompletionDate
    ? user.lastCompletionDate.toLocaleDateString('en-CA', { timeZone: userTimezone })
    : null

  // Grace period: if lastDate was 2 days ago (one missed day), DON'T reset — keep streak.
  // Only reset if gap is 3+ days. This is the "resume, don't restart" principle.
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  const twoDaysAgoStr = twoDaysAgo.toLocaleDateString('en-CA', { timeZone: userTimezone })

  let newStreak: number

  if (lastDateStr === todayStr) {
    // Already completed something today — no change
    return { currentStreak: user.currentStreak, longestStreak: user.longestStreak, milestone: null }
  } else if (lastDateStr === yesterdayStr) {
    // Consecutive day — increment
    newStreak = user.currentStreak + 1
  } else if (lastDateStr === twoDaysAgoStr) {
    // Grace period: one missed day — keep streak, don't increment (streak holds)
    newStreak = user.currentStreak
  } else {
    // Gap of 3+ days, or first completion — reset to 1
    newStreak = 1
  }

  const newLongest = Math.max(user.longestStreak, newStreak)

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletionDate: now,
    },
  })

  // Check milestones
  const milestones = [7, 14, 30, 60, 100]
  const hitMilestone = milestones.find((m) => newStreak === m) ?? null

  if (hitMilestone) {
    await prisma.productivityEvent.create({
      data: {
        userId,
        eventType: 'STREAK_MILESTONE',
        metadataJson: { streak: hitMilestone },
      },
    })
  }

  return { currentStreak: newStreak, longestStreak: newLongest, milestone: hitMilestone }
}
