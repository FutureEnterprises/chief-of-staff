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
 * CoylMark — modern geometric "C".
 *
 * Bold open arc forming the letter C. ~270° of a circle, heavy stroke,
 * round endcaps. Orange→red gradient from top to bottom-right gives the
 * mark visual momentum — reads like a C being drawn left-to-right, not
 * a static O with a hole. The opening on the right keeps the negative
 * space active so the eye finishes the shape itself.
 *
 * Why a clean C, not the previous broken-loop:
 *   • The broken-loop concept tried to encode "interrupted pattern" in
 *     the silhouette. It read as a generic loading spinner at small
 *     sizes and lost its meaning entirely below 16px.
 *   • A bold C is the universally-readable letterform, plays directly
 *     against the wordmark, and references the brand name (COYL) AND
 *     the etymology (coil) without needing a visual gimmick.
 *   • Sized for favicon legibility: the 4px stroke at 24px viewBox is
 *     thick enough to survive the 16×16 browser tab raster.
 *
 * Geometric properties:
 *   • viewBox 0 0 24 24 — scales crisply from 16px favicon to 1024px
 *     iOS app icon.
 *   • Arc center (12, 12), radius 8, stroke-width 4. Keeps the inner
 *     bowl readable while the stroke fills enough visual weight.
 *   • Arc spans from ≈345° down through 180° to ≈15° (the long way
 *     around) leaving a 30° gap on the right — the C opening.
 *   • Linear gradient #ff6600 → #ef4444 oriented top → bottom-right so
 *     the warmer hue reads first (we're left-to-right readers).
 *
 * Per-size unique gradient id so multiple marks on the same page don't
 * clash via the global SVG id namespace.
 */
export function CoylMark({ size = 30, className }: { size?: number; className?: string }) {
  const gradId = `coyl-c-${size}`

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
      <defs>
        <linearGradient
          id={gradId}
          x1="4"
          y1="4"
          x2="20"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ff6600" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      {/* The C — 270° arc opening on the right. Endpoints calculated so
          the arc takes the long way around (large-arc flag 1, sweep
          flag 0 = counter-clockwise) leaving the right side open. */}
      <path
        d="M 19.7 7.5 A 8 8 0 1 0 19.7 16.5"
        stroke={`url(#${gradId})`}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
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
