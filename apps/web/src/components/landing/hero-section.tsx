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

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="mt-8 max-w-xl text-lg text-gray-400 sm:text-xl"
          >
            Every commitment tracked. Every deadline enforced. Every excuse{' '}
            <span className="border-b-2 border-orange-500 font-bold text-orange-400" style={{ textShadow: '0 0 12px rgba(255, 102, 0, 0.6)' }}>
              eliminated
            </span>
            . Your Execution Score doesn&apos;t lie. Your streak doesn&apos;t care how you feel.
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
              <span className="relative z-10">Start Enforcing</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative z-10">
                <path d="M8 1v14M1 8l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-90 8 8)" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <a
              href="#engine"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/10"
            >
              See How It Works
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-y-1">
                <path d="M7 1v12m0 0l5-5m-5 5L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </motion.div>
        </div>

        {/* Floating briefing card */}
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
            {/* Scanline overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{
              background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)',
              backgroundSize: '100% 4px',
            }} />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-white">Morning Briefing</span>
              </div>
              <span className="font-mono text-xs text-gray-500">06:00 AM</span>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="flex items-start gap-4 rounded-lg border border-white/5 bg-black/40 p-3"
              >
                <div className="h-10 w-1 rounded-full bg-red-600" />
                <div>
                  <p className="text-sm font-semibold text-white">You dropped this yesterday</p>
                  <p className="mt-1 text-xs text-gray-400">Finalize the proposal. No, seriously. Do it now.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.5, x: 0 }}
                transition={{ delay: 1.4 }}
                className="flex items-start gap-4 rounded-lg border border-white/5 bg-black/20 p-3"
              >
                <div className="h-10 w-1 rounded-full bg-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-300 line-through">Gym (Done)</p>
                  <p className="mt-1 text-xs text-gray-500">At least you showed up for something.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 }}
                className="flex items-start gap-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3"
              >
                <div className="h-10 w-1 rounded-full bg-orange-500" />
                <div>
                  <p className="text-sm font-semibold text-orange-400">Still haven&apos;t followed up</p>
                  <p className="mt-1 text-xs text-gray-400">3rd reminder. I&apos;m not going away.</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
