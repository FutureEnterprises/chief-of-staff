'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Sparkles } from 'lucide-react'
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
    if (!value.trim()) return

    setLoading(true)
    try {
      await createTaskFromChat(value)
      toast({ title: 'Task added', description: 'Your task has been captured.' })
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Failed to add task.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700">Capture a task</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Follow up with Sarah on Friday about the proposal"
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !value.trim()} size="sm">
            {loading ? 'Adding...' : 'Add'}
          </Button>
        </form>
        <p className="mt-2 text-xs text-zinc-400">
          AI will extract dates, follow-ups, and priority automatically.
        </p>
      </div>
    </div>
  )
}
