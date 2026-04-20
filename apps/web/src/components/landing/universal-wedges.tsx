'use client'

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

/**
 * Wedge section — "Built first for weight loss."
 *
 * v3 spec (COYL_homepage_v3_FINAL.md §WEDGE) calls for tight two-column
 * copy: what the wedge is, what it also works for. The previous 6-card
 * grid explained too much. This section's job is reassurance, not
 * education \u2014 a weight-loss visitor should feel anchored, and a
 * non-weight-loss visitor should feel "this works for me too" without
 * a 1,200-word detour.
 */

// GODFILE \u00a74: Work is now a first-class wedge alongside weight loss.
// Still surfaced here as part of the "also works for" expansion so the
// single-wedge focus of weight loss stays primary on the homepage.
const OTHER_WEDGES = [
  'work follow-up (the emails you don\u2019t send)',
  'cravings',
  'procrastination',
  'anything you keep sabotaging',
] as const

const START_HERE = [
  'Late-night eating',
  'Weekend spirals',
  '"I already blew it"',
] as const

export function UniversalWedges() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-12 max-w-3xl"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          The wedge
        </h2>
        <h3 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          Built first for<br />
          <span className="text-orange-400">weight loss.</span>
        </h3>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Left — the primary wedge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="rounded-2xl border-l-[3px] border-orange-500/60 bg-gradient-to-r from-orange-500/5 to-transparent p-6"
        >
          <ul className="mb-5 space-y-2 text-xl font-bold leading-snug text-white md:text-2xl">
            {START_HERE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-base font-semibold text-gray-300">
            That&apos;s where this starts.
          </p>
        </motion.div>

        {/* Right — the broaden */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <p className="mb-4 text-sm text-gray-400">Then it works for:</p>
          <ul className="space-y-2 text-base leading-snug text-gray-200">
            {OTHER_WEDGES.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-orange-500">\u2014</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Science credibility lives on /science. Homepage stays emotional. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-10 max-w-3xl text-xs text-gray-500"
      >
        Built on real behavioral research. <Link href="/science" className="text-orange-400 hover:underline">The research \u2192</Link>
      </motion.p>
    </section>
  )
}
