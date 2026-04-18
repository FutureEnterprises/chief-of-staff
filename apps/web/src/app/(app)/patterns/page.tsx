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
    />
  )
}
