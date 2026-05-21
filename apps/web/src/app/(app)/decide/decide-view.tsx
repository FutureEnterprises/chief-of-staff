'use client'
/**
 * LUXURY EDITORIAL OVERHAUL — May 2026 (decide, dark)
 * Refero references applied:
 *   - 067fe2b3-9411-42b9-9ea4-39338344f66d (Liron Moran): serif as the
 *     monumental question; "what are you deciding" reads like a chapter title.
 *   - c00d3961-a100-4c22-91fe-75f6e488e579 (Pipe): ONE orange focal action
 *     (Send). User bubble adopts the orange. Everything else recedes.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): editorial restraint,
 *     calm composition for what could otherwise be a panic surface.
 * Decide is a thinking surface. Serif gives the question weight, the
 * examples read as italic suggestions in a gallery wall list.
 */

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'motion/react'
import { PageTransition } from '@/components/motion/animations'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { SendHorizontal, RotateCcw, Mic, Shield, Flame, Repeat } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
import { StructuredResponse } from '@/components/structured-response'

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
    <PageTransition className="flex h-full flex-col bg-[#0e0d0b]">
      {/* Editorial header — small eyebrow + serif page title */}
      <header className="border-b border-white/[0.05] px-6 pb-6 pt-10 sm:px-10">
        <div className="mx-auto flex max-w-3xl items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-orange-500/70" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
                Decide
              </p>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-normal leading-[1.06] tracking-[-0.012em] text-[#f5f3ee] sm:text-[34px]">
              Real-time decision support.
            </h1>
          </div>
          {hasMessages && (
            <button
              onClick={handleReset}
              className="inline-flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.20em] text-[#8a847a] transition-colors hover:text-[#f5f3ee]"
            >
              <RotateCcw className="h-3 w-3" />
              New decision
            </button>
          )}
        </div>
      </header>

      {/* Messages / empty state */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-12 sm:px-10">
        {!hasMessages ? (
          <div className="mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
                The question
              </p>
              <h2 className="mt-4 font-serif text-4xl font-normal leading-[1.05] tracking-[-0.015em] text-[#f5f3ee] sm:text-5xl">
                What are you deciding?
              </h2>
              <p className="mt-5 max-w-xl font-sans text-[14px] leading-relaxed text-[#a39d92]">
                Ask COYL about any choice you&rsquo;re about to make. You&rsquo;ll get the best move, the cost of the worse one, the excuse you&rsquo;re probably using, and the smallest next step.
              </p>
            </motion.div>

            <div className="mt-12 border-t border-white/[0.05] pt-8">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
                Try one
              </p>
              <ul className="divide-y divide-white/[0.05]">
                {EXAMPLES.map((e, i) => (
                  <motion.li
                    key={e}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <button
                      onClick={() => handleExample(e)}
                      className="group flex w-full items-baseline justify-between gap-4 py-4 text-left transition-colors hover:bg-white/[0.02]"
                    >
                      <span className="font-serif text-xl font-normal italic leading-snug text-[#f5f3ee] transition-colors group-hover:text-orange-300">
                        &ldquo;{e}&rdquo;
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a] transition-colors group-hover:text-orange-400">
                        Ask &rarr;
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const text = message.parts
                  ?.map((p) => (p.type === 'text' ? (p as { text: string }).text : ''))
                  .join('') ?? ''
                if (message.role === 'user') {
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] border-l-[1.5px] border-orange-500/70 bg-orange-500/[0.06] px-5 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
                          You
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap font-serif text-lg font-normal italic leading-snug text-[#f5f3ee]">
                          {text}
                        </p>
                      </div>
                    </motion.div>
                  )
                }
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <StructuredResponse text={text} accentColor="orange" />
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 px-1 py-2">
                {[0, 0.18, 0.36].map((d, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 1.2, delay: d, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-orange-500"
                  />
                ))}
              </motion.div>
            )}

            {/* Post-response CTAs — text-link rail */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.45 }}
                className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.05] pt-6 font-mono text-[11px] uppercase tracking-[0.20em]"
              >
                <button
                  onClick={saveAsCommitment}
                  disabled={saving}
                  className="inline-flex items-center gap-2 border-b border-orange-500/40 pb-1 text-orange-400 transition-colors hover:border-orange-500 hover:text-orange-300 disabled:opacity-50"
                >
                  <Shield className="h-3 w-3" />
                  {saving ? 'Saving…' : 'Save as commitment'}
                </button>
                <Link
                  href="/rescue"
                  className="inline-flex items-center gap-2 text-[#a39d92] transition-colors hover:text-[#f5f3ee]"
                >
                  <Flame className="h-3 w-3 text-orange-400/80" />
                  Start rescue flow
                </Link>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 text-[#a39d92] transition-colors hover:text-[#f5f3ee]"
                >
                  <Repeat className="h-3 w-3" />
                  Ask again
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.05] bg-[#0e0d0b] px-6 py-5 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-colors focus-within:border-orange-500/40">
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
              className="min-h-[36px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 font-serif text-lg font-normal leading-snug text-[#f5f3ee] outline-none placeholder:italic placeholder:text-[#5f5a52]"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center text-[#8a847a] transition-colors hover:text-[#f5f3ee] disabled:opacity-40"
              title="Voice coming soon"
              disabled
            >
              <Mic className="h-4 w-4" />
            </button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-orange-500/40 bg-orange-500/[0.08] text-orange-300 transition-colors hover:border-orange-500/70 hover:bg-orange-500/[0.16] disabled:opacity-40"
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
