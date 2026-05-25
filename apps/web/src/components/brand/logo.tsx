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
 * CoylMark — SIGNAL · CAUGHT (May 24 2026 revision).
 *
 * Half-ring "C" catches a radiating signal. Reads as both the letter C
 * and the verb "catch" — the founder's promise visualized.
 *
 *   1. Warm-chrome half-ring on the left, opening to the right. Drawn as
 *      a thick stroked arc with rounded caps so the ends read clean at
 *      every size from 16px favicon to 1024px iOS icon. The chrome
 *      gradient (warm cream → warm charcoal) gives 3D sculptural weight
 *      and is luminance-balanced for both #fafaf7 marketing surfaces and
 *      #0e0c0a app surfaces without theme-swap logic.
 *   2. 4-point compass star inside the C's opening — three layers stacked
 *      (orange diamond cross, lighter inner cross, white center dot) for
 *      a bright sun-like core with orange edges. Pulses on a 2.4s loop.
 *   3. Three sonar arcs to the right of the star, propagating outward in
 *      staggered phase. Tells the eye "the signal is live, the catch is
 *      happening now" — not a static badge.
 *
 * Why this replaces the AZURE FACET mark (May 24 2026 → May 24 2026):
 * the A-frame was sculptural but the metaphor (a literal triangle) was
 * orthogonal to the product. The half-ring + signal is *the product's
 * actual mechanism* rendered as a glyph — visual identity and product
 * thesis collapsed into one shape. Founder feedback on the A-frame:
 * "horrendous." This shape was selected from a two-option pair (orange
 * chrome / purple chrome); orange picked for palette consistency.
 *
 * Geometric properties (viewBox 0 0 32 32):
 *   • C arc: center (11, 16), radius 8.5, stroke 3.5, rounded caps,
 *     opening from −45° to +45° relative to the +x axis (90° gap).
 *   • Star: center (19, 16), 4-point compass, vertical span 13,
 *     horizontal span 13, with 3 nested layers.
 *   • Sonar arcs: 3 concentric ~135° arcs at radii 4 / 6 / 8 from the
 *     star, each ~0.8s out of phase, ease-out.
 *
 * Animations: see `.coyl-star-pulse` and `.coyl-ripple-1/2/3` in
 * globals.css. All halt under `prefers-reduced-motion`.
 */
export function CoylMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Warm-chrome gradient for the C — cream highlight at top,
            charcoal-brown shadow at bottom. Works on cream + warm-dark
            backgrounds without modification. */}
        <linearGradient id="coyl-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f3e8" />
          <stop offset="38%" stopColor="#cfc7b8" />
          <stop offset="72%" stopColor="#6e6555" />
          <stop offset="100%" stopColor="#2a2520" />
        </linearGradient>
        {/* Halo behind the star — radial cream-to-orange-to-transparent
            so the star appears to glow into the surrounding negative space. */}
        <radialGradient id="coyl-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff4e0" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#ff8a3d" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#ff6600" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Half-ring C — thick stroked arc, opens right. The two endpoint
          coordinates (17.01, 9.99) and (17.01, 22.01) sit at ±45° from
          horizontal on a circle of radius 8.5 centered at (11, 16). The
          large-arc-flag=1 + sweep-flag=0 selects the long arc through
          the left side, producing a C that opens toward the signal. */}
      <path
        d="M 17.01 9.99 A 8.5 8.5 0 1 0 17.01 22.01"
        stroke="url(#coyl-chrome)"
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Sonar arcs — three concentric ripples emanating right from the
          star. Each animates outward (scale + opacity) on a 2.4s loop,
          phase-offset to create a continuous propagation feel. The
          transform-origin (set in globals.css) anchors each ripple's
          scale to the star center (19, 16) so they fan outward from
          the source instead of thickening in place. */}
      <path
        className="coyl-ripple-1"
        d="M 21 12.54 A 4 4 0 0 1 21 19.46"
        stroke="#ff6600"
        strokeWidth={0.85}
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="coyl-ripple-2"
        d="M 22 10.81 A 6 6 0 0 1 22 21.19"
        stroke="#ff6600"
        strokeWidth={0.8}
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="coyl-ripple-3"
        d="M 23 9.07 A 8 8 0 0 1 23 22.93"
        stroke="#ff6600"
        strokeWidth={0.75}
        strokeLinecap="round"
        fill="none"
      />

      {/* Halo — sits behind the star so the star reads as a bright core
          on a warm glow. Non-animated; the motion lives in the star + arcs. */}
      <circle cx="19" cy="16" r="6.5" fill="url(#coyl-halo)" />

      {/* 4-point compass star — three nested diamonds.
          Outer: orange compass cross. Middle: lighter inner cross.
          Center: bright white dot. The whole group pulses (scale + opacity)
          on the same heartbeat as the legacy sparkle did. The transform
          origin is set via .coyl-star-pulse in globals.css (fill-box +
          center → bbox-center of the symmetric star group). */}
      <g className="coyl-star-pulse">
        {/* Outer 4-point compass — orange */}
        <path
          d="M 19 9.5 L 19.7 16 L 19 22.5 L 18.3 16 Z M 12.5 16 L 19 15.3 L 25.5 16 L 19 16.7 Z"
          fill="#ff8a3d"
        />
        {/* Inner brighter compass — cream */}
        <path
          d="M 19 12 L 19.4 16 L 19 20 L 18.6 16 Z M 15 16 L 19 15.6 L 23 16 L 19 16.4 Z"
          fill="#fff4e0"
        />
        {/* Center hot spot */}
        <circle cx="19" cy="16" r="0.7" fill="#ffffff" />
      </g>
    </svg>
  )
}

