'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      </svg>
    ),
    title: 'Morning + Night Check-ins',
    body: 'Every morning: what are you doing today? Every night: did you actually do it? Two check-ins that keep you honest. No more "I\'ll get to it tomorrow."',
    footer: { left: 'Always on', right: '6am + 10pm' },
    glowColor: 'orange',
    offset: false,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'You Said It. We Saved It.',
    body: 'Every task, every promise, every "I\'ll do it later" — logged. COYL remembers what you committed to even when you conveniently forget.',
    progress: 78,
    glowColor: 'red',
    offset: false,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    title: 'It Gets Louder',
    body: 'Ignore a task? First reminder is friendly. Second is firm. Third? It\'s in your face. COYL escalates until you deal with it or admit you\'re ducking it.',
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
        {feature.progress !== undefined && (
          <div className="flex flex-col gap-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-orange-500"
                initial={{ width: 0 }}
                animate={inView ? { width: `${feature.progress}%` } : {}}
                transition={{ delay: 0.5 + index * 0.15, duration: 1, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
            <span className="text-right font-mono text-xs text-gray-500">
              {feature.progress}% follow-through rate
            </span>
          </div>
        )}
        {!feature.footer && feature.progress === undefined && (
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
          How It Works
        </h2>
        <h3 className="max-w-2xl text-3xl font-bold tracking-tight text-white md:text-5xl">
          An AI that won&apos;t let you off the hook.
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
