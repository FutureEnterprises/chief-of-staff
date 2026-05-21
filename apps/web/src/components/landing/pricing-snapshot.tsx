'use client'

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

/**
 * <PricingSnapshot /> — the four tiers in one tight band.
 *
 * Per the Refero synthesis (Linear, Vercel, Pipe): the homepage shows
 * pricing as a SNAPSHOT — names + numbers — and links to /pricing for
 * the full comparison. Full feature matrix on the homepage dilutes the
 * conversion path; this snapshot answers "is this affordable?" in one
 * scan and routes ready-to-buy visitors to the dedicated page.
 *
 * No toggle, no feature lists, no FAQ — those live at /pricing.
 */
export function PricingSnapshot() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      cadence: 'forever',
      hook: 'Audit + 1 behavior loop.',
    },
    {
      name: 'Core',
      price: '$9.99',
      cadence: '/mo',
      hook: 'Interrupt. Recover. Repeat.',
    },
    {
      name: 'GLP-1',
      price: '$19.99',
      cadence: '/mo',
      hook: 'Weight maintenance + rebound coverage.',
      featured: true,
    },
    {
      name: 'Teams',
      price: '$5–$15',
      cadence: '/PMPM',
      hook: 'Clinics + employers.',
    },
  ]

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
        className="mb-12 max-w-3xl"
      >
        <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
          <span className="h-px w-8 bg-orange-600" />
          Pricing
        </p>
        <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-5xl">
          Free audit to start.<br />
          <span className="text-orange-600">$9.99 when you mean it.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
            className={`rounded-2xl border p-5 ${
              t.featured
                ? 'border-orange-300 bg-orange-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">
              {t.name}
            </p>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900 tabular-nums">{t.price}</span>
              <span className="text-xs text-gray-500">{t.cadence}</span>
            </p>
            <p className="mt-3 text-xs text-gray-600">{t.hook}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 underline-offset-4 hover:underline"
        >
          Full pricing &rarr;
        </Link>
        <span className="text-gray-400">&middot;</span>
        <p className="text-sm text-gray-600">
          Annual saves ~17%. Cancel anytime. No card for Free.
        </p>
      </motion.div>
    </section>
  )
}
