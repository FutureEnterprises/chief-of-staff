'use client'

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

/**
 * Wedge section \u2014 "Built first for weight loss."
 *
 * V4 spec (COYL_homepage_v4.md \u00a7WEDGE) wants this SHORT. Weight-loss
 * triggers on the left as a vertical list, ONE line on the right to
 * broaden. No 4-column grid, no card explanations, no tag rows. Less
 * text = sharper wedge.
 */

const START_HERE = [
  'Late-night eating',
  'Weekend collapse',
  '"I already blew it"',
] as const

export function UniversalWedges() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-4xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-10"
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

      {/* V4 one-liner expansion \u2014 no bulleted list. One sentence. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8 text-lg font-semibold text-gray-400"
      >
        Also works for anything you keep sabotaging.
      </motion.p>

      {/* Quiet research footer, kept tiny per v4 "don't try to prove science" */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-10 text-xs text-gray-500"
      >
        Built on real behavioral research.{' '}
        <Link href="/science" className="text-orange-400 hover:underline">
          The research \u2192
        </Link>
      </motion.p>
    </section>
  )
}
