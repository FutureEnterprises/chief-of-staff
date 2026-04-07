'use client'
import { cn } from '@/lib/utils'

interface CoylLogoProps {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  theme?: 'light' | 'dark' | 'auto'
}

const sizes = {
  sm: { icon: 22, text: 'text-sm',  gap: 'gap-1.5' },
  md: { icon: 30, text: 'text-lg',  gap: 'gap-2' },
  lg: { icon: 44, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 60, text: 'text-4xl', gap: 'gap-4' },
}

/**
 * CoylMark — a miniature cylindrical coil spring.
 * 4 loops viewed from a slight angle: front arcs heavy, back arcs light.
 * End caps close the cylinder top and bottom.
 */
export function CoylMark({ size = 30, className }: { size?: number; className?: string }) {
  const W = size
  const H = size * 1.1   // slightly taller than wide
  const cx = W / 2
  const rx = W * 0.42    // horizontal radius of each loop
  const ry = H * 0.085   // vertical radius — flat ellipses for cylinder depth
  const loops = 4
  const spacing = (H * 0.72) / loops
  const top = H * 0.14   // start of coil top
  const sw = W * 0.09    // front arc stroke
  const swb = W * 0.055  // back arc stroke

  const arcs: { d: string; front: boolean; y: number }[] = []
  for (let i = 0; i <= loops; i++) {
    const y = top + i * spacing
    // Back arc — top half of ellipse
    arcs.push({
      d: `M ${cx - rx} ${y} A ${rx} ${ry} 0 0 1 ${cx + rx} ${y}`,
      front: false,
      y,
    })
    // Front arc — bottom half connecting to next loop
    if (i < loops) {
      arcs.push({
        d: `M ${cx + rx} ${y} A ${rx} ${ry * 1.3} 0 0 0 ${cx - rx} ${y + spacing}`,
        front: true,
        y,
      })
    }
  }

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top cap */}
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} stroke="#ff6600" strokeWidth={swb} fill="none" opacity={0.4} />

      {/* Coil arcs */}
      {arcs.map((arc, i) => (
        <path
          key={i}
          d={arc.d}
          stroke="#ff6600"
          strokeWidth={arc.front ? sw : swb}
          strokeLinecap="round"
          fill="none"
          opacity={arc.front ? 1 : 0.22}
        />
      ))}

      {/* Bottom cap */}
      <ellipse
        cx={cx} cy={top + loops * spacing}
        rx={rx} ry={ry}
        stroke="#ff6600" strokeWidth={swb}
        fill="none" opacity={0.4}
      />
    </svg>
  )
}

/** Full COYL logotype — mark + wordmark */
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
    theme === 'dark'   ? 'text-[#f5f5f0]'
    : theme === 'light'  ? 'text-[#1a1a1a]'
    : 'text-foreground'
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

/** Standalone icon-only mark for favicons, app icons */
export function CoylIcon({ size = 32, className }: { size?: number; className?: string }) {
  return <CoylMark size={size} className={className} />
}
