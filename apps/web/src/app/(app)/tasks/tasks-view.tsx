'use client'
import { useState } from 'react'
import type { Task, Tag, Project } from '@repo/database'
import { TaskCard } from '@/components/tasks/task-card'
import { QuickAddTask } from '@/components/tasks/quick-add-task'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Plus } from 'lucide-react'
import { getStatusLabel } from '@/lib/utils'

type TaskWithRelations = Task & {
  tags: Array<{ tag: Tag }>
  project?: Project | null
  subtasks: Array<{ id: string; title: string; status: string }>
}

const STATUS_ORDER = ['IN_PROGRESS', 'PLANNED', 'OPEN', 'INBOX', 'BLOCKED', 'WAITING', 'SNOOZED', 'COMPLETED']

interface TasksViewProps {
  tasks: TaskWithRelations[]
}

export function TasksView({ tasks }: TasksViewProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [filter, setFilter] = useState<string>('active')

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
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">All Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500">{tasks.length} total tasks</p>
        </div>
        <Button size="sm" onClick={() => setShowQuickAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {[
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <h3 className="font-semibold text-zinc-900">No tasks here</h3>
          <p className="mt-1 text-sm text-zinc-500">Add a task to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([status, statusTasks]) => (
            <section key={status}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  {getStatusLabel(status)}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {statusTasks.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showOverdue={status !== 'COMPLETED'}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {showQuickAdd && <QuickAddTask onClose={() => setShowQuickAdd(false)} />}
    </div>
  )
}
