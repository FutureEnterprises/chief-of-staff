import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { InboxView } from './inbox-view'

export const metadata = { title: 'Inbox' }

export default async function InboxPage() {
  const user = await requireDbUser()

  const tasks = await prisma.task.findMany({
    where: { userId: user.id, status: 'INBOX' },
    include: { tags: { include: { tag: true } } },
    orderBy: [{ createdAt: 'desc' }],
  })

  return <InboxView tasks={tasks} />
}
