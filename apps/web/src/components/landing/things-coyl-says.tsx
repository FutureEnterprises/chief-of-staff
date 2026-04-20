'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

/**
 * "Things COYL says to people." \u2014 the viral-screenshot section.
 *
 * Four punchy quotable lines, each in its own big card. Purpose-built
 * to be screenshotted and shared on Twitter / TikTok / group chats.
 * No CTA, no explanation. Just the lines.
 *
 * Reviewer note (added after v4): "You need ONE viral screenshot moment
 * \u2014 this is what spreads."
 */

const LINES = [
  'You don\u2019t want the food. You want the feeling.',
  'You\u2019re not confused. You\u2019re avoiding.',
  'This is where you always lose.',
  'You already know what happens next.',
] as const

export function ThingsCoylSays() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

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
          Things COYL says to people
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {LINES.map((line, i) => (
          <motion.figure
            key={line}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.45 }}
            className="relative flex min-h-[180px] flex-col justify-between rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] via-orange-500/[0.02] to-transparent p-6 md:p-7"
          >
            <blockquote className="text-xl font-black leading-snug text-white md:text-2xl">
              &ldquo;{line}&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-[10px] font-mono uppercase tracking-widest text-orange-500">
              \u2014 COYL
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}
