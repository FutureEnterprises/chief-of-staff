'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Task, Tag, Project } from '@repo/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, Tag as TagIcon,
  FolderOpen, Zap, ChevronRight,
} from 'lucide-react'
import {
  cn, formatDate, formatRelativeDate, getPriorityColor, getPriorityLabel,
  getStatusLabel, getEffortLabel,
} from '@/lib/utils'
import { QUICK_ACTIONS } from '@/lib/task-state-machine'
import { completeTask, updateTaskStatus, decomposeTask } from '@/app/actions/tasks'
import { toast } from '@/hooks/use-toast'
import type { TaskStatus } from '@/lib/task-state-machine'

type TaskWithRelations = Task & {
  tags: Array<{ tag: Tag }>
  project?: Project | null
  subtasks: Array<Task & { tags: Array<{ tag: Tag }> }>
  parentTask?: { id: string; title: string } | null
  aiInteractions: Array<{ interactionType: string; createdAt: Date }>
}

interface TaskDetailViewProps {
  task: TaskWithRelations
}

export function TaskDetailView({ task }: TaskDetailViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const quickActions = QUICK_ACTIONS[task.status as TaskStatus] ?? []

  async function handleAction(status: TaskStatus) {
    setLoading(status)
    try {
      if (status === 'COMPLETED') {
        await completeTask(task.id)
        toast({ title: 'Task completed', description: 'Well done.' })
        router.push('/today')
      } else {
        await updateTaskStatus(task.id, status)
        toast({ title: `Moved to ${getStatusLabel(status)}` })
        router.refresh()
      }
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  async function handleDecompose() {
    setLoading('decompose')
    try {
      await decomposeTask(task.id)
      toast({ title: 'Task broken down', description: 'Subtasks have been created.' })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Failed to decompose task.', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link href="/tasks">
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        {task.parentTask && (
          <div className="mb-2 flex items-center gap-1 text-xs text-zinc-400">
            <Link href={`/tasks/${task.parentTask.id}`} className="hover:text-zinc-600">
              {task.parentTask.title}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span>Subtask</span>
          </div>
        )}
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">{task.title}</h1>
        {task.description && (
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{task.description}</p>
        )}
      </div>

      {/* Metadata Row */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('text-xs', getPriorityColor(task.priority))}>
          {getPriorityLabel(task.priority)}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {getStatusLabel(task.status)}
        </Badge>
        {task.effortEstimate && (
          <span className="text-xs text-zinc-400">{getEffortLabel(task.effortEstimate)}</span>
        )}
        {task.dueAt && (
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(task.dueAt)}
          </span>
        )}
        {task.project && (
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            <FolderOpen className="h-3 w-3" />
            {task.project.name}
          </span>
        )}
        {task.tags.map(({ tag }: { tag: Tag }) => (
          <span key={tag.id} className="flex items-center gap-0.5 text-xs text-zinc-400">
            <TagIcon className="h-3 w-3" />
            {tag.name}
          </span>
        ))}
      </div>

      {/* Follow-up Banner */}
      {task.followUpRequired && task.nextFollowUpAt && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="text-sm text-amber-700">
            Follow-up due {formatRelativeDate(task.nextFollowUpAt)}
            {task.followUpIntervalDays && ` · every ${task.followUpIntervalDays} days`}
          </span>
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Actions</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action: { label: string; status: TaskStatus; requiresReason?: boolean }) => (
              <Button
                key={action.status}
                variant={action.status === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                disabled={loading !== null}
                onClick={() => handleAction(action.status)}
              >
                {loading === action.status ? 'Working...' : action.label}
              </Button>
            ))}
            {task.subtasks.length === 0 && task.status !== 'COMPLETED' && (
              <Button
                variant="outline"
                size="sm"
                disabled={loading !== null}
                onClick={handleDecompose}
                className="gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                {loading === 'decompose' ? 'Breaking down...' : 'Break down with AI'}
              </Button>
            )}
          </div>
        </div>
      )}

      <Separator className="mb-6" />

      {/* Subtasks */}
      {task.subtasks.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Subtasks ({task.subtasks.filter((s: Task) => s.status === 'COMPLETED').length}/
            {task.subtasks.length} done)
          </h2>
          <div className="space-y-1.5">
            {task.subtasks.map((subtask: Task & { tags: Array<{ tag: Tag }> }) => (
              <Link
                key={subtask.id}
                href={`/tasks/${subtask.id}`}
                className="flex items-center gap-2.5 rounded-md border bg-zinc-50 px-3 py-2 transition-colors hover:bg-zinc-100"
              >
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 shrink-0',
                    subtask.status === 'COMPLETED' ? 'text-green-500' : 'text-zinc-300'
                  )}
                />
                <span
                  className={cn(
                    'text-sm',
                    subtask.status === 'COMPLETED'
                      ? 'text-zinc-400 line-through'
                      : 'text-zinc-700'
                  )}
                >
                  {subtask.title}
                </span>
                {subtask.effortEstimate && (
                  <span className="ml-auto text-xs text-zinc-400">
                    {getEffortLabel(subtask.effortEstimate)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Metadata Footer */}
      <div className="text-xs text-zinc-400 space-y-1">
        <p>Created {formatDate(task.createdAt)}</p>
        {task.completedAt && <p>Completed {formatDate(task.completedAt)}</p>}
        {task.source && <p>Source: {task.source.replace(/_/g, ' ').toLowerCase()}</p>}
        {task.aiConfidence !== null && task.aiConfidence !== undefined && (
          <p>AI confidence: {Math.round(task.aiConfidence * 100)}%</p>
        )}
      </div>
    </div>
  )
}
