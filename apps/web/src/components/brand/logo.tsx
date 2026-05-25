import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CoylLogoProps {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** @deprecated theme prop is no longer used — the PNG ships with its
   * own chrome shading and the wordmark color is baked in. Kept on the
   * prop type for backward compatibility with existing call sites. */
  theme?: 'light' | 'dark' | 'auto'
}

const sizes = {
  sm: { icon: 22, text: 'text-sm', gap: 'gap-1.5' },
  md: { icon: 30, text: 'text-lg', gap: 'gap-2' },
  lg: { icon: 44, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 60, text: 'text-4xl', gap: 'gap-4' },
}

/**
 * CoylMark — the founder's official COYL mark (May 24 2026 final).
 *
 * Stops the SVG iteration loop. The mark is now sourced from the
 * founder-supplied master PNG at /public/coyl-logo-full.png, cropped
 * to a square mark-only at /public/coyl-mark.png. The chrome half-C
 * with black interior, 4-point compass star, and sonar arcs are all
 * baked into the image — no in-code geometry, no theme variants, no
 * animation. If the brand identity changes, replace coyl-mark.png +
 * coyl-logo-full.png and every consumer picks it up.
 *
 * Why PNG over SVG: the chrome-3D shading, black inner-fill, and
 * golden sonar ripples in the founder's reference are a rendered
 * piece of art, not a vector. SVG approximations of it consistently
 * came out muddy. The PNG is the source of truth.
 *
 * Animation: none. The static mark IS the brand. If we want a pulse
 * later, do it in CSS on the wrapping element (transform: scale on
 * hover) rather than re-introducing animated SVG.
 */
export function CoylMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/coyl-mark.png"
      alt="COYL"
      width={size}
      height={size}
      priority
      className={cn('shrink-0 select-none', className)}
      // Master is 512×512; the next-image optimizer downsamples to
      // exactly the rendered size on demand.
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
}: CoylLogoProps) {
  const { icon, text, gap } = sizes[size]

  return (
    <div className={cn('flex items-center', gap, className)}>
      <CoylMark size={icon} />
      {showWordmark && (
        <span
          className={cn(
            'font-bold tracking-[-0.04em] leading-none select-none text-foreground',
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
