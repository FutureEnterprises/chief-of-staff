'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function LiveExample() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-32 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Live example
        </h2>
        <h3 className="max-w-2xl text-3xl font-bold tracking-tight text-white md:text-5xl">
          This is where most people lose.
        </h3>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Moment */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="overflow-hidden rounded-2xl border border-white/5 p-6"
          style={{ background: 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(15,15,15,0.8))' }}
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-gray-500">The moment</p>
          <p className="mb-1 text-sm text-gray-400">Friday night.</p>
          <p className="mb-5 text-lg font-semibold text-white">You already ate off-plan.</p>

          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="mb-1 text-[11px] font-mono uppercase tracking-widest text-red-400">You think</p>
            <p className="text-lg font-bold text-white">&ldquo;I&apos;ll restart Monday.&rdquo;</p>
          </div>
        </motion.div>

        {/* COYL response */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="overflow-hidden rounded-2xl border border-orange-500/30 p-6 shadow-[0_0_30px_-10px_rgba(255,102,0,0.5)]"
          style={{ background: 'linear-gradient(145deg, rgba(255,102,0,0.08), rgba(15,15,15,0.9))' }}
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-orange-500">COYL says</p>
          <div className="space-y-4">
            <p className="text-lg font-semibold leading-snug text-white">This is your pattern.</p>
            <p className="text-sm leading-relaxed text-gray-300">
              One slip <span className="text-orange-400">→</span> full weekend collapse.
            </p>
            <div className="rounded-lg bg-black/40 px-4 py-3">
              <p className="text-base font-bold text-orange-400">Fix the next meal.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Outcome row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
      >
        {['No spiral.', 'No restart.', 'No shame loop.'].map((t, i) => (
          <div key={t} className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-5 py-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-sm font-semibold text-emerald-300">{t}</span>
            {i < 2 && null}
          </div>
        ))}
      </motion.div>
    </section>
  )
}
