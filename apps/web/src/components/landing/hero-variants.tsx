'use client'

/**
 * AESTHETIC UPGRADE — May 2026
 * Refero references applied:
 *   - 511dd047-74c3-4c94-929c-4c80a5de0356 (Replit): cream canvas + decisive
 *     orange accent + tightly tracked oversized display headline; pill CTAs
 *     with restrained elevation.
 *   - 9d0e9f91-616f-49af-9e04-4ad33ce711d6 (Poly): single orange-red gradient
 *     focal accent, refined display hierarchy on warm canvas, light haloed
 *     atmosphere behind hero image card.
 *   - 9a9e4bd1-3aee-4783-a678-028ffea1fdbe (Panxo): hero product card floats
 *     over a soft peach/blush atmospheric gradient — ambient color behind
 *     glass rather than just a shadow.
 *
 * What changed (vs the prior utility-grade hero):
 *   1. COYL letterform — letter-spacing tightened to -0.06em, leading-[0.82],
 *      and the per-letter stagger dropped from 0.12s → 0.06s with a more
 *      assertive easing curve. Letters slide in from -24px rather than -40px
 *      so the entrance reads as one phrase, not three separate beats.
 *   2. Subhead H2 — leading collapsed to leading-[1.05] and tracking-[-0.015em]
 *      to feel like a magazine pull-line, not a paragraph heading.
 *   3. Demo card — sits in a haloed pocket of orange ambient glow (a radial
 *      gradient behind it) instead of a bare shadow. The shadow is still
 *      there but is now warmth-tinted (rgba(255, 102, 0, 0.10)).
 *   4. CTA — primary pill keeps the orange→red gradient but adds an inner
 *      highlight ring and a tighter focus state; secondary pill picks up an
 *      orange-tinted ring on hover instead of just a border color shift.
 *   5. Scroll cue — a small animated chevron + label appears bottom-center,
 *      hinting at content below. Respects prefers-reduced-motion implicitly
 *      because motion/react handles it.
 *   6. Spacing — gap between the hero text column and the demo card lifted
 *      from gap-12 to gap-12 lg:gap-16, and the hero pt rebalanced from
 *      pt-32 lg:pt-48 → pt-28 lg:pt-44 so the whole section feels less
 *      bottom-heavy.
 */

import Link from 'next/link'
import { motion } from 'motion/react'

const letterVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.25 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  }),
} satisfies Record<string, unknown>

const words = [
  { highlight: 'CO', rest: 'ntrol', indent: 0 },
  { highlight: 'Y', rest: 'our', indent: 48 },
  { highlight: 'L', rest: 'ife', indent: 96 },
]

type Variant = 'a' | 'b' | 'c'

const COPY: Record<Variant, {
  label: string
  headline: React.ReactNode
  subhead: string
  primaryCta: string
}> = {
  a: {
    label: 'Autopilot Interruption',
    // Synced to the locked main line: "It's not the mistake. It's what
    // you do after." Variant A is retired (we force B) but keep it in
    // sync for the ?v=a override path.
    headline: (
      <>
        It&apos;s not the mistake.<br />
        It&apos;s{' '}
        <span className="border-b-2 border-orange-500 text-orange-600" style={{ textShadow: '0 0 12px rgba(255, 102, 0, 0.6)' }}>
          what you do after
        </span>.
      </>
    ),
    subhead:
      "You don't fail because you don't know what to do. You fail in the exact same moments — over and over. This catches them before they turn into a spiral. Built first for weight loss. Works anywhere you keep sabotaging yourself.",
    primaryCta: 'Stop the spiral',
  },
  b: {
    label: 'The behavioral interface for AI',
    // Category-launch positioning per the May 2026 strategist brief:
    // COYL is not a habit app, not a GLP-1 app, not a productivity app —
    // it's the first AI that meets you at the real-world moment when the
    // pattern is about to run. The headline names the category, the
    // subhead names the moments, the primary CTA leads to the audit
    // (lowest-friction entry; reveals the user's archetype).
    headline: (
      <>
        AI for the moment<br />
        <span className="border-b-2 border-orange-500 text-orange-600" style={{ textShadow: '0 0 12px rgba(255, 102, 0, 0.6)' }}>
          before behavior happens.
        </span>
      </>
    ),
    subhead:
      "COYL detects your autopilot patterns and interrupts them in real time — before the fridge opens, before the tab wins, before one slip becomes the night.",
    primaryCta: 'Take the 60-second autopilot audit',
  },
  c: {
    label: 'Weight-Loss Interrupt',
    headline: (
      <>
        Weight loss doesn&apos;t fail at lunch.
        <br />
        It fails{' '}
        <span className="border-b-2 border-orange-500 text-orange-600" style={{ textShadow: '0 0 12px rgba(255, 102, 0, 0.6)' }}>
          at 9 PM
        </span>.
      </>
    ),
    subhead: 'Late-night kitchen autopilot. Weekend collapse. "I already blew it." This stops that moment.',
    primaryCta: 'Stop the 9 PM loop',
  },
}

