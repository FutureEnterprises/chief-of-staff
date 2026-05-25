'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import {
  Handshake, TrendingDown, MessageCircleWarning, Zap,
  Footprints, Heart, Brain, type LucideIcon,
} from 'lucide-react'

/**
 * Core Loop visualization — the GODFILE spec §1.
 *
 * Commitment → Drift → Excuse → Interrupt → Action → Recovery → Learning
 *
 * Reframed from "Signal → Detect → Interrupt → Truth → Action → Recovery
 * → Learn" because the product is now positioned as the commitment
 * engine, not a signal-detection layer. The LOOP starts with a promise
 * and ends with what the system learns when the loop closes (or breaks).
 *
 * Rendered horizontally with arrows on desktop, stacked vertically on
 * mobile. Each node shows: label (noun), what's happening, what fires it.
 *
 * v4-AUDIT UPGRADE (May 2026): the loop is now visibly *running*. A
 * traveler highlight cycles through each node when the section is in
 * view, so the user sees the cycle as a cycle, not a static row of
 * cards. Step 4 (Interrupt) is permanently emphasized — the auditor
 * called it "the three-second window where a cued behavior can still
 * be re-routed" and the diagram should make that visible at a glance.
 * A loop-back marker closes the cycle (Learning → Commitment).
 * `prefers-reduced-motion` users get the static layout with step 4
 * still emphasized but no traveler animation.
 */

type Node = {
  label: string
  icon: LucideIcon
  what: string
  signal: string
}

const NODES: Node[] = [
  {
    label: 'Commitment',
    icon: Handshake,
    what: 'The promise. A rule, a rep, a follow-up you said you’d do. This is the thing COYL exists to protect.',
    signal: 'A daily rule, a rep, a follow-up you set.',
  },
  {
    label: 'Drift',
    icon: TrendingDown,
    what: 'The gap starts to open. A danger window approaches. A signal gets missed. Autopilot is loading.',
    signal: 'Time of day, context, prior-pattern match.',
  },
  {
    label: 'Excuse',
    icon: MessageCircleWarning,
    what: 'The sentence in your head that justifies the break. "Tomorrow." "I deserve this." "I already blew it."',
    signal: 'The sentence you say to yourself first.',
  },
  {
    label: 'Interrupt',
    icon: Zap,
    what: 'Precision fire at the exact moment. Not a reminder — an intervention. Names the pattern, predicts the cost.',
    signal: 'A push, a 30-second call-out, a rescue card.',
  },
  {
    label: 'Action',
    icon: Footprints,
    what: 'The smallest physical move you can take in the next five minutes. Concrete. Executable.',
    signal: 'One specific action, sized to be doable now.',
  },
  {
    label: 'Recovery',
    icon: Heart,
    what: 'If the break happened, stop the spiral. 2h check, 24h resolve, no shame. Resume, don’t restart.',
    signal: 'Same-night re-entry. No restart on Monday.',
  },
  {
    label: 'Learning',
    icon: Brain,
    what: 'The loop closes. The next time looks the same — but COYL is sharper. It learned your exact excuse. It knows the window better. The pattern doesn’t know it just got a little smaller.',
    signal: 'COYL updates its map of your autopilot.',
  },
]

/** Index of the node COYL fires at. The three-second window. */
const FIRE_INDEX = 3 // Interrupt

/** How long each node holds the traveler before advancing. */
const STEP_MS = 1100

export function CoreLoop() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })
  const reduceMotion = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)

  // Cycle the traveler through nodes while the loop is in view. We
  // unmount the interval when out of view or when the user prefers
  // reduced motion — no off-screen CPU work.
  useEffect(() => {
    if (!inView || reduceMotion) return
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % NODES.length)
    }, STEP_MS)
    return () => clearInterval(id)
  }, [inView, reduceMotion])

  return (
    <div ref={ref} className="w-full">
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-7 md:gap-2">
        {NODES.map((node, i) => {
          const Icon = node.icon
          const isFirePoint = i === FIRE_INDEX
          const isActive = !reduceMotion && activeStep === i

          return (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="relative"
            >
              {/* "COYL fires here" callout — permanent on step 4 */}
              {isFirePoint && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-orange-500/40 bg-orange-500/[0.08] px-2.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-orange-600 backdrop-blur-sm"
                >
                  COYL fires here
                </div>
              )}

              {/* Desktop arrow — sits in the gap between cards */}
              {i < NODES.length - 1 && (
                <div className="pointer-events-none absolute -right-2 top-8 z-0 hidden h-6 w-6 items-center justify-center md:flex">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500/50">
                    <path
                      d="M4 12h14m0 0l-6-6m6 6l-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              {/* The node card — animates scale + ring when traveler is on it.
                  Step 4 (Interrupt) gets a permanent stronger ring + tint so
                  the user can see at a glance "this is the fire point." */}
              <motion.div
                animate={
                  isActive
                    ? {
                        scale: 1.04,
                        boxShadow: '0 0 0 2px rgba(255,102,0,0.55), 0 12px 28px -10px rgba(255,102,0,0.45)',
                      }
                    : {
                        scale: 1,
                        boxShadow: isFirePoint
                          ? '0 0 0 1px rgba(255,102,0,0.45)'
                          : '0 0 0 0 rgba(0,0,0,0)',
                      }
                }
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className={`relative z-10 flex h-full flex-col rounded-2xl border p-3 ${
                  isFirePoint
                    ? 'border-orange-400 bg-orange-50/70'
                    : 'border-orange-200 bg-white'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-orange-600 ${
                      isFirePoint
                        ? 'border-orange-400 bg-orange-100'
                        : 'border-orange-200 bg-orange-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-orange-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h4
                  className={`text-sm font-bold ${
                    isFirePoint ? 'text-orange-700' : 'text-gray-900'
                  }`}
                >
                  {node.label}
                </h4>
                <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-gray-600">
                  {node.what}
                </p>
                <p className="mt-3 border-t border-gray-200 pt-2 text-[10px] text-gray-500">
                  {node.signal}
                </p>
              </motion.div>

              {/* Mobile connector — vertical line between stacked cards */}
              {i < NODES.length - 1 && (
                <div className="flex justify-center py-2 md:hidden">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-90 text-orange-500/40">
                    <path
                      d="M4 12h14m0 0l-6-6m6 6l-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Loop-back marker — visibly closes the cycle (Learning → Commitment).
          Without it the diagram reads as a one-shot funnel rather than a
          repeating loop. The auditor explicitly called out that the loop
          shape was unclear in the static version. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8 flex flex-col items-start gap-3 border-t border-orange-200 pt-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 32 24"
            className="h-6 w-8 text-orange-500"
            aria-hidden
          >
            <path
              d="M28 6 H 8 C 4 6 4 18 8 18 H 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M28 6 L 24 2 M 28 6 L 24 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="rotate(180 26 6)"
            />
          </svg>
          <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-orange-600">
            Loop closes · sharper next cycle
          </p>
        </div>
        <p className="max-w-md text-[11px] italic leading-[1.55] text-gray-500 sm:text-right">
          Each cycle makes the next interrupt sharper. Your autopilot map gets more accurate every time it fires.
        </p>
      </motion.div>
    </div>
  )
}
