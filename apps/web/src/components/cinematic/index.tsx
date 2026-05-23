/**
 * Cinematic design primitives — the shared layer that lets every
 * surface adopt the May 2026 cinematic treatment without rewriting
 * each page individually.
 *
 * Refero synthesis:
 *   - V7labs (75236d28) — Dark Slate Operational Hub. Primary
 *     palette: warm orange + dark slate. The single-accent system.
 *   - Sequel (50c47480) — Black Canvas Sharp Typography. Editorial
 *     restraint, serif-italic display, gallery-like negative space.
 *   - ThoughtLab (a6076091) — Midnight Command Center. Generous
 *     65px-scaled section gaps, single saturated accent for action,
 *     command-center hierarchy.
 *
 * Design language:
 *   Canvas       deep warm charcoal #0e0d0b (matches existing /today)
 *   Text         warm off-white #f8f1e4 → #d9d1c2 → #a59a87 (3 levels)
 *   Accent       #ff6600 orange, used surgically (not decoratively)
 *   Display      serif italic (Instrument Serif), -0.025em tracking
 *   Body         sans (Geist Sans), tight line-height
 *   Sections     dual-radial orange glow + scan-line texture overlay
 *   Buttons      pill 9999px radius; primary = orange→red gradient
 *   Rhythm       80-120px section gap, sectioned by hairline rules
 *
 * The rules:
 *   - Single orange accent; never decorate, only direct attention
 *   - Hairline rules only; no card shadows unless atmospheric
 *   - Generous negative space (Sequel-grade gallery restraint)
 *   - Serif italic owns display weight; sans owns body; mono owns
 *     captions/eyebrows
 */
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

// ───────────────────── tokens ─────────────────────

export const CINEMATIC_TOKENS = {
  bg: '#0e0d0b',
  bgElevated: '#111010',
  bgSurface: 'rgba(255, 255, 255, 0.03)',
  text: '#f8f1e4',
  textMuted: '#d9d1c2',
  textDim: '#a59a87',
  textHushed: '#7a7264',
  accent: '#ff6600',
  accentSoft: '#ffa37a',
  hairline: 'rgba(255, 255, 255, 0.06)',
  ringSubtle: 'rgba(255, 255, 255, 0.15)',
} as const

// ───────────────────── primitives ─────────────────────

/**
 * CinematicScrim — the dark cinematic wrapper. Drops in around any
 * page section to provide the warm-charcoal canvas + dual radial
 * glow + subtle scan-line texture. Self-contained: no global CSS
 * changes required.
 *
 * Use `bleedToCream` to fade the bottom edge into the cream
 * homepage (or any light surface) so the transition reads as a
 * deliberate chapter cut, not a hard cliff.
 */
export function CinematicScrim({
  children,
  className = '',
  bleedToCream = false,
  glowPositions,
}: {
  children: ReactNode
  className?: string
  bleedToCream?: boolean
  /** Override the default dual-radial glow anchors (defaults: upper-left + mid-right). */
  glowPositions?: { primary: string; secondary: string }
}) {
  const glow = glowPositions ?? {
    primary: '45% 60% at 18% 32%',
    secondary: '40% 60% at 78% 60%',
  }
  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      {/* Canvas — deep warm charcoal */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: CINEMATIC_TOKENS.bg }}
      />
      {/* Dual radial orange glow — two pools, atmospheric not decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(${glow.primary}, rgba(255, 138, 76, 0.18) 0%, transparent 70%),
            radial-gradient(${glow.secondary}, rgba(255, 102, 0, 0.16) 0%, transparent 70%)
          `,
        }}
      />
      {/* Scan-line texture — the Black-Mirror-meets-behavioral-psych
          surface noise. Pure CSS, edge-bulletproof. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />
      {/* Cream bleed — optional fade-out at the bottom edge for hard
          dark→light page transitions. */}
      {bleedToCream && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 -z-10"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, transparent 0%, rgba(250,250,247,0.0) 30%, rgba(250,250,247,0.85) 90%, #fafaf7 100%)',
          }}
        />
      )}
      {children}
    </section>
  )
}

/**
 * CinematicEyebrow — small caps mono kicker label with hairline
 * accent rule on the left. The "01 · The stack" / "Autopilot
 * interruption" pattern.
 */
