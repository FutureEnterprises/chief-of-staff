'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState, useCallback } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  angle: number
  distance: number
  size: number
  color: string
  delay: number
}

const ORANGE_PALETTE = ['#ff6600', '#ff3d00', '#ff9100', '#ff8533', '#e91e63', '#ff6600']

function generateParticles(count: number, colors: string[] = ORANGE_PALETTE): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    angle: (360 / count) * i + Math.random() * 30 - 15,
    distance: 30 + Math.random() * 40,
    size: 3 + Math.random() * 4,
    color: colors[i % colors.length]!,
    delay: Math.random() * 0.05,
  }))
}

export function TaskCompleteCelebration({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  const [particles] = useState(() => generateParticles(10))

  useEffect(() => {
    if (active && onComplete) {
      const t = setTimeout(onComplete, 500)
      return () => clearTimeout(t)
    }
  }, [active, onComplete])

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180
            return (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{ width: p.size, height: p.size, backgroundColor: p.color }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(rad) * p.distance,
                  y: Math.sin(rad) * p.distance,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.4, delay: p.delay, ease: [0.23, 1, 0.32, 1] }}
              />
            )
          })}
          <motion.div
            className="absolute h-6 w-6 rounded-full bg-gradient-warm"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
      )}
    </AnimatePresence>
  )
}

export function InboxZeroCelebration({ active }: { active: boolean }) {
  const [particles] = useState(() => generateParticles(16))

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none relative flex flex-col items-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative">
            {particles.map((p) => {
              const rad = (p.angle * Math.PI) / 180
              return (
                <motion.div
                  key={p.id}
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{ width: p.size, height: p.size, backgroundColor: p.color }}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos(rad) * (p.distance * 1.5),
                    y: Math.sin(rad) * (p.distance * 1.5),
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{ duration: 0.8, delay: 0.2 + p.delay * 2, ease: [0.23, 1, 0.32, 1] }}
                />
              )
            })}
            <motion.div
              className="text-5xl"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
            >
              &#x2728;
            </motion.div>
          </div>
          <motion.p
            className="mt-4 text-gradient-warm heading-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            Inbox Zero!
          </motion.p>
          <motion.p
            className="mt-1 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Everything is processed. You&apos;re in control.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function StreakCelebration({ days }: { days: number }) {
  if (days < 2) return null
  return (
    <motion.div
      className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 dark:bg-orange-950/30"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <motion.span
        className="text-lg"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
      >
        &#x1F525;
      </motion.span>
      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
        {days} day streak
      </span>
    </motion.div>
  )
}
