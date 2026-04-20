'use client'

import { motion } from 'motion/react'
import {
  Target, Check, AlertTriangle, Brain, Footprints, Pause, Bandage,
  Repeat, Timer, HelpCircle, OctagonX, Bell, Search, Heart, Ban,
  Calendar, Tag, Clipboard,
} from 'lucide-react'
import { parseStructuredSections, type SectionIcon } from '@/lib/parse-structured'

interface Props {
  text: string
  accentColor?: 'orange' | 'red' | 'emerald'
}

// Single source of truth for section-header icons. Strings in parse-structured
// map to components here. Keeps the parser pure (no JSX) and easy to test.
const ICON_MAP: Record<SectionIcon, React.ComponentType<{ className?: string }>> = {
  target: Target,
  check: Check,
  alert: AlertTriangle,
  brain: Brain,
  footprints: Footprints,
  pause: Pause,
  bandage: Bandage,
  repeat: Repeat,
  timer: Timer,
  help: HelpCircle,
  stop: OctagonX,
  bell: Bell,
  search: Search,
  heart: Heart,
  ban: Ban,
  calendar: Calendar,
  tag: Tag,
  clipboard: Clipboard,
}

/**
 * Renders a streaming AI response as a stack of labeled cards.
 * If the text has no **Section** markers, it falls back to a single card.
 */
export function StructuredResponse({ text, accentColor = 'orange' }: Props) {
  const sections = parseStructuredSections(text)

  if (sections.length === 0) return null

  // If only one unlabeled section, render as a single block (keeps stream feel)
  if (sections.length === 1 && !sections[0]!.title) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {sections[0]!.body}
        </p>
      </div>
    )
  }

  const borderColor =
    accentColor === 'red' ? 'border-red-500/30'
    : accentColor === 'emerald' ? 'border-emerald-500/30'
    : 'border-orange-500/30'

  const headerColor =
    accentColor === 'red' ? 'text-red-400'
    : accentColor === 'emerald' ? 'text-emerald-400'
    : 'text-orange-500'

  const iconColor =
    accentColor === 'red' ? 'text-red-400'
    : accentColor === 'emerald' ? 'text-emerald-400'
    : 'text-orange-500'

  return (
    <div className="space-y-2.5">
      {sections.map((s, i) => {
        const Icon = s.icon ? ICON_MAP[s.icon] : null
        return (
          <motion.div
            key={`${s.title ?? 'tail'}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className={`glass rounded-2xl border-l-[3px] p-4 ${borderColor}`}
          >
            {s.title && (
              <div className="mb-1.5 flex items-center gap-2">
                {Icon && <Icon className={`h-3.5 w-3.5 ${iconColor}`} />}
                <p className={`text-[10px] font-mono uppercase tracking-widest ${headerColor}`}>
                  {s.title}
                </p>
              </div>
            )}
            {s.body && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {s.body}
              </p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
