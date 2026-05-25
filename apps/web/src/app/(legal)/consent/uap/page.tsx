/**
 * /consent/uap — UAP v0.1.1 hosted consent UI (server component shell).
 *
 * Per UAP-0.1.md §8 the consent surface for standing-authority grants
 * MUST be hosted by the UAP coordinator, not by the partner. This is
 * the mitigation for threat T8 (social-engineering of consent UI via
 * partner-controlled UX where the GRANT button is salient and the
 * REVOKE button is buried). Partners initiate a grant via redirect to
 * THIS page; the user sees the actual scope list, expiry, and rule
 * set on a COYL-hosted page before any authority is issued.
 *
 * URL contract — every partner that wants to obtain a UAP grant
 * redirects the user here with the following query params:
 *
 *   partner_id        opaque partner identifier (registered with COYL)
 *   redirect_uri      where to bounce back to after the user decides
 *   scope_requested[] one or more UAP scopes (from UAP_SCOPES) — repeat
 *                     the key for each scope, e.g.
 *                     ?scope_requested=proactive_food&scope_requested=read
 *   state             partner-supplied CSRF nonce; round-tripped back
 *                     to redirect_uri verbatim on both approve and decline
 *
 * If the user approves, the client island POSTs to /api/uap/v1/grant
 * (built by sibling agent A7) with the consent_artifact populated per
 * spec §5. The grant endpoint returns the grant_id and the page
 * redirects back to redirect_uri with ?status=granted&grant_id=…&state=…
 *
 * If the user declines, we redirect back to redirect_uri immediately
 * with ?status=declined&state=… — no DB write.
 *
 * Cache Components compatibility — this page MUST NOT set
 * `export const dynamic = 'force-dynamic'` (incompatible with
 * cacheComponents:true in next.config.ts). Instead, the dynamic
 * request-time read (searchParams) is wrapped in a Suspense boundary
 * inside the server component, which is the Next 16 way of mixing
 * static shell + dynamic content under PPR.
 *
 * Editorial design — matches the cream/orange/serif aesthetic of the
 * /uap marketing wedge so the user experiences visual continuity
 * between "what UAP is" (marketing) and "grant this UAP authority"
 * (consent). The (legal) layout wraps with a dark shell; we render
 * a self-contained cream surface that visually overrides.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { UAP_SCOPES, type UAPScope } from '@/lib/uap/types'
import { ConsentForm } from './consent-form'

export const metadata: Metadata = {
  title: 'Grant standing authority · UAP consent · COYL',
  description:
    'Review the scope, expiry, and rules a partner is requesting before issuing standing authority. UAP v0.1.1 protocol-hosted consent surface.',
  // Consent pages should not be indexed — they are partner-initiated
  // surfaces with query-string state, not durable content.
  robots: { index: false, follow: false },
}

/* ──────────────────── Plain-English scope sentences ────────────────────
 *
 * Per UAP-0.1.md §8: "Scope list rendered as plain-English sentences,
 * NOT scope identifiers. 'Can schedule events on your calendar' —
 * never 'calendar.write'."
 *
 * The mapping below is the source of truth for how each scope reads
 * to a non-technical user. If a scope appears in `scope_requested`
 * that is not in this map, it is rendered with a guarded fallback
 * AND surfaced as a warning so the user can decline rather than
 * grant authority they can't read.
 */
const SCOPE_SENTENCES: Record<UAPScope, string> = {
  proactive_food:
    'Notice and intervene on food-related autopilot loops (late-night kitchen, restraint-collapse patterns)',
  proactive_focus:
    'Notice and intervene on focus-related autopilot loops (tab thrash, doom-scroll, meeting-prep procrastination)',
  proactive_relational:
    'Notice and intervene on relational autopilot loops (drafted-but-not-sent messages, avoided conversations)',
  proactive_sleep:
    'Notice and intervene on sleep-related autopilot loops (revenge bedtime procrastination, sleep-debt accumulation)',
  proactive_purchase:
    'Propose purchase interventions (deferred buys, recurring impulse categories)',
  proactive_recovery:
    'Notice and intervene during post-slip recovery windows',
  proactive_substance:
    'Notice and intervene on substance-related autopilot loops (only enable with explicit clinical guidance)',
  proactive_mood:
    'Notice and intervene on mood-related patterns (read-only by default)',
  read: 'Read your behavioral state without taking any actions',
}

/* ──────────────────── searchParams shape ──────────────────── */

type ConsentSearchParams = {
  partner_id?: string | string[]
  redirect_uri?: string | string[]
  scope_requested?: string | string[]
  state?: string | string[]
}

/* ──────────────────── Helpers (pure, deterministic) ────────────────────
 *
 * These run in the server component on each request — no DB, no I/O.
 * They normalize the query string into a typed shape the client island
 * can render without re-deriving anything.
 */

