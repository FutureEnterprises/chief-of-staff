import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { FollowUpsView } from './follow-ups-view'
import type { Task, Tag } from '@repo/database'

export const metadata = { title: 'Follow-ups' }

type TaskWithTags = Task & { tags: Array<{ tag: Tag }> }

export default async function FollowUpsPage() {
  const user = await requireDbUser()
  const now = new Date()

  const tasks: TaskWithTags[] = await prisma.task.findMany({
    where: {
      userId: user.id,
      followUpRequired: true,
      status: { notIn: ['COMPLETED', 'ARCHIVED'] },
    },
    include: { tags: { include: { tag: true } } },
    orderBy: [{ nextFollowUpAt: 'asc' }, { priority: 'asc' }],
  }) as TaskWithTags[]

  const overdue = tasks.filter((t: TaskWithTags) => t.nextFollowUpAt && t.nextFollowUpAt < now)
  const dueToday = tasks.filter((t: TaskWithTags) => {
    if (!t.nextFollowUpAt) return false
    const d = new Date(t.nextFollowUpAt)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return d >= today && d < tomorrow && d >= now
  })
  const upcoming = tasks.filter((t: TaskWithTags) => {
    if (!t.nextFollowUpAt) return false
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return t.nextFollowUpAt >= tomorrow
  })
  const noDate = tasks.filter((t: TaskWithTags) => !t.nextFollowUpAt)

  return <FollowUpsView overdue={overdue} dueToday={dueToday} upcoming={upcoming} noDate={noDate} />
}