/**
 * Full COYL logotype — mark + wordmark for nav/footer/header use. The
 * wordmark stays as a simple "CO[Y orange]L" because it has to read
 * cleanly at 14px in nav and 48px in marketing without re-tuning. For
 * the elaborate hero-lockup wordmark (pill-O + tagline + microcopy from
 * the May 24 brand refresh), use <CoylLockup /> instead.
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

/**
 * CoylLockup — marketing hero variant with the pill-O wordmark, tagline,
 * and the "INTENT · 3 SECONDS · OUTCOME" microcopy strip. Reserve for
 * hero contexts where the mark deserves to breathe — splash screens,
 * the homepage hero, OG share renders. Not for inline nav use.
 *
 * The "O" of COYL is rendered as an outlined orange stadium shape — a
 * hollow vessel echoing the half-ring C above it (both are "catchers").
 * The C/Y/L glyphs are light-weight sans-serif white; the only color
 * accents are the pill-O outline, the mark's signal, and the "3 SECONDS"
 * pivot in the microcopy strip.
 */
export function CoylLockup({
  className,
  showTagline = true,
  showStrip = true,
  theme = 'dark',
}: {
  className?: string
  showTagline?: boolean
  showStrip?: boolean
  theme?: 'light' | 'dark'
}) {
  const isDark = theme === 'dark'
  const letterColor = isDark ? '#f5f0e6' : '#1a1a1a'
  const taglineColor = isDark ? '#e8e1d2' : '#1a1a1a'
  const muted = isDark ? '#7c7466' : '#5a5550'

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div className="mb-6 md:mb-10">
        <CoylMark size={140} />
      </div>

      {/* Wordmark — C [pill-O] Y L. The pill-O is a hollow stadium-
          shaped outline in #ff6600. We render it as an inline SVG sized
          relative to the surrounding font (em units) so it scales with
          the wordmark and stays vertically centered on the cap-height. */}
      <div
        className="flex items-baseline"
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
          fontWeight: 300,
          fontSize: 'clamp(48px, 8vw, 96px)',
          letterSpacing: '0.04em',
          color: letterColor,
          lineHeight: 1,
        }}
      >
        <span>C</span>
        <span
          aria-hidden
          className="inline-flex items-center justify-center"
          style={{
            width: '0.82em',
            height: '0.74em',
            margin: '0 0.04em',
            transform: 'translateY(-0.04em)',
          }}
        >
          <svg
            viewBox="0 0 100 92"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
          >
            <rect
              x="4"
              y="4"
              width="92"
              height="84"
              rx="42"
              ry="42"
              fill="none"
              stroke="#ff6600"
              strokeWidth="6"
            />
          </svg>
        </span>
        {/* Visually-hidden O so screen readers and search bots see COYL */}
        <span className="sr-only">O</span>
        <span>Y</span>
        <span>L</span>
      </div>

      {showTagline && (
        <p
          className="mt-6 font-mono uppercase tracking-[0.28em]"
          style={{
            color: taglineColor,
            fontSize: 'clamp(11px, 1.3vw, 16px)',
            fontWeight: 400,
          }}
        >
          Catch yourself before you do it again
          <sup
            style={{
              fontSize: '0.6em',
              marginLeft: '0.2em',
              verticalAlign: 'super',
              color: muted,
            }}
          >
            ™
          </sup>
        </p>
      )}

      {showStrip && (
        <p
          className="mt-5 font-mono uppercase tracking-[0.32em]"
          style={{
            fontSize: 'clamp(9px, 1.05vw, 13px)',
            fontWeight: 500,
            color: muted,
          }}
        >
          <span>Intent</span>
          <span style={{ margin: '0 0.6em', opacity: 0.6 }}>·</span>
          <span style={{ color: '#ff8a3d' }}>3 seconds</span>
          <span style={{ margin: '0 0.6em', opacity: 0.6 }}>·</span>
          <span>Outcome</span>
        </p>
      )}
    </div>
  )
}
