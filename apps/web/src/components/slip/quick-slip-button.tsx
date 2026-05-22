'use client'

/**
 * QuickSlipButton — the one-tap "I slipped." affordance for /today.
 *
 * Slip logging used to be 3-8 taps (open modal, type trigger, optional
 * notes, optional commitment link, submit). The friction killed the data
 * we need most: timestamped ground-truth slip events. This button
 * removes all of it. Tap once, confess, get acknowledged, optionally
 * route into the 90-second rescue ritual.
 *
 * NOT a modal. NOT a form. The user sees an "I slipped." button; on
 * click we POST to /api/v1/slip/quick (empty body, fully inferred
 * server-side); the button briefly displays the inferred trigger +
 * (optionally) the linked commitment; after 4s it resets.
 *
 * Treatment is intentionally restrained: no celebration, no judgment.
 * A dropped pebble, not a fanfare. Matches the page's editorial
 * gallery-label aesthetic — Geist Sans + warm charcoal.
 */
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Footprints } from 'lucide-react'

type QuickSlipResponse = {
  slip: {
    id: string
    trigger: string | null
    notes: string | null
    commitmentId: string | null
    createdAt: string
  }
  inferred: {
    window: string | null
    commitment: string | null
  }
  rescueLink: string
}

type ButtonState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'logged'; loggedAt: Date; result: QuickSlipResponse }
  | { status: 'error'; message: string }

export function QuickSlipButton() {
  const [state, setState] = useState<ButtonState>({ status: 'idle' })
  const [, startTransition] = useTransition()

  async function handleClick() {
    if (state.status === 'loading') return
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/v1/slip/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        if (res.status === 402) {
          setState({ status: 'error', message: 'Recovery Engine is a Core feature.' })
          return
        }
        if (res.status === 401) {
          setState({ status: 'error', message: 'Sign in to log slips.' })
          return
        }
        setState({ status: 'error', message: 'Could not log. Try again.' })
        return
      }
      const data = (await res.json()) as QuickSlipResponse
      setState({ status: 'logged', loggedAt: new Date(), result: data })
      // Reset to idle after 4s — long enough to read the acknowledgment,
      // short enough that a second slip doesn't require a refresh.
      window.setTimeout(() => {
        startTransition(() => setState({ status: 'idle' }))
      }, 4000)
    } catch {
      setState({ status: 'error', message: 'Could not log. Try again.' })
    }
  }

  const isLogged = state.status === 'logged'
  const isLoading = state.status === 'loading'
  const isError = state.status === 'error'

  return (
    <div className="mb-12 border-y border-white/[0.05] py-6">
      <p className="font-sans text-[12px] leading-relaxed text-zinc-400">
        Slipped just now?
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-sm border border-white/[0.10] bg-[#13110d] px-4 py-2 font-sans text-[13px] font-medium text-[#f5f3ee] transition-colors hover:border-orange-500/40 hover:bg-[#181510] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Log a slip with one tap"
        >
          <Footprints className="h-3.5 w-3.5 text-orange-400/80" />
          {isLoading ? 'Logging...' : isLogged ? `Logged at ${formatTime(state.loggedAt)}.` : 'I slipped.'}
        </button>

        {isLogged && state.result.inferred.commitment && (
          <span className="inline-flex items-center rounded-full border border-orange-500/25 bg-orange-500/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-orange-300/90">
            linked: {truncate(state.result.inferred.commitment, 48)}
          </span>
        )}
      </div>

      {isLogged && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8a847a]">
          {state.result.slip.trigger ?? 'Quick slip'}
        </p>
      )}

      {isError && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-red-400/80">
          {state.message}
        </p>
      )}

      <div className="mt-3">
        <Link
          href={isLogged ? state.result.rescueLink : '/rescue'}
          className="inline-flex items-center font-sans text-[12px] text-zinc-500 underline-offset-2 transition-colors hover:text-orange-400 hover:underline"
        >
          Need a 90-second reset &rarr;
        </Link>
      </div>
    </div>
  )
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}
