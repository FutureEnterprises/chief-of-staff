'use client'

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
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-32 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-600">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          The premise
        </h2>

        <h3 className="text-4xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-6xl">
          You are not random.<br />
          <span className="text-orange-600">You are patterned.</span>
        </h3>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="text-xl leading-relaxed text-gray-700 md:text-2xl">
              Your 9 PM kitchen has a shape. Your Sunday-night spiral has
              a shape. Your &ldquo;I&rsquo;ll restart Monday&rdquo; sentence
              has a shape.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-gray-600">
              Most human failure is predictable — same time of day, same
              cue, same internal sentence. The reason no AI has caught it
              before is that AI has lived inside a chatbox. COYL learns
              the shape of your autopilot and stands in the doorway.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/audit"
                className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
              >
                Find your archetype · 60-second audit
              </Link>
              <Link
                href="/manifesto"
                className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
              >
                Read the manifesto
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
              <p className="text-xs font-mono uppercase tracking-widest text-orange-700">
                The screenshot line
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-gray-900 md:text-3xl">
                Search engines organized information.
              </p>
              <p className="mt-2 text-2xl font-black leading-tight text-gray-900 md:text-3xl">
                Social networks organized attention.
              </p>
              <p className="mt-2 text-2xl font-black leading-tight text-gray-900 md:text-3xl">
                LLMs organized language.
              </p>
              <p className="mt-2 text-2xl font-black leading-tight text-orange-700 md:text-3xl">
                COYL organizes intervention.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
