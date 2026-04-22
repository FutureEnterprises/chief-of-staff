'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { AutopilotDemoCard } from './autopilot-demo-card'

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

export function HeroSection() {
  return (
    <section className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-6 pt-32 md:px-12 lg:pt-48">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Typography */}
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
              Behavior Enforcement
            </span>
          </motion.div>

          {/* Big type */}
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

          {/* Hook headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="mt-8 max-w-xl text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl"
          >
            You don&apos;t fail because you don&apos;t know what to do.
            <br />
            <span className="border-b-2 border-orange-500 text-orange-400" style={{ textShadow: '0 0 12px rgba(255, 102, 0, 0.6)' }}>
              You fail in the exact same moments
            </span>
            {' '}— over and over.
          </motion.h2>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7 }}
            className="mt-4 max-w-xl text-base text-gray-400 sm:text-lg"
          >
            COYL catches you in real time — before a bad choice turns into a bad day, and a bad day turns into a bad week.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/sign-up"
              className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,102,0,0.5)]"
            >
              <span className="relative z-10">Start catching your patterns</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative z-10">
                <path d="M8 1v14M1 8l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-90 8 8)" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <a
              href="#engine"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/10"
            >
              See how it works
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-y-1">
                <path d="M7 1v12m0 0l5-5m-5 5L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </motion.div>
        </div>

        {/* Floating briefing card — extracted so /caught and other landings
            can reuse the same demo. Don't inline it back; the animation
            timings are load-bearing across surfaces. */}
        <AutopilotDemoCard className="hidden lg:col-span-5 lg:block" />
      </div>
    </section>
  )
}
