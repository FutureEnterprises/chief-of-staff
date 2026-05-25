'use client'

/**
 * YourAutopilotMapBanner
 *
 * Client-side banner that sits above the /autopilot-map marketing
 * content and renders the visitor's REAL most-recent
 * AutopilotMapSnapshot when they're signed in.
 *
 * Why client-side: /autopilot-map's parent is a static marketing page,
 * and the project has Next 16 Cache Components enabled — segment-level
 * `dynamic = 'force-dynamic'` is forbidden. Doing the auth check + DB
 * read in the server component would force the entire marketing
 * surface into request-time rendering. Fetching from a client
 * component keeps the marketing page statically rendered while the
 * personalised data layer hydrates on top.
 *
 * Three render states (matches the marketing page contract):
 *   - signed out → render NOTHING (prospect sees pure marketing)
 *   - signed in, no snapshot yet → "publishes Monday at 6 AM UTC" banner
 *   - signed in, has snapshot → "Your Map" section with 4 real cards
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarClock,
  Clock,
  Layers,
  MessageSquareQuote,
  Share2,
} from 'lucide-react'

type Snapshot = {
  topExcuse: string | null
  topExcuseCount: number | null
  peakWindowLabel: string | null
  peakWindowSlips: number | null
  slipsThisWeek: number | null
  recoveredCount: number | null
  recoveryRate: number | null
  patternSignature: string | null
  weekLabel: string | null
  shareSlug: string
}

type FetchState =
  | { kind: 'loading' }
  | { kind: 'signed_out' }
  | { kind: 'no_snapshot' }
  | { kind: 'ok'; snapshot: Snapshot }
  | { kind: 'error' }

export function YourAutopilotMapBanner() {
  const [state, setState] = useState<FetchState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/autopilot-map/me', { credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          setState({ kind: 'signed_out' })
          return
        }
        const body = (await res.json().catch(() => null)) as
          | { status?: string; snapshot?: Snapshot }
          | null
        if (!body) {
          setState({ kind: 'error' })
          return
        }
        if (body.status === 'unauthenticated') {
          setState({ kind: 'signed_out' })
          return
        }
        if (body.status === 'ok' && body.snapshot) {
          setState({ kind: 'ok', snapshot: body.snapshot })
          return
        }
        setState({ kind: 'no_snapshot' })
      })
      .catch(() => {
        if (cancelled) return
        setState({ kind: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Loading + signed-out + error states render nothing so the marketing
  // surface stays clean for prospects (and for the SSR pre-hydration
  // pass, where there's no auth context yet).
  if (state.kind === 'loading') return null
  if (state.kind === 'signed_out') return null
  if (state.kind === 'error') return null

  if (state.kind === 'no_snapshot') {
    return (
      <section
        aria-label="Your Autopilot Map status"
        className="border-b border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white px-6 py-6 md:px-10"
      >
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Your Autopilot Map
            </span>
          </div>
          <p className="text-sm leading-[1.55] text-gray-700 md:max-w-2xl md:text-right">
            Your first Autopilot Map publishes{' '}
            <span className="font-medium text-gray-900">
              Monday at 6 AM UTC
            </span>
            &nbsp;&mdash; keep logging this week and you&rsquo;ll see your
            patterns.
          </p>
        </div>
      </section>
    )
  }

  // state.kind === 'ok'
  const s = state.snapshot
  const recoveryPercent =
    typeof s.recoveryRate === 'number'
      ? `${Math.round(s.recoveryRate * 100)}%`
      : '—'

  return (
    <section
      aria-label="Your most recent Autopilot Map"
      className="space-y-10 border-b border-orange-200 bg-gradient-to-br from-orange-50/60 via-white to-white px-6 py-12 md:px-10 md:py-16"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Your Map &middot; {s.weekLabel ?? 'This week'}
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Your autopilot, <span className="italic text-orange-600">on a card.</span>
          </h2>
        </div>
        <Link
          href={`/m/${s.shareSlug}`}
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 shadow-[0_2px_8px_-4px_rgba(255,102,0,0.4)] hover:bg-orange-50"
        >
          <Share2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          Share this map
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 — Top excuse */}
        <div className="relative flex aspect-[280/320] flex-col justify-between overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)]">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
              <MessageSquareQuote className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500/80">
              COYL / Yours
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Top excuse
            </p>
            <p className="mt-2 font-serif text-2xl font-normal italic leading-tight text-gray-900">
              {s.topExcuse ? `"${s.topExcuse}"` : 'Not enough data yet'}
            </p>
            {typeof s.topExcuseCount === 'number' && s.topExcuseCount > 0 ? (
              <p className="mt-3 text-xs text-gray-600">
                Said {s.topExcuseCount}&times; this week.
              </p>
            ) : null}
          </div>
        </div>

        {/* Card 2 — Peak window */}
        <div className="relative flex aspect-[280/320] flex-col justify-between overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)]">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
              <Clock className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500/80">
              COYL / Yours
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Peak window
            </p>
            <p className="mt-2 font-serif text-3xl font-normal leading-tight tracking-tight text-gray-900">
              {s.peakWindowLabel ?? '—'}
            </p>
            {typeof s.peakWindowSlips === 'number' && s.peakWindowSlips > 0 ? (
              <p className="mt-3 text-xs text-gray-600">
                {s.peakWindowSlips} slips fired in this window.
              </p>
            ) : null}
          </div>
        </div>

        {/* Card 3 — Recovery rate */}
        <div className="relative flex aspect-[280/320] flex-col justify-between overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)]">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
              <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500/80">
              COYL / Yours
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Recovery rate
            </p>
            <p className="mt-2 font-serif text-5xl font-normal leading-none tracking-tight text-gray-900">
              {recoveryPercent}
            </p>
            <p className="mt-3 text-xs text-gray-600">
              {typeof s.recoveredCount === 'number' &&
              typeof s.slipsThisWeek === 'number'
                ? `${s.recoveredCount} of ${s.slipsThisWeek} slips recovered this week.`
                : 'Bounce-back is the product.'}
            </p>
          </div>
        </div>

        {/* Card 4 — Pattern signature */}
        <div className="relative flex aspect-[280/320] flex-col justify-between overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)]">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
              <Layers className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500/80">
              COYL / Yours
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Pattern signature
            </p>
            <p className="mt-2 font-serif text-2xl font-normal leading-tight tracking-tight text-gray-900">
              {s.patternSignature ?? 'Forming…'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
