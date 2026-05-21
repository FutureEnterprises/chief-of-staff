'use client'

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
    <section className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="mb-12 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
          How COYL works
        </span>
      </div>

      <h2 className="mb-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-6xl">
        Three steps.<br />
        <span className="text-orange-600">No restart, no shame, no streaks to protect.</span>
      </h2>
      <p className="mb-16 max-w-2xl text-lg text-gray-600">
        The entire product is a loop the visitor can hold in their head: catch the script, interrupt
        the moment, continue without punishment. Everything else is plumbing.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white/[0.03] to-transparent p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-orange-600 tracking-widest">
                {s.n}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-100 text-orange-600">
                <s.Icon className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mb-3 text-2xl font-black text-gray-900">{s.title}</h3>
            <p className="text-base leading-relaxed text-gray-600">{s.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/how-it-works"
          className="rounded-full border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-orange-500/40 hover:text-gray-900"
        >
          See the full loop
        </Link>
        <Link
          href="/sign-up?ref=how-it-works"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)]"
        >
          Start free
        </Link>
      </div>
    </section>
  )
}
