'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Share2, Copy, Check, X } from 'lucide-react'

/**
 * ShareMoment — the small share chip used at emotional peak moments in the
 * product (post-onboarding, post-slip-recovery, streak milestones).
 *
 * Why a separate component from ShareButton: the existing ShareButton is
 * tightly coupled to the execution-score card. ShareMoment is type-aware —
 * it points at `/api/share/[userId]?type={moment}` so each peak gets its
 * own OG image, and the copy it feeds to Web Share is the emotional hook
 * for that specific moment, not a generic score.
 *
 * Behavior: Web Share API on mobile (native sheet), clipboard fallback
 * on desktop. Shows a 2s "copied" confirmation inline so the user knows
 * something happened.
 */

type MomentType = 'readme' | 'recovery' | 'streak' | 'pattern'

interface Props {
  userId: string
  moment: MomentType
  /** The text message that accompanies the share link. Should be shareable on its own. */
  shareText: string
  /** Button label (shown next to the icon). */
  label?: string
  /** Optional emphasis variant — 'solid' (gradient) or 'glass' (subtle). */
  variant?: 'solid' | 'glass'
}

export function ShareMoment({ userId, moment, shareText, label = 'Share this', variant = 'glass' }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')

  async function doShare() {
    const shareUrl = `https://coyl.ai/api/share/${userId}?type=${moment}`
    const fullText = `${shareText}\n\ncoyl.ai`

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ text: fullText, url: 'https://coyl.ai' })
        return
      } catch {
        // User dismissed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${fullText}\n${shareUrl}`)
      setState('copied')
      setTimeout(() => setState('idle'), 2200)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2200)
    }
  }

  const isSolid = variant === 'solid'
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all'
  const style = isSolid
    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_16px_rgba(255,102,0,0.25)] hover:scale-[1.02]'
    : 'border border-white/10 bg-white/5 text-gray-300 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300'

  return (
    <button onClick={doShare} className={`${base} ${style}`}>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            {label}
          </motion.span>
        )}
        {state === 'copied' && (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            Copied
          </motion.span>
        )}
        {state === 'error' && (
          <motion.span
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-1.5 text-red-300"
          >
            <X className="h-3.5 w-3.5" />
            Blocked
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
