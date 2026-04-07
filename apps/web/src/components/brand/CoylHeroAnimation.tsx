'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const CX = 400
const CY = 280
const ORANGE = '#ff6600'
const CHARCOAL = '#1a1a1a'

/* ── Cylindrical coil spring geometry ────────────────────────────────────────
   Wire wound around a cylinder viewed from a low angle:
   - RX wide, RY tall → deep ellipses give strong 3D cylinder illusion
   - Back arcs (top half of loop): recede, light opacity
   - Front arcs (bottom half): come toward viewer, heavy stroke
   - End caps: filled ellipses at top & bottom close the cylinder
*/
const LOOPS      = 10
const RX         = 100   // horizontal radius — narrower for cylinder feel
const RY_FRONT   = 28    // tall vertical radius → deep perspective
const RY_BACK    = 20    // back arc slightly flatter
const SPACING    = 24    // tighter winding
const COIL_TOP   = CY - (LOOPS * SPACING) / 2

// Build ordered draw list: back arc N, then front arc N
const SEGMENTS: { d: string; sw: number; op: number; delay: number; key: string }[] = []
for (let i = 0; i <= LOOPS; i++) {
  const y = COIL_TOP + i * SPACING
  // Back arc (top half — recedes into cylinder)
  SEGMENTS.push({
    d: `M ${CX - RX} ${y} A ${RX} ${RY_BACK} 0 0 1 ${CX + RX} ${y}`,
    sw: 3, op: 0.18,
    delay: i * 0.08 + 0.04,
    key: `back-${i}`,
  })
  // Front arc (bottom half — faces viewer, full opacity)
  if (i < LOOPS) {
    SEGMENTS.push({
      d: `M ${CX + RX} ${y} A ${RX} ${RY_FRONT} 0 0 0 ${CX - RX} ${y + SPACING}`,
      sw: 6, op: 1,
      delay: i * 0.08,
      key: `front-${i}`,
    })
  }
}

// Explosion particles
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  angle: (360 / 32) * i + (i % 2 ? 5 : -5),
  dist: 150 + (i % 5) * 28,
  size: 2.5 + (i % 4) * 0.8,
  color: i % 3 === 0 ? CHARCOAL : ORANGE,
  delay: (i % 5) * 0.025,
}))

type Phase = 'build' | 'tension' | 'explode' | 'assemble' | 'done'

