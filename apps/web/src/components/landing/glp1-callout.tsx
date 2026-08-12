'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

/**
 * GLP-1 / Rebound callout band — the money-path beat on the homepage.
 *
 * Restored to the homepage Aug 2026 per the consumer-vortex recut:
 * Rebound leads the money path ($29/mo GLP-1 maintenance), the audit
 * is the fun top-of-funnel. This band sits right after the proof strip
 * — the visitor has just seen the timing moat; this is the "and if
 * you're on the drug, this is the version built for you" beat.
 *
 * History: the original version of this band was styled for the old
 * dark homepage (white text, #0a0a0a ring offsets) and linked to
 * /glp1, a route that no longer exists. Recut into the settled cream
 * editorial language (same card idiom as the PMPM calculator:
 * orange-hairline border, orange-50 wash) and pointed at /rebound.
 *
 * Copy discipline: no detect/sense/predict claims (honesty reframe,
 * commit b135795). The mechanism is "fires at the windows you name,
 * learns as you check in."
 */
export function Glp1Callout() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:px-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white px-6 py-8 md:px-10 md:py-10"
      >
        <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-red-500"
              />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-orange-600">
                On Ozempic, Wegovy, or Mounjaro?
              </span>
            </div>

            <h2 className="font-serif text-3xl font-normal leading-[1.08] tracking-[-0.02em] text-gray-900 md:text-4xl">
              The shot suppresses appetite.{' '}
              <span className="italic text-orange-600">
                Rebound holds the loss after it ends.
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-base leading-[1.7] text-gray-600 md:text-lg">
              The 9 PM kitchen. The stress-eat. The &ldquo;I deserve
              this&rdquo; &mdash; those scripts are still running under
              the drug. Rebound fires at the windows you name and trains
              the interrupt while you&rsquo;re on it, so it&rsquo;s
              muscle memory when you&rsquo;re off.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3">
            <Link
              href="/rebound"
              className="group/btn inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_-8px_rgba(255,102,0,0.4)] transition-all hover:bg-orange-600"
            >
              See Rebound
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </Link>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">
              $29/mo &middot; GLP-1 maintenance
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
