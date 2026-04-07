'use client'
import { useState } from 'react'
import type { Project, Task } from '@repo/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition, StaggerList, StaggerItem, motion, AnimatePresence, AnimatedCounter } from '@/components/motion/animations'
import { FolderOpen, Plus, CheckCircle2, Circle } from 'lucide-react'

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
    <PageTransition className="relative mx-auto max-w-4xl p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="heading-1">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="brand" size="sm">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-border">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="relative px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {filter === f.key && (
              <motion.span
                layoutId="project-filter-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-warm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className={filter === f.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}>
              {f.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GlassCard className="py-12 text-center">
              <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="heading-3">No projects yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Projects help group related tasks together.</p>
            </GlassCard>
          </motion.div>
        ) : (
          <StaggerList key="list" className="grid gap-4 sm:grid-cols-2">
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

  return (
    <GlassCard hover variant="orange-glow" className="cursor-pointer">
      {/* Gradient header strip */}
      <div
        className="mb-4 h-1.5 w-full rounded-full"
        style={{
          background: project.color
            ? `linear-gradient(135deg, ${project.color}, ${project.color}88)`
            : 'linear-gradient(135deg, var(--gradient-warm-start), var(--gradient-warm-end))',
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <h3 className="heading-3 text-foreground">{project.name}</h3>
        {project.status !== 'ACTIVE' && (
          <Badge variant="secondary" className="text-[10px]">
            {project.status === 'ON_HOLD' ? 'On Hold' : project.status === 'COMPLETED' ? 'Completed' : 'Archived'}
          </Badge>
        )}
      </div>

      {project.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Circle className="h-3 w-3" /> {openTasks} open
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {completedTasks} done
        </span>
      </div>

      {totalTasks > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Progress</span>
            <span className="font-semibold"><AnimatedCounter value={progress} />%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-warm"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
        </div>
      )}

      {totalTasks === 0 && (
        <p className="mt-3 text-xs text-muted-foreground/60">No tasks yet</p>
      )}
    </GlassCard>
  )
}
