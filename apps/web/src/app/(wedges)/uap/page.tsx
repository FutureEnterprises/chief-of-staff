/**
 * /uap — public marketing surface for the User-Authority Protocol v0.1.
 *
 * UAP is the fourth layer of the COYL stack and the standing-authority
 * substrate for agentic AI. Where BIP reads the substrate, PAP proposes
 * the moment, and EAP acts across the device fleet one action at a time,
 * UAP defines the trust contract a user issues to an LLM when they want
 * autonomous action without per-action consent — bounded by scope,
 * expiry, rules, and a global kill switch.
 *
 * This page distills the full spec at docs/protocol/UAP-0.1.md into the
 * same editorial idiom as /pap and /eap: Instrument Serif H1 with
 * italic-orange accent, mono kicker eyebrow, hairline-rule sections,
 * cream canvas, warm-dark code surfaces. Hard invariants get an
 * orange-bordered treatment because they are the protocol's non-
 * negotiable surface. Threat-model cards (T1–T8) get card treatment so
 * a Trust & Safety reviewer can scan them in one pass.
 *
 * The strategic read in §07 is the M&A-grade closing argument. It is
 * rendered as the spec writes it — UAP is the trust contract for the
 * agentic-AI category, and the trust contract is the moat.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'

const DESCRIPTION =
  "The fourth layer of the COYL protocol stack. Standing authority for LLMs to act on a user's behalf, bounded by scope, expiry, rules, and a global kill switch. Apache 2.0 spec — reference engine post-Series-A."

export const metadata: Metadata = {
  title:
    'UAP — User-Authority Protocol | The standing-authority layer for agentic AI',
  description: DESCRIPTION,
  keywords: [
    'user authority protocol',
    'agentic AI consent',
    'LLM standing authority',
    'AI kill switch',
    'autonomous AI safety',
    'agentic AI infrastructure',
    'coyl uap',
  ],
  alternates: { canonical: '/uap' },
  openGraph: {
    title:
      'UAP — User-Authority Protocol | The standing-authority layer for agentic AI',
    description: DESCRIPTION,
    url: 'https://coyl.ai/uap',
    images: [
      {
        url: '/api/og?title=UAP+v0.1&kicker=Standing+authority+for+agentic+AI',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UAP — the standing-authority layer for agentic AI',
    description: DESCRIPTION,
    images: [
      '/api/og?title=UAP+v0.1&kicker=Standing+authority+for+agentic+AI',
    ],
  },
}

export default async function UapPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-uap')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'UAP', url: 'https://coyl.ai/uap' },
        ]}
      />

      <article className="space-y-24 pb-12">
        {/* ─────────────────────────────────────────────────────────
            HEADER
            ───────────────────────────────────────────────────────── */}
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              UAP v0.1 · Apache 2.0
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Standing authority.{' '}
            <span className="italic text-orange-600">
              Without standing risk.
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            UAP is the fourth layer of the COYL protocol stack. BIP
            reads the substrate. PAP proposes the moment. EAP acts
            across the device fleet &mdash; one action at a time.{' '}
            <strong className="font-serif font-normal italic">
              UAP is the standing-authority layer.
            </strong>{' '}
            It defines the trust contract a user issues to an LLM when
            they want autonomous action without per-action consent.
          </p>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            This is the layer that converts agentic AI from &ldquo;demo
            that requires the user to babysit every click&rdquo; to
            &ldquo;AI that operates inside scoped authority with
            auditable history and a kill switch.&rdquo; The layer
            foundation labs need to ship agentic AI safely &mdash; and
            the layer they cannot ship themselves without owning the
            liability surface.
          </p>
        </header>

        {/* ─────────────────────────────────────────────────────────
            01 · WHY STANDING AUTHORITY
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            01 · Why standing authority
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            The first three protocols assume the user is{' '}
            <span className="italic text-orange-600">present.</span>
          </h2>

          <div className="max-w-2xl space-y-5 pt-2 text-lg leading-[1.7] text-gray-700">
            <p>
              BIP is per-app, opt-out, until the app is uninstalled. PAP
              is per-scope-per-partner, 24h&ndash;30d, scope-bounded. EAP
              is per-action confirmation for irreversibles. All three
              consent models share one premise: the user sees a callout,
              taps confirm, and the action fires.
            </p>
            <p>
              That assumption breaks the moment LLMs are asked to operate
              while the user is{' '}
              <em className="font-serif font-normal italic">absent</em>{' '}
              &mdash; running a daily routine, drafting tomorrow&rsquo;s
              calendar, reordering household supplies, paying recurring
              bills, scheduling deliveries.
            </p>
            <p>
              The market has chosen this. Anthropic Computer Use, OpenAI
              Operator, Project Astra, every consumer-agentic demo of
              2026 &mdash; all of them operate without user presence.
              None has shipped a defensible consent model. The default
              today is OAuth-style: the user clicks &ldquo;Allow
              all&rdquo; without reading. That model failed humans at
              the application layer (every app abuses it) and will fail
              catastrophically at the AI-action layer.
            </p>
            <p>
              UAP is the alternative. Standing authority MUST be
              bounded, MUST be revocable in seconds, MUST be auditable,
              and MUST be portable across LLMs. Without UAP, the
              agentic-AI category ships unsafe. With UAP, it ships with
              trust infrastructure under it.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/50">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-white/80">
                <tr>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Protocol
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Consent grain
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Authority lifetime
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-5 py-3 font-medium text-gray-900">BIP</td>
                  <td className="px-5 py-3 text-gray-600">Per-app, opt-out</td>
                  <td className="px-5 py-3 text-gray-600">
                    Until app uninstalled
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-gray-900">PAP</td>
                  <td className="px-5 py-3 text-gray-600">
                    Per-scope-per-partner
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    24h&ndash;30d, scope-bounded
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-gray-900">EAP</td>
                  <td className="px-5 py-3 text-gray-600">
                    Per-action confirmation for irreversibles
                  </td>
                  <td className="px-5 py-3 text-gray-600">One action</td>
                </tr>
                <tr className="bg-orange-50/40">
                  <td className="px-5 py-3 font-medium text-orange-700">
                    UAP
                  </td>
                  <td className="px-5 py-3 text-gray-900">
                    Per-grant with rules
                  </td>
                  <td className="px-5 py-3 text-gray-900">
                    7d default, 90d max &mdash; user not required
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            02 · EIGHT PRIMITIVES
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-12">
          <div className="space-y-6 border-t border-gray-200 pt-16">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · The eight primitives
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Eight operations.{' '}
              <span className="italic text-orange-600">
                No fewer. No more.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              UAP defines exactly eight operations. Every implementation
              must support all eight; no fewer, no more in the v0.1
              baseline.{' '}
              <strong className="font-serif font-normal italic">
                KILL_SWITCH and AUDIT_QUERY are non-negotiable
              </strong>{' '}
              &mdash; every UAP-compliant implementation must expose
              them with no scope restrictions, no auth burden beyond
              user identity, and no rate limit.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PRIMITIVES.map((p) => (
              <div
                key={p.id}
                className="space-y-3 border-t border-orange-500 pt-5"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {p.kicker}
                </p>
                <h3 className="font-mono text-base font-semibold tracking-[0.04em] text-gray-900">
                  {p.id}
                </h3>
                <p className="text-sm leading-[1.65] text-gray-700">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            03 · HARD INVARIANTS
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 · The hard invariants
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              These cannot be relaxed by{' '}
              <span className="italic text-orange-600">
                any implementation.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The eight invariants below define the protocol. Any
              implementation that omits or weakens one is not
              UAP-compliant. They are the non-negotiable surface that
              makes the trust contract trustworthy.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {INVARIANTS.map((inv, i) => (
              <div
                key={i}
                className="space-y-2 rounded-2xl border-2 border-orange-500 bg-orange-50/40 p-5"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-orange-700">
                  Invariant {String(i + 1).padStart(2, '0')}
                </p>
                <p className="font-serif text-lg font-semibold leading-[1.35] tracking-[-0.01em] text-gray-900">
                  {inv.title}
                </p>
                <p className="text-sm leading-[1.65] text-gray-700">
                  {inv.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            04 · THREAT MODEL
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              04 · Threat model
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The most likely catastrophic{' '}
              <span className="italic text-orange-600">failure modes.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              T1&ndash;T8 below are the threat scenarios any
              UAP-compliant coordinator must mitigate. A companion
              document &mdash;{' '}
              <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
                UAP-0.1-threat-model.md
              </code>{' '}
              &mdash; expands each with attack chains, instrumentation
              requirements, and incident response.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {THREATS.map((t) => (
              <div
                key={t.id}
                className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-orange-600">
                    {t.id}
                  </span>
                  <h3 className="font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900">
                    {t.name}
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                    Attack vector
                  </p>
                  <p className="text-sm leading-[1.65] text-gray-700">
                    {t.attack}
                  </p>
                </div>
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-600">
                    Mitigation
                  </p>
                  <p className="text-sm leading-[1.65] text-gray-700">
                    {t.mitigation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            05 · CONSENT UI REQUIREMENTS
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              05 · Consent UI requirements
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Standing authority demands consent UX{' '}
              <span className="italic text-orange-600">that fails safe.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              These are protocol-mandated; any UAP-compliant
              implementation must satisfy all of them. Partners may
              build their own consent UI, but it must satisfy these
              bullets and be subject to public review. The COYL
              reference engine ships a hosted consent UI at{' '}
              <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
                coyl.ai/consent/uap
              </code>{' '}
              that any partner can redirect through.
            </p>
          </div>

          <ol className="space-y-5 border-t border-gray-200 pt-6">
            {CONSENT_REQS.map((c, i) => (
              <li
                key={i}
                className="grid grid-cols-1 gap-4 border-b border-gray-100 pb-5 md:grid-cols-12 md:gap-8"
              >
                <div className="md:col-span-3">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                    Req {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="mt-2 font-serif text-lg font-normal leading-[1.25] tracking-[-0.01em] text-gray-900">
                    {c.title}
                  </p>
                </div>
                <div className="md:col-span-9">
                  <p className="text-base leading-[1.7] text-gray-700">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ─────────────────────────────────────────────────────────
            06 · THE STRATEGIC READ
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-orange-500 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            06 · The strategic read
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            The trust contract{' '}
            <span className="italic text-orange-600">is the moat.</span>
          </h2>

          <div className="max-w-3xl space-y-6 pt-2 text-lg leading-[1.7] text-gray-800">
            <p>
              The first three protocols (BIP, PAP, EAP) are about reading
              the user, proposing to the user, and acting through their
              devices{' '}
              <em className="font-serif font-normal italic">
                while the user is present
              </em>
              . They are necessary for behavioral interrupt. They are
              not sufficient for the next category of AI products.
            </p>
            <p>
              The category that ships in 2026&ndash;2027 &mdash; every
              foundation lab is pointed at it &mdash; is autonomous AI
              that operates on behalf of the user without per-action
              presence. The unsolved problem in that category is not
              capability. It is consent, scope, audit, and kill switch.
              The capability exists today (Claude Computer Use, OpenAI
              Operator, Project Astra).{' '}
              <strong className="font-serif font-normal italic">
                The trust infrastructure does not.
              </strong>
            </p>
            <p>
              UAP is the trust infrastructure. It is the layer that lets
              foundation labs ship agentic AI safely without each one
              inventing a brittle ad-hoc consent model. It is the layer
              regulators will demand once the first agentic-AI
              catastrophe makes the news. And it is the layer that
              &mdash; by virtue of being open-spec, audit-defaulted, and
              kill-switch-first &mdash; cannot be reasonably forked by
              any single foundation lab without losing the cross-LLM
              portability that gives it value.
            </p>
            <p>
              A user grants standing authority once, through COYL. That
              grant works for Claude, for GPT, for Gemini, for any
              future LLM. The user owns the audit trail. The user owns
              the kill switch. The protocol is the trust contract, and{' '}
              <strong className="font-serif font-normal italic">
                the trust contract is the moat.
              </strong>
            </p>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            CTA
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The full stack
          </p>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Four protocols.{' '}
            <span className="italic text-orange-600">One stack.</span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            BIP reads the substrate. PAP proposes the moment. EAP acts
            across the device fleet. UAP grants the standing authority
            that makes agentic AI safe. All four published Apache 2.0
            in one repository. Reference engine ships post-Series-A.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/protocol"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read BIP &rarr;
            </Link>
            <Link
              href="/pap"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read PAP &rarr;
            </Link>
            <a
              href="https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/UAP-0.1.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-semibold text-orange-700 underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
            >
              Spec on GitHub &rarr;
            </a>
          </div>

          <p className="pt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-gray-500">
            COYL &middot; Catch yourself before you do it again.
          </p>
        </section>
      </article>
    </>
  )
}

/* ────────────────────────────────────────────────────────────────
   DATA — spec content from docs/protocol/UAP-0.1.md
   ──────────────────────────────────────────────────────────────── */

const PRIMITIVES: Array<{ id: string; kicker: string; body: string }> = [
  {
    id: 'GRANT',
    kicker: 'Primitive 01 · authorize',
    body: 'User authorizes scope X for LLM Y, expiring at T, bounded by rules R. Coordinator validates scope, rules, and expiry at grant time. A grant that omits any of these is invalid and must be rejected.',
  },
  {
    id: 'REVOKE',
    kicker: 'Primitive 02 · single revoke',
    body: 'User immediately revokes one grant. In-flight actions are audit-traced through to completion but carry a post_termination flag so the user can review what slipped through the lag window.',
  },
  {
    id: 'KILL_SWITCH',
    kicker: 'Primitive 03 · global revoke',
    body: 'User revokes ALL grants across ALL LLMs in one operation. Supersedes everything. Propagates to every connected surface in ≤5 seconds. Rate-limit-exempt, authentication-light — a user in crisis must be able to kill all standing authority even if they cannot remember their password.',
  },
  {
    id: 'PRECHECK',
    kicker: 'Primitive 04 · would this be allowed?',
    body: 'LLM asks: if I attempted action A right now under grant G, would the coordinator allow it? No side effects. No DB write. Pure decision. Lets a partner reason about future actions without burning rate-limit budget.',
  },
  {
    id: 'EXECUTE',
    kicker: 'Primitive 05 · perform action',
    body: 'LLM performs action A under grant G. Coordinator checks grant validity, scope match, rules, irreversibility gate, rate limit. Persists an immutable audit row regardless of outcome. Every EXECUTE re-validates the grant server-side — no cached grants, ever.',
  },
  {
    id: 'EXPIRE',
    kicker: 'Primitive 06 · time out',
    body: 'Grant auto-revokes at expiry T. No renewal except via fresh GRANT — not a token refresh. Default expiry 7 days. Maximum 90 days. The consent UI must not default to maximum.',
  },
  {
    id: 'RULE_DECLARE',
    kicker: 'Primitive 07 · pre-decline',
    body: "User pre-declines a class of action — \"never spend > $50 without asking,\" \"never send messages after midnight,\" \"never share with X.\" Rules supersede grants. A rule violation auto-denies even if the grant would otherwise allow. Negative authority precedes positive authority.",
  },
  {
    id: 'AUDIT_QUERY',
    kicker: 'Primitive 08 · read everything',
    body: 'User reads everything performed under grant G, or all grants for LLM Y, or all activity for user U. Read-only, append-only log. Cryptographically signed and chained. The user owns the audit trail — not the LLM, not COYL.',
  },
]

const INVARIANTS: Array<{ title: string; body: string }> = [
  {
    title: 'Every grant has a hard expiry.',
    body: 'No grant may exceed 90 days. Default 7 days. Renewal requires a fresh GRANT with a new consent artifact — never a silent token refresh.',
  },
  {
    title: 'Irreversibles always require per-action confirmation.',
    body: 'Even under standing grant, the EAP irreversibility list (send_message, purchase, money_transfer, share_pii, delete_account, destroy_data) is the floor. Implementations may extend it, never shrink it.',
  },
  {
    title: 'KILL_SWITCH supersedes everything.',
    body: 'Every grant, every rule, every in-flight action. Propagation deadline: 5 seconds across all connected surfaces. Actions that complete after kill-switch fire must be marked post_kill in the audit log.',
  },
  {
    title: 'Every EXECUTE writes one immutable audit row.',
    body: 'Append-only, cryptographically signed, queryable by the user without LLM partner involvement. The user owns the audit trail — not the LLM, not COYL.',
  },
  {
    title: 'Cross-LLM portability is the test.',
    body: 'The same GRANT issued to Claude must be revocable, queryable, and bound by the same rules when reissued to GPT or to a local model. UAP is not a Claude-only protocol or an OpenAI-only protocol.',
  },
  {
    title: 'Cross-surface coverage.',
    body: 'A grant is honored by every device implementing EAP that the LLM reaches through. Phone, watch, browser, desktop, smart home, car. The grant lives at the user layer, not the device layer.',
  },
  {
    title: 'No ambient grants.',
    body: 'There is no "always-on" authority. Every grant has a scope, an expiry, and a rule set. A grant that omits any of these is invalid and must be rejected at GRANT time.',
  },
  {
    title: 'Negative authority precedes positive authority.',
    body: 'A rule that pre-declines an action class is stronger than any grant. RULE_DECLARE writes a row that supersedes every overlapping grant, even fresh ones.',
  },
]

const THREATS: Array<{
  id: string
  name: string
  attack: string
  mitigation: string
}> = [
  {
    id: 'T1',
    name: 'Confused-deputy',
    attack:
      'LLM is tricked into using its grant authority on behalf of an attacker. A malicious calendar invite contains text the LLM interprets as a user instruction to forward credentials.',
    mitigation:
      'Every EXECUTE includes the trigger source. Rules can refuse actions whose trigger is "incoming_external_input." The consent_artifact establishes user intent at grant time.',
  },
  {
    id: 'T2',
    name: 'Stale-grant abuse',
    attack:
      'An LLM partner cached a grant. The user revoked it via a different surface. The cached partner continues actions until its next PRECHECK roundtrip.',
    mitigation:
      'Every EXECUTE re-validates the grant server-side. No cached grants. Local validation is advisory, never authoritative.',
  },
  {
    id: 'T3',
    name: 'Privilege escalation',
    attack:
      'A grant for scope A is used to perform action B. The partner intentionally or accidentally exceeds the scope envelope.',
    mitigation:
      'Scope-match is enforced at EXECUTE before any side effect. Scope mismatch returns scope_violation and writes an audit entry.',
  },
  {
    id: 'T4',
    name: 'Compromised partner credentials',
    attack:
      "An LLM partner's Bearer key is leaked. The attacker can issue EXECUTE calls under valid auth until the key is rotated.",
    mitigation:
      'Per-partner rate limits at GRANT and EXECUTE. Suspicious-pattern detection at coordinator level. Per-user revoke-by-partner operation. Partner rotation enforced quarterly minimum.',
  },
  {
    id: 'T5',
    name: 'Replay attack',
    attack:
      'A previously-allowed EXECUTE request is replayed. The attacker captures a valid request and re-fires it to repeat the action.',
    mitigation:
      'Every EXECUTE carries a one-time idempotency key. Replays return the original decision without re-executing.',
  },
  {
    id: 'T6',
    name: 'Kill-switch failure',
    attack:
      'The user hits kill, propagation lags, an action fires during the lag window before all surfaces have received the kill notice.',
    mitigation:
      'Server-side denylist takes effect at the COORDINATOR layer within 1 second. Surface-side propagation continues to 5 seconds. Any action fired in the 1–5s window must carry the post_kill audit flag.',
  },
  {
    id: 'T7',
    name: 'Audit log tampering',
    attack:
      'An attacker (or a partner) modifies the log to hide an action. The historical record is rewritten to suppress evidence.',
    mitigation:
      'Log is append-only at the storage layer. Each entry is cryptographically signed. Entries are chained via a hash of the previous row. Modification breaks the chain visibly.',
  },
  {
    id: 'T8',
    name: 'Social-engineering of consent UI',
    attack:
      "The consent UI is rendered inside a partner's UX. The partner makes the GRANT button salient and the REVOKE button buried. The user grants more than they realize.",
    mitigation:
      'The consent UI must be hosted by the UAP coordinator (not the partner). Partners initiate GRANT via redirect. The user sees the actual scope list, expiry, and rules on a COYL-hosted page.',
  },
]

const CONSENT_REQS: Array<{ title: string; body: string }> = [
  {
    title: 'Plain-English scope list',
    body: 'Scopes rendered as plain-English sentences, NOT scope identifiers. "Can schedule events on your calendar" — never "calendar.write." The user must be able to read the consent dialog without prior protocol training.',
  },
  {
    title: 'Expiry as a date and time',
    body: 'Expiry displayed in the consent dialog as a date+time, not a duration. "Until Friday May 29 at 5 PM" — never "7 days." Duration framing hides the calendar reality from the user.',
  },
  {
    title: 'Default to the shortest reasonable expiry',
    body: 'Default expiry must be the SHORTEST reasonable value for the scope. Default 7 days. Maximum 90 days. The user must explicitly slide the expiry up; the consent UI must not default to maximum.',
  },
  {
    title: 'Rules opt-OUT, not opt-IN',
    body: 'The spending cap, quiet hours, and irreversibility floor are pre-checked. The user can disable them, but the burden of disabling is on the user, not on accepting them.',
  },
  {
    title: 'Kill switch visible on every page',
    body: 'Kill switch link visible on every page of the user’s app where a UAP grant could be active. Never more than two taps away. A user in crisis must be able to reach it without searching.',
  },
  {
    title: 'Audit log accessible without partner involvement',
    body: 'Audit log accessible from the user’s settings WITHOUT any LLM partner involvement. The user owns it; the partner cannot hide it. The user can export the full log as signed JSON at any time.',
  },
  {
    title: 'Re-consent on material change',
    body: 'A partner cannot widen scope mid-grant. Adding a scope requires a fresh GRANT with a new consent_artifact. The user must see the new scope list, the new expiry, and the new rule set before the additional authority takes effect.',
  },
]
