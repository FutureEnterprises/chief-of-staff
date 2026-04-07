'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import type { Task, Tag } from '@repo/database'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn, formatRelativeDate, getDaysOverdue, getPriorityColor, getPriorityLabel } from '@/lib/utils'
import { completeTask } from '@/app/actions/tasks'
import { toast } from '@/hooks/use-toast'

type TaskWithRelations = Task & {
  tags?: Array<{ tag: Tag }>
  project?: { id: string; name: string } | null
}

interface TaskCardProps {
  task: TaskWithRelations
  compact?: boolean
  showFollowUp?: boolean
  showOverdue?: boolean
}

export function TaskCard({ task, compact, showFollowUp, showOverdue }: TaskCardProps) {
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(false)
  const daysOverdue = task.dueAt ? getDaysOverdue(task.dueAt) : 0

  async function handleComplete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (completing || done) return
    setCompleting(true)
    setDone(true)
    await completeTask(task.id)
    toast({ title: 'Task completed', description: task.title })
    setCompleting(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: done ? 0 : 1, y: 0, height: done ? 0 : 'auto' }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -1 }}
      className={cn(
        'group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-sm',
        done && 'pointer-events-none'
      )}
    >
      <div className="flex items-start gap-3 px-3 py-3">
        {/* Complete button */}
        <motion.button
          onClick={handleComplete}
          whileTap={{ scale: 0.85 }}
          transition={{ duration: 0.1 }}
          className="mt-0.5 shrink-0"
          aria-label="Complete task"
        >
          <motion.div
            animate={{ color: done ? '#14b8a6' : undefined }}
            className="text-zinc-300 transition-colors hover:text-teal-500"
          >
            {done ? (
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </motion.div>
        </motion.button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Link href={`/tasks/${task.id}`} className="block">
            <p
              className={cn(
                'text-sm font-medium leading-snug text-foreground hover:text-muted-foreground transition-colors',
                compact && 'text-xs',
                done && 'text-muted-foreground line-through'
              )}
            >
              {task.title}
            </p>
          </Link>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {/* Priority */}
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                getPriorityColor(task.priority)
              )}
            >
              {getPriorityLabel(task.priority)}
            </span>

            {/* Due date */}
            {task.dueAt && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs',
                  showOverdue && daysOverdue > 0
                    ? 'font-medium text-red-500'
                    : 'text-muted-foreground'
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
                <RefreshCw className="h-3 w-3" />
                Follow up {formatRelativeDate(task.nextFollowUpAt)}
              </span>
            )}

            {/* Project */}
            {task.project && (
              <span className="text-xs text-muted-foreground">{task.project.name}</span>
            )}

            {/* Tags */}
            {task.tags?.slice(0, 2).map(({ tag }) => (
              <span key={tag.id} className="text-xs text-muted-foreground">
                #{tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex shrink-0 items-center gap-1">
          {task.status === 'BLOCKED' && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
              Blocked
            </span>
          )}
          {task.status === 'WAITING' && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Waiting
            </span>
          )}
          {task.followUpRequired && !showFollowUp && (
            <RefreshCw className="h-3 w-3 text-amber-400" aria-label="Follow-up required" />
          )}
        </div>
      </div>
    </motion.div>
  )
}
