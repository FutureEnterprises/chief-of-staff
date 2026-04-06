'use client'
import { cn } from '@/lib/utils'

interface CoylLogoProps {
  className?: string
  /** Show wordmark beside icon */
  showWordmark?: boolean
  /** Icon + wordmark size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Force a specific theme regardless of system */
  theme?: 'light' | 'dark' | 'auto'
}

const sizes = {
  sm: { icon: 24, text: 'text-base', gap: 'gap-1.5' },
  md: { icon: 32, text: 'text-xl',  gap: 'gap-2' },
  lg: { icon: 48, text: 'text-3xl', gap: 'gap-3' },
  xl: { icon: 64, text: 'text-4xl', gap: 'gap-4' },
}

/** The COYL coil mark — an "O" shaped as a spring/coil in Hermès orange */
export function CoylMark({ size = 32, className }: { size?: number; className?: string }) {
  const r = size * 0.36      // coil outer radius
  const cx = size / 2
  const cy = size / 2
  const strokeW = size * 0.085

  // The coil: a 300° arc that doesn't close, leaving an opening
  // suggesting a wound spring with controlled tension
  const startAngle = 130   // degrees
  const endAngle   = 430   // = 70° (wraps past 360)
  const toRad = (d: number) => (d * Math.PI) / 180

  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))

  // Inner arc (smaller radius) for the coil's inner loop
  const ri = r * 0.55
  const ix1 = cx + ri * Math.cos(toRad(startAngle + 20))
  const iy1 = cy + ri * Math.sin(toRad(startAngle + 20))
  const ix2 = cx + ri * Math.cos(toRad(endAngle - 20))
  const iy2 = cy + ri * Math.sin(toRad(endAngle - 20))

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer coil arc */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`}
        stroke="#ff6600"
        strokeWidth={strokeW}
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner coil arc — gives the spring/wound depth */}
      <path
        d={`M ${ix1} ${iy1} A ${ri} ${ri} 0 1 1 ${ix2} ${iy2}`}
        stroke="#ff6600"
        strokeWidth={strokeW * 0.65}
        strokeLinecap="round"
        strokeOpacity="0.45"
        fill="none"
      />
      {/* Tension line — the gap tail suggesting energy ready to release */}
      <line
        x1={x1}
        y1={y1}
        x2={cx + r * 0.15 * Math.cos(toRad(startAngle))}
        y2={cy + r * 0.15 * Math.sin(toRad(startAngle))}
        stroke="#ff6600"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeOpacity="0.3"
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
    theme === 'dark'  ? 'text-[#f5f5f0]'
    : theme === 'light' ? 'text-[#1a1a1a]'
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
