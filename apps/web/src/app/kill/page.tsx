/**
 * /kill — dedicated single-purpose "revoke ALL standing authority" surface.
 *
 * Per UAP-0.1.md §8: "Kill switch link visible on every page of the
 * user's app where a UAP grant could be active. Never more than two
 * taps away." This page is the canonical destination for that link —
 * a URL the user can type from memory (coyl.ai/kill) when they want
 * to revoke every grant they've ever issued, across every LLM partner.
 *
 * Threat-model rationale (T8, social-engineering of consent UI): the
 * page is intentionally minimalist. No marketing copy, no upsell, no
 * cross-links to dashboards. The only call to action is the kill
 * itself; everything else is the explanation of WHAT a kill does and
 * a single "back to home" exit. A user in crisis hits coyl.ai/kill,
 * sees a big red button, taps it twice, and is done.
 *
 * Auth posture: the page is public so a signed-out user reaching for
 * the URL in panic doesn't get blocked at a sign-in wall. The actual
 * POST to /api/uap/v1/kill-switch still requires the user's Clerk
 * session (the route enforces "you can only kill your own standing
 * authority"). If the visitor is signed out, the client island
 * detects that via /api/v1/user → 401 and surfaces a sign-in CTA that
 * round-trips back here.
 *
 * Cache Components compatibility (Next 16, cacheComponents:true): the
 * server shell here is fully static — no request-time reads — so it
 * does not need a Suspense boundary or `export const dynamic`. The
 * dynamic identity check happens client-side inside <KillSwitchPanel>.
 *
 * Aesthetic: matches /uap and /consent/uap — cream canvas, mono
 * kicker, serif italic H1 accent, hairline orange rule, Hermès-orange
 * action button. The visual restraint is the point: this is a safety
 * primitive, not a marketing page.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { KillSwitchPanel } from './kill-switch-panel'

export const metadata: Metadata = {
  title: 'Kill switch — revoke all standing authority · COYL',
  description:
    'One-tap global revoke for every UAP standing grant you have ever issued, across every LLM partner. UAP v0.1.1 §8 — kill switch always within two taps.',
  // The kill page should not be indexed — it's a user-only safety
  // surface, not durable content, and we don't want it ranking
  // ahead of /uap (the spec page).
  robots: { index: false, follow: false },
  alternates: { canonical: '/kill' },
}

export default function KillPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] px-6 py-16 text-gray-900 selection:bg-orange-500 selection:text-white md:px-12 md:py-24">
      <div className="mx-auto max-w-2xl">
        <article className="space-y-10">
          <header className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              UAP v0.1.1 · global kill switch
            </p>
            <h1 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Revoke all standing{' '}
              <span className="italic text-orange-600">authority.</span>
            </h1>
            {/* Hairline orange rule under the H1 — matches /uap aesthetic */}
            <div className="h-px w-16 bg-orange-500" />
            <p className="max-w-xl text-base leading-[1.7] text-gray-700">
              Every UAP grant you have ever issued — across every LLM
              partner, every scope, every device — flips to{' '}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[12px] text-orange-700">
                KILLED_GLOBALLY
              </code>{' '}
              in a single transaction. Propagation lands in ≤5 seconds
              and is fully audit-logged. You can issue fresh grants
              afterward; nothing about your account or audit history is
              destroyed.
            </p>
          </header>

          {/* ───────────── KILL SWITCH PANEL (client island) ───────────── */}
          <KillSwitchPanel />

          {/* ───────────── FOOTER (single safe exit only) ───────────── */}
          <footer className="space-y-3 border-t border-gray-200 pt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-gray-500">
              UAP v0.1.1 · §8 kill switch · hosted by COYL, not by any partner
            </p>
            <Link
              href="/"
              className="inline-block text-sm font-medium text-gray-700 underline decoration-gray-400 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-700"
            >
              &larr; Back to home
            </Link>
          </footer>
        </article>
      </div>
    </div>
  )
}
