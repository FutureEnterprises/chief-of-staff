'use client'

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
 * not a feature list. Family name + emoji + signature script (the
 * one-line meme).
 */
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

        <h3 className="text-4xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-6xl">
          Which autopilot<br />
          <span className="text-orange-600">are you?</span>
        </h3>

        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          Almost everyone&rsquo;s pattern collapses into one of six identities.
          You probably recognise yourself in one of these before you finish
          reading them. The audit confirms which.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {families.map((f, i) => (
          <motion.div
            key={f.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08 * i, duration: 0.5 }}
          >
            <Link
              href={`/audit/${f.slug}`}
              className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:shadow-[0_12px_36px_-12px_rgba(255,102,0,0.18)]"
            >
              <p className="flex items-center gap-3 text-2xl font-black text-gray-900 md:text-3xl">
                <span aria-hidden>{f.emoji}</span>
                <span>{f.name}</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {f.essence}
              </p>
              <p className="mt-4 rounded-xl bg-gray-50 px-3 py-2 font-mono text-xs italic text-orange-700">
                {f.signature}
              </p>
              <p className="mt-auto pt-4 text-xs font-bold text-gray-500 group-hover:text-orange-600">
                Read the family →
              </p>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-12 flex flex-wrap items-center gap-3"
      >
        <Link
          href="/audit"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
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
