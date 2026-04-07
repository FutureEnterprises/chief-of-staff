import { notFound } from 'next/navigation'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { TaskDetailView } from './task-detail-view'

interface TaskPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TaskPageProps) {
  const { id } = await params
  const user = await requireDbUser()
  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
    select: { title: true },
  })
  return { title: task?.title ?? 'Task' }
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params
  const user = await requireDbUser()

  const task = await prisma.task.findUnique({
    where: { id, userId: user.id },
    include: {
      tags: { include: { tag: true } },
      project: true,
      subtasks: {
        orderBy: { createdAt: 'asc' },
        include: { tags: { include: { tag: true } } },
      },
      parentTask: { select: { id: true, title: true } },
      aiInteractions: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { interactionType: true, createdAt: true },
      },
    },
  })

  if (!task) notFound()

  return <TaskDetailView task={task} />
}
