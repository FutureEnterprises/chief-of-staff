'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'motion/react'
import { PageTransition } from '@/components/motion/animations'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { Brain, SendHorizontal, RotateCcw, Mic, Shield, Flame, Repeat } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'

const EXAMPLES = [
  'Should I eat this?',
  'Should I skip the workout?',
  'Should I drink tonight?',
  'Should I order takeout?',
  'Should I send this text?',
  'Should I buy this?',
]

export function DecideView() {
  const [input, setInput] = useState('')
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/v1/decide' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const hasMessages = messages.length > 0
  const showActions = !isLoading && messages.some((m) => m.role === 'assistant')

  async function saveAsCommitment() {
    // Pull the last assistant response + parse out "Best move" line if present
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    const text = lastAssistant?.parts
      ?.map((p) => (p.type === 'text' ? (p as { text: string }).text : ''))
      .join('\n') ?? ''
    // Try to extract the "Best move" section
    const match = text.match(/\*\*Best move\*\*\s*\n+([\s\S]+?)(?=\n\n|\*\*|$)/i)
    const rule = match?.[1]?.trim().slice(0, 200)
      ?? text.split('\n').find((l) => l.trim().length > 10)?.trim().slice(0, 200)
      ?? 'My next move'

    setSaving(true)
    try {
      const res = await fetch('/api/v1/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule, frequency: 'ONE_TIME' }),
      })
      if (res.ok) {
        toast({ title: 'Saved as commitment', description: rule })
      } else {
        toast({ title: 'Could not save', variant: 'destructive' })
      }
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (error?.message) {
      if (error.message.includes('feature_gated') || error.message.includes('402')) {
        setPaywallOpen(true)
      }
    }
  }, [error])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSubmit() {
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  function handleReset() {
    setMessages([])
    setInput('')
  }

  function handleExample(example: string) {
    sendMessage({ text: example })
  }

  return (
    <PageTransition className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm shadow-glow-orange">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Decide</h1>
            <p className="text-xs text-muted-foreground">Real-time decision support</p>
          </div>
        </div>
        {hasMessages && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            New decision
          </button>
        )}
      </div>

      {/* Messages / empty state */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {!hasMessages ? (
          <div className="mx-auto max-w-xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-warm shadow-glow-orange"
            >
              <Brain className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="heading-2 mb-2">What are you deciding?</h2>
            <p className="mb-8 text-sm text-muted-foreground">
              Ask COYL about any choice you&apos;re about to make. You&apos;ll get the best move,
              the cost of the worse one, the excuse you&apos;re probably using, and the smallest
              next step.
            </p>
            <div className="mx-auto grid w-full max-w-sm grid-cols-1 gap-2">
              {EXAMPLES.map((e) => (
                <motion.button
                  key={e}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExample(e)}
                  className="glass rounded-xl px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:text-foreground"
                >
                  {e}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-gradient-warm text-white'
                        : 'glass'
                    }`}
                  >
                    {message.parts?.map((p, i) =>
                      p.type === 'text' ? (
                        <span key={i} className="whitespace-pre-wrap">{p.text}</span>
                      ) : null
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 px-4">
                {[0, 0.15, 0.3].map((d, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
                    transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-orange-500"
                  />
                ))}
              </motion.div>
            )}

            {/* Post-response CTAs */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                <button
                  onClick={saveAsCommitment}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-warm px-4 py-2.5 text-xs font-bold text-white shadow-glow-orange disabled:opacity-50"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {saving ? 'Saving…' : 'Save as commitment'}
                </button>
                <Link
                  href="/rescue"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20"
                >
                  <Flame className="h-3.5 w-3.5" />
                  Start rescue flow
                </Link>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  <Repeat className="h-3.5 w-3.5" />
                  Ask again
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="glass flex items-end gap-2 rounded-2xl px-4 py-3 focus-within:shadow-glow-orange">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="What are you about to decide?"
              className="min-h-[36px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 text-sm outline-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
              title="Voice coming soon"
              disabled
            >
              <Mic className="h-4 w-4" />
            </button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-warm text-white disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      <PaywallDialog
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger="decision"
        defaultTier="core"
      />
    </PageTransition>
  )
}
