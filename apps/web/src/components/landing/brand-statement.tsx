'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function BrandStatement() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="philosophy"
      ref={ref}
      className="relative overflow-hidden border-y border-white/5 bg-[#111] py-32"
    >
      {/* Vertical center line */}
      <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* Animated coil bars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="group relative mx-auto mb-12 flex h-28 w-12 cursor-pointer flex-col items-center justify-center"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="mb-2 h-1 rounded-full bg-orange-500/80 last:mb-0"
              style={{ width: i === 3 ? '90%' : '100%' }}
              animate={
                i === 3
                  ? { scaleY: [1, 0.3, 1], opacity: [0.5, 1, 0.5] }
                  : {}
              }
              transition={
                i === 3
                  ? { duration: 4, repeat: Infinity, ease: [0.68, -0.55, 0.265, 1.55] }
                  : {}
              }
            />
          ))}
          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-orange-500 opacity-20 blur-[40px] mix-blend-screen transition-opacity group-hover:opacity-40" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-4xl font-black tracking-tighter text-white md:text-6xl"
        >
          Why you keep failing
          <br />
          (and it&apos;s{' '}
          <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            not what you think
          </span>).
        </motion.h2>

        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mx-auto mt-10 flex max-w-2xl flex-col gap-2 text-lg text-gray-400 md:text-xl"
        >
          <li>You don&apos;t forget what to do.</li>
          <li>You don&apos;t lack discipline.</li>
          <li>You don&apos;t need more motivation.</li>
        </motion.ul>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mx-auto mt-10 max-w-2xl text-2xl font-bold leading-tight text-white md:text-3xl"
        >
          You go on{' '}
          <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            autopilot
          </span>.
          <br />
          <span className="mt-2 inline-block text-xl font-medium text-gray-500">Autopilot wins.</span>
        </motion.p>

        {/* The knife-line. Lands after the "autopilot wins" beat so the
            emotional payoff stacks: identify the problem \u2192 name the
            mechanism \u2192 name the thing that actually does the damage. */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="mx-auto mt-14 max-w-3xl border-l-[3px] border-orange-500/60 bg-orange-500/5 px-6 py-5 text-left text-xl font-bold leading-snug text-white md:text-2xl"
        >
          You don&apos;t ruin your progress in one moment.<br />
          <span className="text-orange-400">You ruin it in the story you tell yourself after.</span>
        </motion.p>
      </div>
    </section>
  )
}
