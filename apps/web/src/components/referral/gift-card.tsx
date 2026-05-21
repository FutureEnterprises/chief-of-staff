'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Gift, Copy, Check, Send, Sparkles } from 'lucide-react'

/**
 * <GiftCoylCard /> — the "Give a month, get a month" referral surface.
 *
 * Mounted in Settings. Fetches the user's permanent referral code +
 * stats from GET /api/v1/referrals on mount. UI states:
 *   - Loading (silent skeleton)
 *   - Empty (no invites sent): show share UI + value prop
 *   - Active (invites sent): show stats + share UI
 *   - Earned (credit pending): celebrate the converted credit
 *
 * Three share affordances:
 *   - Copy link
 *   - Native Web Share API on mobile (sharesheet)
 *   - mailto: prefilled "Try this" message
 *
 * Brand voice rule: never call this "referral program" in the UI.
 * "Give a month, get a month" is the headline. The mechanic does the
 * work; the language stays human.
 */

interface ReferralStats {
  code: string
  shareUrl: string
  invitesSent: number
  invitesConverted: number
  creditMonthsPending: number
}

export function GiftCoylCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareSupported, setShareSupported] = useState(false)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setShareSupported(true)
    }

    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/v1/referrals')
        if (!res.ok) return
        const data = (await res.json()) as ReferralStats
        if (!cancelled) setStats(data)
      } catch {
        // silent — empty state still renders
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function copyLink() {
    if (!stats) return
    try {
      await navigator.clipboard.writeText(stats.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — fall back to select-on-display
    }
  }

  async function nativeShare() {
    if (!stats || !shareSupported) return
    try {
      await navigator.share({
        title: 'COYL',
        text: shareCopy(),
        url: stats.shareUrl,
      })
    } catch {
      // user cancelled — ignore
    }
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-orange-500" />
          <p className="text-base font-semibold">Gift COYL</p>
        </div>
      </div>
    )
  }

  const hasPendingCredit = stats.creditMonthsPending > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.06] to-transparent p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-orange-400" />
          <p className="text-base font-semibold text-foreground">Gift COYL</p>
        </div>
        {hasPendingCredit && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <Sparkles className="h-3 w-3" />
            {stats.creditMonthsPending} free {stats.creditMonthsPending === 1 ? 'month' : 'months'} earned
          </span>
        )}
      </div>

      <p className="mb-1 text-xl font-black leading-tight text-foreground">
        Give a month. Get a month.
      </p>
      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
        Share your link. When a friend signs up and starts paying, you both get a free month of Core. Credit applies at your next checkout — no expiration, no fine print.
      </p>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <code className="flex-1 select-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-foreground">
          {stats.shareUrl}
        </code>
        <button
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_16px_-3px_rgba(255,102,0,0.4)]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy link
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {shareSupported && (
          <button
            onClick={nativeShare}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-white/[0.05]"
          >
            <Send className="h-3 w-3" /> Share
          </button>
        )}
        <a
          href={`mailto:?subject=${encodeURIComponent('Try COYL')}&body=${encodeURIComponent(`${shareCopy()}\n\n${stats.shareUrl}`)}`}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Email it
        </a>
      </div>

      {stats.invitesSent > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
          <Stat label="Sent" value={stats.invitesSent} />
          <Stat label="Started paying" value={stats.invitesConverted} />
          <Stat label="Months earned" value={stats.creditMonthsPending} highlight={hasPendingCredit} />
        </div>
      )}
    </motion.div>
  )
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black tabular-nums ${highlight ? 'text-emerald-300' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}

function shareCopy(): string {
  return "I've been using COYL — it fires a notification at the exact moment my autopilot wants to run. Late-night eating, the 9pm kitchen, doom-scrolling. Try it free. You get a month of Core on me when you start paying, and so do I."
}
