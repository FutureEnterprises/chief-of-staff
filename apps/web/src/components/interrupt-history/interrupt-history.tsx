'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Flame, ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react'

/**
 * <InterruptHistory /> — visible proof the JITAI claim is real.
 *
 * The marketing site claims "real-time pattern interrupt." Users can
 * read that. They can't FEEL it until they see a list of the moments
 * COYL caught them, with timestamps and their own feedback. This card
 * makes the abstract claim concrete.
 *
 * Data source: GET /api/v1/events?type=AUTOPILOT_INTERRUPTED&limit=10
 * matched with INTERRUPT_FEEDBACK events by metadataJson.windowId where
 * available. Rendered in /today below the danger-window stats.
 *
 * Honest about empty state: if no interrupts have fired yet, the card
 * doesn't pretend. It tells the user when the system will start firing
 * and links to the relevant settings.
 */

interface InterruptRow {
  id: string
  firedAt: string // ISO
  kind: string
  label: string | null
  channel: string
  feedback: 'helpful' | 'not_helpful' | null
}

export function InterruptHistory({ planType }: { planType?: string }) {
  const [rows, setRows] = useState<InterruptRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isFree = planType === 'FREE'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/v1/events?type=AUTOPILOT_INTERRUPTED&limit=10')
        if (!res.ok) throw new Error('Failed to load')
        const data = (await res.json()) as { events: InterruptRow[] }
        if (!cancelled) setRows(data.events ?? [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'unknown')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return null
  if (rows == null) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <p className="label-xs text-orange-500">RECENT INTERRUPTS</p>
        <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
      >
        <p className="label-xs text-orange-500">RECENT INTERRUPTS</p>
        <p className="mt-2 text-sm font-semibold text-foreground">
          No interrupts fired yet.
        </p>
        {isFree ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Your first interrupt fires the next time you&rsquo;re inside a danger
            window. Free plan includes 3 interrupts a week —{' '}
            <Link href="/pricing" className="text-orange-400 underline-offset-2 hover:underline">
              upgrade for unlimited
            </Link>
            .
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            The first one fires the next time you&rsquo;re inside one of your danger
            windows. Map more windows on the patterns page to sharpen the model.
          </p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="label-xs text-orange-500">RECENT INTERRUPTS</p>
        <p className="text-[10px] text-muted-foreground">{rows.length} fired in last 7 days</p>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
            <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {humanKind(r.kind)}
                {r.label ? <span className="text-muted-foreground"> &middot; {r.label}</span> : null}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                {formatRelative(r.firedAt)} &middot; {r.channel}
              </p>
            </div>
            <FeedbackBadge feedback={r.feedback} />
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function FeedbackBadge({ feedback }: { feedback: InterruptRow['feedback'] }) {
  if (feedback === 'helpful') {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
        <ThumbsUp className="h-3 w-3" /> Caught me
      </span>
    )
  }
  if (feedback === 'not_helpful') {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
        <ThumbsDown className="h-3 w-3" /> Off
      </span>
    )
  }
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground/60">
      <MinusCircle className="h-3 w-3" /> No feedback
    </span>
  )
}

function humanKind(kind: string): string {
  switch (kind) {
    case 'DANGER_WINDOW': return 'Danger window'
    case 'POST_SLIP_2H':  return 'Post-slip · 2h check'
    case 'POST_SLIP_24H': return 'Post-slip · 24h resolve'
    case 'GLP1_DAY3':     return 'GLP-1 day-3'
    default:              return kind.replace(/_/g, ' ').toLowerCase()
  }
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
