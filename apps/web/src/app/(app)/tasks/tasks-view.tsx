'use client'
import { useState } from 'react'
import type { Task, Tag, Project } from '@repo/database'
import { TaskCard } from '@/components/tasks/task-card'
import { QuickAddTask } from '@/components/tasks/quick-add-task'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition, StaggerList, StaggerItem, motion, AnimatePresence } from '@/components/motion/animations'
import { CheckCircle2, Plus } from 'lucide-react'
import { getStatusLabel, getStatusHex } from '@/lib/utils'

type TaskWithRelations = Task & {
  tags: Array<{ tag: Tag }>
  project?: Project | null
  subtasks: Array<{ id: string; title: string; status: string }>
}

const STATUS_ORDER = ['IN_PROGRESS', 'PLANNED', 'OPEN', 'INBOX', 'BLOCKED', 'WAITING', 'SNOOZED', 'COMPLETED']

const FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
] as const

type Filter = typeof FILTERS[number]['key']

interface TasksViewProps {
  tasks: TaskWithRelations[]
}

export function TasksView({ tasks }: TasksViewProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [filter, setFilter] = useState<Filter>('active')

  const filtered =
    filter === 'active'
      ? tasks.filter((t) => !['COMPLETED', 'ARCHIVED'].includes(t.status))
      : filter === 'completed'
        ? tasks.filter((t) => t.status === 'COMPLETED')
        : tasks

  const grouped = STATUS_ORDER.reduce<Record<string, TaskWithRelations[]>>((acc, status) => {
    const group = filtered.filter((t) => t.status === status)
    if (group.length > 0) acc[status] = group
    return acc
  }, {})

  return (
    <PageTransition className="relative mx-auto max-w-4xl p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="heading-1">All Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tasks.length} total</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setShowQuickAdd(true)}>
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Filter tabs with gradient underline */}
      <div className="mb-6 flex items-center gap-1 border-b border-border">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="relative px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {filter === f.key && (
              <motion.span
                layoutId="tasks-filter-underline"
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
        {Object.keys(grouped).length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
              <h3 className="heading-3">
                {filter === 'completed' ? 'No completed tasks yet' : 'No tasks here'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === 'active' ? 'Add a task to get started.' : 'Complete some tasks and they\'ll show up here.'}
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-8"
          >
            {Object.entries(grouped).map(([status, statusTasks]) => (
              <section key={status}>
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: getStatusHex(status) }}
                  />
                  <h2 className="label-xs text-muted-foreground">{getStatusLabel(status)}</h2>
                  <Badge variant="secondary" className="text-xs">{statusTasks.length}</Badge>
                </div>
                <StaggerList className="space-y-2">
                  {statusTasks.map((task) => (
                    <StaggerItem key={task.id}>
                      <TaskCard task={task} showOverdue={status !== 'COMPLETED'} />
                    </StaggerItem>
                  ))}
                </StaggerList>
              </section>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickAdd && <QuickAddTask onClose={() => setShowQuickAdd(false)} />}
      </AnimatePresence>
    </PageTransition>
  )
}
