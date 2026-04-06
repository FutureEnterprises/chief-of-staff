'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MotionButton } from '@/components/ui/motion-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Sparkles, Wand2 } from 'lucide-react'
import { createTaskFromChat, createTask } from '@/app/actions/tasks'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TaskCreateModalProps {
  onClose: () => void
  projectId?: string
}

type Mode = 'ai' | 'manual'

export function TaskCreateModal({ onClose, projectId }: TaskCreateModalProps) {
  const [mode, setMode] = useState<Mode>('ai')
  const [aiInput, setAiInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueAt: '',
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  async function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!aiInput.trim() || loading) return
    setLoading(true)
    try {
      await createTaskFromChat(aiInput)
      toast({ title: 'Task captured', description: 'AI extracted dates, follow-ups, and priority.' })
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Could not add task.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || loading) return
    setLoading(true)
    try {
      await createTask({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        dueAt: form.dueAt ? new Date(form.dueAt) : undefined,
        projectId,
      })
      toast({ title: 'Task created' })
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Could not create task.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
      >
        <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <button
                onClick={() => setMode('ai')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  mode === 'ai'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="h-3 w-3" /> AI capture
              </button>
              <button
                onClick={() => setMode('manual')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  mode === 'manual'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Manual
              </button>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <AnimatePresence mode="wait">
            {mode === 'ai' ? (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="p-5"
              >
                <form onSubmit={handleAiSubmit} className="space-y-3">
                  <Textarea
                    ref={textareaRef}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder='e.g. "Follow up with Sarah on Thursday about the proposal — if no response by Friday, call her"'
                    className="min-h-[100px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAiSubmit(e as unknown as React.FormEvent)
                      }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      <Wand2 className="mr-1 inline h-3 w-3" />
                      AI extracts due dates, follow-ups, and priority automatically.
                    </p>
                    <MotionButton
                      type="submit"
                      size="sm"
                      loading={loading}
                      disabled={!aiInput.trim()}
                    >
                      Capture
                    </MotionButton>
                  </div>
                </form>
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Try it:</p>
                  {[
                    'Email Alex about the Keynote slides — follow up Monday',
                    'Submit Q2 report by end of this week, high priority',
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setAiInput(ex)}
                      className="block text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      &ldquo;{ex}&rdquo;
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="p-5"
              >
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Task title"
                    className="text-sm"
                    autoFocus
                  />
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Notes (optional)"
                    className="min-h-[60px] resize-none text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={form.priority}
                      onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SOMEDAY'].map((p) => (
                          <SelectItem key={p} value={p} className="text-xs">
                            {p.charAt(0) + p.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={form.dueAt}
                      onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <MotionButton
                      type="submit"
                      size="sm"
                      loading={loading}
                      disabled={!form.title.trim()}
                    >
                      Create task
                    </MotionButton>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}