export function CoylHeroAnimation({ className }: { className?: string }) {
  const [phase, setPhase] = useState<Phase>('build')
  const [drawProgress, setDrawProgress] = useState(0) // 0→1 drives all ring draws
  const [loop, setLoop] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t0Ref       = useRef<number | null>(null)

  const BUILD    = 2100
  const TENSION  = BUILD + 550
  const EXPLODE  = TENSION + 120   // short gap before boom
  const ASSEMBLE = EXPLODE + 650
  const DONE     = ASSEMBLE + 1400
  const RESTART  = DONE + 2000

  useEffect(() => {
    t0Ref.current = null

    function easeOut3(t: number) { return 1 - Math.pow(1 - t, 3) }

    function tick() {
      const now = Date.now()
      if (!t0Ref.current) t0Ref.current = now
      const ms = now - t0Ref.current

      // Draw progress 0→1 over BUILD duration
      setDrawProgress(easeOut3(Math.min(ms / BUILD, 1)))

      if      (ms < BUILD)    setPhase('build')
      else if (ms < TENSION)  setPhase('tension')
      else if (ms < ASSEMBLE) setPhase('explode')
      else if (ms < DONE)     setPhase('assemble')
      else                    setPhase('done')

      if (ms >= RESTART) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setTimeout(() => {
          setPhase('build')
          setDrawProgress(0)
          setLoop(l => l + 1)
        }, 400)
      }
    }

    intervalRef.current = setInterval(tick, 16)
    tick() // run immediately so first frame isn't delayed 16ms
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [loop])

  const showCoil    = phase === 'build' || phase === 'tension'
  const showExplode = phase === 'explode'
  const showLetters = phase === 'assemble' || phase === 'done'
  const showTagline = phase === 'done'
  const isTension   = phase === 'tension'

  return (
    <div className={className} style={{ width: '100%' }}>
      <svg
        viewBox="0 0 800 560"
        width="800"
        height="560"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Coil spring ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {showCoil && (
            <motion.g
              key="coil"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.35 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
              animate={isTension ? {
                scaleY: [1, 0.93, 1.06, 0.96, 1.03, 1],
                transition: { duration: 0.5, ease: 'easeInOut' },
              } : {}}
            >
              {/* Top end-cap ellipse — closes the cylinder */}
              {drawProgress > 0.02 && (
                <ellipse
                  cx={CX} cy={COIL_TOP}
                  rx={RX} ry={RY_BACK}
                  stroke={ORANGE} strokeWidth={3}
                  fill="none" opacity={0.35}
                />
              )}

              {SEGMENTS.map((seg) => {
                // Each segment draws in sequentially based on its delay relative to total
                const segStart = seg.delay / (LOOPS * 0.08 + 0.08)
                const segProgress = Math.max(0, Math.min(1,
                  (drawProgress - segStart) / (1 - segStart)
                ))
                if (segProgress <= 0) return null
                return (
                  <motion.path
                    key={seg.key}
                    d={seg.d}
                    stroke={ORANGE}
                    strokeWidth={seg.sw}
                    strokeLinecap="round"
                    fill="none"
                    opacity={seg.op}
                    pathLength={1}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: segProgress }}
                    transition={{ duration: 0 }}
                  />
                )
              })}

              {/* Bottom end-cap ellipse */}
              {drawProgress > 0.9 && (
                <ellipse
                  cx={CX} cy={COIL_TOP + LOOPS * SPACING}
                  rx={RX} ry={RY_BACK}
                  stroke={ORANGE} strokeWidth={3}
                  fill="none" opacity={0.35}
                />
              )}

              {/* Hook at top */}
              {drawProgress > 0.05 && (
                <motion.line
                  x1={CX} y1={COIL_TOP - 2}
                  x2={CX} y2={COIL_TOP - 24}
                  stroke={ORANGE} strokeWidth={4} strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2 }}
                  opacity={0.6}
                />
              )}
              {/* Hook at bottom */}
              {drawProgress > 0.95 && (
                <motion.line
                  x1={CX} y1={COIL_TOP + LOOPS * SPACING + 2}
                  x2={CX} y2={COIL_TOP + LOOPS * SPACING + 24}
                  stroke={ORANGE} strokeWidth={4} strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2 }}
                  opacity={0.6}
                />
              )}
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Explosion ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showExplode && (
            <g key="explode">
              {/* Flash */}
              <motion.ellipse
                cx={CX} cy={CY} rx={90} ry={60}
                fill={ORANGE}
                initial={{ opacity: 0.8, scaleX: 0.1, scaleY: 0.1 }}
                animate={{ opacity: 0, scaleX: 4, scaleY: 3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformOrigin: `${CX}px ${CY}px` }}
              />
              {PARTICLES.map((p, i) => {
                const rad = (p.angle - 90) * (Math.PI / 180)
                return (
                  <motion.circle
                    key={i}
                    cx={CX} cy={CY} r={p.size}
                    fill={p.color}
                    initial={{ cx: CX, cy: CY, opacity: 0.9 }}
                    animate={{
                      cx: CX + Math.cos(rad) * p.dist,
                      cy: CY + Math.sin(rad) * p.dist,
                      opacity: 0,
                    }}
                    transition={{ duration: 0.55, delay: p.delay, ease: [0.23, 1, 0.32, 1] }}
                  />
                )
              })}
            </g>
          )}
        </AnimatePresence>

        {/* ── "Control Your Life" — C Y L orange, centred ─────────────── */}
        <text
          x={CX} y={308}
          textAnchor="middle"
          fontSize={68} fontWeight={800}
          letterSpacing={-1}
          fontFamily="-apple-system, 'Inter', sans-serif"
          style={{
            opacity: showLetters ? 1 : 0,
            transform: showLetters ? 'translateY(0px)' : 'translateY(-20px)',
            transition: showLetters
              ? 'opacity 0.55s cubic-bezier(0.23,1,0.32,1), transform 0.65s cubic-bezier(0.23,1,0.32,1)'
              : 'none',
          }}
        >
          <tspan fill={ORANGE}>C</tspan>
          <tspan fill={CHARCOAL}>ontrol </tspan>
          <tspan fill={ORANGE}>Y</tspan>
          <tspan fill={CHARCOAL}>our </tspan>
          <tspan fill={ORANGE}>L</tspan>
          <tspan fill={CHARCOAL}>ife</tspan>
        </text>
      </svg>
    </div>
  )
}
