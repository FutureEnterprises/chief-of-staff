'use client'
import { motion, AnimatePresence, type Variants } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

/* ── Shared variants ─────────────────────────────────────────── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, y: 4, transition: { duration: 0.15, ease: [0.77, 0, 0.175, 1] } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: [0.77, 0, 0.175, 1] } },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
}

/* ── Stagger container ───────────────────────────────────────── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
}

/* ── Wrapper components ──────────────────────────────────────── */
export function FadeUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit" transition={{ delay }} className={className}>
      {children}
    </motion.div>
  )
}

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" exit="exit" transition={{ delay }} className={className}>
      {children}
    </motion.div>
  )
}

export function ScaleIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" transition={{ delay }} className={className}>
      {children}
    </motion.div>
  )
}

export function SlideUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div variants={slideUp} initial="hidden" animate="visible" exit="exit" transition={{ delay }} className={className}>
      {children}
    </motion.div>
  )
}

export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className={className}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Animated counter ────────────────────────────────────────── */
export function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    const start = display
    const end = value
    const duration = 400
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) ref.current = requestAnimationFrame(step)
    }

    ref.current = requestAnimationFrame(step)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value])

  return <span className={className}>{display}</span>
}

/* ── Shimmer skeleton ────────────────────────────────────────── */
export function ShimmerSkeleton({ className }: { className?: string }) {
  return <div className={`shimmer rounded-xl ${className ?? 'h-16 w-full'}`} />
}

export { motion, AnimatePresence }
