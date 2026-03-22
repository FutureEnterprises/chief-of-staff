'use client'
import type { Task, Tag } from '@repo/database'
import { TaskCard } from '@/components/tasks/task-card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, Calendar, HelpCircle } from 'lucide-react'

type TaskWithTags = Task & { tags: Array<{ tag: Tag }> }

interface FollowUpsViewProps {
  overdue: TaskWithTags[]
  dueToday: TaskWithTags[]
  upcoming: TaskWithTags[]
  noDate: TaskWithTags[]
}

export function FollowUpsView({ overdue, dueToday, upcoming, noDate }: FollowUpsViewProps) {
  const total = overdue.length + dueToday.length + upcoming.length + noDate.length

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Follow-ups</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total} task{total !== 1 ? 's' : ''} requiring follow-up
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <h3 className="font-semibold text-zinc-900">No follow-ups needed</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Tasks with follow-up requirements will appear here.
          </p>
        </div>
      )}

      {overdue.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-red-500">Overdue</h2>
            <Badge variant="destructive">{overdue.length}</Badge>
          </div>
          <div className="space-y-2">
            {overdue.map((task) => (
              <TaskCard key={task.id} task={task} showFollowUp />
            ))}
          </div>
        </section>
      )}

      {dueToday.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Due Today</h2>
            <Badge variant="secondary">{dueToday.length}</Badge>
          </div>
          <div className="space-y-2">
            {dueToday.map((task) => (
              <TaskCard key={task.id} task={task} showFollowUp />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Upcoming</h2>
            <Badge variant="secondary">{upcoming.length}</Badge>
          </div>
          <div className="space-y-2">
            {upcoming.map((task) => (
              <TaskCard key={task.id} task={task} showFollowUp />
            ))}
          </div>
        </section>
      )}

      {noDate.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">No Date Set</h2>
            <Badge variant="secondary">{noDate.length}</Badge>
          </div>
          <div className="space-y-2">
            {noDate.map((task) => (
              <TaskCard key={task.id} task={task} showFollowUp />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
