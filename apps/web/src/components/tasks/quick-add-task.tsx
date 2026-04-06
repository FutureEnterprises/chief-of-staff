'use client'
import { useRef, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { X, Sparkles } from 'lucide-react'
import { MotionButton } from '@/components/ui/motion-button'
import { createTaskFromChat } from '@/app/actions/tasks'
import { toast } from '@/hooks/use-toast'

interface QuickAddTaskProps {
  onClose: () => void
}

export function QuickAddTask({ onClose }: QuickAddTaskProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || loading) return
    setLoading(true)
    try {
      await createTaskFromChat(value)
      toast({ title: 'Task captured' })
      onClose()
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-24 left-1/2 z-50 w-full max-w-md -translate-x-1/2"
      >
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-xl border bg-card shadow-2xl"
        >
          <div className="flex items-center gap-2 px-4 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Capture anything — AI handles the rest"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={loading}
            />
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2">
            <p className="text-xs text-muted-foreground">
              Dates, follow-ups, priority extracted automatically
            </p>
            <MotionButton
              type="submit"
              size="sm"
              loading={loading}
              disabled={!value.trim()}
              className="h-7 text-xs"
            >
              Add
            </MotionButton>
          </div>
        </form>
      </motion.div>
    </>
  )
}
