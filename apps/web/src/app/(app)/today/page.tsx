import { Suspense } from 'react'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { TodayView } from './today-view'

export const metadata = { title: 'Today' }

async function getTodayData(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [dueTodayTasks, followUpsDueToday, overdueTasks, recentlyCompleted, user] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueAt: { gte: today, lt: tomorrow },
      },
      include: { tags: { include: { tag: true } }, project: true },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        followUpRequired: true,
        nextFollowUpAt: { gte: today, lt: tomorrow },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { priority: 'asc' },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueAt: { lt: today },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: today },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
    prisma.user.findUnique({ where: { id: userId } }),
  ])

  return { dueTodayTasks, followUpsDueToday, overdueTasks, recentlyCompleted, user }
}

export default async function TodayPage() {
  const user = await requireDbUser()
  const data = await getTodayData(user.id)

  return (
    <div className="h-full">
      <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading...</div>}>
        <TodayView {...data} user={user} />
      </Suspense>
    </div>
  )
}
