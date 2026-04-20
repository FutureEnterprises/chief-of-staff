'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'motion/react'
import { StructuredResponse } from '@/components/structured-response'

const DEMO_TRIGGERS = [
  { key: 'BINGE_URGE', label: 'I want to binge', emoji: '🍔' },
  { key: 'DELIVERY_URGE', label: "I'm ordering food", emoji: '📦' },
  { key: 'SPIRALING', label: "I'm spiraling", emoji: '🌀' },
  { key: 'ALREADY_SLIPPED', label: 'I already slipped', emoji: '💥' },
  { key: 'SKIP_WORKOUT', label: 'I want to skip', emoji: '😴' },
]

export function RescueDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const [selected, setSelected] = useState<(typeof DEMO_TRIGGERS)[number] | null>(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)

  async function fire(trigger: (typeof DEMO_TRIGGERS)[number]) {
    setSelected(trigger)
    setResponse('')
    setLoading(true)
    setRateLimited(false)

    try {
      const res = await fetch('/api/demo/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: trigger.key }),
      })

      if (res.status === 429) {
        setRateLimited(true)
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
        for (const line of chunk.split('\n')) {
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
    } catch {
      setResponse('Something went wrong. Sign up to try for real.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-track that someone clicked the demo (analytics hook point)
    if (selected && typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('coyl:demo-fired', { detail: { trigger: selected.key } }))
      } catch {
        // silent
      }
    }
  }, [selected])

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Try it right now
        </h2>
        <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Feel what it&apos;s like<br />to be caught.
        </h3>
        <p className="mt-4 max-w-xl text-sm text-gray-400">
          Tap one. COYL responds in real-time. No signup. No card. Just the raw interrupt.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Trigger list */}
        <div className="md:col-span-5">
          <div className="space-y-2">
            {DEMO_TRIGGERS.map((t, i) => (
              <motion.button
                key={t.key}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fire(t)}
                disabled={loading}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-all disabled:opacity-50 ${
                  selected?.key === t.key
                    ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(255,102,0,0.25)]'
                    : 'border-white/10 bg-white/5 hover:border-orange-500/30 hover:bg-white/10'
                }`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-white">{t.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Response panel */}
        <div className="md:col-span-7">
          <AnimatePresence mode="wait">
            {!selected && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center"
              >
                <p className="text-sm text-gray-500">← Tap a moment to see COYL interrupt it.</p>
              </motion.div>
            )}

            {selected && (
              <motion.div
                key={selected.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                  <span className="text-lg">{selected.emoji}</span>
                  <p className="text-sm font-semibold text-white">{selected.label}</p>
                </div>

                {loading && !response && (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                        className="h-1.5 w-1.5 rounded-full bg-orange-500"
                      />
                    ))}
                    <span className="ml-1 text-xs text-gray-400">COYL is interrupting…</span>
                  </div>
                )}

                {rateLimited && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                    Demo rate limited. Sign up to try for real.
                  </div>
                )}

                {response && <StructuredResponse text={response} accentColor="orange" />}

                {response && !loading && (
                  <Link
                    href={`/sign-up?ref=demo&t=${selected.key}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
                  >
                    <span>This is what 9pm looks like. Save your COYL.</span>
                    <span>→</span>
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
