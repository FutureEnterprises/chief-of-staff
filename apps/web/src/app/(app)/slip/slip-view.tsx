'use client'
/**
 * AESTHETIC UPGRADE — May 2026 (operator surface)
 * Refero references applied:
 *   - 554b801c-3b31-4086-a7e5-ae613cdd618b (Linear): compact element gap,
 *     6px card radius, hairline borders, monospace section labels,
 *     refined medium-weight headlines instead of font-black.
 *   - 6e9baa82-2f2f-4e77-8b0d-566325635dbe (Axiom): single orange accent,
 *     2px-feeling rectangular surfaces, charcoal card backgrounds,
 *     monospace meta-data.
 *   - 11d3e58a-87d7-4a9a-bbf5-720f4fd3ffc6 (Linear Changelog): timeline
 *     entry pattern — slip entries presented as stacked sections with
 *     thin graphite separation, mono timestamps, tight letter-spacing.
 * Slip-specific: a log surface used in recovery — bias for calm structure,
 * no theatrical emphasis. Reduce caps-bombing, lean on type weight.
 */

import { useState } from 'react'
import { motion } from 'motion/react'
import { PageTransition } from '@/components/motion/animations'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { StructuredResponse } from '@/components/structured-response'
import { Droplet, Footprints, Salad, ArrowRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { ShareMoment } from '@/components/share/share-moment'

const QUICK_TAGS = [
  { value: 'binged', label: 'I binged', emoji: '🍔' },
  { value: 'skipped', label: 'I skipped', emoji: '😴' },
  { value: 'blew the day', label: 'I blew the day', emoji: '💥' },
  { value: 'disappeared', label: 'I disappeared', emoji: '🌀' },
  { value: 'spiraled', label: 'I spiraled', emoji: '🎢' },
]

interface SlipViewProps {
  userId: string
  currentStreak: number
}

export function SlipView({ userId, currentStreak }: SlipViewProps) {
  const [trigger, setTrigger] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [stabilizeDone, setStabilizeDone] = useState<Record<string, boolean>>({})
  // The "I'm back" share chip appears only once all three stabilize actions
  // are done — that's the earliest the "I caught myself" claim is true.
  const allStabilizeDone =
    Object.values(stabilizeDone).filter(Boolean).length >= 3

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
        <div className="border-b border-white/[0.06] px-6 py-3.5">
          <h1 className="text-[13px] font-semibold tracking-[-0.01em]">Slip recovery</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground">No Monday reset. We continue now.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-7">
          <div className="mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <p className="text-3xl font-semibold leading-[1.05] tracking-[-0.025em] text-white sm:text-4xl">
                You slipped.
              </p>
              <p className="mb-3 text-3xl font-semibold leading-[1.05] tracking-[-0.025em] text-orange-400 sm:text-4xl">
                Good. Now we stop the damage.
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Pick what happened. COYL builds the next move in 10 seconds.
              </p>
            </motion.div>

            <div className="mb-5 grid grid-cols-1 gap-1.5">
              {QUICK_TAGS.map((t, i) => (
                <motion.button
                  key={t.value}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => submit(t.value)}
                  className="flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-[13px] font-semibold tracking-[-0.005em] transition-all hover:border-orange-500/40 hover:bg-orange-500/[0.04]"
                >
                  <span className="text-xl">{t.emoji}</span>
                  {t.label}
                </motion.button>
              ))}
            </div>

            <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Or tell COYL what happened</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ate the whole pint. Ignored weigh-in. Missed workout."
                className="min-h-[60px] w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/60"
              />
              <button
                onClick={() => submit('other', notes)}
                disabled={!notes.trim()}
                className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-orange-400 transition-opacity hover:text-orange-300 disabled:opacity-40"
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
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3.5">
        <div>
          <h1 className="text-[13px] font-semibold tracking-[-0.01em]">Slip recovery</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground">{trigger}</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> Log another
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl">
          {loading && !response && (
            <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-5 py-5 text-center">
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="mb-1.5 text-[13px] font-semibold tracking-[-0.005em] text-orange-400"
              >
                Building your next move…
              </motion.div>
              <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground">No shame. Just next move.</p>
            </div>
          )}

          {response && <StructuredResponse text={response} accentColor="orange" />}

          {!loading && response && (
            <div className="mt-5">
              <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-orange-500">Stabilize — tap when done</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                {stabilizeActions.map((a) => {
                  const done = !!stabilizeDone[a.key]
                  return (
                    <button
                      key={a.key}
                      onClick={() => setStabilizeDone((s) => ({ ...s, [a.key]: !s[a.key] }))}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-[12px] font-semibold transition-all ${
                        done
                          ? 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-400'
                          : 'border-white/[0.08] bg-white/[0.02] text-foreground/90 hover:bg-white/[0.05]'
                      }`}
                    >
                      {done ? <span className="text-[15px]">✓</span> : <a.icon className="h-3.5 w-3.5" />}
                      {a.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <Link
                  href="/today"
                  className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-warm px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_18px_-4px_rgba(255,102,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-shadow hover:shadow-[0_0_28px_-4px_rgba(255,102,0,0.6)]"
                >
                  Back to today <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/commitments"
                  className="flex items-center justify-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-white/[0.05]"
                >
                  Set tomorrow&apos;s rule
                </Link>
              </div>

              {/* "I'm back" share chip — only shows once all three stabilize
                  actions are tapped. That gate matters: we don't want people
                  broadcasting "I recovered" before they actually did the
                  stabilizing work. The chip is the reward for follow-through. */}
              {allStabilizeDone && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-4 flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/[0.04] px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold tracking-[-0.005em] text-emerald-400">You stabilized. You&rsquo;re back.</p>
                    <p className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                      Streak preserved: {currentStreak}d &middot; share if it helps someone else
                    </p>
                  </div>
                  <ShareMoment
                    userId={userId}
                    moment="recovery"
                    shareText="I slipped. COYL caught me. I'm back."
                    label="Share"
                    variant="solid"
                  />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <PaywallDialog open={paywallOpen} onClose={() => setPaywallOpen(false)} trigger="recovery" defaultTier="core" />
    </PageTransition>
  )
}
