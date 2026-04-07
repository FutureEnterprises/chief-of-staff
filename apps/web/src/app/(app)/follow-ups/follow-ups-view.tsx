'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Task, Tag } from '@repo/database'
import { TaskCard } from '@/components/tasks/task-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion/animations'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type FollowUpTask = Task & { tags: Array<{ tag: Tag }> }

interface FollowUpsViewProps {
  overdue: FollowUpTask[]
  dueToday: FollowUpTask[]
  upcoming: FollowUpTask[]
  noDate: FollowUpTask[]
}

export function FollowUpsView({ overdue, dueToday, upcoming, noDate }: FollowUpsViewProps): React.JSX.Element {
  const total = overdue.length + dueToday.length + upcoming.length + noDate.length

  return (
    <PageTransition className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {total > 0
            ? `${total} open follow-up${total !== 1 ? 's' : ''}`
            : 'All follow-ups are handled'}
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All follow-ups handled"
          description="No outstanding follow-ups. Add follow-up requirements to tasks via AI capture."
        />
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <FollowUpSection title="Overdue" tasks={overdue} variant="destructive" />
          )}
          {dueToday.length > 0 && (
            <FollowUpSection title="Due today" tasks={dueToday} variant="warning" />
          )}
          {upcoming.length > 0 && (
            <FollowUpSection title="Upcoming" tasks={upcoming} variant="default" />
          )}
          {noDate.length > 0 && (
            <FollowUpSection title="No date set" tasks={noDate} variant="muted" />
          )}
        </div>
      )}
    </PageTransition>
  )
}

function FollowUpSection({
  title,
  tasks,
  variant,
}: {
  title: string
  tasks: FollowUpTask[]
  variant: 'destructive' | 'warning' | 'default' | 'muted'
}) {
  const iconColors: Record<string, string> = {
    destructive: 'text-red-500',
    warning: 'text-amber-500',
    default: 'text-foreground',
    muted: 'text-muted-foreground',
  }

  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <RefreshCw className={cn('h-3.5 w-3.5', iconColors[variant])} />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <Badge
          variant={variant === 'destructive' ? 'destructive' : 'secondary'}
          className="h-4 px-1.5 text-[10px]"
        >
          {tasks.length}
        </Badge>
      </div>
      <StaggerList className="space-y-2">
        {tasks.map((task) => (
          <StaggerItem key={task.id}>
            <TaskCard task={task} showFollowUp />
          </StaggerItem>
        ))}
      </StaggerList>
    </section>
  )
}
