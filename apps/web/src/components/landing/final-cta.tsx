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
          href="/audit?ref=final-cta"
          className="group relative flex items-center gap-2.5 rounded-full bg-orange-500 px-10 py-4 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,102,0,0.5)] transition-all hover:bg-orange-600 hover:shadow-[0_16px_42px_-10px_rgba(255,102,0,0.6)]"
        >
          Take the audit
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M1 8h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* iOS app CTA — no public App Store link yet (launching on
            TestFlight), so this routes to the waitlist with honest
            "coming to the App Store" framing rather than a dead link. */}
        <Link
          href="/waitlist"
          className="group flex items-center gap-2.5 rounded-full border border-gray-300 bg-white px-9 py-4 text-base font-semibold text-gray-900 transition-all hover:border-gray-900"
        >
          <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden className="-ml-0.5">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          Get the iPhone app
          <span className="ml-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
            Soon
          </span>
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500"
      >
        No signup for the audit. Invite waves for the app.
      </motion.p>
    </section>
  )
}
