'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

const letterVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.3 + i * 0.12, duration: 0.8, ease: [0.23, 1, 0.32, 1] as const },
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
    headline: (
      <>
        This stops the moment<br />
        you usually{' '}
        <span className="border-b-2 border-orange-500 text-orange-400" style={{ textShadow: '0 0 12px rgba(255, 102, 0, 0.6)' }}>
          screw yourself
        </span>.
      </>
    ),
    subhead:
      "You don't fail because you don't know what to do. You fail in the exact same moments \u2014 over and over. This catches them before they turn into a spiral. Built first for weight loss. Works anywhere you keep sabotaging yourself.",
    primaryCta: 'Stop the spiral',
  },
  b: {
    label: 'Autopilot Interruption',
    headline: (
      <>
        Why do you keep<br />
        <span className="border-b-2 border-orange-500 text-orange-400" style={{ textShadow: '0 0 12px rgba(255, 102, 0, 0.6)' }}>
          doing this?
        </span>
      </>
    ),
    // v4 spec (COYL_homepage_v4.md §HERO): "bad day" \u2192 "spiral".
    // The spiral word carries more emotional weight + ties to the loop section.
    subhead:
      "Because you\u2019re on autopilot. COYL catches the moment you usually blow it \u2014 before it turns into a spiral.",
    primaryCta: 'Start catching your patterns',
  },
  c: {
    label: 'Weight-Loss Interrupt',
    headline: (
      <>
        Weight loss doesn&apos;t fail at lunch.
        <br />
        It fails{' '}
        <span className="border-b-2 border-orange-500 text-orange-400" style={{ textShadow: '0 0 12px rgba(255, 102, 0, 0.6)' }}>
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
    <section className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-6 pt-32 md:px-12 lg:pt-48">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="relative z-20 flex flex-col items-start lg:col-span-7">
          {/* AI Willpower label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-6 flex items-center gap-3"
          >
            <div className="h-px w-8 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500" style={{ textShadow: '0 0 20px rgba(255, 102, 0, 0.4)' }}>
              {copy.label}
            </span>
          </motion.div>

          {/* COYL wordmark */}
          <h1 className="text-[clamp(4rem,15vw,8rem)] font-black uppercase leading-[0.85] tracking-[-0.04em] text-white">
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
                <span className="text-orange-500">{w.highlight}</span>
                {w.rest}
              </motion.span>
            ))}
          </h1>

          {/* Variant headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="mt-8 max-w-xl text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl"
          >
            {copy.headline}
          </motion.h2>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7 }}
            className="mt-4 max-w-xl text-base text-gray-400 sm:text-lg"
          >
            {copy.subhead}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href={`/sign-up?v=${variant}`}
              className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,102,0,0.5)]"
            >
              <span className="relative z-10">{copy.primaryCta}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative z-10">
                <path d="M8 1v14M1 8l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-90 8 8)" />
              </svg>
            </Link>
            <a
              href="#try-it"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/10"
            >
              Try it now
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-y-1">
                <path d="M7 1v12m0 0l5-5m-5 5L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </motion.div>
        </div>

        {/* Static 9:12 PM fridge scene — consistent across variants */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateY: -5 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.6, duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative hidden lg:col-span-5 lg:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
            className="relative overflow-hidden rounded-2xl border border-white/5 p-6 shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(15,15,15,0.8))',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{
              background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)',
              backgroundSize: '100% 4px',
            }} />

            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="h-3 w-3 rounded-full bg-red-500"
                />
                <span className="text-sm font-bold uppercase tracking-wider text-white">Autopilot detected</span>
              </div>
              <span className="font-mono text-xs text-gray-500">9:12 PM</span>
            </div>

            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="rounded-lg border border-white/5 bg-black/40 p-3"
              >
                <p className="mb-1 text-[11px] font-mono uppercase tracking-wider text-gray-500">You</p>
                <p className="text-sm text-white">Opened the fridge. Again.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 }}
                className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3"
              >
                <p className="mb-1 text-[11px] font-mono uppercase tracking-wider text-orange-500">COYL</p>
                <p className="text-sm leading-relaxed text-orange-100">
                  You&apos;re not hungry. This is your usual night loop.
                  <br />
                  Drink water. Walk 5 minutes. <span className="font-bold text-orange-400">Then</span> decide.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
              >
                <span className="text-xs font-semibold text-emerald-400">Paused. Didn&apos;t binge.</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-400">
                  <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
