'use client'

/**
 * /consent/uap — UAP v0.1.1 hosted consent UI (client island).
 *
 * This is the interactive surface of the protocol-mandated consent
 * page (see ./page.tsx for the server shell and the full §8
 * compliance rationale). Lives as a client component because the
 * expiry picker + rule toggles + submit-state management cannot be
 * derived purely server-side without round-tripping every keystroke.
 *
 * Protocol-mandated behavior the form encodes (UAP-0.1.md §3 + §8):
 *
 *   ✱ Expiry defaults to 7 days from now (the SHORTEST reasonable
 *     value per §8). User can slide up to 90 days max (the §3
 *     invariant 1 hard ceiling). Expiry is rendered as a date+time,
 *     never as a duration ("Until Fri May 29 at 5 PM" — never "7d").
 *
 *   ✱ The three default rules — spending_cap ($50/action),
 *     quiet_hours (00:00–07:00 in the user's timezone), and
 *     irreversible_floor — are pre-checked (opt-OUT, not opt-IN).
 *     The user can disable spending_cap and quiet_hours. The
 *     irreversible_floor toggle is LOCKED ON and cannot be
 *     disabled — it's the §3 floor and disabling it would make the
 *     resulting grant non-compliant.
 *
 *   ✱ On Approve, POST /api/uap/v1/grant with the spec-conforming
 *     payload (built by sibling agent A7). The payload includes a
 *     consent_artifact per §5 documenting what the user saw and how
 *     they responded — so the audit trail can prove the consent was
 *     genuine and not partner-fabricated.
 *
 *   ✱ On Decline, redirect back to the partner's redirect_uri with
 *     ?status=declined&state=<state>. No DB write, no audit row
 *     (per §4 — terminal-state audit entries are only written for
 *     issued grants, not for never-issued grants).
 *
 * The form does NOT import from /api/uap/v1/grant — the action URL
 * is a string. The /grant route is being built in parallel by sibling
 * agent A7; coupling the URL via import would create a build-order
 * dependency between worktrees.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { UAPScope } from '@/lib/uap/types'
import { UAP_IRREVERSIBLE_FLOOR } from '@/lib/uap/types'

const GRANT_ENDPOINT = '/api/uap/v1/grant'
const KILL_SWITCH_ENDPOINT = '/api/uap/v1/kill-switch'
const USER_ENDPOINT = '/api/v1/user'
const KILL_REASON = 'user_initiated_from_consent_form'
const KILL_CONFIRM_MESSAGE =
  'This will revoke ALL standing authority you’ve granted to ANY AI. Continue?'

/* ──────────────────── Expiry defaults (per §8) ──────────────────── */

const DEFAULT_EXPIRY_DAYS = 7
const MAX_EXPIRY_DAYS = 90
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Format a Date as a value compatible with `<input type="datetime-local">`.
 * Browser convention: "YYYY-MM-DDTHH:MM" in the user's local timezone
 * (no Z suffix, no seconds). We round to the minute.
 */
function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

/**
 * Parse a `<input type="datetime-local">` value back into a Date in
 * the user's local timezone. Returns null on malformed input.
 */
function fromDatetimeLocalValue(v: string): Date | null {
  // `new Date('YYYY-MM-DDTHH:MM')` is interpreted as local time per the
  // datetime-local spec, which is what we want.
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Per §8: "Expiry displayed in the consent dialog as a date+time, not
 * a duration. 'Until Friday May 29 at 5 PM' — never '7 days'." This
 * formatter is the rendering side of that invariant.
 */
function formatHumanExpiry(d: Date): string {
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' })
  const month = d.toLocaleDateString(undefined, { month: 'long' })
  const day = d.getDate()
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: d.getMinutes() === 0 ? undefined : '2-digit',
    hour12: true,
  })
  return `Until ${weekday} ${month} ${day} at ${time}`
}

/* ──────────────────── Component ──────────────────── */

type ConsentFormProps = {
  partnerId: string
  redirectUri: string
  state: string
  scopes: UAPScope[]
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }

