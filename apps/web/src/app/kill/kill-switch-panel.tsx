'use client'

/**
 * /kill — client island for the dedicated kill-switch surface.
 *
 * Same confirm → POST → success/error state machine as the inline
 * kill-switch UI inside /consent/uap (apps/web/src/app/(legal)/consent/
 * uap/consent-form.tsx). Kept as a separate component because:
 *   1. The /kill page is a public-by-default safety surface — it must
 *      render even for signed-out visitors and degrade gracefully.
 *   2. Sharing a component with consent-form would couple two surfaces
 *      that have different layout chrome and different post-kill exits
 *      (consent-form returns to /settings; /kill returns to /).
 *   3. The dedicated panel can show a stronger "you are about to do
 *      something destructive" affordance — full-width red button, no
 *      surrounding form context — because the user navigated here
 *      with explicit intent.
 *
 * Identity resolution: /api/uap/v1/kill-switch validates that
 * body.user_id matches the Clerk-authenticated user. We resolve the
 * DB id via GET /api/v1/user. If the visitor is signed out (401), we
 * surface a sign-in CTA that round-trips back to /kill so they can
 * re-attempt without losing context.
 */

import { useEffect, useState } from 'react'

const KILL_SWITCH_ENDPOINT = '/api/uap/v1/kill-switch'
const USER_ENDPOINT = '/api/v1/user'
const KILL_REASON = 'user_initiated_from_kill_page'
const KILL_CONFIRM_MESSAGE =
  'This will revoke ALL standing authority you’ve granted to ANY AI. Continue?'

type KillStatus =
  | { kind: 'resolving_user' }
  | { kind: 'unauthenticated' }
  | { kind: 'idle' }
  | { kind: 'confirming' }
  | { kind: 'submitting' }
  | {
      kind: 'success'
      killedAt: string
      affectedGrantCount: number
      auditUrl: string | null
    }
  | { kind: 'error'; message: string }

