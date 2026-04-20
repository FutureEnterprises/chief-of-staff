'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function PatternIntelligence() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const patterns = [
    'You fail Sunday nights.',
    'You quit after one mistake.',
    'You delay with "tomorrow."',
  ]

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Pattern intelligence
        </h2>
        <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          It remembers what you<br />keep repeating.
        </h3>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {patterns.map((p, i) => (
          <motion.div
            key={p}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
            className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent p-6"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-orange-500">
              Pattern {String(i + 1).padStart(2, '0')}
            </p>
            <p className="mt-3 text-lg font-bold text-white">{p}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-10 text-center text-xl font-bold text-white md:text-2xl"
      >
        It doesn&apos;t just track you.{' '}
        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          It exposes you.
        </span>
      </motion.p>
    </section>
  )
}
