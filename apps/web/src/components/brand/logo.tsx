import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CoylLogoProps {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Wordmark color context. The PNG mark ships its own chrome shading,
   * but the "CO_L" wordmark span uses `text-foreground`, which resolves
   * DARK on pages that hardcode a dark canvas (e.g. /a, /i, /card — they
   * never toggle the `.dark` class). Pass 'dark' on those pages so the
   * wordmark renders cream instead of vanishing dark-on-dark. */
  theme?: 'light' | 'dark' | 'auto'
}

/**
 * Mark intrinsic aspect ratio — the founder's mark is LANDSCAPE because
 * the sonar arcs extend right of the C. Master PNG is 527×400 (ratio
 * ~1.3175). When sizing the mark by height, the width follows from
 * this constant. Centralized so callers don't have to reason about it.
 */
const MARK_ASPECT = 527 / 400 // ≈ 1.3175

/** Convert a height target to the landscape (width, height) pair. */
function markBox(height: number): { width: number; height: number } {
  return { width: Math.round(height * MARK_ASPECT), height }
}

const sizes = {
  sm: { iconH: 26, text: 'text-sm', gap: 'gap-2' },
  md: { iconH: 36, text: 'text-lg', gap: 'gap-2.5' },
  lg: { iconH: 52, text: 'text-2xl', gap: 'gap-3' },
  xl: { iconH: 72, text: 'text-4xl', gap: 'gap-4' },
}

/**
 * CoylMark — the founder's official COYL mark (May 24 2026 final).
 *
 * Stops the SVG iteration loop. The mark is now sourced from the
 * founder-supplied master PNG, cropped tight to the mark's alpha
 * bounding box at /public/coyl-mark.png (527×400 landscape — the
 * sonar arcs extend right of the half-ring C, so the natural shape
 * is wider than tall). The chrome half-C with black interior,
 * 4-point compass star, and sonar arcs are all baked into the
 * image — no in-code geometry, no theme variants, no animation.
 *
 * Why PNG over SVG: the chrome-3D shading, black inner-fill, and
 * golden sonar ripples in the founder's reference are a rendered
 * piece of art, not a vector. SVG approximations consistently came
 * out muddy. The PNG is the source of truth.
 *
 * Sizing API: `size` = desired HEIGHT in px. Width is computed from
 * the natural aspect ratio (no padding, no distortion). If the brand
 * identity changes, replace coyl-mark.png + coyl-logo-full.png and
 * every consumer picks it up.
 */
export function CoylMark({ size = 36, className }: { size?: number; className?: string }) {
  const { width, height } = markBox(size)
  return (
    <Image
      src="/coyl-mark.png"
      alt="COYL"
      width={width}
      height={height}
      priority
      className={cn('shrink-0 select-none', className)}
    />
  )
}

/**
 * Full COYL logotype — mark + wordmark for nav/footer/header use.
 *
 * The wordmark stays as a simple text "CO[Y orange]L" rather than
 * inlining the founder's full PNG (which includes the wordmark
 * already), because nav contexts need a tight inline layout with
 * mark + text side-by-side at small sizes. For the full vertical
 * PNG lockup, use <CoylLockup /> below.
 */
export function CoylLogo({
  className,
  showWordmark = true,
  size = 'md',
  theme,
}: CoylLogoProps) {
  const { iconH, text, gap } = sizes[size]

  return (
    <div className={cn('flex items-center', gap, className)}>
      <CoylMark size={iconH} />
      {showWordmark && (
        <span
          className={cn(
            'font-bold tracking-[-0.04em] leading-none select-none',
            theme === 'dark' ? 'text-[#f5efe6]' : 'text-foreground',
            text,
          )}
        >
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
 * CoylLockup — the founder's full vertical lockup PNG (mark + COYL
 * wordmark with the orange pill-O), used in marketing hero contexts
 * where the mark deserves to breathe. Splash screens, hero blocks,
 * social/OG renders. Not for inline nav.
 *
 * The PNG is 1024×1024 square. Render at whatever size the caller
 * needs and the next-image optimizer downsamples on demand.
 */
export function CoylLockup({
  className,
  size = 320,
}: {
  className?: string
  /** Rendered display size in px. The PNG square is 1024×1024 master. */
  size?: number
}) {
  return (
    <Image
      src="/coyl-logo-full.png"
      alt="COYL — Catch yourself before you do it again"
      width={size}
      height={size}
      priority
      className={cn('select-none', className)}
    />
  )
}
