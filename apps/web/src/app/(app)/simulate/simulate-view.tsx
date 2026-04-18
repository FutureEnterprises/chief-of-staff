'use client'

import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { PageTransition } from '@/components/motion/animations'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { Zap, Send, RotateCcw } from 'lucide-react'

const EXAMPLES = [
  'If I skip today, what happens?',
  'If I drink tonight, what pattern am I restarting?',
  'If I keep doing this, where does it lead in 30 days?',
  'If I miss the weigh-in, what comes next?',
  'If I send this angry text, what do I lose?',
]

export function SimulateView() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function run(scenario: string) {
    if (!scenario.trim() || loading) return
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/v1/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })

      if (res.status === 402) {
        setPaywallOpen(true)
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('no reader')
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const obj = JSON.parse(line.slice(6))
              if (obj.type === 'text-delta' && typeof obj.textDelta === 'string') {
                accumulated += obj.textDelta
                setResponse(accumulated)
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setInput('')
    setResponse('')
  }

  return (
    <PageTransition className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-orange-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Simulate</h1>
            <p className="text-xs text-muted-foreground">Play out the scenario before you commit to it</p>
          </div>
        </div>
        {response && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <RotateCcw className="h-3 w-3" />
            New
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl">
          {!response && !loading && (
            <div className="text-center">
              <p className="mb-6 text-sm text-muted-foreground">
                Input a hypothetical. Get the likely immediate, behavioral, and identity consequences.
              </p>
              <div className="grid gap-2">
                {EXAMPLES.map((e) => (
                  <motion.button
                    key={e}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => run(e)}
                    className="glass rounded-xl px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {e}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                {[0, 0.15, 0.3].map((d, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
                    transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-orange-500"
                  />
                ))}
                <span className="text-sm text-muted-foreground">Simulating…</span>
              </div>
            </div>
          )}

          {response && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
              <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                {response}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="border-t px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="glass flex items-end gap-2 rounded-2xl px-4 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  run(input)
                }
              }}
              placeholder="What if I…"
              className="min-h-[36px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 text-sm outline-none"
              rows={1}
              disabled={loading}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => run(input)}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-orange-500 text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      <PaywallDialog open={paywallOpen} onClose={() => setPaywallOpen(false)} trigger="simulate" defaultTier="premium" />
    </PageTransition>
  )
}
