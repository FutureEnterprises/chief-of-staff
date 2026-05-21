'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): closing serif H2 with italic
 *     orange accent, gallery-grade negative space.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): final CTA reads as a single
 *     polished button on a quiet canvas, no gradient or glow.
 */

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function FinalCta() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-4xl px-6 py-40 text-center md:px-12">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="font-serif text-5xl font-normal leading-[1.04] tracking-[-0.02em] text-gray-900 md:text-7xl"
      >
        If one moment keeps{' '}
        <span className="italic text-orange-600">
          ruining your week
        </span>,
        <br />
        start here.
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-14 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          href="/sign-up"
          className="group relative flex items-center gap-2.5 rounded-full bg-orange-500 px-10 py-4 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,102,0,0.5)] transition-all hover:bg-orange-600 hover:shadow-[0_16px_42px_-10px_rgba(255,102,0,0.6)]"
        >
          Start free
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M1 8h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500"
      >
        No credit card. Cancel anytime.
      </motion.p>
    </section>
  )
}
