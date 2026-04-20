'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import {
  Handshake, TrendingDown, MessageCircleWarning, Zap,
  Footprints, Heart, Brain, type LucideIcon,
} from 'lucide-react'

/**
 * Core Loop visualization \u2014 the GODFILE spec \u00a71.
 *
 * Commitment \u2192 Drift \u2192 Excuse \u2192 Interrupt \u2192 Action \u2192 Recovery \u2192 Learning
 *
 * Reframed from "Signal \u2192 Detect \u2192 Interrupt \u2192 Truth \u2192 Action \u2192 Recovery
 * \u2192 Learn" because the product is now positioned as the commitment
 * engine, not a signal-detection layer. The LOOP starts with a promise
 * and ends with what the system learns when the loop closes (or breaks).
 *
 * Rendered horizontally with arrows on desktop, stacked vertically on
 * mobile. Each node shows: label (noun), what's happening, what fires it.
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
    what: 'The promise. A rule, a rep, a follow-up you said you\u2019d do. This is the thing COYL exists to protect.',
    signal: '/commitments, daily rule, work follow-up',
  },
  {
    label: 'Drift',
    icon: TrendingDown,
    what: 'The gap starts to open. A danger window approaches. A signal gets missed. Autopilot is loading.',
    signal: 'Time, context, pattern match',
  },
  {
    label: 'Excuse',
    icon: MessageCircleWarning,
    what: 'The sentence in your head that justifies the break. "Tomorrow." "I deserve this." "I already blew it."',
    signal: 'Excuse classifier + user input',
  },
  {
    label: 'Interrupt',
    icon: Zap,
    what: 'Precision fire at the exact moment. Not a reminder \u2014 an intervention. Names the pattern, predicts the cost.',
    signal: 'Push, rescue UI, callout',
  },
  {
    label: 'Action',
    icon: Footprints,
    what: 'The smallest physical move the user can take in the next five minutes. Concrete. Executable.',
    signal: 'Structured response section',
  },
  {
    label: 'Recovery',
    icon: Heart,
    what: 'If the break happened, stop the spiral. 2h check, 24h resolve, no shame. Resume, don\u2019t restart.',
    signal: 'Post-slip cron + /slip flow',
  },
  {
    label: 'Learning',
    icon: Brain,
    what: 'The loop closes. Excuse count +1. Danger window confidence shifts. Next interrupt is sharper.',
    signal: 'Background write back to user model',
  },
]

export function CoreLoop() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref} className="w-full">
      {/* Horizontal nodes with arrows \u2014 readable on tablet/desktop.
          On mobile, stacks vertically with a vertical connector line. */}
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-7 md:gap-2">
        {NODES.map((node, i) => {
          const Icon = node.icon
          return (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="relative"
            >
              {/* Desktop arrow \u2014 sits in the gap between cards */}
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

              {/* The node card */}
              <div className="relative z-10 flex h-full flex-col rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] via-orange-500/[0.02] to-transparent p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/15 text-orange-400">
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{node.label}</h4>
                <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-gray-400">
                  {node.what}
                </p>
                <p className="mt-3 border-t border-white/5 pt-2 text-[10px] text-gray-500">
                  {node.signal}
                </p>
              </div>

              {/* Mobile connector \u2014 vertical line between stacked cards */}
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

      {/* Loop-back note \u2014 makes the LEARN step visibly feed back to SIGNAL */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-6 text-center text-[11px] italic text-gray-500"
      >
        Each cycle makes the next interrupt sharper. Your autopilot map gets more accurate every time it fires.
      </motion.p>
    </div>
  )
}
