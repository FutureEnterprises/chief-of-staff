'use client'

/**
 * LUXURY EDITORIAL — May 2026 blueprint collapse.
 *
 * The homepage snapshot now mirrors the single-tier collapse on /pricing:
 * two tiers only (Free, Core $12). The prior four-tier band (Free/Core/GLP-1/Teams)
 * was strategy-shopping disguised as transparency — it gave the visitor four
 * decisions when they needed one.
 *
 * Pull-line: "less than one bad night" — it reframes the $12 as
 * comparative, not absolute. The bad night you already bought once this
 * month cost more than the year of the interrupt.
 */

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

/**
 * <PricingSnapshot /> — the two consumer tiers in one tight editorial band.
 *
 * No toggle, no feature lists, no FAQ — those live at /pricing. The job
 * of the snapshot is to answer "is this affordable?" in one scan and
 * route the ready-to-buy visitor to the dedicated page.
 */
export function PricingSnapshot() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      cadence: 'forever',
      hook: 'Audit + archetype + 3 interrupts a week.',
    },
    {
      name: 'Core',
      price: '$12',
      cadence: '/mo',
      hook: 'Everything. Cancel anytime.',
      featured: true,
    },
  ]

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-32 md:py-40 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
        className="mb-16 max-w-3xl"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Pricing
          </span>
        </div>
        <h2 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-6xl">
          Free to try.<br />
          <span className="italic text-orange-600">Less than one bad night.</span>
        </h2>
        <p className="mt-6 max-w-xl text-base leading-[1.65] text-gray-600">
          One paid tier. $12 a month, or $99 a year as a commitment to yourself.
          That’s the whole price page.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
            className={`border-t pt-5 ${
              t.featured ? 'border-orange-500' : 'border-gray-200'
            }`}
          >
            <p className={`font-serif text-2xl font-normal leading-[1.1] tracking-[-0.01em] ${t.featured ? 'italic text-orange-600' : 'text-gray-900'}`}>
              {t.name}
            </p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="font-serif text-5xl font-normal tracking-[-0.02em] text-gray-900 tabular-nums">{t.price}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">{t.cadence}</span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-[1.6] text-gray-600">{t.hook}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-16 flex flex-wrap items-center gap-3"
      >
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 underline-offset-4 hover:underline"
        >
          Full pricing &rarr;
        </Link>
        <span className="text-gray-400">&middot;</span>
        <p className="text-sm text-gray-600">
          Annual $99 — commit to the year. Cancel monthly anytime. No card for Free.
        </p>
      </motion.div>
    </section>
  )
}
