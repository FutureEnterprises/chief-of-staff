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
 * CoylMark — the broken loop.
 *
 * Reads as a nearly-closed ring with a visible gap at the upper-right,
 * with a single filled dot bridging the gap. The shape is the entire
 * product metaphor in one glyph:
 *
 *   • ring    = the autopilot loop — the pattern that keeps running you
 *   • gap     = the interrupt — the exact moment the loop is about to close
 *   • dot     = COYL — the thing that catches it right before completion
 *
 * Geometric properties:
 *   • viewBox 0 0 24 24, renders crisply at 16px (favicon) through 1024px
 *     (iOS app icon) without pixel snapping issues.
 *   • Single open arc path, 3px stroke, linecap=round so the ends read as
 *     deliberate terminators rather than cut-offs.
 *   • Gradient stroke (#ff6600 → #ef4444) matches the site's CTA gradient.
 *   • Solid-fill dot uses the top gradient stop so it holds at tiny sizes
 *     where gradients blur into a single color anyway.
 *
 * The `gradientUnits="userSpaceOnUse"` + explicit coordinates guarantee the
 * gradient direction is stable across sizes. Without this, the gradient
 * recomputes per-render at different sizes and the logo looks inconsistent
 * between favicon and hero contexts.
 */
export function CoylMark({ size = 30, className }: { size?: number; className?: string }) {
  // Unique gradient id per size so multiple marks on one page don't clash
  // via the global SVG id namespace. 30 → "coyl-mark-grad-30".
  const gradId = `coyl-mark-grad-${size}`

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

      {/* The almost-closed loop. Large-arc, sweep-clockwise, starting just past
          12 o'clock and ending at roughly 2 o'clock — leaves a ~50° gap at the
          upper-right that the dot fills. Tuned empirically for balance. */}
      <path
        d="M 13.5 3.2 A 9 9 0 1 0 20.2 15"
        stroke={`url(#${gradId})`}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* The catch point. Slightly larger than the stroke so it reads as a
          deliberate endpoint, not an accidental join. Filled with the warm
          end of the gradient so it pops against the cooler arc tail. */}
      <circle cx="16.9" cy="5.6" r="2.1" fill="#ff6600" />
    </svg>
  )
}

/**
 * Full COYL logotype — mark + wordmark. The Y is always orange so the eye
 * lands on the middle letter (matches the hero H1 and /caught H1 treatment
 * where the orange highlight carries the "catch" moment).
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
