'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): editorial proof composition
 *     with refined serif H2 + restrained accent on the moat claim.
 *   - b501d608-f10c-490c-8e88-a48a557603db (Public): magazine-grade comparison
 *     row with hairline borders, fine mono headers, gallery breathing room.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): single decisive accent on
 *     COYL's row; everything else stays monochrome editorial.
 */

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { Check, X } from 'lucide-react'

/**
 * <ProofStrip /> — three proof beats in one disciplined section.
 *
 * Replaces what used to be three full sections (ComparisonTable +
 * RecoverySection + portions of BrandStatement). Per the Refero
 * synthesis: award-winning SaaS pages don't repeat the same proof
 * three times across three full-bleed sections. They cluster it in
 * one tight, scannable strip and move on.
 *
 * Three sub-blocks:
 *   1. Comparison vs the competitive set (Noom / Calm / EAP / habit
 *      trackers) — one row each, three columns: timing / shame UX /
 *      price. The wins are all on ONE column (timing) — that's the
 *      moat made visible.
 *   2. Clinical study one-liner — links to /clinical-study.
 *   3. Recovery promise — single sentence, no card decoration.
 */
export function ProofStrip() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const comparison = [
    {
      product: 'COYL',
      timing: 'Fires at the 3-second window',
      shame: 'Recovery engine · no Monday reset',
      price: 'Free · $12 · $29 (Rebound)',
      highlight: true,
    },
    {
      product: 'Noom',
      timing: 'Daily lesson, hours after',
      shame: 'Streak resets on slip',
      price: '$60/mo',
    },
    {
      product: 'Calm / Headspace',
      timing: 'Meditation, decoupled from the moment',
      shame: 'Daily-use guilt loop',
      price: '$70/yr',
    },
    {
      product: 'EAP',
      timing: 'Phone call, hours-days later',
      shame: '3–6% utilization',
      price: '$2/PEPM',
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
            The proof
          </span>
        </div>
        <h2 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-6xl">
          We fight for the 3 seconds<br />
          <span className="italic text-orange-600">nobody else fights for.</span>
        </h2>
      </motion.div>

      {/* Comparison table — tight rows, one focal column */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.15, duration: 0.55 }}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <div className="grid grid-cols-[1.2fr_2fr_2fr_1fr] gap-0 border-b border-gray-200 bg-gray-50 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.22em] text-gray-500">
          <div></div>
          <div>When it acts</div>
          <div>What happens on a bad day</div>
          <div className="text-right">Price</div>
        </div>
        {comparison.map((row) => (
          <div
            key={row.product}
            className={`grid grid-cols-[1.2fr_2fr_2fr_1fr] items-center gap-0 border-b border-gray-100 px-5 py-4 text-sm last:border-b-0 ${
              row.highlight ? 'bg-orange-50' : ''
            }`}
          >
            <div className={`font-bold ${row.highlight ? 'text-orange-700' : 'text-gray-900'}`}>
              {row.product}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              {row.highlight ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-orange-600" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              )}
              <span>{row.timing}</span>
            </div>
            <div className="text-gray-600">{row.shame}</div>
            <div className="text-right font-mono text-gray-700">{row.price}</div>
          </div>
        ))}
      </motion.div>

      {/* Two trust-anchors in a row */}
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="border-t border-orange-500 pt-5"
        >
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Clinical study · open
          </p>
          <p className="mt-3 font-serif text-xl font-normal leading-[1.3] text-gray-900">
            12-week IRB-pathway-mapped RCT — open for partner enrollment.
          </p>
          <Link
            href="/clinical-study"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-600 underline-offset-4 hover:underline"
          >
            Read the protocol &rarr;
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="border-t border-gray-300 pt-5"
        >
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            Recovery engine · built in
          </p>
          <p className="mt-3 font-serif text-xl font-normal leading-[1.3] text-gray-900">
            No Monday reset. One missed day doesn&rsquo;t break the streak.
          </p>
          <Link
            href="/recovery"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-900 underline-offset-4 hover:underline"
          >
            How recovery works &rarr;
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
