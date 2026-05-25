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
 * <WhatItCatches /> — the six wedges, one tight band.
 *
 * Replaces what used to be three separate callout components
 * (Glp1Callout + ProcrastinationCallout + TeamsCallout). Per the
 * Refero synthesis (Linear, Vapi, Metaview, Dovetail): award-winning
 * SaaS homepages do not stack 3-4 full-bleed callouts — they show
 * the breadth in one section, with breath.
 *
 * V3 audit expansion (2026-05-24): expanded from 3 cards to 6 to
 * make the "same engine across verticals" point visible at first
 * touch. The v3 critique correctly flagged that 5 separate vertical
 * pages competing for homepage attention forced users to self-
 * segment ("is this about my eating, my focus, my work?"). The
 * answer: same coordinator, different windows. The breadth band
 * now SHOWS that with six patterns in a 2×3 grid, each linking to
 * its dedicated vertical page for the deep dive.
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
      // GLP-1 framing pulled per the May 2026 audit — the consumer
      // surface speaks "night self-sabotage" / "behavioral interrupt";
      // the GLP-1 angle stays on /glp1, /clinical-study, /clinician,
      // /research where the clinical narrative lives.
      eyebrow: 'NIGHT · FRIDGE',
      title: '"Not hungry. Just restless."',
      body: 'The 9 PM kitchen. The "I worked hard today" script. The script willpower can’t touch.',
      href: '/weight-loss',
      cta: 'Late-night kitchen',
    },
    {
      eyebrow: 'FOCUS · TAB',
      title: '"One more tab won’t hurt."',
      body: 'The doom-scroll. The Reddit pivot mid-deep-work. The afternoon collapse.',
      href: '/procrastination',
      cta: 'Procrastination',
    },
    {
      eyebrow: 'FOLLOW-THROUGH · DEAL',
      title: '"I’ll send it tomorrow."',
      body: 'The email that drifts. The follow-up that dies in the inbox. The commitment that felt real Tuesday and is gone Thursday.',
      href: '/work',
      cta: 'Work follow-through',
    },
    {
      eyebrow: 'DECISIONS · LATE',
      title: '"I’ll decide in the morning."',
      body: 'The choice you defer past the window where it still mattered. The plan that needed today’s yes.',
      href: '/decision-support',
      cta: 'Decision support',
    },
    {
      eyebrow: 'RECOVERY · POST-SLIP',
      title: '"I already blew it."',
      body: 'The Monday-reset trap. The streak abandon. The spiral that starts with one slip and ends three days later.',
      href: '/recovery',
      cta: 'Recovery engine',
    },
    {
      eyebrow: 'RECURRING · LOOP',
      title: '"Just this once."',
      body: 'Same exact decision, same exact time, same exact script. The loop you keep running. Behavioral support — not clinical crisis.',
      href: '/recurring-loops',
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
        {/* The "same engine" line — addresses the v3 audit's concern
            that 5+ vertical pages forced users to self-segregate.
            One sentence collapses the verticals into one engine; the
            cards below show the breadth without re-fragmenting. */}
        <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700">
          Same coordinator. Different windows. COYL catches food at 9 PM, tab
          switches at 11 AM, follow-ups that drift past Thursday, and the
          decision you keep deferring — through one engine, not six apps.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
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
