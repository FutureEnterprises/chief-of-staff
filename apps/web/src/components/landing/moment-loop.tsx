'use client'

/**
 * MomentLoop — the visible product loop above the fold.
 *
 * Per the May 2026 full-site audit: the homepage doesn't demonstrate
 * the intelligence; it explains it. The audit's exact prescription was
 * a visible loop animation showing real micro-moments — not abstract
 * diagrams. This is that.
 *
 * Plays a four-beat sequence on a continuous loop:
 *
 *   1. Time + scene set    — "11:42 PM. Saturday."
 *   2. Internal script     — "One snack won't matter."
 *   3. Interrupt           — "This is where tomorrow gets damaged."
 *   4. Resolution          — "Paused. Didn't fold."
 *
 * Each beat fades in over 800ms, holds for 1.6s, then the next beat
 * appears beneath it (the prior beats stay visible — cumulative
 * stack). After the resolution holds for 3s the whole sequence
 * resets and replays.
 *
 * Visual language is the dark cinematic treatment the audit called
 * for: warm charcoal panel, deep shadows, single orange accent on
 * the interrupt line, monospace timestamp.
 *
 * Respects prefers-reduced-motion via motion/react's auto-handling.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

type Beat = {
  who: 'time' | 'you' | 'coyl' | 'resolution'
  label?: string
  body: string
}

const BEATS: Beat[] = [
  { who: 'time', body: '11:42 PM. Saturday.' },
  { who: 'you', label: 'You', body: '“One snack won’t matter.”' },
  {
    who: 'coyl',
    label: 'COYL',
    body: 'This is where tomorrow gets damaged.',
  },
  { who: 'resolution', body: 'Paused. Didn’t fold.' },
]

// Per-beat hold (ms) before the next one appears.
const BEAT_DURATION_MS = 1700
// Pause at the end of the full sequence before the loop resets.
const LOOP_RESET_PAUSE_MS = 3200

export function MomentLoop() {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    if (revealed >= BEATS.length) {
      const reset = setTimeout(() => setRevealed(0), LOOP_RESET_PAUSE_MS)
      return () => clearTimeout(reset)
    }
    const next = setTimeout(() => setRevealed((n) => n + 1), BEAT_DURATION_MS)
    return () => clearTimeout(next)
  }, [revealed])

  return (
    <div className="relative w-full max-w-md">
      {/* Ambient warm radial glow behind the card — the "warmth pocket"
          that gives the dark panel atmosphere rather than just shadow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] opacity-90 blur-3xl"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, rgba(255, 138, 76, 0.30) 0%, rgba(255, 102, 0, 0.12) 45%, transparent 75%)',
        }}
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111010] p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5),0_10px_30px_-10px_rgba(255,102,0,0.18)] md:p-7">
        {/* Card chrome — live indicator + scene caption */}
        <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(255,102,0,0.8)]"
            />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-orange-400">
              Autopilot detected
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
            Live
          </span>
        </div>

        {/* Beat stack — each beat slides in beneath the prior. */}
        <div className="min-h-[268px] space-y-3">
          <AnimatePresence>
            {BEATS.slice(0, revealed).map((beat, i) => (
              <motion.div
                key={`${revealed}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={beatStyles(beat.who)}
              >
                {beat.label && (
                  <p
                    className={`mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] ${beatLabelColor(beat.who)}`}
                  >
                    {beat.label}
                  </p>
                )}
                <p
                  className={
                    beat.who === 'time'
                      ? 'font-mono text-[11px] uppercase tracking-[0.32em] text-gray-400'
                      : beat.who === 'coyl'
                        ? 'font-serif text-lg italic leading-snug text-orange-300 md:text-xl'
                        : beat.who === 'resolution'
                          ? 'font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400'
                          : 'text-base leading-relaxed text-[#f5efe6]'
                  }
                >
                  {beat.body}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer brand line */}
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">
            The 3-second window
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-500">
            coyl.ai
          </span>
        </div>
      </div>
    </div>
  )
}

function beatStyles(who: Beat['who']): string {
  switch (who) {
    case 'time':
      return 'border-l-2 border-gray-700 pl-3'
    case 'you':
      return 'rounded-lg border border-white/[0.06] bg-white/[0.02] p-3'
    case 'coyl':
      return 'rounded-lg border border-orange-500/30 bg-orange-500/[0.06] p-3 shadow-[0_0_24px_-6px_rgba(255,102,0,0.35)]'
    case 'resolution':
      return 'flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-3'
  }
}

function beatLabelColor(who: Beat['who']): string {
  if (who === 'coyl') return 'text-orange-400'
  return 'text-gray-500'
}