function asString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined
  return Array.isArray(v) ? v[0] : v
}

function asStringArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

/**
 * Filter the partner's requested scopes against UAP_SCOPES. Anything
 * not in the canonical scope set is silently dropped from the
 * "known" list and surfaced in `unknown` so we can warn the user
 * (and refuse to grant if all scopes are unknown).
 */
function partitionScopes(requested: string[]): {
  known: UAPScope[]
  unknown: string[]
} {
  const allowed = new Set<string>(UAP_SCOPES)
  const known: UAPScope[] = []
  const unknown: string[] = []
  for (const s of requested) {
    if (allowed.has(s)) known.push(s as UAPScope)
    else unknown.push(s)
  }
  return { known, unknown }
}

/* ──────────────────── Page (server component shell) ──────────────────── */

export default function ConsentUapPage({
  searchParams,
}: {
  searchParams: Promise<ConsentSearchParams>
}) {
  // Outer shell renders the static page chrome (header, footer,
  // cream surface). The dynamic searchParams read is wrapped in
  // Suspense so this segment is cacheComponents-compatible without
  // needing `export const dynamic`.
  return (
    <div className="-mx-6 -my-16 min-h-screen bg-[#fafaf7] px-6 py-12 text-gray-900 selection:bg-orange-500 selection:text-white md:px-12">
      <div className="mx-auto max-w-3xl">
        <Suspense fallback={<ConsentSkeleton />}>
          <ConsentBody searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

async function ConsentBody({
  searchParams,
}: {
  searchParams: Promise<ConsentSearchParams>
}) {
  const params = await searchParams
  const partnerId = asString(params.partner_id)?.trim() ?? ''
  const redirectUri = asString(params.redirect_uri)?.trim() ?? ''
  const state = asString(params.state)?.trim() ?? ''
  const requestedScopes = asStringArray(params.scope_requested)
  const { known, unknown } = partitionScopes(requestedScopes)

  // Hard validation per §3 invariant 7 — "no ambient grants". A grant
  // attempt without a partner_id, a redirect_uri, and at least one
  // known scope is invalid and we refuse to render the consent form.
  // (The /api/uap/v1/grant endpoint will also reject these at GRANT
  // time per §5; this is a UX-layer fast fail.)
  if (!partnerId || !redirectUri || known.length === 0) {
    return (
      <InvalidGrantRequest
        partnerId={partnerId}
        redirectUri={redirectUri}
        knownScopes={known}
        unknownScopes={unknown}
      />
    )
  }

  // Build the plain-English scope sentences for the form. The form is
  // a client island so it can manage the expiry picker + rule toggles
  // without round-tripping the server.
  const scopeRows = known.map((scope) => ({
    scope,
    sentence: SCOPE_SENTENCES[scope],
  }))

  return (
    <article className="space-y-12">
      {/* ───────────────────────────── HEADER ───────────────────────────── */}
      <header className="space-y-6">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          UAP v0.1.1 · standing-authority consent
        </p>
        <h1 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Grant standing authority to{' '}
          <span className="italic text-orange-600">{partnerId}</span>?
        </h1>
        {/* Hairline orange rule under H1 — matches /uap aesthetic */}
        <div className="h-px w-16 bg-orange-500" />
        <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
          A partner is asking to take action on your behalf without
          asking you each time. You decide the scope, the expiry, and
          the rules that bound it. You can revoke this grant at any
          time, or pull the global kill switch to revoke every grant
          across every LLM in one tap.
        </p>
        {unknown.length > 0 && (
          <div className="rounded-2xl border-2 border-orange-500 bg-orange-50/60 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-orange-700">
              {unknown.length} unknown scope{unknown.length === 1 ? '' : 's'} ignored
            </p>
            <p className="mt-2 text-sm leading-[1.6] text-gray-800">
              The partner asked for the following scope{unknown.length === 1 ? '' : 's'} that{' '}
              {unknown.length === 1 ? 'is' : 'are'} not in the UAP v0.1.1
              scope set:{' '}
              {unknown.map((u, i) => (
                <span key={u}>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
                    {u}
                  </code>
                  {i < unknown.length - 1 ? ', ' : ''}
                </span>
              ))}
              . These have been dropped from the consent request. The
              partner cannot widen scope mid-grant; if they need them,
              they must request a fresh grant.
            </p>
          </div>
        )}
      </header>

      {/* ───────────────────────── SCOPE LIST ─────────────────────────
          Per §8: plain-English sentences, never raw scope identifiers.
          Hairline borders between rows; no glossy chrome. */}
      <section className="space-y-4">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          What the partner will be able to do
        </p>
        <ul className="space-y-0 border-t border-gray-200">
          {scopeRows.map((row) => (
            <li
              key={row.scope}
              className="flex items-start gap-4 border-b border-gray-200 py-4"
            >
              <span
                aria-hidden="true"
                className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"
              />
              <p className="text-base leading-[1.6] text-gray-800">
                {row.sentence}
              </p>
            </li>
          ))}
        </ul>
        <p className="pt-2 text-xs leading-[1.6] text-gray-500">
          Internal scope identifier
          {scopeRows.length === 1 ? '' : 's'} (for the audit log):{' '}
          {scopeRows.map((row, i) => (
            <span key={row.scope}>
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px] text-gray-700">
                {row.scope}
              </code>
              {i < scopeRows.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      </section>

      {/* ─────────────────────── CONSENT FORM (CLIENT ISLAND) ─────────────────────── */}
      <ConsentForm
        partnerId={partnerId}
        redirectUri={redirectUri}
        state={state}
        scopes={known}
      />

      {/* ───────────────────────── FOOTER · KILL SWITCH ─────────────────────────
          Per §8: "Kill switch link visible on every page of the user's
          app where a UAP grant could be active. Never more than two
          taps away." Rendered prominently in the page footer. */}
      <footer className="space-y-3 border-t border-gray-200 pt-8">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          Global kill switch
        </p>
        <p className="max-w-2xl text-sm leading-[1.65] text-gray-700">
          You can revoke every grant across every LLM at any time. The
          kill switch propagates to every connected surface in ≤5
          seconds — phone, watch, browser, desktop, smart home, car.{' '}
          <Link
            href="/kill"
            className="font-medium text-orange-700 underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
          >
            Pull the kill switch &rarr;
          </Link>
        </p>
        <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.32em] text-gray-500">
          UAP v0.1.1 · §8 consent UI · hosted by COYL, not by the partner
        </p>
      </footer>
    </article>
  )
}

/* ──────────────────── Fallback states ──────────────────── */

function ConsentSkeleton() {
  return (
    <div className="animate-pulse space-y-8 py-12">
      <div className="h-4 w-48 rounded bg-gray-200" />
      <div className="h-12 w-3/4 rounded bg-gray-200" />
      <div className="h-px w-16 bg-orange-500/40" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
        <div className="h-4 w-4/6 rounded bg-gray-100" />
      </div>
    </div>
  )
}

function InvalidGrantRequest({
  partnerId,
  redirectUri,
  knownScopes,
  unknownScopes,
}: {
  partnerId: string
  redirectUri: string
  knownScopes: UAPScope[]
  unknownScopes: string[]
}) {
  return (
    <article className="space-y-8 py-12">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
        UAP v0.1.1 · invalid grant request
      </p>
      <h1 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-4xl">
        This consent link is{' '}
        <span className="italic text-orange-600">incomplete.</span>
      </h1>
      <div className="h-px w-16 bg-orange-500" />
      <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
        A UAP-compliant grant request must include a{' '}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[12px] text-gray-700">
          partner_id
        </code>
        , a{' '}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[12px] text-gray-700">
          redirect_uri
        </code>
        , and at least one recognized scope from the UAP v0.1.1 scope
        set. Per UAP-0.1.md §3 invariant 7 (&ldquo;no ambient
        grants&rdquo;) we refuse to issue authority for a request that
        omits any of these.
      </p>
      <dl className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm">
        <div className="flex items-start gap-4">
          <dt className="w-36 flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
            partner_id
          </dt>
          <dd className="flex-1 text-gray-800">
            {partnerId || <em className="text-orange-600">missing</em>}
          </dd>
        </div>
        <div className="flex items-start gap-4">
          <dt className="w-36 flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
            redirect_uri
          </dt>
          <dd className="flex-1 break-all text-gray-800">
            {redirectUri || <em className="text-orange-600">missing</em>}
          </dd>
        </div>
        <div className="flex items-start gap-4">
          <dt className="w-36 flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
            known scopes
          </dt>
          <dd className="flex-1 text-gray-800">
            {knownScopes.length > 0 ? (
              knownScopes.join(', ')
            ) : (
              <em className="text-orange-600">none</em>
            )}
          </dd>
        </div>
        {unknownScopes.length > 0 && (
          <div className="flex items-start gap-4">
            <dt className="w-36 flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
              unknown scopes
            </dt>
            <dd className="flex-1 break-all text-gray-800">
              {unknownScopes.join(', ')}
            </dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap items-center gap-4 pt-4">
        <Link
          href="/uap"
          className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:border-orange-300"
        >
          Read the UAP spec &rarr;
        </Link>
        <Link
          href="/kill"
          className="text-sm font-medium text-orange-700 underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
        >
          Pull the kill switch
        </Link>
      </div>
      <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.32em] text-gray-500">
        UAP v0.1.1 · §8 consent UI · hosted by COYL, not by the partner
      </p>
    </article>
  )
}
