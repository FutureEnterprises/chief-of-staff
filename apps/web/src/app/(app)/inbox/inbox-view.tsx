'use client'
import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { Task, Tag } from '@repo/database'
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskCreateModal } from '@/components/tasks/task-create-modal'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion/animations'
import { InboxZeroCelebration } from '@/components/motion/celebrations'
import { updateTaskStatus } from '@/app/actions/tasks'
import { toast } from '@/hooks/use-toast'
import { ArrowRight, Plus } from 'lucide-react'

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
    <PageTransition className="relative mx-auto max-w-3xl px-6 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="heading-1">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.length > 0
              ? `${tasks.length} item${tasks.length !== 1 ? 's' : ''} need your decision`
              : 'Zero inbox — nothing to process'}
          </p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> Capture
        </Button>
      </div>

      {tasks.length === 0 ? (
        <GlassCard className="py-8">
          <InboxZeroCelebration active />
        </GlassCard>
      ) : (
        <StaggerList className="space-y-2">
          {tasks.map((task) => (
            <StaggerItem key={task.id}>
              <div className="group relative">
                <TaskCard task={task} />
                <Button
                  variant="brand"
                  size="sm"
                  className="absolute right-3 top-3 opacity-0 transition-all group-hover:opacity-100"
                  onClick={() => processTask(task.id)}
                  disabled={processingId === task.id}
                >
                  Process <ArrowRight className="h-3 w-3" />
                </Button>
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
