'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition } from '@/components/motion/animations'
import { SendHorizontal, Bot, User, Sun, Moon, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const STARTERS = {
  chat: [
    'Follow up with David on Friday about the Q2 proposal',
    'I need to ship the homepage update by end of month',
    "What's the most important thing I should do today?",
    'Break down my website redesign project into steps',
  ],
  morning: ["Good morning. Let's do my morning planning."],
  night: ["Let's do the nightly review."],
}

export function ChatInterface() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') ?? 'chat') as 'chat' | 'morning' | 'night'
  const [inputValue, setInputValue] = useState('')
  const initialSentRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  useEffect(() => {
    if (initialSentRef.current) return
    if (mode === 'morning') {
      initialSentRef.current = true
      sendMessage({ text: STARTERS.morning[0]! })
    } else if (mode === 'night') {
      initialSentRef.current = true
      sendMessage({ text: STARTERS.night[0]! })
    }
  }, [mode, sendMessage])

  function handleSend() {
    if (!inputValue.trim() || isLoading) return
    sendMessage({ text: inputValue })
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const modeConfig = {
    chat: { label: 'AI Assistant', Icon: Zap, badge: null },
    morning: { label: 'Morning Planning', Icon: Sun, badge: 'Planning Session' },
    night: { label: 'Night Review', Icon: Moon, badge: 'Review Session' },
  }[mode]

  return (
    <PageTransition className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm">
          <modeConfig.Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">{modeConfig.label}</h1>
          <p className="text-xs text-muted-foreground">COYL AI</p>
        </div>
        {modeConfig.badge && (
          <Badge variant="brand" className="text-xs">{modeConfig.badge}</Badge>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence>
          {messages.length === 0 && mode === 'chat' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-warm shadow-glow-orange">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="heading-3">Your COYL is ready</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Capture a task, plan your day, or tell me what&apos;s on your mind.
              </p>
              <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
                {STARTERS.chat.map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage({ text: s })}
                    className="glass rounded-xl px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:text-foreground hover:shadow-glow-orange/30"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto max-w-2xl space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-warm">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-gradient-warm text-white'
                      : 'glass'
                  )}
                >
                  {message.parts?.map((part, pi) =>
                    part.type === 'text' ? (
                      <span key={pi} className="whitespace-pre-wrap">{part.text}</span>
                    ) : null
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-warm">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="glass flex items-center gap-1.5 rounded-2xl px-4 py-3">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
                    transition={{ duration: 0.8, delay, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-orange-500"
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="glass flex items-end gap-2 rounded-2xl px-4 py-3 focus-within:shadow-glow-orange transition-shadow">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'morning' ? 'What needs to get done today?' : mode === 'night' ? 'How did the day go?' : 'Capture a task or ask anything\u2026'
              }
              className="min-h-[36px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              rows={1}
              disabled={isLoading}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-warm text-white transition-opacity disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
            </motion.button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Enter to send &middot; Shift+Enter for new line
          </p>
        </div>
      </div>
    </PageTransition>
  )
}
