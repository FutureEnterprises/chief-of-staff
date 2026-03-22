'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Task, User, Tag } from '@repo/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TaskCard } from '@/components/tasks/task-card'
import { QuickAddTask } from '@/components/tasks/quick-add-task'
import { Plus, Sun, Moon, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatDate, getDaysOverdue } from '@/lib/utils'

type TaskWithRelations = Task & {
  tags: Array<{ tag: Tag }>
  project?: { id: string; name: string } | null
}

interface TodayViewProps {
  dueTodayTasks: TaskWithRelations[]
  followUpsDueToday: Array<Task & { tags: Array<{ tag: Tag }> }>
  overdueTasks: Array<Task & { tags: Array<{ tag: Tag }> }>
  recentlyCompleted: Task[]
  user: User
}

export function TodayView({
  dueTodayTasks,
  followUpsDueToday,
  overdueTasks,
  recentlyCompleted,
  user,
}: TodayViewProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.name.split(' ')[0] ?? user.name

  const totalAttention = dueTodayTasks.length + overdueTasks.length + followUpsDueToday.length
  const criticalTasks = [...dueTodayTasks, ...overdueTasks]
    .filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH')
    .slice(0, 3)

  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{formatDate(new Date())}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/chat?mode=morning">
                <Sun className="h-4 w-4" />
                Morning Interview
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/chat?mode=night">
                <Moon className="h-4 w-4" />
                Night Review
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <StatCard label="Due Today" value={dueTodayTasks.length} color="blue" />
        <StatCard label="Overdue" value={overdueTasks.length} color={overdueTasks.length > 0 ? 'red' : 'green'} />
        <StatCard label="Follow-ups" value={followUpsDueToday.length} color="amber" />
        <StatCard label="Done Today" value={recentlyCompleted.length} color="green" />
      </div>

      {/* Top Priorities */}
      {criticalTasks.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Top Priorities</h2>
          </div>
          <div className="space-y-2">
            {criticalTasks.map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </section>
      )}

      {/* Due Today */}
      {dueTodayTasks.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Due Today</h2>
            <Badge variant="secondary">{dueTodayTasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {dueTodayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Follow-ups Due */}
      {followUpsDueToday.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Follow-ups Due</h2>
            <Badge variant="secondary">{followUpsDueToday.length}</Badge>
          </div>
          <div className="space-y-2">
            {followUpsDueToday.map((task) => (
              <TaskCard key={task.id} task={task} showFollowUp />
            ))}
          </div>
        </section>
      )}

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-red-500">Overdue</h2>
            <Badge variant="destructive">{overdueTasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} showOverdue />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {totalAttention === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <h3 className="font-semibold text-zinc-900">You&apos;re all caught up</h3>
          <p className="mt-1 text-sm text-zinc-500">Nothing urgent needs your attention right now.</p>
          <Button className="mt-4" size="sm" onClick={() => setShowQuickAdd(true)}>
            <Plus className="h-4 w-4" />
            Add a task
          </Button>
        </div>
      )}

      {/* Recently Completed */}
      {recentlyCompleted.length > 0 && (
        <section className="mt-8">
          <Separator className="mb-6" />
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Completed Today</h2>
          </div>
          <div className="space-y-1">
            {recentlyCompleted.map((task) => (
              <div key={task.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                <span className="text-sm text-zinc-500 line-through">{task.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Add FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800"
        aria-label="Add task"
      >
        <Plus className="h-5 w-5" />
      </button>

      {showQuickAdd && <QuickAddTask onClose={() => setShowQuickAdd(false)} />}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
    amber: 'text-amber-600 bg-amber-50',
    green: 'text-green-600 bg-green-50',
  }
  return (
    <div className={`rounded-lg p-3 ${colors[color] ?? colors['blue']}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-80">{label}</div>
    </div>
  )
}
