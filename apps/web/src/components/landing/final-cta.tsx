'use client'

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function FinalCta() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-4xl px-6 py-32 text-center md:px-12">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl"
      >
        If one moment keeps{' '}
        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          ruining your week
        </span>,
        <br />
        start here.
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          href="/sign-up"
          className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-10 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(255,102,0,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(255,102,0,0.6)]"
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
        className="mt-6 text-xs text-gray-600"
      >
        No credit card. Cancel anytime.
      </motion.p>
    </section>
  )
}
