'use client'

/**
 * AESTHETIC UPGRADE — May 2026
 * Refero references applied:
 *   - 70776247-d83f-4c42-a221-4b90ab7c788d (Getharvest): restrained orange
 *     accents on cream feature cards; calm spacing; orderly grid composition.
 *   - d1af3fe4-bbf9-4bd3-82c5-aa29e83a0512 (Monarch): luxury hover lift; soft
 *     elevated card surfaces; a single decisive orange accent appearing only
 *     on the highest-priority element.
 *   - 0a8a4374-b165-4ec0-99b7-ab0b20c37ba4 (Portrait): rounded tile cards
 *     with soft layered shadows + thin pale borders for premium polish.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): editorial use of a
 *     handset, italicized signature line as a quote, not a chip.
 *
 * What changed (vs the prior utility-grade strip):
 *   1. Icon badge — flat icon glyph is now anchored in a circular tinted
 *      background (orange-50 → orange-100 on hover), giving each card a
 *      visual entry-point that reads at a glance.
 *   2. Hover state — translate-y was -0.5; now -1, paired with a slim
 *      orange accent line that slides in along the card's bottom edge.
 *      Background also shifts to orange-50/40 with a tighter orange ring.
 *   3. Signature line — was a gray mono pill. Now displayed as a true
 *      pull-quote, italic-serif weight inside the same chip, with two
 *      decorative SVG quotation glyphs framing it.
 *   4. Prevalence indicator — each card now surfaces a tiny "% prevalence"
 *      metric extracted from the family's prevalenceCopy. Dimensional data
 *      feel without being clinical.
 *   5. Section header — adds tracking-[-0.02em] and stricter leading on
 *      the H3 so it reads more deliberate against the soft canvas.
 *
 * NOTE: The data layer (`@/lib/audit-archetype`) ships each family with an
 * `Icon` (Lucide component). A prior version of this strip rendered
 * `f.emoji` which never existed on the typed shape. This file now uses
 * `f.Icon` to align with the source of truth — coordinating with the
 * parallel emoji→SVG conversion happening across archetype components.
 */

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { allFamilies } from '@/lib/audit-archetype'

/**
 * <ArchetypesStrip /> — homepage section 6, the viral surface.
 *
 * Six family cards. Each links to /audit/[family-slug] (the family
 * explainer page). The strategist's mandate: people share identity
 * diagnostics more than almost anything else online (MBTI, Spotify
 * Wrapped, BuzzFeed quizzes). Surface the six families here so the
 * pattern reveals itself BEFORE the visitor takes the audit — pulling
 * them into "which one am I?" before they even click.
 *
 * Each card is the same shape so the grid reads as a constellation,
 * not a feature list. Family name + icon + signature script + a small
 * prevalence indicator.
 */

// Pulls "69%" out of "69% of you tell yourself..." for the prevalence chip.
// If the family copy ever changes shape this falls through to null and the
// chip simply does not render, so the card still works.
function extractPrevalencePct(copy: string): string | null {
  const m = copy.match(/(\d{1,3}%)/)
  return m && m[1] ? m[1] : null
}

export function ArchetypesStrip() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const families = allFamilies()

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-32 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="mb-12"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-600">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          The six families
        </h2>

        <h3 className="text-4xl font-black leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-6xl">
          Which autopilot<br />
          <span className="text-orange-600">are you?</span>
        </h3>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
          Almost everyone&rsquo;s pattern collapses into one of six identities.
          You probably recognise yourself in one of these before you finish
          reading them. The audit confirms which.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {families.map((f, i) => {
          const pct = extractPrevalencePct(f.prevalenceCopy)
          const Icon = f.Icon
          return (
            <motion.div
              key={f.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08 * i, duration: 0.5 }}
            >
              <Link
                href={`/audit/${f.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-300/70 hover:bg-orange-50/40 hover:shadow-[0_18px_44px_-14px_rgba(255,102,0,0.22),0_4px_12px_-6px_rgba(20,20,20,0.06)]"
              >
                {/* Slim accent line that slides in along the bottom on hover.
                    Subtle but unmistakable — borrowed from Monarch's "single
                    decisive accent" treatment. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent transition-transform duration-500 group-hover:scale-x-100"
                />

                {/* Header row: tinted icon badge + name + prevalence pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100 transition-colors group-hover:bg-orange-100 group-hover:ring-orange-200"
                    >
                      <Icon className="h-5 w-5 text-orange-600" strokeWidth={2} />
                    </span>
                    <p className="text-xl font-black leading-[1.1] tracking-[-0.01em] text-gray-900 md:text-2xl">
                      {f.name}
                    </p>
                  </div>

                  {pct ? (
                    <span
                      className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-gray-600 transition-colors group-hover:bg-white group-hover:text-orange-700"
                      title={f.prevalenceCopy}
                    >
                      {pct}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {f.essence}
                </p>

                {/* Signature script — pull-quote treatment with decorative
                    glyphs framing it. Italicised, serif-leaning, set on a
                    softer cream so it reads as a remembered line, not a
                    label. */}
                <figure className="mt-4 rounded-xl border border-gray-100 bg-[#fbf8f3] px-4 py-3">
                  <div className="flex items-start gap-2">
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      className="mt-0.5 shrink-0 text-orange-400"
                      fill="currentColor"
                    >
                      <path d="M5 4H2c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1h2v1c0 .6-.4 1-1 1H2v1h2c1.1 0 2-.9 2-2V5c0-.6-.4-1-1-1zm7 0H9c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1h2v1c0 .6-.4 1-1 1H9v1h2c1.1 0 2-.9 2-2V5c0-.6-.4-1-1-1z" />
                    </svg>
                    <blockquote className="font-serif text-sm italic leading-snug text-orange-800">
                      {f.signature}
                    </blockquote>
                  </div>
                </figure>

                <p className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors group-hover:text-orange-600">
                  Read the family
                  <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </p>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-12 flex flex-wrap items-center gap-3"
      >
        <Link
          href="/audit"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_22px_-6px_rgba(255,102,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-transform hover:scale-[1.02]"
        >
          Find your family · 60-second audit →
        </Link>
        <p className="text-sm text-gray-500">
          Three questions. No signup. Your archetype on the other side.
        </p>
      </motion.div>
    </section>
  )
}
