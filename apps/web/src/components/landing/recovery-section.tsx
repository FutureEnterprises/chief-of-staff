'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function RecoverySection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Recovery
        </h2>
        <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Built for <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">bad days</span>.
        </h3>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8 max-w-2xl text-lg text-gray-400"
      >
        Most apps punish you.
      </motion.p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { emoji: '🎯', label: 'Catches the slip' },
          { emoji: '🛑', label: 'Stops the spiral' },
          { emoji: '↻', label: 'Resets instantly' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-5"
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-sm font-semibold text-white">COYL {item.label.toLowerCase()}.</span>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-10 text-center text-2xl font-black text-white md:text-3xl"
      >
        No restart.{' '}
        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          Just continue.
        </span>
      </motion.p>
    </section>
  )
}
