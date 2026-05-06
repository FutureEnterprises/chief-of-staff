'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

/**
 * Teams (workplace + employer B2B) callout band.
 *
 * Third in the homepage callout sequence after Glp1Callout and
 * ProcrastinationCallout. Per the May 2026 wedge ultrathink: workplace
 * productivity is the second co-equal vertical, and the B2B-employer
 * channel is its highest-leverage GTM. /procrastination is the
 * consumer-side surface; /teams is the buyer-facing one.
 *
 * Visual rhythm matches the other two callouts (pulsing dot, gradient
 * bg, single CTA + hint) but tinted blue instead of red/amber so the
 * three callouts have distinct identities while sharing structure.
 * Blue reads as "B2B / professional" without being cold.
 */
export function TeamsCallout() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="group relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.05] via-orange-500/[0.03] to-transparent px-6 py-7 md:px-10 md:py-9"
      >
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%)' }}
        />

        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-blue-400"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-300">
                Running a team?
              </span>
            </div>

            <h2 className="text-2xl font-black leading-tight text-white md:text-3xl">
              Your team loses 23 minutes per interrupt.{' '}
              <span className="text-orange-400">
                COYL fires before the tab switch.
              </span>
            </h2>

            <p className="mt-3 max-w-xl text-sm text-gray-400 md:text-base">
              Knowledge workers are interrupted every 11 minutes. Recovery costs 23. One third of
              every working week is spent recovering, not working. PMPM pricing. 30-day pilot.
              Privacy-first by architecture &mdash; we never read your team&rsquo;s work content.
            </p>
          </div>

          <Link
            href="/teams"
            className="group/btn inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/[0.08] px-5 py-3 text-sm font-bold text-blue-200 transition-all duration-200 hover:border-blue-500/60 hover:bg-blue-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          >
            See COYL for teams
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
