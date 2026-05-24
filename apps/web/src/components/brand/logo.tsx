'use client'
import { cn } from '@/lib/utils'

interface CoylLogoProps {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  theme?: 'light' | 'dark' | 'auto'
}

const sizes = {
  sm: { icon: 22, text: 'text-sm', gap: 'gap-1.5' },
  md: { icon: 30, text: 'text-lg', gap: 'gap-2' },
  lg: { icon: 44, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 60, text: 'text-4xl', gap: 'gap-4' },
}

/**
 * CoylMark — HELD PAUSE · LOZENGE.
 *
 * Hairline 270° arc opening to the right, with a precise filled
 * lozenge (rotated square diamond) at the geometric center. The arc
 * is the bracket; the lozenge is the moment being held. The
 * composition reads as "something captured within boundaries."
 *
 * Editorial-luxury aesthetic — matches the Letter / Aesop / A24 /
 * Hermès / Bulgari reference set already running through the site
 * (Instrument Serif italic, cream backgrounds, hairline rules). The
 * lozenge is the section-divider dingbat from fine printing — a
 * jewel-like fixed point.
 *
 * Geometric properties:
 *   • viewBox 0 0 24 24 — scales crisply from 16px favicon to 1024px
 *     iOS app icon.
 *   • Arc center (12, 12), radius 9.5, stroke-width 1.75. The
 *     hairline weight (≈7.3% of size) holds at 16px favicon while
 *     reading as restrained at hero/billboard scale.
 *   • Arc spans from 1:30 (18.72, 5.28) the long way counter-
 *     clockwise to 4:30 (18.72, 18.72), leaving a 90° opening on the
 *     right.
 *   • Endcaps butt (not round) — sharper, more editorial.
 *   • Lozenge: 3.2 × 3.2 unit rect rotated 45° about (12, 12). Fills
 *     ≈17% of the arc's interior — visible at all sizes without
 *     competing with the arc.
 *   • Solid orange #ff6600 (no gradient). Hermès orange does the
 *     work alone; gradients read as 2018-vintage tech.
 *
 * Replaces the previous bold gradient C (which read close to Capital
 * One / Citrix / Cox) with a distinct silhouette unused by any
 * competitor in behavioral health or proactive-AI.
 *
 * Selected from the /logo-options review on 2026-05-22. The three
 * variants considered: SPARK (asterisk center), CROSS (+ center —
 * rejected for medical-cross semantic that conflicts with the
 * /safety page's "not a medical device" positioning), and LOZENGE
 * (chosen).
 */
export function CoylMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* The hairline 270° arc — bracket. */}
      <path
        d="M 18.72 5.28 A 9.5 9.5 0 1 0 18.72 18.72"
        stroke="#ff6600"
        strokeWidth="1.75"
        strokeLinecap="butt"
        fill="none"
      />
      {/* The lozenge — the moment being held. Rotated 3.2px square
          centered at the geometric midpoint. */}
      <rect
        x="10.4"
        y="10.4"
        width="3.2"
        height="3.2"
        transform="rotate(45 12 12)"
        fill="#ff6600"
      />
    </svg>
  )
}

/**
 * Full COYL logotype — mark + wordmark. Mark sits left, wordmark right.
 * The Y in the wordmark stays orange (eyepath anchor + reinforces the
 * accent letter). With the new mark also rendering as a C, the read
 * becomes: [orange C glyph] COYL — letterforms going left-to-right,
 * mark and wordmark amplifying each other instead of fighting.
 */
export function CoylLogo({
  className,
  showWordmark = true,
  size = 'md',
  theme = 'auto',
}: CoylLogoProps) {
  const { icon, text, gap } = sizes[size]

  const wordmarkClass = cn(
    'font-bold tracking-[-0.04em] leading-none select-none',
    text,
    theme === 'dark'
      ? 'text-[#f5f5f0]'
      : theme === 'light'
        ? 'text-[#1a1a1a]'
        : 'text-foreground',
  )

  return (
    <div className={cn('flex items-center', gap, className)}>
      <CoylMark size={icon} />
      {showWordmark && (
        <span className={wordmarkClass}>
          CO<span style={{ color: '#ff6600' }}>Y</span>L
        </span>
      )}
    </div>
  )
}

/** Standalone icon-only mark for favicons, app icons, social previews. */
export function CoylIcon({ size = 32, className }: { size?: number; className?: string }) {
  return <CoylMark size={size} className={className} />
}