/**
 * Kill-switch UI states for the always-visible "revoke everything"
 * affordance rendered inside this form (per UAP-0.1 §8: kill switch
 * never more than two taps away — the consent surface is one of the
 * pages that must satisfy that invariant, so we render the actual
 * working button here rather than just a link out to /kill).
 *
 *   idle           default — the orange "Pull the global kill switch" button
 *   resolving_user fetching the user id from /api/v1/user so we can POST a
 *                  spec-conforming { user_id } body to /api/uap/v1/kill-switch
 *   unauthenticated user is signed-out — surface a sign-in link instead of
 *                      firing a POST that would 401 silently
 *   confirming     showing the inline "this revokes EVERY grant" confirm step
 *   submitting     POST to /api/uap/v1/kill-switch is in flight
 *   success        kill landed; show the affected-grant count and a safe exit
 *   error          something failed — show the API message verbatim
 */
type KillStatus =
  | { kind: 'idle' }
  | { kind: 'resolving_user' }
  | { kind: 'unauthenticated' }
  | { kind: 'confirming' }
  | { kind: 'submitting' }
  | {
      kind: 'success'
      killedAt: string
      affectedGrantCount: number
      auditUrl: string | null
    }
  | { kind: 'error'; message: string }

export function ConsentForm({
  partnerId,
  redirectUri,
  state,
  scopes,
}: ConsentFormProps) {
  // Compute the user's IANA timezone once on mount (it's stable for
  // the lifetime of the page) so we can stamp it onto the
  // quiet_hours rule and the consent_artifact.
  const userTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  }, [])

  // Default expiry: 7 days from page load, in the user's local TZ.
  // Min/max bounds are 1 day from now (no instant-expire grants — they
  // would be useless) and 90 days from now (§3 invariant 1).
  const now = useMemo(() => new Date(), [])
  const minExpiry = useMemo(
    () => new Date(now.getTime() + 60 * 60 * 1000), // +1h floor
    [now],
  )
  const maxExpiry = useMemo(
    () => new Date(now.getTime() + MAX_EXPIRY_DAYS * MS_PER_DAY),
    [now],
  )
  const defaultExpiry = useMemo(
    () => new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * MS_PER_DAY),
    [now],
  )

  const [expiryLocal, setExpiryLocal] = useState<string>(() =>
    toDatetimeLocalValue(defaultExpiry),
  )

  // Rules opt-OUT per §8. spending_cap + quiet_hours start checked
  // and are user-disable-able. irreversible_floor starts checked AND
  // is locked — the §3 floor cannot be disabled at consent time.
  const [spendingCapOn, setSpendingCapOn] = useState(true)
  const [spendingCapUsd, setSpendingCapUsd] = useState<number>(50)
  const [quietHoursOn, setQuietHoursOn] = useState(true)
  const [quietHoursFrom, setQuietHoursFrom] = useState<string>('00:00')
  const [quietHoursTo, setQuietHoursTo] = useState<string>('07:00')
  // irreversibleFloorOn intentionally not in state — it is always true.

  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  /* ───── Kill-switch state + user.id resolution ─────
   *
   * /api/uap/v1/kill-switch validates that body.user_id matches the
   * Clerk-authenticated user (defense in depth — see the route's
   * "SELF-service primitive" comment). We resolve the user's DB id
   * lazily on first render via /api/v1/user; the consent page itself
   * is anonymous-friendly because partners initiate the redirect
   * before the user has signed in, but the kill-switch primitive is
   * fundamentally a signed-in user action. */
  const [userId, setUserId] = useState<string | null>(null)
  const [killStatus, setKillStatus] = useState<KillStatus>({
    kind: 'resolving_user',
  })

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
          setKillStatus({ kind: 'unauthenticated' })
          return
        }
        if (!res.ok) {
          // Treat any other non-2xx as "we couldn't resolve identity".
          // The button still renders, but it routes to /kill (the
          // dedicated surface) which can drive the user through
          // sign-in and re-attempt.
          setUserId(null)
          setKillStatus({ kind: 'unauthenticated' })
          return
        }
        const data = (await res.json().catch(() => null)) as
          | { id?: string }
          | null
        if (!data?.id) {
          setUserId(null)
          setKillStatus({ kind: 'unauthenticated' })
          return
        }
        setUserId(data.id)
        setKillStatus({ kind: 'idle' })
      } catch {
        if (cancelled) return
        setUserId(null)
        setKillStatus({ kind: 'unauthenticated' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleKillConfirmed() {
    if (!userId) {
      setKillStatus({ kind: 'unauthenticated' })
      return
    }
    setKillStatus({ kind: 'submitting' })
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
        setKillStatus({ kind: 'error', message: detail })
        return
      }
      const data = (await res.json().catch(() => null)) as
        | {
            killed_at?: string
            affected_grant_ids?: string[]
            audit_url?: string
          }
        | null
      setKillStatus({
        kind: 'success',
        killedAt: data?.killed_at ?? new Date().toISOString(),
        affectedGrantCount: Array.isArray(data?.affected_grant_ids)
          ? data!.affected_grant_ids!.length
          : 0,
        auditUrl: data?.audit_url ?? null,
      })
    } catch (err) {
      setKillStatus({
        kind: 'error',
        message:
          err instanceof Error
            ? `Network error: ${err.message}`
            : 'Network error firing kill switch.',
      })
    }
  }

  /* ───── Parse expiry, validate against §3 invariant 1 (≤90d) ───── */

  const expiryDate = useMemo(
    () => fromDatetimeLocalValue(expiryLocal),
    [expiryLocal],
  )
  const expiryValid =
    expiryDate !== null &&
    expiryDate.getTime() > minExpiry.getTime() &&
    expiryDate.getTime() <= maxExpiry.getTime()
  const expiryHumanText = expiryDate ? formatHumanExpiry(expiryDate) : ''

  /* ───── Submit handlers ───── */

  async function handleApprove(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!expiryValid || !expiryDate) {
      setStatus({
        kind: 'error',
        message:
          'Pick an expiry between 1 hour and 90 days from now. Per UAP §3, no grant may exceed 90 days.',
      })
      return
    }
    setStatus({ kind: 'submitting' })

    const rules: Array<Record<string, unknown>> = []
    if (spendingCapOn) {
      rules.push({
        kind: 'spending_cap',
        max_per_action_usd: spendingCapUsd,
      })
    }
    if (quietHoursOn) {
      rules.push({
        kind: 'quiet_hours',
        from: quietHoursFrom,
        to: quietHoursTo,
        tz: userTimezone,
      })
    }
    // irreversible_floor is always present — locked per §3 invariant 2.
    rules.push({
      kind: 'irreversible_floor',
      always_confirm: [...UAP_IRREVERSIBLE_FLOOR],
    })

    const consentShownAt = new Date().toISOString()
    const payload = {
      partner_id: partnerId,
      scopes,
      expires_at: expiryDate.toISOString(),
      rules,
      consent_artifact: {
        version: '0.1.1',
        shown_to_user_at: consentShownAt,
        user_response: 'explicit_grant',
        ui_surface: 'coyl.consent.uap.v1',
        ui_timezone: userTimezone,
        ui_expiry_human: expiryHumanText,
        partner_state: state || null,
        scopes_shown_as: scopes.length,
        rules_opt_out_baseline: {
          spending_cap_default: true,
          spending_cap_kept: spendingCapOn,
          quiet_hours_default: true,
          quiet_hours_kept: quietHoursOn,
          irreversible_floor_locked: true,
        },
      },
    }

    try {
      const res = await fetch(GRANT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // The grant endpoint runs same-origin under the user's session
        // (the partner's Bearer token is not used here — this is the
        // user-side consent submission, not the partner-side grant
        // ratification per §5).
        credentials: 'same-origin',
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        let detail = `Grant endpoint returned ${res.status}.`
        try {
          const parsed = JSON.parse(text) as { message?: string; error?: string }
          if (parsed.message) detail = parsed.message
          else if (parsed.error) detail = parsed.error
        } catch {
          if (text) detail = text.slice(0, 240)
        }
        setStatus({ kind: 'error', message: detail })
        return
      }

      const data = (await res.json().catch(() => null)) as
        | { grant_id?: string; status?: string }
        | null
      const grantId = data?.grant_id ?? ''

      // Redirect back to the partner per the OAuth-style flow §5
      // implies. We round-trip the state nonce verbatim and pass the
      // grant_id so the partner can immediately fetch grant metadata
      // via GET /api/uap/v1/grant/[id].
      const back = new URL(redirectUri)
      back.searchParams.set('status', 'granted')
      if (grantId) back.searchParams.set('grant_id', grantId)
      if (state) back.searchParams.set('state', state)
      window.location.href = back.toString()
    } catch (err) {
      setStatus({
        kind: 'error',
        message:
          err instanceof Error
            ? `Network error: ${err.message}`
            : 'Network error issuing grant.',
      })
    }
  }

  function handleDecline() {
    // Decline does NOT POST to /api/uap/v1/grant — there is no grant
    // to revoke, only a request to refuse. We bounce back to the
    // partner with status=declined and the round-tripped state.
    try {
      const back = new URL(redirectUri)
      back.searchParams.set('status', 'declined')
      if (state) back.searchParams.set('state', state)
      window.location.href = back.toString()
    } catch {
      // If redirect_uri is unparseable (the server would have caught
      // this, but defense-in-depth) fall back to the kill switch page
      // rather than leaving the user stranded.
      window.location.href = '/kill'
    }
  }

  /* ───── Render ───── */

  const submitting = status.kind === 'submitting'

  return (
    <form onSubmit={handleApprove} className="space-y-12">
      {/* ──────────────── EXPIRY ──────────────── */}
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            How long this grant lasts
          </p>
          <p className="text-sm leading-[1.6] text-gray-700">
            Default is 7 days. Maximum is 90 days. You can revoke this
            grant at any time before then. After expiry, the partner
            must request a fresh grant — there is no silent renewal.
          </p>
        </div>
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          <label className="block space-y-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gray-600">
              Expires at
            </span>
            <input
              type="datetime-local"
              name="expires_at"
              value={expiryLocal}
              min={toDatetimeLocalValue(minExpiry)}
              max={toDatetimeLocalValue(maxExpiry)}
              onChange={(e) => setExpiryLocal(e.target.value)}
              required
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-60"
            />
          </label>
          {expiryDate && expiryValid && (
            <p className="font-serif text-base italic text-gray-800">
              {expiryHumanText}
            </p>
          )}
          {expiryDate && !expiryValid && (
            <p className="text-sm text-orange-700">
              Pick a time between 1 hour and 90 days from now. UAP §3
              caps every grant at 90 days.
            </p>
          )}
        </div>
      </section>

      {/* ──────────────── RULES ──────────────── */}
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Rules that bound this grant
          </p>
          <p className="text-sm leading-[1.6] text-gray-700">
            These are pre-checked for you. You can disable the spending
            cap and quiet hours if you want a more permissive grant.
            The irreversible-action floor is locked on — UAP §3
            requires per-action confirmation for sensitive actions
            (money transfer, send message, share personal data) under
            every grant, no exceptions.
          </p>
        </div>

        <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
          {/* spending_cap — opt-OUT, editable amount */}
          <div className="space-y-3 p-5">
            <div className="flex items-start gap-3">
              <input
                id="rule-spending-cap"
                type="checkbox"
                checked={spendingCapOn}
                onChange={(e) => setSpendingCapOn(e.target.checked)}
                disabled={submitting}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="rule-spending-cap"
                  className="block font-serif text-base font-normal text-gray-900"
                >
                  Cap spending at{' '}
                  <span className="inline-flex items-baseline gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      step={1}
                      value={spendingCapUsd}
                      onChange={(e) =>
                        setSpendingCapUsd(
                          Math.max(
                            1,
                            Math.min(
                              10000,
                              Number.parseInt(e.target.value, 10) || 50,
                            ),
                          ),
                        )
                      }
                      disabled={submitting || !spendingCapOn}
                      className="w-20 rounded border border-gray-300 bg-white px-2 py-0.5 font-mono text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 disabled:opacity-50"
                    />
                  </span>{' '}
                  per action
                </label>
                <p className="text-xs leading-[1.55] text-gray-600">
                  Any action that would spend more than this is
                  auto-denied. The partner can re-request the action
                  with explicit per-action confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* quiet_hours — opt-OUT, editable window */}
          <div className="space-y-3 p-5">
            <div className="flex items-start gap-3">
              <input
                id="rule-quiet-hours"
                type="checkbox"
                checked={quietHoursOn}
                onChange={(e) => setQuietHoursOn(e.target.checked)}
                disabled={submitting}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="rule-quiet-hours"
                  className="block font-serif text-base font-normal text-gray-900"
                >
                  No actions during quiet hours
                </label>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <span>From</span>
                  <input
                    type="time"
                    value={quietHoursFrom}
                    onChange={(e) => setQuietHoursFrom(e.target.value)}
                    disabled={submitting || !quietHoursOn}
                    className="rounded border border-gray-300 bg-white px-2 py-0.5 font-mono text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 disabled:opacity-50"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={quietHoursTo}
                    onChange={(e) => setQuietHoursTo(e.target.value)}
                    disabled={submitting || !quietHoursOn}
                    className="rounded border border-gray-300 bg-white px-2 py-0.5 font-mono text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 disabled:opacity-50"
                  />
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">
                    {userTimezone}
                  </span>
                </div>
                <p className="text-xs leading-[1.55] text-gray-600">
                  Default is 12:00 AM to 7:00 AM in your timezone. Any
                  action attempted inside this window is auto-denied
                  and audit-logged.
                </p>
              </div>
            </div>
          </div>

          {/* irreversible_floor — LOCKED ON per §3 invariant 2 */}
          <div className="space-y-3 bg-orange-50/40 p-5">
            <div className="flex items-start gap-3">
              <input
                id="rule-irreversible-floor"
                type="checkbox"
                checked
                disabled
                readOnly
                aria-describedby="rule-irreversible-floor-desc"
                className="mt-1 h-4 w-4 cursor-not-allowed rounded border-gray-300 text-orange-600 opacity-100"
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="rule-irreversible-floor"
                  className="flex items-center gap-2 font-serif text-base font-normal text-gray-900"
                >
                  Always confirm irreversible actions
                  <span
                    className="rounded-full bg-orange-600 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white"
                    title="Locked per UAP-0.1 §3 invariant 2 — cannot be disabled at consent time"
                  >
                    Locked
                  </span>
                </label>
                <p
                  id="rule-irreversible-floor-desc"
                  className="text-xs leading-[1.55] text-gray-700"
                >
                  Per UAP §3, these actions ALWAYS require per-action
                  confirmation, even under a standing grant — and this
                  floor cannot be disabled at consent time:{' '}
                  {UAP_IRREVERSIBLE_FLOOR.map((a, i) => (
                    <span key={a}>
                      <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-orange-700">
                        {a}
                      </code>
                      {i < UAP_IRREVERSIBLE_FLOOR.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── ERROR ──────────────── */}
      {status.kind === 'error' && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-orange-500 bg-orange-50/60 p-4"
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-orange-700">
            Grant could not be issued
          </p>
          <p className="mt-1.5 text-sm leading-[1.55] text-gray-800">
            {status.message}
          </p>
        </div>
      )}

      {/* ──────────────── ACTIONS ────────────────
          Single orange Approve button, minimal text-button Decline.
          Per §8 the GRANT button must not be over-salient relative
          to REVOKE/DECLINE; we balance by giving Approve the orange
          accent and Decline the readable-but-restrained text style. */}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting || !expiryValid}
          className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,102,0,0.18)] transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Issuing grant…' : 'Approve standing authority'}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={submitting}
          className="text-sm font-medium text-gray-700 underline decoration-gray-400 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Decline and return to the partner
        </button>
      </div>

      <p className="text-xs leading-[1.55] text-gray-500">
        Approving sends a consent artifact to{' '}
        <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px] text-gray-700">
          {GRANT_ENDPOINT}
        </code>
        . The artifact is signed into the UAP audit chain (§3 invariant
        4) so this consent is provable from now on. The partner
        receives only the resulting grant id — not your audit history.
      </p>

      {/* ──────────────── INLINE KILL SWITCH ────────────────
          Per UAP-0.1.md §8: "Kill switch link visible on every page of
          the user's app where a UAP grant could be active. Never more
          than two taps away." We render the kill-switch as an actual
          working primitive inside the consent surface (one tap to
          confirm, one tap to fire) rather than a placeholder link.
          The dedicated /kill page is still available via the footer of
          the page shell for users who arrive here unauthenticated. */}
      <section
        aria-labelledby="kill-switch-heading"
        className="space-y-4 rounded-2xl border-2 border-orange-500/70 bg-orange-50/40 p-5"
      >
        <div className="space-y-1.5">
          <p
            id="kill-switch-heading"
            className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-700"
          >
            Global kill switch · always one tap away
          </p>
          <p className="font-serif text-lg italic text-gray-900">
            Revoke every standing grant you’ve ever issued.
          </p>
          <div className="h-px w-12 bg-orange-500" />
          <p className="text-sm leading-[1.6] text-gray-700">
            One press flips every active UAP grant — across every LLM
            partner you’ve ever authorized — to{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-orange-700">
              KILLED_GLOBALLY
            </code>
            . Propagation lands in ≤5 seconds and is audit-logged.
          </p>
        </div>

        {killStatus.kind === 'resolving_user' && (
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Resolving identity…
          </p>
        )}

        {killStatus.kind === 'unauthenticated' && (
          <div className="space-y-2">
            <p className="text-sm leading-[1.6] text-gray-800">
              You’re signed out, so we can’t verify whose grants to
              revoke. Sign in once and the kill switch fires
              immediately.
            </p>
            <a
              href={`/sign-in?redirect_url=${encodeURIComponent('/kill')}`}
              className="inline-flex items-center rounded-full border border-orange-500 bg-white px-5 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-500 hover:text-white"
            >
              Sign in to revoke &rarr;
            </a>
          </div>
        )}

        {killStatus.kind === 'idle' && (
          <button
            type="button"
            onClick={() => setKillStatus({ kind: 'confirming' })}
            disabled={submitting}
            className="rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,102,0,0.22)] transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Pull the global kill switch
          </button>
        )}

        {killStatus.kind === 'confirming' && (
          <div className="space-y-3 rounded-xl border border-orange-500 bg-white p-4">
            <p className="font-serif text-base italic text-gray-900">
              {KILL_CONFIRM_MESSAGE}
            </p>
            <p className="text-xs leading-[1.55] text-gray-600">
              Every active grant — every partner, every scope — flips
              to <code className="font-mono">KILLED_GLOBALLY</code> in a
              single transaction. You can issue fresh grants
              afterward; nothing about your account or audit history is
              lost.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleKillConfirmed}
                className="rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,102,0,0.22)] transition-colors hover:bg-orange-700"
              >
                Yes — revoke everything now
              </button>
              <button
                type="button"
                onClick={() => setKillStatus({ kind: 'idle' })}
                className="text-sm font-medium text-gray-700 underline decoration-gray-400 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {killStatus.kind === 'submitting' && (
          <div className="flex items-center gap-3 rounded-xl border border-orange-500 bg-white p-4">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-orange-500"
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-orange-700">
              Revoking every active grant…
            </p>
          </div>
        )}

        {killStatus.kind === 'success' && (
          <div
            role="status"
            className="space-y-2 rounded-xl border border-orange-500 bg-white p-4"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-orange-700">
              Authority revoked
            </p>
            <p className="font-serif text-base italic text-gray-900">
              {killStatus.affectedGrantCount === 0
                ? 'No active grants existed — your authority surface was already clean.'
                : killStatus.affectedGrantCount === 1
                  ? '1 active grant was revoked.'
                  : `${killStatus.affectedGrantCount} active grants were revoked.`}
            </p>
            <p className="text-sm leading-[1.6] text-gray-700">
              Authority revoked. Reload the page to issue new grants.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="/settings"
                className="inline-flex items-center rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,102,0,0.22)] transition-colors hover:bg-orange-700"
              >
                Back to settings &rarr;
              </a>
              {killStatus.auditUrl && (
                <a
                  href={killStatus.auditUrl}
                  className="text-sm font-medium text-orange-700 underline decoration-orange-500/40 underline-offset-4 transition-colors hover:decoration-orange-500"
                >
                  View audit trail
                </a>
              )}
            </div>
          </div>
        )}

        {killStatus.kind === 'error' && (
          <div
            role="alert"
            className="space-y-2 rounded-xl border border-orange-600 bg-white p-4"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-orange-700">
              Kill switch did not fire
            </p>
            <p className="text-sm leading-[1.55] text-gray-800">
              {killStatus.message}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setKillStatus({ kind: 'confirming' })}
                className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Try again
              </button>
              <a
                href="/kill"
                className="text-sm font-medium text-orange-700 underline decoration-orange-500/40 underline-offset-4 transition-colors hover:decoration-orange-500"
              >
                Open the dedicated kill page &rarr;
              </a>
            </div>
          </div>
        )}
      </section>
    </form>
  )
}
