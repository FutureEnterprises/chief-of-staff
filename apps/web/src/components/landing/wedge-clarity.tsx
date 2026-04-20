'use client'

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function WedgeClarity() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const startsWith = ['Late-night eating', 'Weekend spirals', '"I already blew it" thinking']
  const expandsTo = ['Cravings', 'Habits', 'Procrastination', 'Spending']

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Wedge
        </h2>
        <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Built first for <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">weight loss</span>.
        </h3>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="rounded-2xl border border-white/5 bg-white/5 p-6"
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">COYL starts with</p>
          <ul className="space-y-3 text-base text-gray-200">
            {startsWith.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-6"
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Then expands to</p>
          <ul className="grid grid-cols-2 gap-3 text-base text-gray-200">
            {expandsTo.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <Link
          href="/weight-loss"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300"
        >
          See the weight-loss wedge →
        </Link>
      </motion.div>
    </section>
  )
}
