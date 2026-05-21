/**
 * /protocol — public developer surface for the Behavioral Interrupt Protocol.
 *
 * The MCP-shaped move: open-source the spec under Apache 2.0, become
 * the protocol category, let the ecosystem build COYL-compatible
 * implementations. The reference engine (COYL Cloud) wins on data +
 * integration quality, not on spec lock-in.
 *
 * This page is the entry point for the developer/enterprise/acquirer
 * audience. The consumer hero ("AI for the moment before behavior
 * happens") stays on /. This page reframes COYL as the behavioral
 * context protocol for AI systems that interact with humans.
 *
 * Editorial design matches the rest of the luxury overhaul — serif H1,
 * mono eyebrow, italic accent, hairline-rule sections, cream background.
 * The code snippets sit in calm dark surfaces for readability without
 * breaking the cream palette.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'COYL Protocol — the behavioral interrupt protocol for AI systems',
  description:
    'Every LLM today knows what the user is asking. None of them know what behavioral state the user is in when they ask it. COYL Protocol provides real-time behavioral context — danger window, archetype, excuse pattern, risk level — that any AI system can consume.',
  keywords: [
    'behavioral interrupt protocol',
    'coyl protocol',
    'behavioral context for ai',
    'jitai protocol',
    'mcp for human behavior',
    'open behavioral protocol',
    'ai behavioral interrupt api',
  ],
  alternates: { canonical: '/protocol' },
  openGraph: {
    title: 'COYL Protocol — the behavioral interrupt protocol',
    description:
      'The missing context layer between AI systems and human behavioral reality. Apache 2.0 open standard.',
    url: 'https://coyl.ai/protocol',
    images: [
      {
        url: '/api/og?title=The+behavioral+interrupt+protocol.&kicker=COYL+Protocol',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Protocol',
    description:
      'The behavioral interrupt protocol for AI systems. Apache 2.0. Open standard.',
    images: ['/api/og?title=The+behavioral+interrupt+protocol.&kicker=COYL+Protocol'],
  },
}

export default function ProtocolPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Protocol', url: 'https://coyl.ai/protocol' },
        ]}
      />

      <article className="space-y-24 pb-12">
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Spec · v0.1 · Apache 2.0
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            The behavioral interrupt{' '}
            <span className="italic text-orange-600">protocol.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Every LLM today knows what the user is asking. None of them
            know what behavioral state the user is in when they ask it.
            COYL Protocol provides real-time behavioral context —
            archetype, danger-window state, excuse pattern, risk level —
            that any AI system, wearable, or health app can consume.
          </p>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            <strong className="font-serif font-normal italic">
              MCP connects LLMs to software systems. COYL Protocol
              connects LLMs to the human behavioral system.
            </strong>{' '}
            Where one reaches into a database, the other reaches into
            the moment before behavior runs.
          </p>
        </header>

        {/* THE GAP */}
        <section className="space-y-6 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            01 · The gap
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            AI can answer{' '}
            <span className="italic text-orange-600">"should I eat this?"</span>{' '}
            It cannot fire at 9:47 PM when nobody asked.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            The LLM sits in a chat box and waits. The user is at the
            fridge. The protocol that closes this gap doesn&rsquo;t
            exist yet. We&rsquo;re publishing it.
          </p>
        </section>

        {/* THE THREE PRIMITIVES */}
        <section className="space-y-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · The three primitives
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Context. Trigger.{' '}
              <span className="italic text-orange-600">Outcome.</span>
            </h2>
          </div>

          {/* Primitive 1: Context */}
          <div className="grid grid-cols-1 gap-10 border-t border-orange-500 pt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Primitive 01
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                The Behavioral Context Object
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-gray-700">
                A read API returning the user&rsquo;s current behavioral
                state. No PII. Only behavioral abstractions: archetype,
                danger-window state, excuse category, self-trust score,
                risk level. Any LLM that receives this object can
                respond with contextually precise advice instead of
                generic platitudes.
              </p>
            </div>
            <div className="md:col-span-7">
              <CodeBlock
                lang="http"
                code={`GET /v1/context/{user_id}
Authorization: Bearer <token>

{
  "spec_version": "0.1",
  "archetype": "9PM_NEGOTIATOR",
  "archetype_confidence": 0.83,
  "danger_window_active": true,
  "current_excuse_category": "DESERVER",
  "self_trust_score": 74,
  "risk_level": "HIGH",
  "freshness": { "ttl_seconds": 60 }
}`}
              />
            </div>
          </div>

          {/* Primitive 2: Trigger */}
          <div className="grid grid-cols-1 gap-10 border-t border-gray-200 pt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Primitive 02
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                The Interrupt Trigger
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-gray-700">
                Any signal source — a Watch, a calendar, a tab-switch
                event — can push a behavioral signal. The engine
                evaluates against the user&rsquo;s model and decides
                whether to fire, defer, or ignore. Apple Watch
                doesn&rsquo;t need to understand behavioral psychology.
                It sends the HRV spike. COYL decides what to do with it.
              </p>
            </div>
            <div className="md:col-span-7">
              <CodeBlock
                lang="http"
                code={`POST /v1/interrupt
Authorization: Bearer <token>

{
  "user_id": "u_2sj8xks0a",
  "trigger_source": "apple_watch_hrv_spike",
  "trigger_type": "physiological",
  "urgency": "HIGH"
}

→ 200 OK
{
  "decision": "FIRE",
  "delivery_channels": ["push"],
  "scheduled_at": "..."
}`}
              />
            </div>
          </div>

          {/* Primitive 3: Webhook */}
          <div className="grid grid-cols-1 gap-10 border-t border-gray-200 pt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Primitive 03
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                The Outcome Webhook
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-gray-700">
                After every interrupt the engine emits the outcome to
                registered consumers. The GLP-1 platform sees adherence
                in real time. The enterprise sees follow-through rates
                across the team. The Watch logs the behavioral
                intervention alongside step counts. The data loop closes.
              </p>
            </div>
            <div className="md:col-span-7">
              <CodeBlock
                lang="http"
                code={`POST <your_webhook_url>
X-BIP-Signature: sha256=<hmac>
X-BIP-Event: INTERRUPT_RESOLVED

{
  "event": "INTERRUPT_RESOLVED",
  "user_id": "u_2sj8xks0a",
  "outcome": "STOPPED",
  "elapsed_seconds": 47,
  "pattern_update": {
    "self_trust_score": 1
  }
}`}
              />
            </div>
          </div>
        </section>

        {/* WHAT THIS UNLOCKS */}
        <section className="space-y-12 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 · What this unlocks
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Behavioral awareness for{' '}
              <span className="italic text-orange-600">every AI you ship.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {UNLOCKS.map((u) => (
              <div key={u.title} className="border-t border-orange-500 pt-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {u.kicker}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {u.title}
                </h3>
                <p className="mt-4 text-base leading-[1.65] text-gray-700">
                  {u.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* OPEN STANDARD */}
        <section className="space-y-6 rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            04 · Open standard, hosted reference
          </p>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Apache 2.0.{' '}
            <span className="italic text-orange-600">No spec lock-in.</span>
          </h2>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            The spec is open. Anyone can implement a BIP-compatible
            engine. COYL Cloud is the reference implementation — it
            wins on data quality and integration depth, not on closed
            specs. Same play Anthropic ran with MCP, same play Stripe
            ran with checkout, same play OAuth ran with authorization.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/BIP-0.1.md"
              target="_blank"
              rel="noopener"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read the v0.1 spec →
            </a>
            <a
              href="mailto:protocol@coyl.ai?subject=BIP%20integration%20interest"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Integrate against COYL Cloud
            </a>
            <span className="text-xs uppercase tracking-widest text-gray-500">
              Public preview Q3 2026
            </span>
          </div>
        </section>

        {/* CATEGORY DEFINITION */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            05 · The category
          </p>
          <blockquote className="max-w-3xl font-serif text-3xl font-normal italic leading-[1.3] text-gray-900 md:text-5xl">
            COYL is to human behavioral reality what MCP is to software
            systems — the protocol that lets AI reach in and act at the
            moment that matters.
          </blockquote>
        </section>

        {/* CTA */}
        <section className="space-y-6 border-t border-orange-500 pt-12">
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-4xl">
            Build against the protocol.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Reference engine in private alpha. Public preview Q3 2026.
            For partnership inquiries — wearables, LLM platforms,
            telehealth, enterprise productivity — reach out and
            we&rsquo;ll bring you into the alpha.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:protocol@coyl.ai?subject=Alpha%20access"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Request alpha access
            </a>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the manifesto
            </Link>
          </div>
        </section>
      </article>
    </>
  )
}

/**
 * Calm dark code-block surface that survives on the cream marketing
 * canvas without breaking the editorial palette. Mono + tight leading
 * + warm dark bg so it reads as a real spec excerpt, not a screenshot.
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

const UNLOCKS: Array<{ kicker: string; title: string; body: string }> = [
  {
    kicker: 'For LLM platforms',
    title: 'Every LLM becomes behaviorally aware.',
    body: 'Claude / GPT / Gemini get real-time behavioral context they could never generate on their own. "Help me plan my week" gets a response that knows the user is a Monday Resetter with a Sunday-night danger window. The answer is fundamentally different.',
  },
  {
    kicker: 'For wearables + health apps',
    title: 'A behavioral interrupt layer they didn’t have to build.',
    body: 'Glucose monitors, sleep trackers, GLP-1 apps, ADHD tools — all of them collect data about what happened. None of them have a real-time interrupt engine. They call BIP and get one. Stripe-shaped: own the protocol, let everyone build on top.',
  },
  {
    kicker: 'For the protocol owner',
    title: 'The data moat compounds with every integration.',
    body: 'Every BIP call (with consent) contributes behavioral signal back. The model gets better with every integration. The better the model, the more integrations. The compounding dynamic that made OAuth, MCP, and Stripe impossible to displace.',
  },
]
