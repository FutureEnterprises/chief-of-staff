'use client'
import { useState } from 'react'
import type { Project, Task } from '@repo/database'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { MotionButton } from '@/components/ui/motion-button'
import { PageTransition, StaggerList, StaggerItem, motion, AnimatePresence } from '@/components/motion/animations'
import { FolderOpen, Plus, CheckCircle2, MoreHorizontal, Circle } from 'lucide-react'

type ProjectWithTasks = Project & {
  tasks: Array<Pick<Task, 'id' | 'status' | 'priority'>>
}

interface ProjectsViewProps {
  projects: ProjectWithTasks[]
}

export function ProjectsView({ projects }: ProjectsViewProps) {
  const [filter, setFilter] = useState<'active' | 'all'>('active')

  const filtered = filter === 'active'
    ? projects.filter((p) => p.status === 'ACTIVE')
    : projects

  const filters: { key: 'active' | 'all'; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'all', label: 'All' },
  ]

  return (
    <PageTransition className="mx-auto max-w-4xl p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Projects
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <MotionButton size="sm">
          <Plus className="h-4 w-4" />
          New Project
        </MotionButton>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {filter === f.key && (
              <motion.span
                layoutId="project-filter-pill"
                className="absolute inset-0 rounded-md bg-zinc-900 dark:bg-zinc-50"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className={`relative z-10 ${filter === f.key ? 'text-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
              {f.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Projects help group related tasks together. Create one to get started."
            />
          </motion.div>
        ) : (
          <StaggerList key="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <StaggerItem key={project.id}>
                <ProjectCard project={project} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

function ProjectCard({ project }: { project: ProjectWithTasks }) {
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length
  const openTasks = project.tasks.filter((t) => !['COMPLETED', 'ARCHIVED'].includes(t.status)).length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500',
    ON_HOLD: 'bg-amber-500',
    COMPLETED: 'bg-zinc-400',
    ARCHIVED: 'bg-zinc-300',
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="group cursor-pointer rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Card header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: project.color ?? undefined }}
          >
            {!project.color && (
              <div className={`h-2.5 w-2.5 rounded-full ${statusColors[project.status] ?? 'bg-zinc-400'}`} />
            )}
          </div>
          <h3 className="font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            {project.name}
          </h3>
        </div>
        <button className="rounded p-0.5 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {project.description && (
        <p className="mb-3 line-clamp-2 text-xs text-zinc-500">{project.description}</p>
      )}

      {/* Task counts */}
      <div className="mb-3 flex items-center gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Circle className="h-3 w-3" />
          {openTasks} open
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          {completedTasks} done
        </span>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
        </div>
      )}

      {totalTasks === 0 && (
        <p className="text-xs text-zinc-400">No tasks yet</p>
      )}

      {project.status !== 'ACTIVE' && (
        <div className="mt-3">
          <Badge variant="secondary" className="text-xs">
            {project.status === 'ON_HOLD' ? 'On Hold' : project.status === 'COMPLETED' ? 'Completed' : 'Archived'}
          </Badge>
        </div>
      )}
    </motion.div>
  )
}
