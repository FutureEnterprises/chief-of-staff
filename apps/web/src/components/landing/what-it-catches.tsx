'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): serif H2 + italic accent
 *     phrase; the breadth section reads as an editorial spread.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): pull-quote titles set in
 *     serif italic — each wedge becomes a remembered line, not a bullet.
 *   - 0e9417ba-1c8d-421a-8880-047eff20959f (Alison Roman): warm cream canvas,
 *     dark ink serif, restrained orange.
 */

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

/**
 * <WhatItCatches /> — the three wedges, one tight band.
 *
 * Replaces what used to be three separate callout components
 * (Glp1Callout + ProcrastinationCallout + TeamsCallout). Per the
 * Refero synthesis (Linear, Vapi, Metaview, Dovetail): award-winning
 * SaaS homepages do not stack 3-4 full-bleed callouts — they show
 * the breadth in one section, with breath.
 *
 * The eyebrow names the moment; each card names ONE specific autopilot
 * loop in the user's voice; the link goes to the dedicated wedge page
 * for deep dive. No paragraph copy — that lives on the wedge pages.
 */
export function WhatItCatches() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const wedges = [
    {
      eyebrow: 'WEIGHT · GLP-1',
      title: '"Not hungry. Just restless."',
      body: 'The 9 PM kitchen. The post-injection day-3 rebound. The script the drug can’t touch.',
      href: '/glp1',
      cta: 'GLP-1 companion',
    },
    {
      eyebrow: 'FOCUS · WORK',
      title: '"One more tab won’t hurt."',
      body: 'The doom-scroll. The Reddit pivot mid-deep-work. The afternoon collapse.',
      href: '/procrastination',
      cta: 'Procrastination',
    },
    {
      eyebrow: 'RECURRING LOOPS',
      title: '"Just this once."',
      body: 'The scroll. The checking. The same exact decision at the same exact time. Behavioral support — not clinical crisis.',
      href: '/destructive-behaviors',
      cta: 'Recurring loops',
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
            Patterns COYL catches
          </span>
        </div>
        <h2 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-6xl">
          Whatever you keep doing<br />
          <span className="italic text-orange-600">that you don&rsquo;t mean to.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {wedges.map((w, i) => (
          <motion.div
            key={w.eyebrow}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
          >
            <Link
              href={w.href}
              className="group block h-full border-t border-gray-200 pt-6 transition-all hover:border-gray-900"
            >
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                {w.eyebrow}
              </p>
              <p className="mt-5 font-serif text-2xl font-normal italic leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-[1.625rem]">
                {w.title}
              </p>
              <p className="mt-4 text-sm leading-[1.7] text-gray-600">{w.body}</p>
              <p className="mt-6 inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500 transition-colors group-hover:text-orange-600">
                {w.cta} <span aria-hidden>&rarr;</span>
              </p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* One quiet line broadens the scope without cluttering. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-16 text-sm text-gray-600"
      >
        Or anything you keep sabotaging.{' '}
        <Link
          href="/how-it-works"
          className="text-orange-600 underline-offset-4 hover:underline"
        >
          The mechanic is the same
        </Link>
        .
      </motion.p>
    </section>
  )
}
