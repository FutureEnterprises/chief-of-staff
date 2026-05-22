/**
 * /pap — public surface for the Proactive AI Protocol v0.1.
 *
 * BIP (at /protocol) is the consumer-app-side behavioral context layer.
 * PAP is the superset for foundation-lab + enterprise audiences — the
 * trust infrastructure ANY LLM uses to propose interventions in a
 * user's life under rate limits, consent scopes, and an audit trail
 * the user controls.
 *
 * This page is the marketing + developer distillation of the full PAP
 * v0.1 spec doc (docs/protocol/proactive-ai-protocol.md). Same
 * editorial idiom as /protocol — Instrument Serif H1 with italic-
 * orange accent, mono kicker eyebrow, hairline rules, cream canvas,
 * warm-dark code surfaces — so a visitor moving from /protocol → /pap
 * lands in a consistent universe.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

const DESCRIPTION =
  'The Proactive AI Protocol v0.1. Apache 2.0 open spec for LLMs to propose behavioral interventions in users’ lives — under rate limits, consent scopes, and an audit trail the user controls.'

export const metadata: Metadata = {
  title: 'PAP — the trust infrastructure for proactive AI · COYL',
  description: DESCRIPTION,
  keywords: [
    'proactive ai protocol',
    'pap',
    'pap v0.1',
    'trust infrastructure for ai',
    'behavioral intervention protocol',
    'llm proactive consent',
    'coyl pap',
    'mcp for behavioral state',
    'apache 2.0 ai protocol',
  ],
  alternates: { canonical: '/pap' },
  openGraph: {
    title: 'PAP — the trust infrastructure for proactive AI · COYL',
    description: DESCRIPTION,
    url: 'https://coyl.ai/pap',
    images: [
      {
        url: '/api/og?title=The+trust+infrastructure+for+proactive+AI.&kicker=PAP+v0.1',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAP — the trust infrastructure for proactive AI',
    description: DESCRIPTION,
    images: ['/api/og?title=The+trust+infrastructure+for+proactive+AI.&kicker=PAP+v0.1'],
  },
}

export default function PapPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'PAP', url: 'https://coyl.ai/pap' },
        ]}
      />

      <article className="space-y-24 pb-12">
        {/* 1. HEADER */}
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              PAP v0.1 · Apache 2.0
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            The trust infrastructure for{' '}
            <span className="italic text-orange-600">proactive AI.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            PAP is to behavioral state what MCP is to tool calls. The
            open spec any LLM uses to propose interventions in a
            user&rsquo;s life &mdash; under rate limits, consent scopes,
            and an audit trail the user controls.
          </p>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            <strong className="font-serif font-normal italic">
              Apache 2.0 from publication.
            </strong>{' '}
            Spec is open. Anyone can implement a Coordinator. COYL
            Cloud is the reference engine that powers consumer + LLM
            partners today.
          </p>
        </header>

        {/* 2. THE CATEGORY INSIGHT — TRUST IS THE BOTTLENECK */}
        <section className="space-y-6 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            01 · The bottleneck
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            The bottleneck for proactive AI is not capability.{' '}
            <span className="italic text-orange-600">It&rsquo;s trust.</span>
          </h2>

          <div className="max-w-2xl space-y-5 pt-2 text-lg leading-[1.7] text-gray-700">
            <p>
              Anthropic could ship Claude that says &ldquo;you&rsquo;ve
              been on Reddit for ninety minutes; here&rsquo;s a different
              thing to do&rdquo; today. OpenAI could. Gemini could. None
              of them do it because users haven&rsquo;t granted that
              authority, there&rsquo;s no shared trust infrastructure,
              the risk of a single bad firing is unbounded, and
              there&rsquo;s no standardized consent or rate-limiting or
              outcome model. The capability has been sitting on the
              shelf for two years.
            </p>
            <p>
              PAP is to behavioral intervention what{' '}
              <strong className="font-serif font-normal italic">
                OAuth
              </strong>{' '}
              is to data access,{' '}
              <strong className="font-serif font-normal italic">
                Stripe
              </strong>{' '}
              is to transaction risk, and{' '}
              <strong className="font-serif font-normal italic">
                HTTPS
              </strong>{' '}
              is to transport. The substrate that has to exist before
              the category can ship. Granular consent scopes per LLM
              per modality. A shared rate-limit ledger across competing
              foundation models. A deduplication engine. An audit trail
              users can read and revoke from.
            </p>
            <p>
              PAP becomes inevitable because foundation labs{' '}
              <em>can&rsquo;t</em> ship proactive AI without trust
              infrastructure, and building trust infrastructure is not
              core to their roadmap. They want to use PAP not because
              they lack capability, but because they lack
              speed-to-market on trust. That&rsquo;s the wedge.
            </p>
          </div>
        </section>

        {/* 3. THE SEVEN PRIMITIVES */}
        <section className="space-y-12">
          <div className="space-y-6 border-t border-gray-200 pt-16">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · The seven primitives
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Seven endpoints.{' '}
              <span className="italic text-orange-600">One protocol.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Each primitive is an HTTP-like RPC with a stable schema.
              The spec is Apache 2.0. The Coordinator engine that
              evaluates proposals, deduplicates competing LLMs, and
              fires through the right modality is the proprietary
              reference implementation.
            </p>
          </div>

          {PRIMITIVES.map((p, i) => (
            <div
              key={p.id}
              className={`grid grid-cols-1 gap-10 pt-8 md:grid-cols-12 md:gap-12 ${
                i === 0 ? 'border-t border-orange-500' : 'border-t border-gray-200'
              }`}
            >
              <div className="md:col-span-5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {p.id}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                  {p.title}
                </h3>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-gray-500">
                  {p.endpoint}
                </p>
                <p className="mt-4 text-base leading-[1.7] text-gray-700">
                  {p.body}
                </p>
              </div>
              <div className="md:col-span-7">
                <CodeBlock lang={p.lang} code={p.code} />
              </div>
            </div>
          ))}
        </section>

        {/* 4. THE BEHAVIORAL CONTEXT OBJECT */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 · The Behavioral Context Object
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The substrate every PAP-integrated LLM{' '}
              <span className="italic text-orange-600">reads from.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The BCO is the read-only abstraction of the user&rsquo;s
              current behavioral reality &mdash; archetype, state, active
              danger window, signal cluster, commitments,
              self-trust score, recent interventions, rate limits. No
              raw PII. Any LLM with the{' '}
              <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
                read_observation
              </code>{' '}
              scope can call it. Authentication via PAP OAuth 2.0 token.
            </p>
          </div>
          <CodeBlock lang="json · GET /pap/v1/observation" code={BCO_EXAMPLE} />
        </section>

        {/* 5. THE PROPOSAL ENVELOPE */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              04 · The proposal envelope
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              LLM proposes.{' '}
              <span className="italic text-orange-600">
                Coordinator decides.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Even if five different LLMs all want to fire in the same
              window, PAP coordinates &mdash; picks the highest-confidence
              proposal, deduplicates similar headlines, respects rate
              limits, respects quiet hours, respects the user&rsquo;s
              granted scope. The proposing LLM never fires directly. It
              earns the right to fire.
            </p>
          </div>
          <CodeBlock lang="json · POST /pap/v1/proposal" code={PROPOSAL_EXAMPLE} />
        </section>

        {/* 6. AUTHORIZATION SCOPES */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              05 · Authorization scopes
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Nine granular scopes.{' '}
              <span className="italic text-orange-600">
                Per LLM. Revocable.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              User grants specific LLMs specific authorities via PAP
              OAuth 2.0 consent flow. Each scope is granular, revocable,
              and logged. The user always sees which LLMs hold which
              scopes, the last thirty interventions per LLM, a per-LLM
              revoke button, and a universal pause-all-proactive-AI
              panic switch.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <ul className="divide-y divide-gray-100">
              {SCOPES.map((s) => (
                <li
                  key={s.scope}
                  className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-12 md:gap-6"
                >
                  <code className="md:col-span-4 font-mono text-[12.5px] font-medium text-orange-700">
                    {s.scope}
                  </code>
                  <p className="md:col-span-8 text-sm leading-[1.6] text-gray-700">
                    {s.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. PRICING */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              06 · Pricing
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Free to start.{' '}
              <span className="italic text-orange-600">
                Usage scales.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The free tier drives adoption. The usage tier is where
              revenue compounds. Strategic seats lock in the platform
              partners with reserved capacity, preferred rates, and
              co-design influence on the spec.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col gap-4 rounded-3xl border p-7 ${
                  tier.featured
                    ? 'border-orange-300 bg-gradient-to-br from-orange-50 via-white to-white shadow-[0_24px_60px_-24px_rgba(255,102,0,0.18)]'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                    {tier.kicker}
                  </p>
                  <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                    {tier.name}
                  </h3>
                </div>
                <p className="font-serif text-3xl font-normal leading-[1.05] text-gray-900">
                  {tier.price}
                </p>
                <p className="text-sm leading-[1.6] text-gray-700">
                  {tier.body}
                </p>
                {tier.footnote && (
                  <p className="mt-auto font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                    {tier.footnote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 8. GET STARTED */}
        <section className="space-y-8 rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            07 · Get started
          </p>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Two paths in.{' '}
            <span className="italic text-orange-600">Pick yours.</span>
          </h2>

          <div className="grid grid-cols-1 gap-8 pt-2 md:grid-cols-2 md:gap-10">
            <div className="space-y-4 border-t border-orange-500 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Foundation labs
              </p>
              <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                Strategic seat. Reserved capacity. Co-design.
              </h3>
              <p className="text-base leading-[1.7] text-gray-700">
                Anthropic, OpenAI, Google, Apple, Microsoft, and
                pharma partners get reserved seats with preferred
                rates and co-design influence on the spec. We ship the
                Coordinator. You ship the LLM. Users keep the audit
                trail.
              </p>
              <a
                href="mailto:partner@coyl.ai?subject=PAP%20foundation-lab%20API%20key"
                className="inline-flex rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
              >
                Apply for API key &rarr;
              </a>
            </div>

            <div className="space-y-4 border-t border-gray-300 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                App developers
              </p>
              <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                BIP integration first. Then PAP.
              </h3>
              <p className="text-base leading-[1.7] text-gray-700">
                BIP v0.1 is the consumer-app-side protocol &mdash; the
                behavioral context layer your app reads and emits.
                Ship a BIP integration, then upgrade to PAP when you
                need proactive firing under the trust substrate.
              </p>
              <Link
                href="/developers"
                className="inline-flex rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
              >
                Start with BIP &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* 9. FAQ */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              08 · FAQ
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The five things people ask{' '}
              <span className="italic text-orange-600">first.</span>
            </h2>
          </div>

          <dl className="divide-y divide-gray-200 border-t border-gray-200">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="grid grid-cols-1 gap-4 py-8 md:grid-cols-12 md:gap-10"
              >
                <dt className="md:col-span-5 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
                  {f.q}
                </dt>
                <dd className="md:col-span-7 text-base leading-[1.7] text-gray-700">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 10. CLOSING */}
        <section className="space-y-6 border-t border-orange-500 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            09 · The sibling protocol
          </p>
          <blockquote className="max-w-3xl font-serif text-3xl font-normal italic leading-[1.3] text-gray-900 md:text-5xl">
            PAP is the trust infrastructure for proactive AI. EAP is
            the same substrate, turned inward &mdash; the protocol an
            agent uses to be honest with itself.
          </blockquote>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Both Apache 2.0. Both reference-implemented by COYL Cloud.
            Both built on the same belief: AI for the moment before
            behavior happens, not the moment after.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/eap"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read the EAP spec &rarr;
            </Link>
            <Link
              href="/protocol"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              BIP v0.1 (the consumer protocol)
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the manifesto
            </Link>
          </div>
          <p className="pt-8 font-mono text-[10px] uppercase tracking-[0.32em] text-gray-500">
            COYL &middot; Catch yourself before you do it again.
          </p>
        </section>
      </article>
    </>
  )
}

/**
 * Calm warm-dark code surface that survives on the cream marketing
 * canvas without breaking the editorial palette. Mirrors the treatment
 * used on /protocol so a visitor moving between the two pages reads
 * the code blocks as the same artifact.
 */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#1b1f24] bg-[#0f1115] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)]">
      <figcaption className="border-b border-white/[0.04] bg-white/[0.02] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
        {lang}
      </figcaption>
      <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.55] text-[#e6e2da]">
        {code}
      </pre>
    </figure>
  )
}

const PRIMITIVES: Array<{
  id: string
  title: string
  endpoint: string
  body: string
  lang: string
  code: string
}> = [
  {
    id: 'Primitive 01',
    title: 'Observation API',
    endpoint: 'GET /pap/v1/observation',
    body: 'Returns the user’s current Behavioral Context Object — the read-only abstraction of their behavioral reality. Any LLM with the read_observation scope can call it. This is the substrate every proposal fires against.',
    lang: 'http',
    code: `GET /pap/v1/observation
Authorization: Bearer <pap_oauth_token>

→ 200 OK
{
  "userId": "u_xyz",
  "archetype": "the-9pm-negotiator",
  "state": "high_arousal",
  "selfTrustScore": 73
}`,
  },
  {
    id: 'Primitive 02',
    title: 'Proposal API',
    endpoint: 'POST /pap/v1/proposal',
    body: 'LLM emits a proposed intervention with action + context + reasoning. The Coordinator returns allowed, denied, or queued for deduplication. The LLM never fires directly — it earns the right to fire.',
    lang: 'http',
    code: `POST /pap/v1/proposal
{
  "llmId": "anthropic-claude-sonnet-3.7",
  "scopeRequested": ["proactive_food"],
  "action": { "kind": "interrupt", "mode": "high_arousal" }
}

→ { "decision": "allowed", "executionToken": "et_xyz" }`,
  },
  {
    id: 'Primitive 03',
    title: 'Execution API',
    endpoint: 'POST /pap/v1/execute',
    body: 'Use the executionToken from the proposal response to fire. PAP picks the modality — Live Activity, Watch haptic, voice, push, browser overlay, Teams message, Slack DM — based on user preference, active surface, and recent firings.',
    lang: 'http',
    code: `POST /pap/v1/execute
{ "executionToken": "et_xyz" }

→ 200 OK
{
  "firedAt": "2026-05-21T21:47:30Z",
  "modality": "ios_live_activity"
}`,
  },
  {
    id: 'Primitive 04',
    title: 'Outcome API',
    endpoint: 'POST /pap/v1/outcome',
    body: 'PAP records whether the intervention landed. User-tagged outcomes (caught_me, dismissed, slipped) or inferred outcomes (slip_within_30min). The outcome flows back to the proposing LLM via the subscription webhook.',
    lang: 'http',
    code: `→ POST /pap/v1/outcome   (PAP → itself)
{
  "executionToken": "et_xyz",
  "outcome": "caught_me",
  "outcomeSource": "user_tag"
}`,
  },
  {
    id: 'Primitive 05',
    title: 'Subscription API',
    endpoint: 'POST /pap/v1/subscribe',
    body: 'LLMs subscribe to user state transitions or outcome events. PAP fires the webhook when conditions match. This is how proactive AI works without polling — webhook-driven, sub-second, scoped per LLM.',
    lang: 'http',
    code: `POST /pap/v1/subscribe
{
  "subscriptionKind": "state_transition",
  "conditions": {
    "fromState": ["calm"],
    "toState": ["high_arousal"],
    "minConfidence": 0.7
  },
  "webhookUrl": "https://api.anthropic.com/pap/webhooks/state"
}`,
  },
  {
    id: 'Primitive 06',
    title: 'Authorization model',
    endpoint: 'OAuth 2.0 · nine scopes',
    body: 'User grants specific LLMs specific authorities via PAP OAuth 2.0 consent flow. Granular, revocable, logged. Per-LLM revoke button + universal panic switch live in the user’s PAP dashboard.',
    lang: 'oauth',
    code: `→ GET /pap/oauth/authorize
   ?client_id=anthropic-claude-sonnet-3.7
   &scope=proactive_food+proactive_focus
   &redirect_uri=https://api.anthropic.com/...

→ user confirms → issued token + audit entry`,
  },
  {
    id: 'Primitive 07',
    title: 'Audit + transparency',
    endpoint: 'GET /pap/v1/audit',
    body: 'Every proposal, decision, firing, and outcome is logged in the user’s PAP audit log. Exportable as JSON anytime by the user. Foundation labs cannot delete entries. A "PAP queue" view shows LLMs competing for attention in real time.',
    lang: 'http',
    code: `GET /pap/v1/audit?since=2026-05-01
→ 200 OK
{
  "entries": [
    { "proposalId": "p_abc", "llm": "claude-sonnet-3.7",
      "decision": "allowed", "outcome": "caught_me" },
    { "proposalId": "p_def", "llm": "gpt-5-omni",
      "decision": "denied", "reason": "rate_limited" }
  ]
}`,
  },
]

const BCO_EXAMPLE = `{
  "userId": "u_xyz",
  "asOf": "2026-05-21T21:43:12Z",
  "archetype": "the-9pm-negotiator",
  "state": "high_arousal",
  "stateConfidence": 0.84,
  "activeDangerWindow": {
    "label": "Late-night kitchen",
    "startedAt": "2026-05-21T21:00:00Z",
    "endsAt": "2026-05-21T23:00:00Z",
    "confidence": 0.87
  },
  "signalCluster": {
    "hrvDeltaPct": -22,
    "sedentaryMins": 105,
    "locationKind": "kitchen",
    "screenOnMins": 38,
    "weekdayStress": "high"
  },
  "activeCommitments": [
    { "rule": "no food after 9 PM", "kept": 14, "broken": 4 }
  ],
  "selfTrustScore": 73,
  "recentInterventions": [
    {
      "firedAt": "2026-05-20T21:52:00Z",
      "mode": "high_arousal",
      "outcome": "caught_me",
      "source": "anthropic-claude-sonnet-3.7"
    }
  ],
  "quietHoursActive": false,
  "intervention60dRateLimit": {
    "interventionsAllowed": 25,
    "interventionsUsed": 7,
    "remaining": 18,
    "resetAt": "2026-06-20T00:00:00Z"
  },
  "modalityPreference": ["voice", "haptic", "push"],
  "consentedScopes": [
    {
      "scope": "proactive_food",
      "grantedAt": "2026-04-12T18:02:00Z",
      "grantedTo": "anthropic-claude-sonnet-3.7",
      "expiresAt": null
    }
  ]
}`

const PROPOSAL_EXAMPLE = `{
  "proposalId": "p_abc",
  "llmId": "anthropic-claude-sonnet-3.7",
  "userId": "u_xyz",
  "scopeRequested": ["proactive_food"],
  "action": {
    "kind": "interrupt",
    "modality": "voice",
    "mode": "high_arousal",
    "headline": "Stop. Hand on the counter. 4 breaths.",
    "subhead": "9:47 PM. You said no food after 9. Decide at 9:55."
  },
  "context": {
    "trigger": "danger_window_active:late_night_kitchen",
    "confidence": 0.84,
    "reasoning": "HRV dropped 22pts in 90min + sedentary 105min + geofence:kitchen + active commitment:no_food_after_9"
  }
}

→ 200 OK
{
  "decision": "allowed",
  "scheduledFor": "2026-05-21T21:47:30Z",
  "executionToken": "et_xyz"
}

// OR
{
  "decision": "denied",
  "reason": "rate_limited",
  "retryAfter": "2026-05-21T23:00:00Z"
}

// OR
{
  "decision": "queued",
  "reason": "deduplication_pending",
  "competingProposals": ["p_def", "p_ghi"],
  "decisionAt": "2026-05-21T21:47:35Z"
}`

const SCOPES: Array<{ scope: string; body: string }> = [
  {
    scope: 'proactive_food',
    body: 'Food + eating interventions. Late-night kitchen, after-meeting graze, weekend bulk shop.',
  },
  {
    scope: 'proactive_focus',
    body: 'Work + attention interventions. Tab-switch loops, Reddit/Twitter spirals, deep-work breaks.',
  },
  {
    scope: 'proactive_relational',
    body: 'Message-you-shouldn’t-send moments. Heat-of-the-moment drafts, late-night DMs, post-fight texts.',
  },
  {
    scope: 'proactive_sleep',
    body: 'Late-night wind-down. Screen time after 11pm, doom-scroll into early hours, blue-light exposure.',
  },
  {
    scope: 'proactive_purchase',
    body: 'Impulse buy prevention. Cart-load spikes, late-night Amazon, recurring-rationalization patterns.',
  },
  {
    scope: 'proactive_recovery',
    body: 'Post-slip support. The 30 minutes after a broken commitment, when the spiral usually starts.',
  },
  {
    scope: 'proactive_substance',
    body: 'Alcohol, nicotine, and similar. Sensitive scope — requires extra user confirmation at grant time.',
  },
  {
    scope: 'proactive_mood',
    body: 'Mood-state interventions. Sensitive scope — ships with clinical caveat surface for the user.',
  },
  {
    scope: 'read_observation',
    body: 'Read-only access to the Behavioral Context Object. No firing authority. The minimum integration tier.',
  },
  {
    scope: 'read_outcome_aggregate',
    body: 'Read aggregate outcome statistics across a user’s interventions. Not per-firing detail.',
  },
]

const PRICING: Array<{
  kicker: string
  name: string
  price: string
  body: string
  footnote?: string
  featured?: boolean
}> = [
  {
    kicker: 'Free',
    name: 'Free tier',
    price: '$0',
    body: '1,000 interventions per month, per user, per LLM. Full Coordinator. Full audit trail. Built for adoption — ship a behaviorally-aware AI feature in a weekend.',
    footnote: 'No card required',
  },
  {
    kicker: 'Usage',
    name: 'Usage',
    price: '$0.001 / intervention',
    body: 'Pay-as-you-go after the free tier. No minimums. No tiered lock-ins. Bill per fired intervention, not per BCO read.',
    footnote: 'Volume discounts at 10M+/month',
    featured: true,
  },
  {
    kicker: 'Strategic',
    name: 'Strategic seat',
    price: 'Reserved',
    body: 'Pharma + Microsoft + Apple + Anthropic + OpenAI + Gemini + foundation labs get reserved capacity, preferred rates, and co-design influence on the spec.',
    footnote: 'partner@coyl.ai',
  },
]

const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'How is this different from MCP?',
    a: (
      <>
        MCP connects LLMs to tools and data — read my calendar,
        search this database, call this API. PAP connects LLMs to{' '}
        <em>behavioral state</em> — propose an intervention because
        the user is in a high-arousal danger window at 9:47 PM. They
        complement. PAP uses MCP-style tool calls underneath where it
        makes sense. The category is different: MCP is about software
        systems, PAP is about the human behavioral system.
      </>
    ),
  },
  {
    q: 'Why won’t Anthropic just build their own?',
    a: (
      <>
        They could. The barrier is not technical, it’s
        speed-to-market on trust — a shared consent ledger across
        competing LLMs, a deduplication engine, a user-controlled audit
        trail, granular per-LLM scope tokens. Building those is real
        engineering plus real product plus regulatory thinking. Most
        foundation labs prefer to adopt an open protocol than to build
        their own trust substrate. Same playbook as MCP.
      </>
    ),
  },
  {
    q: 'Can users revoke an LLM’s authority?',
    a: (
      <>
        Yes. Per-scope, per-LLM, anytime, with a universal pause-all
        switch. Revocations are logged — the historical interventions
        an LLM fired before revocation stay in the audit log (anonymized
        to the model family, not tied to an individual API key).
        Revocation is instant. The next proposal from that LLM is
        denied with reason{' '}
        <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
          scope_revoked
        </code>
        .
      </>
    ),
  },
  {
    q: 'How are rate limits enforced across competing LLMs?',
    a: (
      <>
        The Coordinator maintains a per-user 60-day intervention budget
        (default 25, user-adjustable). All competing LLM proposals draw
        against the same budget. When five proposals land in the same
        danger window, the Coordinator picks the highest-confidence one,
        deduplicates similar headlines, and denies the rest with{' '}
        <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
          rate_limited
        </code>{' '}
        or{' '}
        <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
          deduplication_pending
        </code>
        . LLMs see the response and update their per-user
        proposal-quality model.
      </>
    ),
  },
  {
    q: 'What’s the latency for proposal evaluation?',
    a: (
      <>
        P50 is under 80ms, P99 under 240ms in the reference Coordinator.
        The state classifier runs ahead of proposal time — by the
        moment a proposal arrives, the user’s current BCO is already
        cached. Proposal evaluation is rate-limit check, dedup check,
        quiet-hours check, confidence-threshold gate. Firing latency is
        modality-dependent: Live Activity is under one second, push
        under five, email under sixty.
      </>
    ),
  },
]
