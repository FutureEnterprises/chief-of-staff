import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { PatternsView } from './patterns-view'

export const metadata = { title: 'Patterns' }

export default async function PatternsPage() {
  const user = await requireDbUser()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    excusesByCategory,
    dangerWindows,
    recentSlips,
    allSlips30d,
    preSlipEvents,
    rescueSessions,
    completedWeek,
    completedMonth,
    openTasks,
    overdueTasks,
    tasksByPriority,
  ] = await Promise.all([
    prisma.excuse.groupBy({
      by: ['category'],
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.dangerWindow.findMany({
      where: { userId: user.id, active: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
    }),
    prisma.slipRecord.findMany({
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Full 30-day slip set for Recovery Strength metric
    prisma.slipRecord.findMany({
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, recoveredAt: true },
    }),
    // All events in last 30 days — we'll correlate in memory to find pre-slip triggers
    prisma.productivityEvent.findMany({
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      select: { eventType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.rescueSession.findMany({
      where: { userId: user.id, startedAt: { gte: thirtyDaysAgo } },
      orderBy: { startedAt: 'desc' },
      take: 20,
    }),
    prisma.task.count({
      where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: sevenDaysAgo } },
    }),
    prisma.task.count({
      where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.task.count({
      where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
    }),
    prisma.task.count({
      where: {
        userId: user.id,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueAt: { lt: new Date() },
      },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
      _count: { id: true },
    }),
  ])

  // ──── Failure Trigger: most common event type in the hour preceding slips ────
  const HOUR_MS = 60 * 60 * 1000
  const triggerCounts: Record<string, number> = {}
  let totalPreSlipSignals = 0
  for (const slip of allSlips30d) {
    const windowStart = slip.createdAt.getTime() - HOUR_MS
    const windowEnd = slip.createdAt.getTime()
    for (const ev of preSlipEvents) {
      const t = ev.createdAt.getTime()
      if (t >= windowStart && t < windowEnd) {
        // Skip the slip-logging event itself to avoid tautology
        if (ev.eventType === 'SLIP_LOGGED' || ev.eventType === 'SLIP_RECOVERED') continue
        triggerCounts[ev.eventType] = (triggerCounts[ev.eventType] ?? 0) + 1
        totalPreSlipSignals++
      }
    }
  }
  const topFailureTrigger = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([eventType, count]) => ({ eventType, count }))

  // ──── Recovery Strength: % of slips recovered within 24h over last 30d ────
  const TWENTY_FOUR_HOURS_MS = 24 * HOUR_MS
  const recoveredFast = allSlips30d.filter(
    (s) => s.recoveredAt && s.recoveredAt.getTime() - s.createdAt.getTime() <= TWENTY_FOUR_HOURS_MS,
  ).length
  const recoveryStrengthPct =
    allSlips30d.length > 0 ? Math.round((recoveredFast / allSlips30d.length) * 100) : null
  const totalSlips30d = allSlips30d.length

  return (
    <PatternsView
      userId={user.id}
      userName={user.name}
      selfTrustScore={user.selfTrustScore}
      executionScore={user.executionScore}
      currentStreak={user.currentStreak}
      longestStreak={user.longestStreak}
      identityState={user.identityState ?? 'SLEEPWALKING'}
      recoveryState={user.recoveryState ?? 'ACTIVE'}
      excusesByCategory={excusesByCategory.map((e) => ({ category: e.category, count: e._count }))}
      dangerWindows={dangerWindows.map((w) => ({
        id: w.id,
        label: w.label,
        dayOfWeek: w.dayOfWeek,
        startHour: w.startHour,
        endHour: w.endHour,
        triggerType: w.triggerType,
      }))}
      recentSlips={recentSlips.map((s) => ({
        id: s.id,
        trigger: s.trigger,
        createdAt: s.createdAt.toISOString(),
        recoveredAt: s.recoveredAt?.toISOString() ?? null,
      }))}
      rescueSessions={rescueSessions.map((r) => ({
        id: r.id,
        trigger: r.trigger,
        outcome: r.outcome,
        startedAt: r.startedAt.toISOString(),
      }))}
      completedLast7Days={completedWeek}
      completedLast30Days={completedMonth}
      openTasks={openTasks}
      overdueTasks={overdueTasks}
      tasksByPriority={(tasksByPriority as Array<{ priority: string; _count: { id: number } }>).map((r) => ({
        priority: r.priority,
        count: r._count.id,
      }))}
      topFailureTrigger={topFailureTrigger}
      totalPreSlipSignals={totalPreSlipSignals}
      recoveryStrengthPct={recoveryStrengthPct}
      totalSlips30d={totalSlips30d}
    />
  )
}
