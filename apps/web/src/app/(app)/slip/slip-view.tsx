'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { PageTransition } from '@/components/motion/animations'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { StructuredResponse } from '@/components/structured-response'
import { Droplet, Footprints, Salad, ArrowRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'

const QUICK_TAGS = [
  { value: 'binged', label: 'I binged', emoji: '🍔' },
  { value: 'skipped', label: 'I skipped', emoji: '😴' },
  { value: 'blew the day', label: 'I blew the day', emoji: '💥' },
  { value: 'disappeared', label: 'I disappeared', emoji: '🌀' },
  { value: 'spiraled', label: 'I spiraled', emoji: '🎢' },
]

export function SlipView() {
  const [trigger, setTrigger] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [stabilizeDone, setStabilizeDone] = useState<Record<string, boolean>>({})

  async function submit(tag: string, customNote?: string) {
    setTrigger(tag)
    setResponse('')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: tag, notes: customNote ?? notes }),
      })

      if (res.status === 402) {
        setPaywallOpen(true)
        setLoading(false)
        return
      }

      // Stream
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
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setTrigger(null)
    setNotes('')
    setResponse('')
    setStabilizeDone({})
  }

  const stabilizeActions = [
    { key: 'water', icon: Droplet, label: 'Drank water' },
    { key: 'stop', icon: Footprints, label: 'Walked 5 min' },
    { key: 'protein', icon: Salad, label: 'Planned protein-first next meal' },
  ]

  if (!trigger) {
    return (
      <PageTransition className="flex h-full flex-col">
        <div className="border-b px-6 py-4">
          <h1 className="text-sm font-semibold">Slip recovery</h1>
          <p className="text-xs text-muted-foreground">No Monday reset. We continue now.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <p className="mb-2 text-4xl font-black leading-tight text-white">
                You slipped.
              </p>
              <p className="mb-3 text-4xl font-black leading-tight text-orange-400">
                Good. Now we stop the damage.
              </p>
              <p className="text-sm text-muted-foreground">
                Pick what happened. COYL builds the next move in 10 seconds.
              </p>
            </motion.div>

            <div className="mb-6 grid grid-cols-1 gap-2">
              {QUICK_TAGS.map((t, i) => (
                <motion.button
                  key={t.value}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => submit(t.value)}
                  className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-semibold transition-all hover:border-orange-500/30"
                >
                  <span className="text-2xl">{t.emoji}</span>
                  {t.label}
                </motion.button>
              ))}
            </div>

            <div className="glass rounded-2xl p-4">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground">Or tell COYL what happened</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ate the whole pint. Ignored weigh-in. Missed workout."
                className="min-h-[60px] w-full resize-none border-0 bg-transparent p-0 text-sm outline-none"
              />
              <button
                onClick={() => submit('other', notes)}
                disabled={!notes.trim()}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-orange-400 disabled:opacity-40"
              >
                Get recovery plan <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <PaywallDialog open={paywallOpen} onClose={() => setPaywallOpen(false)} trigger="recovery" defaultTier="core" />
      </PageTransition>
    )
  }

  return (
    <PageTransition className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-sm font-semibold">Slip recovery</h1>
          <p className="text-xs text-muted-foreground capitalize">{trigger}</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> Log another
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl">
          {loading && !response && (
            <div className="glass rounded-2xl p-6 text-center">
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="mb-2 text-sm font-semibold text-orange-400"
              >
                Building your next move…
              </motion.div>
              <p className="text-xs text-muted-foreground">No shame. Just next move.</p>
            </div>
          )}

          {response && <StructuredResponse text={response} accentColor="orange" />}

          {!loading && response && (
            <div className="mt-6">
              <p className="mb-3 label-xs text-orange-500">Stabilize — tap when done</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {stabilizeActions.map((a) => {
                  const done = !!stabilizeDone[a.key]
                  return (
                    <button
                      key={a.key}
                      onClick={() => setStabilizeDone((s) => ({ ...s, [a.key]: !s[a.key] }))}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                        done
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {done ? <span className="text-base">✓</span> : <a.icon className="h-4 w-4" />}
                      {a.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link
                  href="/today"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-warm px-4 py-3 text-sm font-bold text-white shadow-glow-orange"
                >
                  Back to today <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/commitments"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold hover:bg-muted"
                >
                  Set tomorrow&apos;s rule
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <PaywallDialog open={paywallOpen} onClose={() => setPaywallOpen(false)} trigger="recovery" defaultTier="core" />
    </PageTransition>
  )
}