export function CinematicEyebrow({
  label,
  tone = 'accent',
  className = '',
}: {
  label: string
  tone?: 'accent' | 'muted'
  className?: string
}) {
  const color = tone === 'accent' ? 'text-orange-400' : 'text-[#7a7264]'
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span
        aria-hidden
        className={tone === 'accent' ? 'h-px w-10 bg-orange-500' : 'h-px w-10 bg-[#7a7264]'}
      />
      <span
        className={`font-mono text-[10px] font-medium uppercase tracking-[0.32em] ${color}`}
      >
        {label}
      </span>
    </div>
  )
}

/**
 * CinematicDisplay — the focal serif display headline. Variants
 * control size: 'hero' (cold-open scale), 'section' (chapter
 * heading), 'anchor' (closing line). Italic-orange accent slots
 * are handled by the caller via <span className="italic text-orange-400">.
 */
export function CinematicDisplay({
  children,
  variant = 'section',
  className = '',
  as: As = 'h2',
}: {
  children: ReactNode
  variant?: 'hero' | 'section' | 'anchor'
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}) {
  const sizing =
    variant === 'hero'
      ? 'text-[clamp(2.4rem,5.8vw,4.6rem)] leading-[1.04] tracking-[-0.025em]'
      : variant === 'anchor'
        ? 'text-3xl leading-[1.15] tracking-[-0.02em] md:text-6xl'
        : 'text-3xl leading-[1.05] tracking-[-0.025em] md:text-5xl'
  return (
    <As
      className={`font-serif font-normal text-[#f8f1e4] ${sizing} ${className}`}
    >
      {children}
    </As>
  )
}

/**
 * CinematicBody — calm body paragraph. `tone='muted'` for primary,
 * `tone='dim'` for secondary, `tone='hushed'` for tertiary. Cap
 * width at 2xl so reading rhythm matches the editorial system.
 */
export function CinematicBody({
  children,
  tone = 'muted',
  className = '',
}: {
  children: ReactNode
  tone?: 'muted' | 'dim' | 'hushed'
  className?: string
}) {
  const color =
    tone === 'muted'
      ? 'text-[#d9d1c2]'
      : tone === 'dim'
        ? 'text-[#a59a87]'
        : 'text-[#7a7264]'
  return (
    <p className={`max-w-2xl text-base leading-[1.65] ${color} md:text-lg ${className}`}>
      {children}
    </p>
  )
}

/**
 * CinematicPillPrimary — the orange→red gradient pill button.
 * Animated lift on hover, soft glow on focus.
 */
export function CinematicPillPrimary({
  children,
  className = '',
  ...rest
}: HTMLMotionProps<'a'> & { children: ReactNode }) {
  return (
    <motion.a
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] hover:shadow-[0_18px_44px_-12px_rgba(255,102,0,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0d0b] ${className}`}
      {...rest}
    >
      {children}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden
      >
        <path
          d="M1 7h12m0 0L8 2m5 5L8 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.a>
  )
}

/**
 * CinematicPillGhost — the translucent dark pill. Pairs with the
 * primary CTA as a quieter inspection-path action.
 */
export function CinematicPillGhost({
  children,
  className = '',
  ...rest
}: HTMLMotionProps<'a'> & { children: ReactNode }) {
  return (
    <motion.a
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18 }}
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-[#e7dccb] hover:border-orange-300 hover:text-orange-300 ${className}`}
      {...rest}
    >
      {children}
    </motion.a>
  )
}

/**
 * CinematicCard — dark surface card with optional warm glow halo
 * behind. Used for inline cinematic moments within a CinematicScrim
 * section (the audit result card, the moment-loop card).
 */
export function CinematicCard({
  children,
  className = '',
  withGlow = true,
}: {
  children: ReactNode
  className?: string
  withGlow?: boolean
}) {
  return (
    <div className="relative">
      {withGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] opacity-90 blur-3xl"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 50%, rgba(255, 138, 76, 0.30) 0%, rgba(255, 102, 0, 0.12) 45%, transparent 75%)',
          }}
        />
      )}
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111010] p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5),0_10px_30px_-10px_rgba(255,102,0,0.18)] md:p-8 ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * CinematicMonoLabel — small mono uppercase tag (no rule). Used
 * for inline tags within sections.
 */
export function CinematicMonoLabel({
  children,
  tone = 'muted',
  className = '',
}: {
  children: ReactNode
  tone?: 'accent' | 'muted' | 'success'
  className?: string
}) {
  const color =
    tone === 'accent'
      ? 'text-orange-400'
      : tone === 'success'
        ? 'text-emerald-400'
        : 'text-[#7a7264]'
  return (
    <span
      className={`font-mono text-[10px] font-medium uppercase tracking-[0.28em] ${color} ${className}`}
    >
      {children}
    </span>
  )
}
