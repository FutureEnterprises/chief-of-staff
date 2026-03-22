import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { TasksView } from './tasks-view'

export const metadata = { title: 'All Tasks' }

export default async function TasksPage() {
  const user = await requireDbUser()

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: { notIn: ['ARCHIVED'] },
    },
    include: {
      tags: { include: { tag: true } },
      project: true,
      subtasks: { select: { id: true, title: true, status: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
  })

  return <TasksView tasks={tasks} />
}
