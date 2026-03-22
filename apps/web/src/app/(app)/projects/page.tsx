import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { ProjectsView } from './projects-view'

export const metadata = { title: 'Projects' }

export default async function ProjectsPage() {
  const user = await requireDbUser()

  const projects = await prisma.project.findMany({
    where: { userId: user.id, archivedAt: null },
    include: {
      tasks: {
        where: { status: { notIn: ['ARCHIVED'] } },
        select: { id: true, status: true, priority: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <ProjectsView projects={projects} />
}
