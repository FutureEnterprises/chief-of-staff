'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial composition,
 *     pull-quote sits in negative space rather than a card.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): literary serif pull-line,
 *     muted gray supporting body, single small accent button.
 *   - 0e9417ba-1c8d-421a-8880-047eff20959f (Alison Roman): parchment + dark ink
 *     serif headline + restrained accent.
 *
 * What changed:
 *   - H3 now font-serif normal-weight italic accent. Drops the bold blocky shout
 *     for an editorial pull-quote.
 *   - Screenshot card stripped of orange chrome; becomes a cream-on-cream
 *     editorial side-bar with serif italic line items.
 */

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

/**
 * <YouArePatterned /> — the mythology beat between RescueDemo and
 * WhatItCatches on the v5 homepage.
 *
 * Per the May 2026 virality dispatch: the homepage was missing the
 * "myth must come first" beat that ladders the rescue demo (a feature
 * demonstration) into the category claim (an identity claim about
 * the reader). Without it, visitors leave the demo thinking "neat AI
 * trick" instead of "this is how I work."
 *
 * Single, sharp, quotable. Designed to be screenshot-shared.
 *   - One pull-quote: "You are not random. You are patterned."
 *   - Three sentences naming the predictability of human failure.
 *   - One soft link to the audit (so curiosity has somewhere to land).
 *
 * No card lattice, no icons, no proof points. Those exist on
 * surrounding sections. This section's job is to install one sentence
 * in the reader's head and step out of the way.
 */
export function YouArePatterned() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-40 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The premise
          </span>
        </div>

        <h3 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-7xl">
          You are not random.<br />
          <span className="italic text-orange-600">You are patterned.</span>
        </h3>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <p className="font-serif text-2xl font-normal italic leading-[1.4] text-gray-900 md:text-3xl">
              Your 9 PM kitchen has a shape. Your Sunday-night spiral has
              a shape. Your &ldquo;I&rsquo;ll restart Monday&rdquo; sentence
              has a shape.
            </p>
            <p className="mt-8 text-lg leading-[1.7] text-gray-600">
              Most human failure is predictable — same time of day, same
              cue, same internal sentence. The reason no AI has caught it
              before is that AI has lived inside a chatbox. COYL learns
              the shape of your autopilot and stands in the doorway.
            </p>

            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                href="/audit"
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_-8px_rgba(255,102,0,0.4)] transition-all hover:bg-orange-600"
              >
                Find your archetype · 60-second audit
              </Link>
              <Link
                href="/manifesto"
                className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
              >
                Read the manifesto
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <figure className="border-l border-gray-200 pl-6">
              <figcaption className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
                The screenshot line
              </figcaption>
              <p className="font-serif text-2xl font-normal leading-[1.25] text-gray-900 md:text-[1.625rem]">
                Search engines organized information.
              </p>
              <p className="mt-3 font-serif text-2xl font-normal leading-[1.25] text-gray-900 md:text-[1.625rem]">
                Social networks organized attention.
              </p>
              <p className="mt-3 font-serif text-2xl font-normal leading-[1.25] text-gray-900 md:text-[1.625rem]">
                LLMs organized language.
              </p>
              <p className="mt-3 font-serif text-2xl font-normal italic leading-[1.25] text-orange-600 md:text-[1.625rem]">
                COYL organizes intervention.
              </p>
            </figure>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
