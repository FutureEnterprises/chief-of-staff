'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): serif display H2 + ordinal
 *     mono numerals as editorial chapter markers.
 *   - c763837b-8389-4246-a070-87ff79e8ae0b (Cluely): refined serif headline
 *     paired with calm sans body, single accent on the highlight word.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): three column
 *     editorial composition with hairline rules instead of card chrome.
 */

import { motion } from 'motion/react'
import Link from 'next/link'
import { Eye, Zap, Heart } from 'lucide-react'

/**
 * Three-step "How COYL works" section.
 *
 * Audit gap: cold-traffic visitors couldn't answer "what does this thing
 * actually do?" in 5 seconds. The interactive RescueDemo and the live
 * example are great BUT they require interaction or scroll-attention.
 * This strip is the scannable, no-interaction-required answer.
 *
 * Detect → Interrupt → Continue is the product loop in three words.
 * Lucide icons (Eye / Zap / Heart) are deliberate:
 *   • Eye    = pattern detection, watching the script
 *   • Zap    = interrupt, the moment of intervention
 *   • Heart  = recovery, no shame, continuation
 *
 * No fake stats, no testimonials, no app-store badges. Just the three
 * verbs that describe the entire product.
 */
export function HowItWorksStrip() {
  const steps = [
    {
      n: '01',
      title: 'Detect',
      Icon: Eye,
      body: 'COYL learns your danger windows, your excuse patterns, and your failure sequences. The shape of your autopilot before you see it.',
    },
    {
      n: '02',
      title: 'Interrupt',
      Icon: Zap,
      body: 'At the exact moment the script is about to run, a 30-second voice-matched intervention. Not motivation. Not a coach. Pattern recognition in your own voice.',
    },
    {
      n: '03',
      title: 'Continue',
      Icon: Heart,
      body: 'Built for bad days, not perfect users. Slip, log it, move on. No Monday reset. No streak break. Same-night re-entry.',
    },
  ]

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-32 md:py-40 md:px-12">
      <div className="mb-8 flex items-center gap-3">
        <span className="h-px w-10 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          How COYL works
        </span>
      </div>

      <h2 className="mb-8 max-w-3xl font-serif text-5xl font-normal leading-[1.04] tracking-[-0.02em] text-gray-900 md:text-7xl">
        Three steps.<br />
        <span className="italic text-orange-600">No restart, no shame, no streaks to protect.</span>
      </h2>
      <p className="mb-20 max-w-2xl text-lg leading-[1.7] text-gray-600">
        The entire product is a loop the visitor can hold in their head: catch the script, interrupt
        the moment, continue without punishment. Everything else is plumbing.
      </p>

      <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-gray-200 pt-8"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                {s.n}
              </span>
              <s.Icon className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="mb-4 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900">{s.title}</h3>
            <p className="text-base leading-[1.7] text-gray-600">{s.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 flex flex-wrap gap-4">
        <Link
          href="/how-it-works"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
        >
          See the full loop
        </Link>
        <Link
          href="/sign-up?ref=how-it-works"
          className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600"
        >
          Start free
        </Link>
      </div>
    </section>
  )
}
