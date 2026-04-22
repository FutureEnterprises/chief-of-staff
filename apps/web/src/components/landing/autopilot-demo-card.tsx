'use client'

import { motion } from 'motion/react'

/**
 * AutopilotDemoCard — the "AUTOPILOT DETECTED → paused" chat mock that
 * appears on the homepage hero, on /caught, and anywhere else we want a
 * viewer to see the product-in-action in the first second.
 *
 * Animation sequence (baked in):
 *   t=0       card floats in (y: 40 → 0, rotateY: -5 → 0)
 *   t=0       card begins slow ambient float (y: 0 → -10 → 0, 6s loop)
 *   t=0       red "AUTOPILOT DETECTED" dot starts pulsing (1.4s loop)
 *   t=1.2s    "You: Opened the fridge. Again." slides in
 *   t=1.6s    "COYL: You're not hungry..." slides in
 *   t=2.2s    "Paused. Didn't binge ✓" fades up
 *
 * The delays are tuned so a scroll-in arrival lands on the first user
 * line; if the viewer pauses on the page for 3 seconds they see the full
 * sequence end-to-end. Don't retime without A/B testing — the 3-beat
 * rhythm tests well on both desktop and mobile.
 *
 * No props. The card is self-contained so it can drop into any surface
 * without wiring data. A future enhancement could accept `scene` +
 * `response` + `outcome` overrides for wedge-specific demos (e.g. a
 * /work version showing "Didn't send the follow-up" → "Send it now").
 * Leave as-is until we ship wedge-specific /caught variants.
 */
export function AutopilotDemoCard({
  className = '',
  time = '9:12 PM',
}: {
  className?: string
  /** Time label in the card header. Default "9:12 PM" matches the homepage. */
  time?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateY: -5 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: 0.6, duration: 1, ease: [0.23, 1, 0.32, 1] }}
      className={`relative ${className}`}
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
        {/* Scanline overlay — subtle CRT feel that reinforces the "system"
            metaphor. 20% opacity so it doesn't drown the type. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)',
            backgroundSize: '100% 4px',
          }}
        />

        {/* Header: pulsing alert dot + time */}
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="h-3 w-3 rounded-full bg-red-500"
            />
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Autopilot detected
            </span>
          </div>
          <span className="font-mono text-xs text-gray-500">{time}</span>
        </div>

        {/* Beat 1: the user action */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="rounded-lg border border-white/5 bg-black/40 p-3"
          >
            <p className="mb-1 text-[11px] font-mono uppercase tracking-wider text-gray-500">
              You
            </p>
            <p className="text-sm text-white">Opened the fridge. Again.</p>
          </motion.div>

          {/* Beat 2: COYL's interrupt */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
            className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3"
          >
            <p className="mb-1 text-[11px] font-mono uppercase tracking-wider text-orange-500">
              COYL
            </p>
            <p className="text-sm leading-relaxed text-orange-100">
              You&apos;re not hungry. This is your usual night loop.
              <br />
              Drink water. Walk 5 minutes.{' '}
              <span className="font-bold text-orange-400">Then</span> decide.
            </p>
          </motion.div>

          {/* Beat 3: outcome — the emotional payoff */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2 }}
            className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <span className="text-xs font-semibold text-emerald-400">
              Paused. Didn&apos;t binge.
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-emerald-400"
            >
              <path
                d="M13 4L6 12L3 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
