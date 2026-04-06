'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Task, Tag } from '@repo/database'
import { MotionButton } from '@/components/ui/motion-button'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskCreateModal } from '@/components/tasks/task-create-modal'
import { EmptyState } from '@/components/ui/empty-state'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion/animations'
import { updateTaskStatus } from '@/app/actions/tasks'
import { toast } from '@/hooks/use-toast'
import { Inbox, ArrowRight, Plus } from 'lucide-react'

interface InboxViewProps {
  tasks: Array<Task & { tags: Array<{ tag: Tag }>; project?: { id: string; name: string } | null }>
}

export function InboxView({ tasks }: InboxViewProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function processTask(taskId: string) {
    setProcessingId(taskId)
    await updateTaskStatus(taskId, 'OPEN')
    toast({ title: 'Moved to open' })
    setProcessingId(null)
  }

  return (
    <PageTransition className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {tasks.length > 0
              ? `${tasks.length} item${tasks.length !== 1 ? 's' : ''} need your decision`
              : 'Zero inbox — nothing to process'}
          </p>
        </div>
        <MotionButton size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> Capture
        </MotionButton>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox zero"
          description="All captured items have been processed. Keep it clean."
          action={
            <MotionButton size="sm" variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5" /> Capture something
            </MotionButton>
          }
        />
      ) : (
        <StaggerList className="space-y-2">
          {tasks.map((task) => (
            <StaggerItem key={task.id}>
              <div className="group relative">
                <TaskCard task={task} />
                <motion.button
                  initial={{ opacity: 0, x: 4 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="absolute right-3 top-3 flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs font-medium opacity-0 shadow-sm transition-all group-hover:opacity-100"
                  onClick={() => processTask(task.id)}
                  disabled={processingId === task.id}
                >
                  Process <ArrowRight className="h-3 w-3" />
                </motion.button>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      <AnimatePresence>
        {showCreate && <TaskCreateModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </PageTransition>
  )
}
