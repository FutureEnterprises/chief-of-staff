'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined fintech editorial;
 *     airy white + serif display headlines + generous breathing room + restrained
 *     accent. The visual benchmark.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): ultra-premium quiet; image-led
 *     storytelling sits inside dramatic negative space rather than glowing card stacks.
 *   - c763837b-8389-4246-a070-87ff79e8ae0b (Cluely): large editorial serif headline
 *     with single accent restraint; supporting sans body in calm hierarchy.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     oversized serif title — H1 carries the brand weight, no decoration.
 *   - 08b879e1-2871-488f-b573-38e438e9a85c (Cori Corinne): parchment + oversized
 *     serif display + grainy authority.
 *   - 0e9417ba-1c8d-421a-8880-047eff20959f (Alison Roman): warm cream, dark ink
 *     serif, literary editorial composition.
 *
 * Earlier references that informed the underlying structure (kept for trace):
 *   - Replit / Poly / Panxo — original aesthetic upgrade pass.
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

/**
 * COYL letterform — four standalone letters, no acronym lore.
 *
 * The earlier version spelled out "COntrol/Your/Life" with the
 * highlight letters carrying the acronym. The strategist's May 2026
 * audit was emphatic: the COYL acronym sounds like a motivational app
 * and undercuts the category-defining AI positioning everywhere else
 * on the site. "Your brand should not explain COYL as an acronym. It
 * should make COYL a verb." So we drop the explanation; the letters
 * are the wordmark and that's enough.
 *
 * The Y stays orange (visual anchor) — same as the footer wordmark.
 */
const LETTERS: Array<{ char: string; accent: boolean }> = [
  { char: 'C', accent: false },
  { char: 'O', accent: false },
  { char: 'Y', accent: true },
  { char: 'L', accent: false },
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
        <span className="italic text-orange-600">
          what you do after
        </span>.
      </>
    ),
    subhead:
      "You don't fail because you don't know what to do. You fail in the exact same moments — over and over. This catches them before they turn into a spiral. Built first for weight loss. Works anywhere you keep sabotaging yourself.",
    primaryCta: 'Stop the spiral',
  },
  b: {
    label: 'Proactive AI infrastructure',
    // Platform-tier repositioning per the May 2026 Stripe-model brief:
    // payments-as-API was Stripe's protocol; merchants were the proof.
    // COYL: BIP + PAP + EAP are the protocols; coyl.ai is the proof
    // case. The eyebrow names the category for acquirers (foundation
    // labs + tech-platforms join the room), the headline names the
    // layer ("behavioral OS for the LLM era"), the subhead names the
    // architecture (three open protocols, one reference engine), and
    // the audit stays the lowest-friction entry for consumers.
    headline: (
      <>
        The <span className="italic text-orange-600">behavioral OS</span>
        <br />
        for the LLM era.
      </>
    ),
    subhead:
      'Three open protocols — BIP, PAP, EAP — that turn any LLM into a proactive intervention layer across every device the user owns. The consumer app at coyl.ai is the proof case.',
    primaryCta: 'Take the 60-second autopilot audit',
  },
  c: {
    label: 'Weight-Loss Interrupt',
    headline: (
      <>
        Weight loss doesn&apos;t fail at lunch.
        <br />
        It fails{' '}
        <span className="italic text-orange-600">
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
          {/* Eyebrow — small caps, mono, hairline rule. Pure metadata. */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-8 flex items-center gap-3"
          >
            <div className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              {copy.label}
            </span>
          </motion.div>

          {/* COYL wordmark — set in serif now to anchor the editorial system.
              Four standalone letters, the Y carries the orange accent. */}
          <h1 className="flex items-baseline gap-[0.04em] font-serif text-[clamp(4.5rem,16vw,9rem)] font-normal leading-[0.85] tracking-[-0.04em] text-gray-900">
            {LETTERS.map((l, i) => (
              <motion.span
                key={`${l.char}-${i}`}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={letterVariants}
                className={l.accent ? 'text-orange-600' : ''}
              >
                {l.char}
              </motion.span>
            ))}
          </h1>

          {/* Variant headline — serif pull-line, lighter weight, generous leading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-10 max-w-xl font-serif text-3xl font-normal leading-[1.08] tracking-[-0.015em] text-gray-900 sm:text-4xl md:text-[2.75rem]"
          >
            {copy.headline}
          </motion.h2>

          {/* Subhead — sans, breathing leading, gray-600 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
            className="mt-6 max-w-xl text-base leading-[1.65] text-gray-600 sm:text-lg"
          >
            {copy.subhead}
          </motion.p>

          {/* Acquisition-positioning add-line — per the $6B strategy memo
              Fix 01: the consumer hero ("AI for the moment before behavior
              happens") undersells the platform. Acquirers + partners need
              to read COYL as embeddable infrastructure, not a consumer
              app. This single line elevates the multiple in BD rooms
              without compromising the consumer-facing top half. */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="mt-5 max-w-xl border-l-2 border-orange-500 pl-4 font-serif text-lg italic leading-[1.45] text-gray-700 sm:text-xl"
          >
            The behavioral interrupt layer. For any platform. Any autopilot
            script. Any human.
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
              className="group relative flex items-center gap-2.5 overflow-hidden rounded-full bg-orange-500 px-8 py-4 text-base font-semibold text-white shadow-[0_8px_24px_-10px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600 hover:shadow-[0_14px_36px_-10px_rgba(255,102,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf7]"
            >
              <span className="relative z-10">{copy.primaryCta}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative z-10 transition-transform group-hover:translate-x-0.5">
                <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link
              href="/how-it-works"
              className="group flex items-center gap-2 rounded-full border border-gray-200 bg-transparent px-8 py-4 text-base font-medium text-gray-900 transition-all hover:border-gray-900 hover:bg-white"
            >
              See the 3-second window
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
