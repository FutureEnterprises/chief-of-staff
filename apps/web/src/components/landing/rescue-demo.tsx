'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'motion/react'
import {
  Refrigerator, ShoppingCart, Wind, HeartCrack, MoonStar,
  ArrowRight, type LucideIcon,
} from 'lucide-react'
import { StructuredResponse } from '@/components/structured-response'

// Caught-moment triggers — all five assume the user has enough awareness to
// type something (or in reality, open the app). Two new framings replaced the
// pre-commitment "I want to binge" / "I'm ordering food" — those imply
// metacognitive control that autopilot bypasses. Real "caught" moments look
// more like hesitation or retrospection.
type Trigger = {
  key: string
  title: string
  sub: string
  icon: LucideIcon
  /** Variant tag for the narrative — past (retroactive), now (mid-hesitation), pre (pre-action tempted) */
  variant: 'now' | 'past' | 'pre'
}

const DEMO_TRIGGERS: Trigger[] = [
  {
    key: 'FRIDGE_STARE',
    title: 'I\u2019m staring into the fridge',
    sub: 'Not hungry. Just restless.',
    icon: Refrigerator,
    variant: 'now',
  },
  {
    key: 'CART_HOVER',
    title: 'Cart\u2019s full. Finger on checkout',
    sub: 'About to click. Something in me is asking.',
    icon: ShoppingCart,
    variant: 'now',
  },
  {
    key: 'SPIRALING',
    title: 'I\u2019m spiraling',
    sub: 'One slip turning into a night.',
    icon: Wind,
    variant: 'now',
  },
  {
    key: 'ALREADY_SLIPPED',
    title: 'I already folded last night',
    sub: 'Woke up thinking: not again.',
    icon: HeartCrack,
    variant: 'past',
  },
  {
    key: 'SKIP_WORKOUT',
    title: 'I want to skip today',
    sub: 'The story\u2019s already writing itself.',
    icon: MoonStar,
    variant: 'pre',
  },
]

export function RescueDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const [selected, setSelected] = useState<Trigger | null>(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function fire(trigger: Trigger) {
    setSelected(trigger)
    setResponse('')
    setErrorMsg(null)
    setLoading(true)

    try {
      const res = await fetch('/api/demo/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: trigger.key }),
      })

      if (res.status === 429) {
        setErrorMsg('Demo limit hit. Sign up to try unlimited.')
        setLoading(false)
        return
      }
      if (!res.ok) {
        setErrorMsg('Something hiccupped. Sign up and we\u2019ll do it for real.')
        setLoading(false)
        return
      }

      // Plain-text stream — each chunk is raw text, no protocol framing.
      // Much more robust than the UIMessage SSE format for this use case.
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('no reader')
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setResponse(accumulated)
      }
    } catch {
      setErrorMsg('Couldn\u2019t reach COYL. Try again or sign up.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Analytics hook — fires a CustomEvent you can wire to your tracker.
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
        className="mb-10"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Try it right now
        </h2>
        <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Pick a moment<br />you already know.
        </h3>
        <p className="mt-4 max-w-xl text-sm text-gray-400">
          Not a hypothetical. One of these has happened to you. COYL responds in real time.
          No signup. No card.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Trigger list */}
        <div className="md:col-span-5">
          <div className="space-y-2">
            {DEMO_TRIGGERS.map((t, i) => {
              const Icon = t.icon
              const isSelected = selected?.key === t.key
              return (
                <motion.button
                  key={t.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fire(t)}
                  disabled={loading}
                  className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all disabled:opacity-50 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_24px_rgba(255,102,0,0.25)]'
                      : 'border-white/10 bg-white/5 hover:border-orange-500/30 hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      isSelected
                        ? 'border-orange-500/50 bg-orange-500/15 text-orange-400'
                        : 'border-white/10 bg-white/5 text-gray-400 group-hover:text-orange-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-white">{t.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{t.sub}</p>
                  </div>
                </motion.button>
              )
            })}
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
                className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center"
              >
                <p className="text-sm text-gray-500">
                  <span className="hidden md:inline">&larr; Pick one.</span>
                  <span className="md:hidden">Pick one above.</span>
                </p>
                <p className="mt-2 max-w-xs text-xs text-gray-600">
                  COYL will respond in 2\u20134 seconds with the same voice you&apos;d get at 9 PM.
                </p>
              </motion.div>
            )}

            {selected && (
              <motion.div
                key={selected.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                  <selected.icon className="h-4 w-4 shrink-0 text-orange-400" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{selected.title}</p>
                    <p className="text-xs text-gray-400">{selected.sub}</p>
                  </div>
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
                    <span className="ml-1 text-xs text-gray-400">COYL is responding\u2026</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                    {errorMsg}
                  </div>
                )}

                {response && <StructuredResponse text={response} accentColor="orange" />}

                {response && !loading && (
                  <Link
                    href={`/sign-up?ref=demo&t=${selected.key}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-transform hover:scale-[1.01]"
                  >
                    <span>Want this at 9 PM \u2014 not on a landing page?</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
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
