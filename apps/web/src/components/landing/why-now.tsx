'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): "Why now" framed as an
 *     editorial three-column spread; serif display H3, mono ordinal pillars.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): pillars set as hairline-ruled
 *     columns rather than soft cards.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     pillar headers in serif, body in calm sans.
 */

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

/**
 * <WhyNow /> — homepage section 7, the category-arrival beat.
 *
 * Per the May 2026 virality dispatch: "AI is leaving the prompt box"
 * is the press-grade framing. This section names the three forces
 * that arrived together and made COYL possible — without them, this
 * category couldn't exist. With them, it's inevitable.
 *
 * Three pillars, not four. The strategist's exact list:
 *   1. LLMs / models that understand patterns
 *   2. Edge devices that are always with you
 *   3. Behavioral timing as a science (JITAI, dual-process, etc.)
 *
 * Visually: clean three-column band, big heading, no scroll fatigue.
 * Designed to read in 15 seconds.
 */
export function WhyNow() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const pillars = [
    {
      n: '01',
      title: 'Models that understand patterns',
      body: 'LLMs that can read a user model, a danger window, and the exact excuse you tell yourself — and respond in real human language inside 200 milliseconds.',
    },
    {
      n: '02',
      title: 'Edge devices that are always there',
      body: 'Watch on wrist. Phone in pocket. Earbuds in ear. Push that lands in the half-second before the gesture completes. Three years ago this was sci-fi; today it ships.',
    },
    {
      n: '03',
      title: 'Behavioral timing as a science',
      body: 'JITAI research, dual-process theory, identity-based-habit work, recovery psychology — twenty years of academic groundwork finally productizable for consumers.',
    },
  ]

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-40 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="mb-16"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Why now
          </span>
        </div>

        <h3 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-7xl">
          AI is leaving<br />
          <span className="italic text-orange-600">the prompt box.</span>
        </h3>

        <p className="mt-8 max-w-2xl text-lg leading-[1.7] text-gray-600">
          For the first time, three things arrived at once. Each alone is
          interesting. Together they enable a category that couldn&rsquo;t
          have existed five years ago.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {pillars.map((p, i) => (
          <motion.div
            key={p.n}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.12 * i, duration: 0.5 }}
            className="border-t border-gray-200 pt-6"
          >
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">{p.n}</p>
            <h4 className="mt-5 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.015em] text-gray-900 md:text-[1.625rem]">
              {p.title}
            </h4>
            <p className="mt-4 text-base leading-[1.7] text-gray-600">
              {p.body}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-16 max-w-3xl font-serif text-2xl font-normal italic leading-[1.4] text-gray-900 md:text-3xl"
      >
        Together they enable something that has never existed: a system
        that knows you are about to fold and is positioned to say
        something useful in the tiny window where saying something
        useful changes the outcome.
      </motion.p>
    </section>
  )
}
