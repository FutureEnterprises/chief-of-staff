'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import type { Task, Tag } from '@repo/database'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, RefreshCw } from 'lucide-react'
import { cn, formatRelativeDate, getDaysOverdue, getPriorityHex, getPriorityLabel, getStatusHex, getStatusBadgeVariant } from '@/lib/utils'
import { completeTask } from '@/app/actions/tasks'
import { toast } from '@/hooks/use-toast'
import { TaskCompleteCelebration } from '@/components/motion/celebrations'

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
  const [celebrating, setCelebrating] = useState(false)
  const daysOverdue = task.dueAt ? getDaysOverdue(task.dueAt) : 0

  const handleComplete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (completing || done) return
    setCompleting(true)
    setCelebrating(true)
    setDone(true)
    await completeTask(task.id)
    toast({ title: 'Task completed', description: task.title })
    setCompleting(false)
  }, [completing, done, task.id, task.title])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: done ? 0 : 1, y: 0, height: done ? 0 : 'auto' }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={cn('group relative overflow-hidden', done && 'pointer-events-none')}
    >
      <div
        className="glass rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:hover:shadow-card-hover-dark"
        style={{ borderLeft: `3px solid ${getStatusHex(task.status)}` }}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          {/* Complete button */}
          <motion.button
            onClick={handleComplete}
            whileTap={{ scale: 0.85 }}
            transition={{ duration: 0.1 }}
            className="relative mt-0.5 shrink-0"
            aria-label="Complete task"
          >
            <motion.div className="text-zinc-300 transition-colors hover:text-emerald-500 dark:text-zinc-600">
              {done ? (
                <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
              ) : (
                <Circle className="h-[18px] w-[18px]" />
              )}
            </motion.div>
            <TaskCompleteCelebration active={celebrating} onComplete={() => setCelebrating(false)} />
          </motion.button>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <Link href={`/tasks/${task.id}`} className="block">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: getPriorityHex(task.priority) }}
                />
                <p className={cn(
                  'text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400',
                  compact && 'text-xs',
                  done && 'text-muted-foreground line-through'
                )}>
                  {task.title}
                </p>
              </div>
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none',
                `bg-[${getPriorityHex(task.priority)}]/10 text-[${getPriorityHex(task.priority)}]`
              )} style={{
                backgroundColor: `${getPriorityHex(task.priority)}15`,
                color: getPriorityHex(task.priority),
              }}>
                {getPriorityLabel(task.priority)}
              </span>

              {task.dueAt && (
                <span className={cn(
                  'flex items-center gap-1 text-xs',
                  showOverdue && daysOverdue > 0
                    ? 'font-semibold text-red-500'
                    : 'text-muted-foreground'
                )}>
                  <Clock className="h-3 w-3" />
                  {showOverdue && daysOverdue > 0 ? `${daysOverdue}d overdue` : formatRelativeDate(task.dueAt)}
                </span>
              )}

              {showFollowUp && task.nextFollowUpAt && (
                <span className="flex items-center gap-1 text-xs text-amber-500">
                  <RefreshCw className="h-3 w-3" />
                  Follow up {formatRelativeDate(task.nextFollowUpAt)}
                </span>
              )}

              {task.project && (
                <span className="text-xs text-muted-foreground/70">{task.project.name}</span>
              )}

              {task.tags?.slice(0, 2).map(({ tag }) => (
                <span key={tag.id} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* Status badge */}
          <div className="flex shrink-0 items-center gap-1.5">
            {(task.status === 'BLOCKED' || task.status === 'WAITING') && (
              <Badge variant={getStatusBadgeVariant(task.status) as 'status-blocked' | 'status-waiting'} className="text-[10px]">
                {task.status === 'BLOCKED' ? 'Blocked' : 'Waiting'}
              </Badge>
            )}
            {task.followUpRequired && !showFollowUp && (
              <RefreshCw className="h-3 w-3 text-amber-400" aria-label="Follow-up required" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
