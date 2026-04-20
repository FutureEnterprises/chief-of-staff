'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

/**
 * "This is for you if..." section.
 *
 * V4 spec (COYL_homepage_v4.md §"THIS IS FOR YOU") \u2014 four recognition
 * bullets that a visitor can check themselves against, followed by the
 * "This isn't random. It's a pattern." close. Pure recognition, no CTA.
 * The bullets are the exact content-hook bridges from ads to product.
 */

const BULLETS = [
  'You restart every Monday.',
  'You do well\u2026 then suddenly don\u2019t.',
  'You know what to do but don\u2019t do it.',
  'You disappear after one bad day.',
]

export function YouIf() {
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
          This is for you if
        </h2>
      </motion.div>

      <div className="space-y-3">
        {BULLETS.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.45 }}
            className="rounded-2xl border-l-[3px] border-orange-500/60 bg-orange-500/5 px-5 py-4 text-xl font-bold leading-snug text-white md:text-2xl"
          >
            {line}
          </motion.p>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-10 text-lg font-bold leading-tight text-white md:text-2xl"
      >
        This isn\u2019t random.<br />
        <span className="text-orange-400">It\u2019s a pattern.</span>
      </motion.p>
    </section>
  )
}
