'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { SendHorizontal, Bot, User, Loader2, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatInterface() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') ?? 'chat'
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialSentRef = useRef(false)

  // AI SDK v6: body must be passed via DefaultChatTransport, not directly on useChat
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { mode },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send initial message based on mode (once only)
  useEffect(() => {
    if (initialSentRef.current) return
    if (mode === 'morning') {
      initialSentRef.current = true
      sendMessage({ text: "Good morning. Let's do my morning planning." })
    } else if (mode === 'night') {
      initialSentRef.current = true
      sendMessage({ text: "Let's do the nightly review." })
    }
  }, [mode, sendMessage])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    sendMessage({ text: inputValue })
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const modeLabel =
    mode === 'morning' ? 'Morning Interview' : mode === 'night' ? 'Night Review' : 'AI Assistant'
  const ModeIcon = mode === 'morning' ? Sun : mode === 'night' ? Moon : Bot

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
          <ModeIcon className="h-4 w-4 text-zinc-600" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">{modeLabel}</h1>
          <p className="text-xs text-zinc-400">Your AI Chief of Staff</p>
        </div>
        {mode !== 'chat' && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {mode === 'morning' ? 'Planning Session' : 'Review Session'}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && mode === 'chat' && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <Bot className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="font-semibold text-zinc-900">Your Chief of Staff is ready</h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Ask me to capture a task, break down a project, or tell me what you&apos;re working on.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                'Follow up with Sarah on Friday about the proposal',
                'I need to launch the landing page next month',
                'Break down the Q2 planning project',
                'What should I focus on today?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage({ text: prompt })}
                  className="rounded-full border px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {message.role === 'assistant' && (
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  message.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-800'
                )}
              >
                {message.parts?.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <span key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </span>
                    )
                  }
                  return null
                })}
              </div>
              {message.role === 'user' && (
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200">
                  <User className="h-3.5 w-3.5 text-zinc-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start gap-3">
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="rounded-2xl bg-zinc-100 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border bg-zinc-50 px-3 py-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'morning'
                  ? 'What needs to get done today?'
                  : mode === 'night'
                    ? 'What got done today?'
                    : 'Capture a task or ask anything...'
              }
              className="max-h-[160px] min-h-[40px] flex-1 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="shrink-0"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-center text-xs text-zinc-400">
            Press Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}