export function HeroVariants({ variant }: { variant: Variant }) {
  const copy = COPY[variant]

  return (
    <section className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-6 pt-28 md:px-12 lg:pt-44">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="relative z-20 flex flex-col items-start lg:col-span-7">
          {/* AI Willpower label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-6 flex items-center gap-3"
          >
            <div className="h-px w-8 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600" style={{ textShadow: '0 0 20px rgba(255, 102, 0, 0.4)' }}>
              {copy.label}
            </span>
          </motion.div>

          {/* COYL wordmark — tighter tracking + leading + faster stagger */}
          <h1 className="text-[clamp(4rem,15vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.06em] text-gray-900">
            {words.map((w, i) => (
              <motion.span
                key={w.highlight}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={letterVariants}
                className="block transition-transform duration-500 hover:translate-x-4"
                style={{ marginLeft: w.indent }}
              >
                <span className="text-orange-600">{w.highlight}</span>
                {w.rest}
              </motion.span>
            ))}
          </h1>

          {/* Variant headline — magazine pull-line treatment */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-8 max-w-xl text-2xl font-black leading-[1.05] tracking-[-0.015em] text-gray-900 sm:text-3xl"
          >
            {copy.headline}
          </motion.h2>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
            className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg"
          >
            {copy.subhead}
          </motion.p>

          {/* CTAs — flipped per the May 2026 category-launch brief:
              the audit (lowest-friction, viral archetype reveal) is now
              primary; "See how it works" is the inspection path; signup
              is demoted to a tertiary chip below. The strategist's
              insight: pricing-first CTAs read like a SaaS pitch; audit-
              first reads like a category. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/audit"
              className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(255,102,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02] hover:shadow-[0_18px_50px_-8px_rgba(255,102,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf7]"
            >
              <span className="relative z-10">{copy.primaryCta}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative z-10 transition-transform group-hover:translate-x-0.5">
                <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link
              href="/how-it-works"
              className="group flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-all hover:border-orange-400 hover:bg-white hover:shadow-[0_0_0_4px_rgba(255,102,0,0.08)]"
            >
              See how it works
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-0.5">
                <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </motion.div>

          {/* Tertiary sign-up + reassurance line. Pricing references
              live on /pricing; this hero stays category-level. */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-4 text-sm text-gray-500"
          >
            Or{' '}
            <Link
              href={`/sign-up?v=${variant}`}
              className="font-semibold text-orange-600 underline-offset-4 hover:text-orange-700 hover:underline"
            >
              start free
            </Link>{' '}
            <span className="text-gray-600">&middot; no card &middot; behavioral support, not medical treatment.</span>
          </motion.p>
        </div>

        {/* Static 9:12 PM fridge scene — consistent across variants */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateY: -5 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden lg:col-span-5 lg:block"
        >
          {/* Ambient orange halo — sits behind the demo card. This is the
              "warmth pocket" borrowed from Panxo: a radial gradient pool of
              peach/blush that gives the floating product card a sense of
              atmosphere rather than just casting a shadow into nothing. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] opacity-80 blur-3xl"
            style={{
              background:
                'radial-gradient(60% 60% at 50% 50%, rgba(255, 138, 76, 0.28) 0%, rgba(255, 102, 0, 0.10) 45%, transparent 75%)',
            }}
          />

          {/* Hero demo card — flipped to the light palette so it stops
              reading as an alien black panel on the cream homepage. The
              animation, the 9:12 PM timestamp, the YOU / COYL turn-taking
              all stay; only the surface treatment changes (white card,
              warm shadow, gray-200 borders, orange-50 for COYL's bubble). */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.10),0_8px_24px_-8px_rgba(20,20,20,0.10)]"
          >
            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="h-3 w-3 rounded-full bg-red-500"
                />
                <span className="text-sm font-bold uppercase tracking-wider text-gray-900">Autopilot detected</span>
              </div>
              <span className="font-mono text-xs text-gray-500">9:12 PM</span>
            </div>

            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <p className="mb-1 text-[11px] font-mono uppercase tracking-wider text-gray-500">You</p>
                <p className="text-sm text-gray-900">Opened the fridge. Again.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 }}
                className="rounded-lg border border-orange-200 bg-orange-50 p-3"
              >
                <p className="mb-1 text-[11px] font-mono uppercase tracking-wider text-orange-700">COYL</p>
                <p className="text-sm leading-relaxed text-gray-900">
                  You&apos;re not hungry. You&apos;re doing it again.
                  <br />
                  Close the fridge. Walk 5 minutes. <span className="font-bold text-orange-700">Then</span> decide.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3"
              >
                <span className="text-xs font-semibold text-emerald-700">Paused. Didn&apos;t binge.</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-700">
                  <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue — a small visual hint that there is more below. Award-
          winning hero sections almost always have one; ours never did. The
          chevron drifts down on a 2.4s loop; the label fades in late so it
          does not compete with the headline entrance. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="pointer-events-none absolute inset-x-0 bottom-6 hidden flex-col items-center gap-2 lg:flex"
        aria-hidden
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-gray-400">
          Scroll
        </span>
        <motion.svg
          width="14"
          height="20"
          viewBox="0 0 14 20"
          fill="none"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
          className="text-orange-500"
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
    </section>
  )
}
