'use client'

/**
 * Cinematic cold-open hero — May 2026 full-site audit overhaul.
 *
 * The previous hero explained too much before proving anything. Per
 * the audit's exact prescription, this one opens with the pattern-
 * recognition cold-open ("Let me guess..." — restart on Mondays,
 * negotiate at night, "tomorrow" after one mistake, worst decisions
 * mentally tired) and demonstrates the product loop above the fold
 * via the auto-playing MomentLoop card instead of explaining it in
 * five sections.
 *
 * Visual treatment is the dark cinematic shift the audit demanded:
 * warm charcoal scrim, single orange accent, deep shadow on the loop
 * card. The rest of the homepage stays cream — the emotional contrast
 * between the dark moment-of-recognition hero and the lighter content
 * below is the point.
 *
 * The COPY map keeps the variant prop interface so existing
 * ?v=a|b|c links continue to resolve, but every variant now renders
 * the same cold-open structure (the A/B was forced to B per the
 * earlier locked-variant decision). Variants A and C are kept as
 * eyebrow-only overrides for ad-source attribution.
 *
 * Medical-disclaimer line moved off this surface to /safety + the
 * sign-up consent screen per the same audit pass.
 */

import Link from 'next/link'
import { motion } from 'motion/react'
import { MomentLoop } from './moment-loop'

type Variant = 'a' | 'b' | 'c'

const COPY: Record<Variant, { eyebrow: string }> = {
  a: { eyebrow: 'Autopilot interruption' },
  b: { eyebrow: 'The behavioral OS' },
  c: { eyebrow: 'Late-night self-sabotage' },
}

export function HeroVariants({ variant }: { variant: Variant }) {
  const copy = COPY[variant]

  return (
    <section className="relative isolate overflow-hidden">
      {/* Dark scrim — the cinematic surface. Sits above the cream page
          background so the rest of the homepage reads as lighter
          chapters after the moment of recognition. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[#0e0d0b]"
      />
      {/* Two orange radial pools — one upper-left (anchors the cold-open
          paragraph), one mid-right (anchors the MomentLoop card). The
          dual-glow gives the panel atmosphere without flattening. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(45% 60% at 18% 32%, rgba(255, 138, 76, 0.18) 0%, transparent 70%),
            radial-gradient(40% 60% at 78% 60%, rgba(255, 102, 0, 0.16) 0%, transparent 70%)
          `,
        }}
      />
      {/* Soft scan-line texture — the Black-Mirror-meets-behavioral-psych
          texture the audit asked for. Pure CSS, edge-bulletproof. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />
      {/* Gradient bleed at the bottom — soft fade into the cream page
          beneath so the hero/page transition reads as a deliberate
          chapter change, not a hard cut. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, transparent 0%, rgba(250,250,247,0.0) 30%, rgba(250,250,247,0.85) 90%, #fafaf7 100%)',
        }}
      />

      <div className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 pt-28 pb-24 md:px-12 lg:pt-40 lg:pb-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left column — cold-open recognition paragraph */}
          <div className="relative z-20 flex flex-col items-start lg:col-span-7">
            {/* Eyebrow — small caps, mono, hairline rule */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-10 flex items-center gap-3"
            >
              <div className="h-px w-10 bg-orange-500" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-400">
                {copy.eyebrow}
              </span>
            </motion.div>

            {/* Cold-open paragraph. Four lines of recognition that trigger
                the Barnum effect — the same mechanic that drives Myers-
                Briggs, Enneagram, and Wordle virality. Serif italic on
                "Let me guess." for the intimate-reading-aloud cadence. */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[clamp(2.4rem,5.8vw,4.6rem)] font-normal leading-[1.04] tracking-[-0.025em] text-[#f8f1e4]"
            >
              <span className="italic text-orange-300">Let me guess.</span>
              <br />
              You restart on Mondays.
              <br />
              You negotiate with yourself at night.
              <br />
              You say <span className="italic text-orange-300">“tomorrow”</span> after one
              mistake.
              <br />
              And your worst decisions
              <br />
              happen when you’re tired.
            </motion.h1>

            {/* Punchline — sans, restrained, sits as a calm afterbeat
                under the recognition stack. */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.7 }}
              className="mt-8 max-w-xl text-lg leading-[1.6] text-[#cfc7b9] md:text-xl"
            >
              You’re not random. You’re patterned. COYL catches you{' '}
              <span className="font-semibold text-orange-300">before</span> you
              repeat it.
            </motion.p>

            {/* CTAs — audit is primary (lowest-friction entry, viral
                archetype reveal). "See the 3-second window" routes to
                /how-it-works for the inspection-minded visitor. */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05, duration: 0.6 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/audit"
                className="group relative flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-base font-semibold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-12px_rgba(255,102,0,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d0b]"
              >
                <span className="relative z-10">Take the 60-second pattern audit</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="relative z-10 transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    d="M1 7h12m0 0L8 2m5 5L8 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link
                href="/how-it-works"
                className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-base font-medium text-[#e7dccb] transition-colors hover:border-orange-300 hover:text-orange-300"
              >
                See the 3-second window
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    d="M1 7h12m0 0L8 2m5 5L8 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </motion.div>

            {/* Tertiary line — the no-card start-free affordance. Medical
                disclaimer moved to /safety + sign-up consent per the
                full-site audit ("legally smart but emotionally dead in
                the hero"). */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.25, duration: 0.6 }}
              className="mt-5 text-sm text-[#a59a87]"
            >
              Or{' '}
              <Link
                href={`/sign-up?v=${variant}`}
                className="font-semibold text-orange-300 underline-offset-4 hover:text-orange-200 hover:underline"
              >
                start free
              </Link>{' '}
              <span className="text-[#7a7264]">· no card · 60 seconds to your archetype</span>
            </motion.p>
          </div>

          {/* Right column — the auto-playing MomentLoop. This IS the
              "visible product loop above the fold" the audit demanded —
              not a diagram, an actual four-beat micro-moment that plays
              continuously while the visitor reads the cold-open. */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:col-span-5 lg:flex lg:justify-end"
          >
            <MomentLoop />
          </motion.div>
        </div>

        {/* Mobile-only MomentLoop placement — slides under the cold-open
            paragraph on small screens so mobile visitors also see the
            visible loop above the audit CTA. */}
        <div className="mt-12 flex justify-center lg:hidden">
          <MomentLoop />
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="pointer-events-none mt-12 hidden flex-col items-center gap-2 lg:flex"
          aria-hidden
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#7a7264]">
            Scroll
          </span>
          <motion.svg
            width="14"
            height="20"
            viewBox="0 0 14 20"
            fill="none"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
            className="text-orange-400"
          >
            <path
              d="M7 2v14m0 0l5-5m-5 5l-5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.div>
      </div>
    </section>
  )
}
