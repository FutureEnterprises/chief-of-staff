'use client'
import { useState } from 'react'
import type { Task, Tag, Project } from '@repo/database'
import { TaskCard } from '@/components/tasks/task-card'
import { QuickAddTask } from '@/components/tasks/quick-add-task'
import { EmptyState } from '@/components/ui/empty-state'
import { MotionButton } from '@/components/ui/motion-button'
import { Badge } from '@/components/ui/badge'
import { PageTransition, StaggerList, StaggerItem, motion, AnimatePresence } from '@/components/motion/animations'
import { CheckCircle2, Plus } from 'lucide-react'
import { getStatusLabel } from '@/lib/utils'

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
    <PageTransition className="mx-auto max-w-4xl p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            All Tasks
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{tasks.length} total</p>
        </div>
        <MotionButton size="sm" onClick={() => setShowQuickAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Task
        </MotionButton>
      </div>

      {/* Filter tabs with spring indicator */}
      <div className="mb-6 flex items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {filter === f.key && (
              <motion.span
                layoutId="tasks-filter-pill"
                className="absolute inset-0 rounded-md bg-zinc-900 dark:bg-zinc-50"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span
              className={`relative z-10 ${
                filter === f.key
                  ? 'text-white dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
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
            <EmptyState
              icon={CheckCircle2}
              title={filter === 'completed' ? 'No completed tasks yet' : 'No tasks here'}
              description={filter === 'active' ? 'Add a task to get started.' : 'Complete some tasks and they\'ll show up here.'}
            />
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
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {getStatusLabel(status)}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {statusTasks.length}
                  </Badge>
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
