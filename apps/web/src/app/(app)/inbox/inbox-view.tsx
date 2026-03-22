'use client'
import { useState } from 'react'
import type { Task, Tag } from '@repo/database'
import { TaskCard } from '@/components/tasks/task-card'
import { QuickAddTask } from '@/components/tasks/quick-add-task'
import { Button } from '@/components/ui/button'
import { Inbox, Plus } from 'lucide-react'

type TaskWithTags = Task & { tags: Array<{ tag: Tag }> }

interface InboxViewProps {
  tasks: TaskWithTags[]
}

export function InboxView({ tasks }: InboxViewProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inbox</h1>
          <p className="mt-1 text-sm text-zinc-500">Tasks waiting to be processed</p>
        </div>
        <Button size="sm" onClick={() => setShowQuickAdd(true)}>
          <Plus className="h-4 w-4" />
          Capture
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <h3 className="font-semibold text-zinc-900">Inbox zero</h3>
          <p className="mt-1 text-sm text-zinc-500">
            No unprocessed tasks. Use the button above to capture new ones.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {showQuickAdd && <QuickAddTask onClose={() => setShowQuickAdd(false)} />}
    </div>
  )
}
