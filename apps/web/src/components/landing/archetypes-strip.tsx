'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): serif H2 + constellation
 *     composition; cards become editorial entries, not feature tiles.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): family names set in serif
 *     so each archetype reads like a chapter title.
 *   - 08b879e1-2871-488f-b573-38e438e9a85c (Cori Corinne): parchment with
 *     italic serif pull-quote inside each card.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): editorial italic signature
 *     line treatment.
 *
 * Earlier references that informed the underlying structure (kept for trace):
 *   - Getharvest / Monarch / Portrait — original aesthetic pass.
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
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-40 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="mb-16"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The six families
          </span>
        </div>

        <h3 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-7xl">
          Which autopilot<br />
          <span className="italic text-orange-600">are you?</span>
        </h3>

        <p className="mt-8 max-w-2xl text-lg leading-[1.7] text-gray-600">
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
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_44px_-18px_rgba(20,20,20,0.12)]"
              >
                {/* Hairline accent line that slides in along the bottom on hover. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 bottom-0 h-px origin-left scale-x-0 bg-orange-500 transition-transform duration-500 group-hover:scale-x-100"
                />

                {/* Header row: subtle glyph + serif family name + mono prevalence */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400 transition-colors group-hover:text-orange-600"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <p className="font-serif text-2xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-[1.625rem]">
                      {f.name}
                    </p>
                  </div>

                  {pct ? (
                    <span
                      className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 transition-colors group-hover:text-orange-600"
                      title={f.prevalenceCopy}
                    >
                      {pct}
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 text-sm leading-[1.65] text-gray-600">
                  {f.essence}
                </p>

                {/* Signature script — editorial pull-quote, framed by a hairline
                    left rule. No card chrome, no decorative glyphs. */}
                <figure className="mt-6 border-l border-orange-500 pl-4">
                  <blockquote className="font-serif text-base italic leading-snug text-gray-700">
                    {f.signature}
                  </blockquote>
                </figure>

                <p className="mt-auto flex items-center gap-1.5 pt-6 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gray-400 transition-colors group-hover:text-orange-600">
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
        className="mt-16 flex flex-wrap items-center gap-4"
      >
        <Link
          href="/audit"
          className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600"
        >
          Find your family · 60-second audit →
        </Link>
        <p className="text-sm text-gray-500">
          Three questions. No signup. Your archetype on the other side.
        </p>
      </motion.div>

      {/* Attribution — small, factual, sits below the family grid the same
          way data attribution sits on /science. Per the May 2026 brief. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-gray-500"
      >
        From COYL audit responses, May 2026.
      </motion.p>
    </section>
  )
}
