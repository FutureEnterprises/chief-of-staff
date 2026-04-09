'use client'

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function PricingSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="pricing" className="relative py-32" ref={ref}>
      <div className="mx-auto max-w-5xl px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative z-10 mb-20 text-center"
        >
          <h2 className="mb-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Pick Your Level of Accountability
          </h2>
          <p className="mx-auto max-w-xl text-lg font-light text-gray-400">
            Free gets you started. Pro means the AI never shuts up until your sh*t is done.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* Free tier */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            whileHover={{ y: -4 }}
            className="relative z-10 w-full max-w-md justify-self-end overflow-hidden rounded-2xl border border-white/5 p-10"
            style={{
              background: 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(15,15,15,0.8))',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h3 className="mb-2 text-xl font-medium text-gray-300">Free</h3>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">$0</span>
              <span className="font-medium text-gray-500">/forever</span>
            </div>

            <ul className="mb-10 space-y-4">
              {['100 active tasks', 'Morning & night reviews', '20 AI assists / month', 'Daily email briefing'].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-gray-400">
                    <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm text-gray-300">{f}</span>
                </li>
              ))}
              <li className="flex items-start gap-3 opacity-30">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-gray-500">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-sm text-gray-500 line-through">The AI that won&apos;t stop</span>
              </li>
            </ul>

            <Link
              href="/sign-up"
              className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 text-center font-medium text-gray-300 transition-colors hover:bg-white/10"
            >
              Start free
            </Link>
          </motion.div>

          {/* Pro tier */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7 }}
            whileHover={{ scale: 1.02 }}
            className="relative z-20 w-full max-w-md scale-105 rounded-3xl p-[2px] shadow-[0_0_40px_-10px_rgba(255,102,0,0.3)] transition-shadow hover:shadow-[0_0_60px_-5px_rgba(255,102,0,0.5)] md:-ml-4"
            style={{
              background: 'linear-gradient(135deg, #ff6600, #4a0000, #1a1a1a)',
            }}
          >
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-2px)] bg-[#111] p-10">
              {/* Subtle texture */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==")`
              }} />

              <div className="relative z-10">
                <div className="mb-6 w-max rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(255,102,0,0.5)]">
                  No Mercy
                </div>

                <h3 className="mb-2 text-xl font-bold text-white">Pro</h3>
                <div className="mb-8 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$12</span>
                  <span className="font-medium text-gray-400">/mo</span>
                </div>

                <ul className="mb-10 flex-grow space-y-4">
                  {[
                    'Unlimited tasks',
                    'Unlimited AI assists',
                    'Auto follow-ups that don\'t quit',
                    'See every pattern and excuse',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-orange-500">
                        <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-medium text-white">{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 animate-pulse text-orange-500">
                      <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="border-b border-orange-500/30 text-sm font-bold text-orange-500">
                      The AI that hounds your a$$
                    </span>
                  </li>
                </ul>

                <Link
                  href="/sign-up"
                  className="block w-full rounded-xl bg-gradient-to-r from-orange-600 to-red-600 py-4 text-center font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all hover:shadow-[0_0_40px_rgba(255,102,0,0.5)]"
                >
                  Get Hounded
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
