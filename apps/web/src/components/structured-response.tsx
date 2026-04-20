'use client'

import { motion } from 'motion/react'
import { parseStructuredSections } from '@/lib/parse-structured'

interface Props {
  text: string
  accentColor?: 'orange' | 'red' | 'emerald'
}

/**
 * Renders a streaming AI response as a stack of labeled cards.
 * If the text has no **Section** markers, it falls back to a single card.
 */
export function StructuredResponse({ text, accentColor = 'orange' }: Props) {
  const sections = parseStructuredSections(text)

  // Fallback: no sections parsed, render as one card
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
    accentColor === 'red' ? 'border-red-500/20'
    : accentColor === 'emerald' ? 'border-emerald-500/20'
    : 'border-orange-500/20'

  const headerColor =
    accentColor === 'red' ? 'text-red-400'
    : accentColor === 'emerald' ? 'text-emerald-400'
    : 'text-orange-500'

  return (
    <div className="space-y-2.5">
      {sections.map((s, i) => (
        <motion.div
          key={`${s.title ?? 'tail'}-${i}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.03 }}
          className={`glass rounded-2xl border-l-[3px] p-4 ${borderColor}`}
        >
          {s.title && (
            <div className="mb-1.5 flex items-center gap-2">
              {s.emoji && <span className="text-base">{s.emoji}</span>}
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
      ))}
    </div>
  )
}
