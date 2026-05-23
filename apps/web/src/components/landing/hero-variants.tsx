'use client'

/**
 * Rebound-led cinematic hero — May 2026 consumer pivot.
 *
 * Per the founder strategic decision to focus the consumer-facing
 * surface on the GLP-1 anti-regain wedge (and the second-audit math
 * showing the fastest $100M-ARR path runs through "stopping Ozempic"
 * patients terrified of weight regain), the homepage hero now leads
 * with the Rebound positioning rather than the generic-pattern
 * cold-open.
 *
 *   Hero line:  "The shot quiets hunger.
 *                COYL trains the pattern that keeps the weight off."
 *
 * The MomentLoop card stays — the 11:42 PM micro-moment ("One snack
 * won't matter" → "This is where tomorrow gets damaged") is exactly
 * the GLP-1-rebounder script. Same component, sharper context.
 *
 * Visual treatment preserved from the prior cinematic rollout:
 * warm-charcoal scrim, dual radial orange glow, scan-line texture,
 * serif italic for the focal accent, cream bleed to the page beneath.
 *
 * The variant prop is kept for backward compat (?v=a|b|c links still
 * resolve); every variant now renders the same Rebound hero.
 */

import Link from 'next/link'
import { motion } from 'motion/react'
import { MomentLoop } from './moment-loop'

type Variant = 'a' | 'b' | 'c'

const COPY: Record<Variant, { eyebrow: string }> = {
  a: { eyebrow: 'The anti-regain layer' },
  b: { eyebrow: 'Behavioral support · GLP-1 maintenance' },
  c: { eyebrow: 'For the moment the shot gets quiet' },
}

export function HeroVariants({ variant }: { variant: Variant }) {
  const copy = COPY[variant]

  return (
    <section className="relative isolate overflow-hidden">
      {/* Dark scrim — cinematic surface, same as the prior hero */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[#0e0d0b]"
      />
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />
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
          {/* Left column — Rebound headline */}
          <div className="relative z-20 flex flex-col items-start lg:col-span-7">
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

            {/* Hero line — the one sentence. Serif italic on the second
                clause makes the "trains the pattern" feel like the
                category-defining claim, not a feature list. */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[clamp(2.4rem,5.8vw,4.6rem)] font-normal leading-[1.04] tracking-[-0.025em] text-[#f8f1e4]"
            >
              The shot quiets hunger.
              <br />
              <span className="italic text-orange-300">
                COYL trains the pattern that keeps the weight off.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.7 }}
              className="mt-8 max-w-xl text-lg leading-[1.6] text-[#cfc7b9] md:text-xl"
            >
              When the Ozempic, Wegovy, or Zepbound gets quiet, the 9 PM
              script comes back. COYL catches it{' '}
              <span className="font-semibold text-orange-300">before</span>{' '}
              the pattern reruns — so the weight you lost stays off.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05, duration: 0.6 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/rebound/quiz"
                className="group relative flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-base font-semibold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-12px_rgba(255,102,0,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d0b]"
              >
                <span className="relative z-10">
                  Take the 60-second regain risk quiz
                </span>
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

            {/* Reassurance line — anchors the wedge in research. 60%
                regain stat comes from the May 2026 Cambridge meta-
                analysis cited on /clinical-study. */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.25, duration: 0.6 }}
              className="mt-5 max-w-xl text-sm text-[#a59a87]"
            >
              60% of weight lost on GLP-1 returns within a year of
              stopping the medication.{' '}
              <Link
                href="/clinical-study"
                className="underline-offset-4 hover:text-orange-300 hover:underline"
              >
                The research →
              </Link>
            </motion.p>
          </div>

          {/* Right column — auto-playing MomentLoop, same as prior hero.
              The 11:42 PM micro-moment is exactly the GLP-1-rebounder
              script: late-night kitchen, the "one snack won't matter"
              negotiation, the interrupt, the resolution. No content
              change needed; the cinematic loop already reads as
              Rebound. */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:col-span-5 lg:flex lg:justify-end"
          >
            <MomentLoop />
          </motion.div>
        </div>

        {/* Mobile MomentLoop */}
        <div className="mt-12 flex justify-center lg:hidden">
          <MomentLoop />
        </div>
      </div>
    </section>
  )
}
