/**
 * Mobile API v1 — Today view data
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { getPendingReminders } from '@/lib/services/reminder.service'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const [dueToday, overdue, followUpsDue, recentlyCompleted, pendingReminders] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          dueAt: { gte: todayStart, lt: tomorrowStart },
        },
        include: { tags: { include: { tag: true } }, project: { select: { id: true, name: true } } },
        orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          dueAt: { lt: todayStart },
        },
        include: { tags: { include: { tag: true } } },
        orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
        take: 10,
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          followUpRequired: true,
          nextFollowUpAt: { gte: todayStart, lt: tomorrowStart },
        },
        include: { tags: { include: { tag: true } } },
        orderBy: { priority: 'asc' },
      }),
      prisma.task.findMany({
        where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: todayStart } },
        orderBy: { completedAt: 'desc' },
        take: 5,
      }),
      getPendingReminders(user.id),
    ])

  return NextResponse.json({
    dueToday,
    overdue,
    followUpsDue,
    recentlyCompleted,
    pendingReminders,
    meta: {
      dueTodayCount: dueToday.length,
      overdueCount: overdue.length,
      followUpsCount: followUpsDue.length,
      completedTodayCount: recentlyCompleted.length,
    },
  })
}
