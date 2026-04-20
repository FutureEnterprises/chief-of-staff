'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

const features = [
  // v3 spec: three blocks, titles + arrow-body pairs verbatim from
  // COYL_homepage_v3_FINAL.md §"WHAT COYL DOES".
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
    ),
    title: 'Detects your pattern',
    body: 'Learns when you usually slip.',
    footer: { left: 'Your patterns', right: 'Named' },
    glowColor: 'orange',
    offset: false,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
      </svg>
    ),
    title: 'Interrupts the moment',
    body: 'Stops you before you act.',
    footer: { left: 'Rescue flow', right: 'Break the script' },
    glowColor: 'red',
    offset: false,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/>
      </svg>
    ),
    title: 'Stops the spiral',
    body: 'So one mistake doesn\'t become a full collapse.',
    footer: { left: 'Recovery', right: 'Resume, don\u2019t restart' },
    glowColor: 'orange',
    offset: true,
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0]
  index: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-[0_0_30px_-5px_rgba(255,102,0,0.2)] ${feature.offset ? 'md:translate-y-8' : ''}`}
      style={{
        background: 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(15,15,15,0.8))',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Corner glow */}
      <div
        className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-[50px] transition-colors duration-500 ${
          feature.glowColor === 'orange'
            ? 'bg-orange-500/20 group-hover:bg-orange-500/40'
            : 'bg-red-700/20 group-hover:bg-red-700/40'
        }`}
      />

      {/* Icon */}
      <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-full border ${
        feature.glowColor === 'orange'
          ? 'border-orange-500/30 bg-orange-500/10 text-orange-500'
          : 'border-white/10 bg-white/5 text-white'
      }`}>
        <span className="transition-transform duration-700 group-hover:rotate-180">{feature.icon}</span>
      </div>

      <h4 className="mb-3 text-xl font-bold text-white">{feature.title}</h4>
      <p className="mb-6 text-sm font-light leading-relaxed text-gray-400">{feature.body}</p>

      {/* Footer variants */}
      <div className="mt-auto">
        {feature.footer && (
          <div className="flex justify-between rounded border border-white/5 bg-black/40 px-4 py-2 font-mono text-xs text-gray-500">
            <span>{feature.footer.left}</span>
            <span className="text-orange-500">{feature.footer.right}</span>
          </div>
        )}
        {/* Progress-bar metric branch removed with the fake "82%" number.
            If real cohort data becomes available, re-add with data wired
            from /admin metrics. */}
        {!feature.footer && (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-gradient-to-br from-orange-500 to-red-600 text-xs font-bold text-white">
                AI
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
              Active Ping
              <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function FeaturesGrid() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="engine" className="relative mx-auto max-w-7xl px-6 py-32 md:px-12" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          How COYL works
        </h2>
        <h3 className="max-w-2xl text-3xl font-bold tracking-tight text-white md:text-5xl">
          COYL interrupts autopilot.
        </h3>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((f, i) => (
          <FeatureCard key={f.title} feature={f} index={i} />
        ))}
      </div>
    </section>
  )
}
