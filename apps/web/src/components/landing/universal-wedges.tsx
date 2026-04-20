'use client'

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import {
  Utensils, Flame, MessageSquareWarning, Smartphone,
  Wallet, Brain, ArrowRight, type LucideIcon,
} from 'lucide-react'

/**
 * Universal wedges section — the "this isn't a weight-loss app" section.
 *
 * The same behavioral loop runs across every autopilot domain: a cue fires,
 * routine runs, you realize after. COYL interrupts THE LOOP, not any specific
 * behavior. This section makes that explicit so visitors don't pigeonhole
 * the product based on whatever wedge copy they saw first.
 *
 * Card destinations:
 *   • Cards with dedicated marketing pages link to them.
 *   • Cards without (emotional reactivity, focus, money) link to
 *     /decision-support as a catch-all — they share the same mechanism
 *     and the same generic support experience.
 */

type Wedge = {
  title: string
  description: string
  icon: LucideIcon
  href: string
  hasPage: boolean
}

const WEDGES: Wedge[] = [
  {
    title: 'Food & weight',
    description: 'The 9 PM kitchen. The weekend collapse. The "I\u2019ll restart Monday."',
    icon: Utensils,
    href: '/weight-loss',
    hasPage: true,
  },
  {
    title: 'Destructive patterns',
    description: 'The drink. The scroll. The substance. The loops you said you\u2019d break.',
    icon: Flame,
    href: '/destructive-behaviors',
    hasPage: true,
  },
  {
    title: 'Emotional reactivity',
    description: 'The text you regret. The silent treatment. The fight that wasn\u2019t worth it.',
    icon: MessageSquareWarning,
    href: '/decision-support',
    hasPage: false,
  },
  {
    title: 'Focus & avoidance',
    description: 'The scroll. The task you keep skipping. The call you won\u2019t make.',
    icon: Smartphone,
    href: '/decision-support',
    hasPage: false,
  },
  {
    title: 'Money & impulse',
    description: 'The cart. The subscription. The "small" thing you buy a hundred times.',
    icon: Wallet,
    href: '/decision-support',
    hasPage: false,
  },
  {
    title: 'Any decision you keep making wrong',
    description: 'COYL learns your cue. Interrupts your routine. Helps you recover without shame.',
    icon: Brain,
    href: '/how-it-works',
    hasPage: true,
  },
]

export function UniversalWedges() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-14 max-w-3xl"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Built first for weight loss
        </h2>
        <h3 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          The same loop<br />
          <span className="text-orange-400">runs the rest of your life.</span>
        </h3>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-400">
          Late-night eating is the one we optimize for today. But if you recognize the pattern
          \u2014 "good for a few days, then I fold" \u2014 it\u2019s the same machinery behind
          the doom scroll, the angry text, the skipped workout, the cart you can\u2019t close.
          Start with the wedge that fits. The product works on the others too.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {WEDGES.map((w, i) => {
          const Icon = w.icon
          return (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05 + i * 0.06, duration: 0.5 }}
            >
              <Link
                href={w.href}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 transition-all hover:border-orange-500/40 hover:from-orange-500/[0.06] hover:to-transparent"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-colors group-hover:border-orange-500/40 group-hover:bg-orange-500/10 group-hover:text-orange-400">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h4 className="mb-2 text-base font-bold text-white">{w.title}</h4>
                <p className="flex-1 text-sm leading-relaxed text-gray-400">{w.description}</p>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-orange-400/80 transition-colors group-hover:text-orange-400">
                  {w.hasPage ? 'See how' : 'Start here'}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Science credibility lives on /science. Homepage stays emotional. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-10 max-w-3xl text-xs text-gray-500"
      >
        Built on real behavioral research. <Link href="/science" className="text-orange-400 hover:underline">The research \u2192</Link>
      </motion.p>
    </section>
  )
}
