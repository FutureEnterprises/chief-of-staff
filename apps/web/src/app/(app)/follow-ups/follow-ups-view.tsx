'use client'
import * as React from 'react'
import type { Task, Tag } from '@repo/database'
import { TaskCard } from '@/components/tasks/task-card'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion/animations'
import { Badge } from '@/components/ui/badge'
import { InboxZeroCelebration } from '@/components/motion/celebrations'
import { RefreshCw } from 'lucide-react'
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
    <PageTransition className="relative mx-auto max-w-3xl px-6 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-6">
        <h1 className="heading-1">Follow-ups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total > 0
            ? `${total} open follow-up${total !== 1 ? 's' : ''}`
            : 'All follow-ups are handled'}
        </p>
      </div>

      {total === 0 ? (
        <GlassCard className="py-8">
          <InboxZeroCelebration active />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            No outstanding follow-ups. Add follow-up requirements to tasks via AI capture.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && <FollowUpSection title="Overdue" tasks={overdue} color="var(--status-blocked)" />}
          {dueToday.length > 0 && <FollowUpSection title="Due today" tasks={dueToday} color="var(--status-in-progress)" />}
          {upcoming.length > 0 && <FollowUpSection title="Upcoming" tasks={upcoming} color="var(--status-open)" />}
          {noDate.length > 0 && <FollowUpSection title="No date set" tasks={noDate} color="var(--status-snoozed)" />}
        </div>
      )}
    </PageTransition>
  )
}

function FollowUpSection({ title, tasks, color }: { title: string; tasks: FollowUpTask[]; color: string }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <RefreshCw className="h-3.5 w-3.5" style={{ color }} />
        <h2 className="label-xs text-muted-foreground">{title}</h2>
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{tasks.length}</Badge>
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
