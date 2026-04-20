'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

/**
 * "This is for you if..." section.
 *
 * The three hook lines are lifted verbatim from the spec's First 1000 Users
 * content strategy. They're the content-hook bridges between TikTok/Reels/
 * Reddit ads and the product itself \u2014 the exact sentences that make a
 * cold visitor say "wait, that's me."
 *
 * Rendered as three stacked quote cards with a hard closer. No CTA here \u2014
 * the surrounding landing already has CTAs above and below; this section
 * is pure recognition.
 */

const HOOKS = [
  {
    line: 'You\u2019re not hungry. You\u2019re running a script.',
    context: 'Late-night kitchen. Stress-eating. "I deserve this."',
  },
  {
    line: 'Most diets die at 9 PM.',
    context: 'Not at lunch. Not on the scale. In the autopilot window.',
  },
  {
    line: 'One bad meal doesn\u2019t kill your progress. The spiral does.',
    context: '"I already blew it" is how one slip becomes a week.',
  },
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
        <h3 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          You already know<br />
          <span className="text-orange-400">what this is about.</span>
        </h3>
      </motion.div>

      <div className="space-y-4">
        {HOOKS.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.5 }}
            className="relative rounded-2xl border-l-[3px] border-orange-500/50 bg-gradient-to-r from-orange-500/5 to-transparent p-5 md:p-6"
          >
            <p className="text-xl font-bold leading-snug text-white md:text-2xl">
              {h.line}
            </p>
            <p className="mt-2 text-sm text-gray-400">{h.context}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-10 text-base font-bold text-gray-300"
      >
        If one of those made you pause, you\u2019re in the right place.
      </motion.p>
    </section>
  )
}
