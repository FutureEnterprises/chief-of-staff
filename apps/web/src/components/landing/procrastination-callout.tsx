'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

/**
 * Procrastination callout band — paired with Glp1Callout on the homepage
 * so the two primary verticals (weight + work) get equal visual weight.
 *
 * The wedge ultrathink (May 2026): COYL had been over-indexing on weight.
 * Brand says "any compulsive behavior" — surfaces said "weight loss app
 * that also does other things." Adding this band rebalances. Users on
 * Ozempic see the GLP-1 band; users searching "stop procrastinating"
 * see this band; both see the same product.
 *
 * Visual rhythm matches Glp1Callout exactly (pulsing dot, gradient bg,
 * single CTA + secondary mailto-style email) so the homepage reads as
 * "two equal verticals" not "one main thing + one secondary thing."
 */
export function ProcrastinationCallout() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="group relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-amber-500/[0.05] via-orange-500/[0.03] to-transparent px-6 py-7 md:px-10 md:py-9"
      >
        {/* Cooler corner glow than the GLP-1 band — amber/yellow instead of
            red — so the two callouts have distinct visual identities while
            sharing the same structural pattern. */}
        <div
          className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.35), transparent 70%)' }}
        />

        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-amber-400"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-300">
                Workplace + focus?
              </span>
            </div>

            <h2 className="text-2xl font-black leading-tight text-white md:text-3xl">
              You don&rsquo;t have a focus problem.{' '}
              <span className="text-orange-400">
                You have a 30-second tab-switch problem.
              </span>
            </h2>

            <p className="mt-3 max-w-xl text-sm text-gray-400 md:text-base">
              The tab switch happens in half a second. The recovery from it costs 23 minutes —
              if you ever actually recover. COYL fires before the gesture completes, not after
              the deep-work block is already dead.
            </p>
          </div>

          <Link
            href="/procrastination"
            className="group/btn inline-flex shrink-0 items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/[0.08] px-5 py-3 text-sm font-bold text-orange-200 transition-all duration-200 hover:border-orange-500/60 hover:bg-orange-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          >
            See the focus wedge
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
