'use client'

import { useEffect, useState, useCallback } from 'react'
import { Copy, Check, Send } from 'lucide-react'

/**
 * <DailyCard /> — the in-app Wrapped/Daily-Number ritual surface.
 *
 * Renders ONE number, ONE identity sentence, ONE-tap share — the same
 * four-element layout used on the public /d/[code] page + the social
 * 1080×1080 PNG so the user, their friends, and the link previews all
 * see the same atom.
 *
 * Element order (top → bottom):
 *   1. DAY N.           mono micro, muted
 *   2. +X / -X / 0      Instrument Serif huge, orange focal
 *   3. {identity}       Instrument Serif large, near-black
 *   4. — COYL           mono micro, soft
 *
 * Below the card: Share. Tapping it opens a native share sheet
 * (mobile) or copies the link (desktop). Either action POSTs
 * action='share' to /api/v1/daily-number/today so the row's shareCount
 * increments — the cron + read-side endpoint both see the bump.
 *
 * Rendered in today-view.tsx under the "Today's number" eyebrow,
 * between the metrics rail and InterruptHistory.
 */

type DailyPayload = {
  id: string
  dayNumber: number
  selfTrustScore: number
  selfTrustDelta: number
  deltaLabel: string
  identitySentence: string
  shareCode: string
  shareUrl: string
  shareCount: number
  variant: string
}

type FetchState = 'idle' | 'loading' | 'ready' | 'error'

export function DailyCard() {
  const [state, setState] = useState<FetchState>('idle')
  const [daily, setDaily] = useState<DailyPayload | null>(null)
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'copied'>('idle')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setState('loading')
      try {
        const res = await fetch('/api/v1/daily-number/today', {
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as DailyPayload
        if (cancelled) return
        setDaily(data)
        setState('ready')
      } catch {
        if (!cancelled) setState('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Fire-and-forget bump. We don't block share UI on this — the API
  // call is incidental analytics, not the user-facing action. Errors
  // are swallowed; the network tab is the source of truth.
  const recordShare = useCallback(() => {
    void fetch('/api/v1/daily-number/today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'share' }),
    }).catch(() => {})
  }, [])

  const onShare = useCallback(async () => {
    if (!daily) return
    const shareText = `Day ${daily.dayNumber}. ${asciiDelta(daily.selfTrustDelta)}. ${daily.identitySentence} — COYL`
    const sharePayload = {
      title: 'COYL daily',
      text: shareText,
      url: daily.shareUrl,
    }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(sharePayload)
        setShareState('shared')
        recordShare()
        window.setTimeout(() => setShareState('idle'), 1800)
        return
      } catch {
        // user cancelled or share rejected — fall through to copy
      }
    }
    // Fallback — clipboard copy of the URL. The share-text is implied
    // by the link preview when the recipient opens it.
    try {
      await navigator.clipboard.writeText(daily.shareUrl)
      setShareState('copied')
      recordShare()
      window.setTimeout(() => setShareState('idle'), 1800)
    } catch {
      // clipboard blocked — no-op
    }
  }, [daily, recordShare])

  if (state === 'loading' || state === 'idle') {
    return <DailyCardSkeleton />
  }
  if (state === 'error' || !daily) {
    // Soft failure — the card just doesn't appear. Today-view has
    // plenty of other content; an aggressive error UI here would
    // distract from the ritual surface elsewhere on the page.
    return null
  }

  const deltaIsPositive = daily.selfTrustDelta > 0
  const deltaIsNegative = daily.selfTrustDelta < 0
  const deltaColor = deltaIsPositive
    ? 'text-[#ff6600]'
    : deltaIsNegative
      ? 'text-[#9a3a1a]'
      : 'text-[#1a1814]'

  const supportsNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <div className="w-full">
      <section
        aria-label={`Day ${daily.dayNumber}. ${daily.deltaLabel}. ${daily.identitySentence}`}
        className="relative aspect-square w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-[#f6efe4] text-[#1a1814] shadow-[0_30px_60px_-20px_rgba(26,24,20,0.18)]"
        style={{ containerType: 'inline-size' }}
      >
        {/* Warm radial wash, single orange — no decorative gloss */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 35%, rgba(255,102,0,0.06), transparent 60%)',
          }}
        />

        <div className="relative flex h-full w-full flex-col justify-between px-[9%] py-[10%]">
          {/* 1. DAY N. — mono micro, muted */}
          <p className="font-mono text-[clamp(11px,1.9cqw,18px)] uppercase tracking-[0.28em] text-[#6b6557]">
            Day {daily.dayNumber}.
          </p>

          {/* 2 + 3 — delta + identity sentence stacked */}
          <div className="flex flex-col gap-[2%]">
            <p
              className={`font-serif leading-[0.9] tracking-[-0.04em] ${deltaColor}`}
              style={{ fontSize: 'clamp(72px, 22cqw, 256px)' }}
            >
              {daily.deltaLabel}
            </p>

            <p className="font-serif text-[clamp(22px,5.4cqw,56px)] leading-[1.05] tracking-[-0.012em] text-[#1a1814]">
              {daily.identitySentence}
            </p>
          </div>

          {/* 4. — COYL — mono micro, soft */}
          <p className="font-mono text-[clamp(11px,1.9cqw,18px)] uppercase tracking-[0.28em] text-[#9a8f7a]">
            &mdash; COYL
          </p>
        </div>
      </section>

      {/* Share row — the one tap. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-full bg-[#ff6600] px-5 py-2.5 text-sm font-bold text-[#0e0d0b] shadow-[0_0_16px_-3px_rgba(255,102,0,0.4)] transition-transform hover:scale-[1.02]"
        >
          {shareState === 'shared' ? (
            <>
              <Check className="h-4 w-4" /> Shared
            </>
          ) : shareState === 'copied' ? (
            <>
              <Check className="h-4 w-4" /> Link copied
            </>
          ) : supportsNativeShare ? (
            <>
              <Send className="h-4 w-4" /> Share
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy link
            </>
          )}
        </button>
        {daily.shareCount > 0 && (
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9a8f7a]">
            Seen by {daily.shareCount}{' '}
            {daily.shareCount === 1 ? 'person' : 'people'}
          </span>
        )}
      </div>
    </div>
  )
}

function DailyCardSkeleton() {
  return (
    <div
      aria-hidden
      className="aspect-square w-full animate-pulse rounded-3xl border border-black/[0.05] bg-[#efe7d8]"
    />
  )
}

// ASCII fallback for plaintext share targets (SMS, email body) where
// the Unicode minus could mojibake. Matches the server helper.
function asciiDelta(delta: number): string {
  if (delta === 0) return '0'
  if (delta > 0) return `+${delta}`
  return `-${Math.abs(delta)}`
}
