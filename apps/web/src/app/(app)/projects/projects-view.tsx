'use client'
import type { Project, Task } from '@repo/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type ProjectWithTasks = Project & {
  tasks: Array<Pick<Task, 'id' | 'status' | 'priority'>>
}

interface ProjectsViewProps {
  projects: ProjectWithTasks[]
}

export function ProjectsView({ projects }: ProjectsViewProps) {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Projects</h1>
        <p className="mt-1 text-sm text-zinc-500">{projects.length} active project{projects.length !== 1 ? 's' : ''}</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FolderOpen className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <h3 className="font-semibold text-zinc-900">No projects yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Projects help group related tasks together.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalTasks = project.tasks.length
            const completedTasks = project.tasks.filter((t: Pick<Task, 'id' | 'status' | 'priority'>) => t.status === 'COMPLETED').length
            const openTasks = project.tasks.filter((t: Pick<Task, 'id' | 'status' | 'priority'>) => !['COMPLETED', 'ARCHIVED'].includes(t.status)).length
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
                      {project.status === 'ON_HOLD' && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          On Hold
                        </Badge>
                      )}
                    </div>
                    {project.description && (
                      <p className="line-clamp-2 text-xs text-zinc-500">{project.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>{openTasks} open tasks</span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {completedTasks} done
                        </span>
                      </div>
                      {totalTasks > 0 && (
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-zinc-400">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-zinc-900 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
