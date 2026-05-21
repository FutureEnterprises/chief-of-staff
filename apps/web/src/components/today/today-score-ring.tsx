'use client'
/**
 * TodayScoreRing — the signature spatial atom of /today.
 *
 * Design DNA: Whoop strain ring + Oura readiness ring. Built ENTIRELY in
 * CSS — no SVG. The ring shape comes from a single `conic-gradient()` masked
 * with a transparent inner disc. The Whoop/Oura premium feel comes from:
 *   - layered radial glows behind the ring (atmospheric depth)
 *   - inner ring inset shadow (the "glass under glass" double-bezel)
 *   - HUGE biometric-style number centered (display weight, tabular nums)
 *   - 3 satellite mini-rings orbiting the main ring
 *   - pulse animation on the perimeter when a danger window is active
 *
 * Color discipline: signature orange. We do NOT pivot to teal/mint. The
 * Whoop/Oura DNA lives in the SHAPES and DEPTH, not the palette.
 */
import { motion } from 'motion/react'

type SatelliteMetric = {
  label: string
  value: number
  /** 0-100, drives the satellite mini-ring fill */
  percent: number
  /** Optional formatter for the display value */
  display?: string
}

interface TodayScoreRingProps {
  score: number
  /** Soft caption under the score (e.g. "Today" or "Today · 51% kept") */
  caption?: string
  /** Color tone of the ring perimeter — score-driven semantic tier */
  tone?: 'positive' | 'neutral' | 'warning' | 'danger'
  /** When the user is inside an active danger window, the perimeter pulses */
  pulse?: boolean
  /** Satellite mini-rings orbiting the main ring */
  satellites?: SatelliteMetric[]
}

const TONE_STOPS: Record<NonNullable<TodayScoreRingProps['tone']>, [string, string]> = {
  positive: ['#ff8020', '#ffb066'],
  neutral: ['#ff6600', '#ff9040'],
  warning: ['#ff4a1a', '#ff8020'],
  danger: ['#e02b1a', '#ff5a1f'],
}

export function TodayScoreRing({
  score,
  caption = 'Today',
  tone = 'neutral',
  pulse = false,
  satellites = [],
}: TodayScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const deg = Math.round((clamped / 100) * 360)
  const [stopFrom, stopTo] = TONE_STOPS[tone]

  // CSS-only ring: conic-gradient draws the arc, an inner div masks the hole.
  // Demo equivalent:
  //   background: conic-gradient(from -90deg, #ff8020 0deg, #ffb066 230deg, rgba(255,255,255,0.05) 230deg 360deg);
  const ringBackground = `conic-gradient(from -90deg, ${stopFrom} 0deg, ${stopTo} ${deg}deg, rgba(255,255,255,0.04) ${deg}deg 360deg)`

  return (
    <div className="relative isolate flex flex-col items-center">
      {/* AMBIENT GLOW PLANE — slow-drifting orange wash that lives behind the
          ring. motion/react `animate` so it pauses off-screen and doesn't
          burn battery. Soft, low opacity, large radius for "atmosphere". */}
      <motion.div
        aria-hidden
        animate={{
          opacity: [0.45, 0.7, 0.45],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-0 -z-10 mx-auto h-[340px] w-[340px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(255,102,0,0.28) 0%, rgba(255,102,0,0.10) 40%, transparent 70%)',
        }}
      />

      {/* OUTER PULSE RING — only visible during an active danger window.
          Pulses warm orange to communicate "this is the moment". */}
      {pulse && (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.0, 0.6, 0.0], scale: [1, 1.05, 1.1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          className="pointer-events-none absolute left-1/2 top-[12px] h-[296px] w-[296px] -translate-x-1/2 rounded-full"
          style={{
            boxShadow:
              '0 0 0 2px rgba(255,90,30,0.35), 0 0 60px 8px rgba(255,90,30,0.45)',
          }}
        />
      )}

      {/* MAIN RING — conic-gradient drawn directly via background.
          The inner disc covers the middle of the gradient to make it a ring. */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="relative grid h-[296px] w-[296px] place-items-center rounded-full"
        style={{
          background: ringBackground,
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px -20px rgba(255,102,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* INNER DISC — the "hole" of the donut. Slightly recessed feel via
            inset shadow. The disc is the dark warm charcoal of the page. */}
        <div
          className="relative grid h-[248px] w-[248px] place-items-center rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, #1a1614 0%, #0e0d0b 70%)',
            boxShadow:
              'inset 0 2px 6px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* SCORE — biometric-style display number. Tabular mono, very tight
              leading, 80px+. This is the photo-atom for the screenshot. */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="font-mono text-[88px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-foreground"
              style={{ textShadow: '0 1px 0 rgba(0,0,0,0.4)' }}
            >
              {clamped}
            </motion.div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400/90">
              {caption}
            </p>
          </div>
        </div>
      </motion.div>

      {/* SATELLITE METRICS — small rings orbiting below the main ring.
          Each is its own conic-gradient ring. Same recipe, smaller scale. */}
      {satellites.length > 0 && (
        <div className="mt-7 grid w-full max-w-[420px] grid-cols-3 gap-3">
          {satellites.map((s, i) => (
            <SatelliteRing key={s.label} metric={s} delay={0.35 + i * 0.08} />
          ))}
        </div>
      )}
    </div>
  )
}

function SatelliteRing({
  metric,
  delay,
}: {
  metric: SatelliteMetric
  delay: number
}) {
  const pct = Math.max(0, Math.min(100, metric.percent))
  const deg = Math.round((pct / 100) * 360)
  const background = `conic-gradient(from -90deg, #ff6600 0deg, #ff9040 ${deg}deg, rgba(255,255,255,0.04) ${deg}deg 360deg)`

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.02 }}
      className="flex flex-col items-center rounded-2xl border border-white/[0.04] bg-white/[0.015] px-2 py-3 backdrop-blur-sm"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px -12px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="relative grid h-[64px] w-[64px] place-items-center rounded-full"
        style={{
          background,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div
          className="grid h-[52px] w-[52px] place-items-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 35%, #19150f 0%, #0e0d0b 70%)',
          }}
        >
          <span className="font-mono text-[16px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-foreground">
            {metric.display ?? metric.value}
          </span>
        </div>
      </div>
      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        {metric.label}
      </p>
    </motion.div>
  )
}
