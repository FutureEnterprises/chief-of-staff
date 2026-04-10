import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { InsightsView } from './insights-view'

export const metadata = { title: 'Insights' }

export default async function InsightsPage() {
  const user = await requireDbUser()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    completedLast7Days,
    completedLast30Days,
    openTasks,
    overdueTasks,
    tasksByPriority,
    completionEvents,
  ] = await Promise.all([
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
    prisma.productivityEvent.findMany({
      where: {
        userId: user.id,
        eventType: 'TASK_COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ])

  return (
    <InsightsView
      userId={user.id}
      userName={user.name}
      executionScore={user.executionScore}
      currentStreak={user.currentStreak}
      longestStreak={user.longestStreak}
      completedLast7Days={completedLast7Days}
      completedLast30Days={completedLast30Days}
      openTasks={openTasks}
      overdueTasks={overdueTasks}
      tasksByPriority={(tasksByPriority as Array<{ priority: string; _count: { id: number } }>).map((r) => ({ priority: r.priority, count: r._count.id }))}
      completionEvents={(completionEvents as Array<{ createdAt: Date }>).map((e) => e.createdAt.toISOString())}
    />
  )
}
