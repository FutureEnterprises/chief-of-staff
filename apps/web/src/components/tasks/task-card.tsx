'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Task, Tag } from '@repo/database'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { cn, formatRelativeDate, getDaysOverdue, getPriorityColor, getPriorityLabel } from '@/lib/utils'
import { completeTask } from '@/app/actions/tasks'

type TaskWithTags = Task & {
  tags?: Array<{ tag: Tag }>
  project?: { id: string; name: string } | null
}

interface TaskCardProps {
  task: TaskWithTags
  compact?: boolean
  showFollowUp?: boolean
  showOverdue?: boolean
}

export function TaskCard({ task, compact, showFollowUp, showOverdue }: TaskCardProps) {
  const [completing, setCompleting] = useState(false)
  const daysOverdue = task.dueAt ? getDaysOverdue(task.dueAt) : 0

  async function handleComplete(e: React.MouseEvent) {
    e.preventDefault()
    setCompleting(true)
    try {
      await completeTask(task.id)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border bg-white px-3 py-3 transition-shadow hover:shadow-sm',
        completing && 'opacity-50'
      )}
    >
      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={completing}
        className="mt-0.5 shrink-0 text-zinc-300 transition-colors hover:text-green-500"
        aria-label="Complete task"
      >
        <CheckCircle2 className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <Link href={`/tasks/${task.id}`} className="block">
          <p
            className={cn(
              'text-sm font-medium text-zinc-900 hover:text-zinc-600',
              compact && 'text-xs'
            )}
          >
            {task.title}
          </p>
        </Link>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {/* Priority */}
          <Badge variant="outline" className={cn('h-5 text-xs', getPriorityColor(task.priority))}>
            {getPriorityLabel(task.priority)}
          </Badge>

          {/* Due date */}
          {task.dueAt && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs',
                showOverdue && daysOverdue > 0 ? 'font-medium text-red-500' : 'text-zinc-400'
              )}
            >
              <Clock className="h-3 w-3" />
              {showOverdue && daysOverdue > 0
                ? `${daysOverdue}d overdue`
                : formatRelativeDate(task.dueAt)}
            </span>
          )}

          {/* Follow-up */}
          {showFollowUp && task.nextFollowUpAt && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              Follow up {formatRelativeDate(task.nextFollowUpAt)}
            </span>
          )}

          {/* Project */}
          {task.project && <span className="text-xs text-zinc-400">{task.project.name}</span>}

          {/* Tags */}
          {task.tags?.slice(0, 2).map(({ tag }: { tag: Tag }) => (
            <span key={tag.id} className="text-xs text-zinc-400">
              #{tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Status badge */}
      {task.status === 'BLOCKED' && (
        <Badge variant="destructive" className="shrink-0 text-xs">
          Blocked
        </Badge>
      )}
      {task.status === 'WAITING' && (
        <Badge variant="outline" className="shrink-0 text-xs">
          Waiting
        </Badge>
      )}
    </div>
  )
}