export function KillSwitchPanel() {
  const [userId, setUserId] = useState<string | null>(null)
  const [status, setStatus] = useState<KillStatus>({ kind: 'resolving_user' })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(USER_ENDPOINT, {
          method: 'GET',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        })
        if (cancelled) return
        if (res.status === 401 || res.status === 403) {
          setUserId(null)
          setStatus({ kind: 'unauthenticated' })
          return
        }
        if (!res.ok) {
          setUserId(null)
          setStatus({ kind: 'unauthenticated' })
          return
        }
        const data = (await res.json().catch(() => null)) as
          | { id?: string }
          | null
        if (!data?.id) {
          setUserId(null)
          setStatus({ kind: 'unauthenticated' })
          return
        }
        setUserId(data.id)
        setStatus({ kind: 'idle' })
      } catch {
        if (cancelled) return
        setUserId(null)
        setStatus({ kind: 'unauthenticated' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function fireKill() {
    if (!userId) {
      setStatus({ kind: 'unauthenticated' })
      return
    }
    setStatus({ kind: 'submitting' })
    try {
      const res = await fetch(KILL_SWITCH_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, reason: KILL_REASON }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        let detail = `Kill switch endpoint returned ${res.status}.`
        try {
          const parsed = JSON.parse(text) as {
            message?: string
            error?: string
          }
          if (parsed.message) detail = parsed.message
          else if (parsed.error) detail = parsed.error
        } catch {
          if (text) detail = text.slice(0, 240)
        }
        setStatus({ kind: 'error', message: detail })
        return
      }
      const data = (await res.json().catch(() => null)) as
        | {
            killed_at?: string
            affected_grant_ids?: string[]
            audit_url?: string
          }
        | null
      setStatus({
        kind: 'success',
        killedAt: data?.killed_at ?? new Date().toISOString(),
        affectedGrantCount: Array.isArray(data?.affected_grant_ids)
          ? data!.affected_grant_ids!.length
          : 0,
        auditUrl: data?.audit_url ?? null,
      })
    } catch (err) {
      setStatus({
        kind: 'error',
        message:
          err instanceof Error
            ? `Network error: ${err.message}`
            : 'Network error firing kill switch.',
      })
    }
  }

  return (
    <section
      aria-labelledby="kill-page-action-heading"
      className="space-y-6 rounded-2xl border-2 border-orange-500 bg-white p-6 shadow-[0_0_40px_rgba(255,102,0,0.08)] md:p-8"
    >
      <p
        id="kill-page-action-heading"
        className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-700"
      >
        The button
      </p>

      {status.kind === 'resolving_user' && (
        <div className="space-y-3">
          <p className="font-serif text-lg italic text-gray-700">
            Resolving your identity…
          </p>
          <p className="text-sm leading-[1.6] text-gray-600">
            We need to verify whose grants to revoke before the kill
            switch can fire.
          </p>
        </div>
      )}

      {status.kind === 'unauthenticated' && (
        <div className="space-y-4">
          <p className="font-serif text-lg italic text-gray-900">
            You’re signed out.
          </p>
          <p className="text-sm leading-[1.6] text-gray-700">
            The kill switch can only revoke authority that belongs to a
            signed-in account — it is a self-service primitive, not an
            anonymous one (per UAP §5). Sign in once and the kill fires
            immediately.
          </p>
          <a
            href={`/sign-in?redirect_url=${encodeURIComponent('/kill')}`}
            className="inline-flex items-center rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,102,0,0.22)] transition-colors hover:bg-orange-700"
          >
            Sign in to revoke &rarr;
          </a>
        </div>
      )}

      {status.kind === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm leading-[1.6] text-gray-700">
            One press fires a confirmation. A second press revokes
            every active UAP grant on your account.
          </p>
          <button
            type="button"
            onClick={() => setStatus({ kind: 'confirming' })}
            className="block w-full rounded-full bg-orange-600 px-6 py-4 text-base font-semibold text-white shadow-[0_0_30px_rgba(255,102,0,0.28)] transition-colors hover:bg-orange-700 md:w-auto md:text-lg"
          >
            Revoke all standing authority
          </button>
        </div>
      )}

      {status.kind === 'confirming' && (
        <div className="space-y-4 rounded-xl border border-orange-500 bg-orange-50/40 p-5">
          <p className="font-serif text-lg italic text-gray-900">
            {KILL_CONFIRM_MESSAGE}
          </p>
          <p className="text-sm leading-[1.6] text-gray-700">
            Every active grant — every partner, every scope — flips to{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-orange-700">
              KILLED_GLOBALLY
            </code>{' '}
            in a single transaction. You can issue fresh grants
            afterward; nothing about your account or audit history is
            lost.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={fireKill}
              className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,102,0,0.22)] transition-colors hover:bg-orange-700"
            >
              Yes — revoke everything now
            </button>
            <button
              type="button"
              onClick={() => setStatus({ kind: 'idle' })}
              className="text-sm font-medium text-gray-700 underline decoration-gray-400 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status.kind === 'submitting' && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-500 bg-orange-50/40 p-5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-orange-500"
          />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-orange-700">
            Revoking every active grant…
          </p>
        </div>
      )}

      {status.kind === 'success' && (
        <div
          role="status"
          className="space-y-3 rounded-xl border border-orange-500 bg-orange-50/40 p-5"
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-orange-700">
            Authority revoked
          </p>
          <p className="font-serif text-lg italic text-gray-900">
            {status.affectedGrantCount === 0
              ? 'No active grants existed — your authority surface was already clean.'
              : status.affectedGrantCount === 1
                ? '1 active grant was revoked.'
                : `${status.affectedGrantCount} active grants were revoked.`}
          </p>
          <p className="text-sm leading-[1.6] text-gray-700">
            Authority revoked. Reload the page to issue new grants.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="/"
              className="inline-flex items-center rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,102,0,0.22)] transition-colors hover:bg-orange-700"
            >
              Back to home &rarr;
            </a>
            {status.auditUrl && (
              <a
                href={status.auditUrl}
                className="text-sm font-medium text-orange-700 underline decoration-orange-500/40 underline-offset-4 transition-colors hover:decoration-orange-500"
              >
                View audit trail
              </a>
            )}
          </div>
        </div>
      )}

      {status.kind === 'error' && (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-orange-600 bg-orange-50/40 p-5"
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-orange-700">
            Kill switch did not fire
          </p>
          <p className="text-sm leading-[1.55] text-gray-800">{status.message}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStatus({ kind: 'confirming' })}
              className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
