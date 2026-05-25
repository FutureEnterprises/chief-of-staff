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
 * CoylMark — AZURE FACET · PULSING SIGNAL.
 *
 * Two-shape composition:
 *   1. Solid filled A-frame — outer triangle with a tilted apex (Azure-
 *      style asymmetry) cut by an inner triangle to leave a negative
 *      space at center. Reads as a faceted "A" with weight, not as a
 *      flat outline.
 *   2. 4-point compass sparkle in the negative space center, pulsing.
 *      The sparkle is the moment of awareness — the interrupt firing,
 *      visible. CSS keyframe pulses opacity + scale on a 2.4s loop;
 *      `prefers-reduced-motion` halts the animation per A11y guidance.
 *
 * Why this replaces the LOZENGE mark (May 2026 → May 2026 revision):
 * the previous hairline-C + lozenge was editorial-quiet but failed at
 * the founder's "doesn't hit" test. The A-frame brings Azure-style
 * sculptural weight, the sparkle introduces a pulse that telegraphs
 * "live behavioral signal" — both upgrades the previous mark lacked.
 *
 * Geometric properties:
 *   • viewBox 0 0 24 24 — scales 16px favicon → 1024px iOS app icon.
 *   • Outer facet: triangle (13,2)→(22.5,22)→(1.5,22). Apex shifted
 *     1px right of geometric center → Azure-style forward tilt.
 *   • Inner cut-out (negative space): (13,9)→(18.5,20)→(6.5,20). Same
 *     tilt; cream background bleeds through.
 *   • Sparkle: 4-point cross at (12.5, 16.5), outer span ~5.5px,
 *     inner waist ~1.4px. Slightly right of geometric center to
 *     balance the outer tilt.
 *   • Solid orange #ff6600 throughout. No gradients.
 *
 * Animation: see `.coyl-sparkle-pulse` keyframe in globals.css. Falls
 * back to a non-animated static sparkle if reduced-motion is set.
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
      {/* Outer facet — solid orange A-frame triangle with right-tilt. */}
      <polygon points="13,2 22.5,22 1.5,22" fill="#ff6600" />
      {/* Inner cut-out — same-tilt smaller triangle. Fill defaults to
          cream (#fafaf7) for marketing surfaces; the
          `.coyl-mark-inner` class lets globals.css override the fill
          to warm-dark (#0e0c0a) under `.dark` or `[data-theme='dark']`
          wrappers (app surfaces). */}
      <polygon
        className="coyl-mark-inner"
        points="13,9 18.5,20 6.5,20"
        fill="#fafaf7"
      />
      {/* 4-point compass sparkle — the pulsing signal. The CSS class
          drives the keyframe animation; transform-origin keeps the
          pulse centered on the sparkle's geometric midpoint. */}
      <path
        className="coyl-sparkle-pulse"
        d="M 12.5 13.5 L 13.3 16 L 15.5 16.5 L 13.3 17 L 12.5 19.5 L 11.7 17 L 9.5 16.5 L 11.7 16 Z"
        fill="#ff6600"
        style={{ transformOrigin: '12.5px 16.5px' }}
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
