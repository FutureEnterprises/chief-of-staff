'use client'

/**
 * General-autopilot cinematic hero — May 2026 round-3 revert.
 *
 * Round-1 (April 2026) pivoted this hero to GLP-1 Rebound led, on the
 * theory that the fastest $100M-ARR path was through patients
 * terrified of weight regain. Round-3 audit (May 2026) flagged the
 * resulting front-door bifurcation: a visitor with a general
 * autopilot problem (focus, procrastination, late-night eating
 * unrelated to GLP-1) bounced because the hero spoke only to GLP-1
 * patients. Per the founder decision in the round-3 question set,
 * Rebound moves back to a specialty tier deeper in the funnel and the
 * homepage hero returns to the general-pattern framing the brand
 * mantra and the founder bio are already built around.
 *
 *   Hero line:  "Your patterns are louder than your plans.
 *                COYL lives in the three seconds between."
 *
 * Rebound stays reachable via:
 *   - the "On Ozempic, Wegovy, or Zepbound?" secondary chip below the
 *     primary CTAs (this file)
 *   - the /rebound landing page (unchanged)
 *   - the Consumer nav dropdown (unchanged)
 *   - the /rebound/for-clinicians prescriber one-pager (unchanged)
 * The Rebound funnel is intact; only the homepage entry point flips.
 *
 * The MomentLoop card on the right reads as either the general
 * pattern OR the GLP-1 rebounder — the late-night kitchen scene works
 * for both audiences because the script ("one snack won't matter") is
 * the same. Visual cinematic treatment preserved: warm-charcoal
 * scrim, dual radial orange glow, scan-line texture, serif italic for
 * the focal accent, cream bleed to the page beneath.
 *
 * The variant prop is kept for backward compat (?v=a|b|c links still
 * resolve); every variant now renders the same general-autopilot
 * hero. If A/B testing returns, the COPY map below is the surface to
 * branch on.
 */

import Link from 'next/link'
import { motion } from 'motion/react'
import { MomentLoop } from './moment-loop'

type Variant = 'a' | 'b' | 'c'

const COPY: Record<Variant, { eyebrow: string }> = {
  a: { eyebrow: 'AI for the moment before behavior happens' },
  b: { eyebrow: 'Catch yourself before you do it again' },
  c: { eyebrow: 'Behavioral support · the 3-second window' },
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
                clause makes the "lives in the three seconds" feel like
                the category-defining claim, not a feature list. */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[clamp(2.4rem,5.8vw,4.6rem)] font-normal leading-[1.04] tracking-[-0.025em] text-[#f8f1e4]"
            >
              Your patterns are louder than your plans.
              <br />
              <span className="italic text-orange-300">
                COYL lives in the three seconds between.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.7 }}
              className="mt-8 max-w-xl text-lg leading-[1.6] text-[#cfc7b9] md:text-xl"
            >
              Every behavior you wanted to change has a moment — a thin
              three-second window between the impulse and the action
              where an outside voice could have caught you. Therapy
              shows up Tuesday at 3 PM. Habit trackers show up the next
              morning. COYL{' '}
              <span className="font-semibold text-orange-300">lives in those three seconds.</span>
            </motion.p>

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
                <span className="relative z-10">
                  Take the 90-second autopilot audit
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

            {/* Specialty path — GLP-1 visitors get an explicit chip
                routing to the Rebound funnel. Smaller, lighter than the
                primary CTAs so general-autopilot stays the front door,
                but visible enough that a paid-acquisition click off an
                Ozempic / Wegovy / Zepbound keyword still lands in
                Rebound on the second hit. */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.25, duration: 0.6 }}
              className="mt-5 max-w-xl text-sm text-[#a59a87]"
            >
              On Ozempic, Wegovy, or Zepbound?{' '}
              <Link
                href="/rebound"
                className="font-medium text-orange-300 underline-offset-4 hover:underline"
              >
                See Rebound — the anti-regain layer →
              </Link>
            </motion.p>

            {/* Invite-only positioning — the audit is the open front door;
                app access opens in waves through the waitlist. Quiet line
                so the audit CTA stays primary, but the invite framing is
                present from the hero. */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.35, duration: 0.6 }}
              className="mt-3 max-w-xl text-sm text-[#a59a87]"
            >
              COYL is opening in waves.{' '}
              <Link
                href="/waitlist"
                className="font-medium text-orange-300 underline-offset-4 hover:underline"
              >
                Request an invite →
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
