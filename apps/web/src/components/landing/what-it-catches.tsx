'use client'

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
      eyebrow: 'DESTRUCTIVE LOOPS',
      title: '"Just this once."',
      body: 'The drink. The scroll. The compulsive checking. The same exact decision, every time.',
      href: '/destructive-behaviors',
      cta: 'Destructive patterns',
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
          What it catches
        </p>
        <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-5xl">
          Whatever you keep doing<br />
          <span className="text-orange-600">that you don&rsquo;t mean to.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {wedges.map((w, i) => (
          <motion.div
            key={w.eyebrow}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
          >
            <Link
              href={w.href}
              className="group block h-full rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-orange-500/40 hover:shadow-[0_8px_30px_-12px_rgba(255,102,0,0.18)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-600">
                {w.eyebrow}
              </p>
              <p className="mt-3 text-xl font-black leading-tight text-gray-900">
                {w.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{w.body}</p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 transition-transform group-hover:translate-x-0.5">
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
        className="mt-10 text-sm text-gray-600"
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
