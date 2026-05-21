'use client'
/**
 * LUXURY EDITORIAL OVERHAUL — May 2026 (slip recovery, dark)
 * Refero references applied:
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): refined editorial
 *     restraint — cream serif on warm canvas reads as composure, not alarm.
 *   - 067fe2b3-9411-42b9-9ea4-39338344f66d (Liron Moran): monumental serif
 *     headline as the "you slipped" gesture; gallery whitespace.
 *   - c18d1c89-bb32-4a3c-bdc8-42d3355b8905 (DNA Capital): whispered
 *     authority — the recovery surface is "we continue," not "you failed."
 *   - 76c30104-1a19-42e7-a585-19505882f600 (Monopo Saigon): warm earthy
 *     dark tones, calm atmosphere over chrome.
 * Slip is the gentlest surface in the product. Serif gives the moment
 * dignity. Mono only for status labels. No theatrical emphasis.
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
      <PageTransition className="flex h-full flex-col bg-[#0e0d0b]">
        <header className="border-b border-white/[0.05] px-6 pb-8 pt-12 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-orange-500/70" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
                Slip recovery
              </p>
            </div>
            <h1 className="mt-4 font-serif text-4xl font-normal leading-[1.04] tracking-[-0.015em] text-[#f5f3ee] sm:text-5xl">
              You slipped.
              <br />
              <span className="text-[#f5f3ee]/80 italic">Good. Now we continue.</span>
            </h1>
            <p className="mt-4 max-w-xl font-sans text-[14px] leading-relaxed text-[#a39d92]">
              No Monday reset. No spiral. Pick what happened &mdash; COYL builds the next move in ten seconds.
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-12 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
              Name it
            </p>
            <div className="mb-12 grid grid-cols-1 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04]">
              {QUICK_TAGS.map((t, i) => (
                <motion.button
                  key={t.value}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => submit(t.value)}
                  className="group flex items-center gap-4 bg-[#0e0d0b] px-5 py-5 text-left transition-colors hover:bg-[#13110d]"
                >
                  <span className="text-2xl opacity-80">{t.emoji}</span>
                  <span className="font-serif text-[19px] font-normal leading-tight tracking-[-0.005em] text-[#f5f3ee] transition-colors group-hover:text-orange-300">
                    {t.label}.
                  </span>
                </motion.button>
              ))}
            </div>

            <div className="border-t border-white/[0.05] pt-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
                Or write it out
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ate the whole pint. Ignored weigh-in. Missed workout."
                className="min-h-[88px] w-full resize-none border-0 bg-transparent p-0 font-serif text-xl font-normal leading-snug tracking-[-0.005em] text-[#f5f3ee] outline-none placeholder:text-[#5f5a52] placeholder:italic"
              />
              <button
                onClick={() => submit('other', notes)}
                disabled={!notes.trim()}
                className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-400 transition-colors hover:text-orange-300 disabled:opacity-40"
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
    <PageTransition className="flex h-full flex-col bg-[#0e0d0b]">
      <header className="border-b border-white/[0.05] px-6 pb-8 pt-10 sm:px-10">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-orange-500/70" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
                Slip recovery &middot; {trigger}
              </p>
            </div>
            <h1 className="mt-4 font-serif text-3xl font-normal leading-[1.06] tracking-[-0.015em] text-[#f5f3ee] sm:text-4xl">
              Next move. Not Monday.
            </h1>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.20em] text-[#8a847a] transition-colors hover:text-[#f5f3ee]"
          >
            <RotateCcw className="h-3 w-3" /> Log another
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl">
          {loading && !response && (
            <div className="border-y border-orange-500/20 py-10 text-center">
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="font-serif text-2xl font-normal italic text-orange-300"
              >
                Building your next move&hellip;
              </motion.p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
                No shame. Just next move.
              </p>
            </div>
          )}

          {response && <StructuredResponse text={response} accentColor="orange" />}

          {!loading && response && (
            <div className="mt-8">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
                Stabilize &middot; tap when done
              </p>
              <div className="grid grid-cols-1 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04] sm:grid-cols-3">
                {stabilizeActions.map((a) => {
                  const done = !!stabilizeDone[a.key]
                  return (
                    <button
                      key={a.key}
                      onClick={() => setStabilizeDone((s) => ({ ...s, [a.key]: !s[a.key] }))}
                      className={`flex items-center gap-3 px-4 py-4 text-left transition-colors ${
                        done
                          ? 'bg-emerald-500/[0.08]'
                          : 'bg-[#0e0d0b] hover:bg-[#13110d]'
                      }`}
                    >
                      {done ? (
                        <span className="font-serif text-lg text-emerald-400">✓</span>
                      ) : (
                        <a.icon className="h-4 w-4 shrink-0 text-[#8a847a]" />
                      )}
                      <span
                        className={`font-serif text-base leading-snug ${
                          done ? 'text-emerald-300' : 'text-[#f5f3ee]'
                        }`}
                      >
                        {a.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04] sm:grid-cols-2">
                <Link
                  href="/today"
                  className="group bg-[#13110d] px-5 py-5 text-left transition-colors hover:bg-[#181510]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
                    Continue
                  </p>
                  <p className="mt-2 flex items-center gap-2 font-serif text-xl font-normal leading-tight text-[#f5f3ee]">
                    Back to today <ArrowRight className="h-4 w-4" />
                  </p>
                </Link>
                <Link
                  href="/commitments"
                  className="group bg-[#0e0d0b] px-5 py-5 text-left transition-colors hover:bg-[#13110d]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
                    Tomorrow
                  </p>
                  <p className="mt-2 font-serif text-xl font-normal leading-tight text-[#f5f3ee]">
                    Set tomorrow&rsquo;s rule.
                  </p>
                </Link>
              </div>

              {/* "I'm back" share — only after all three stabilize taps. */}
              {allStabilizeDone && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-10 border-y border-emerald-500/20 py-8"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
                    Stabilized
                  </p>
                  <div className="mt-3 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                    <div className="min-w-0">
                      <p className="font-serif text-2xl font-normal leading-snug tracking-[-0.01em] text-[#f5f3ee] sm:text-3xl">
                        You&rsquo;re back.
                      </p>
                      <p className="mt-1 font-mono text-[10px] tabular-nums uppercase tracking-[0.18em] text-[#8a847a]">
                        Streak preserved &middot; {currentStreak}d
                      </p>
                    </div>
                    <ShareMoment
                      userId={userId}
                      moment="recovery"
                      shareText="I slipped. COYL caught me. I'm back."
                      label="Share"
                      variant="solid"
                    />
                  </div>
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
