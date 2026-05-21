'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): editorial pricing snapshot,
 *     refined serif H2 + numbers set in serif as the price-display face.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): tier names in serif, hairline
 *     borders, the highlighted tier earns a single thin accent rule.
 *   - c763837b-8389-4246-a070-87ff79e8ae0b (Cluely): calm grid, generous breathing
 *     between tier columns.
 */

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
          Free audit to start.<br />
          <span className="italic text-orange-600">$9.99 when you mean it.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
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
              <span className="font-serif text-4xl font-normal tracking-[-0.02em] text-gray-900 tabular-nums">{t.price}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">{t.cadence}</span>
            </p>
            <p className="mt-4 text-sm leading-[1.6] text-gray-600">{t.hook}</p>
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
          Annual saves ~17%. Cancel anytime. No card for Free.
        </p>
      </motion.div>
    </section>
  )
}
