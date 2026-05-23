/**
 * /platform — the non-developer entry point for the protocol-tier
 * story.
 *
 * Audience: CEOs, VPs of corp dev, journalists, investors arriving
 * from press or warm intros, trying to understand "what is COYL,
 * really?" The consumer hero ("AI for the moment before behavior
 * happens") stays on /. The developer surfaces (/protocol, /pap,
 * /eap, /developers) carry the technical weight. This page sits in
 * the middle — the editorial frame that says: COYL is not a consumer
 * app, it's the proactive AI infrastructure layer. Consumer coyl.ai
 * is the proof case. The protocol stack is the moat.
 *
 * Same luxury editorial idiom as /protocol and /developers — serif
 * H1 with italic-orange accent, mono kicker eyebrows, hairline-rule
 * sections, cream canvas. No code blocks here — this is the operator
 * view, not the integrator view.
 *
 * The acquirer-math section is unusual for a marketing page but
 * intentional: the audience will map this anyway from press +
 * recruiting + diligence. Transparent disclosure builds credibility
 * with corp dev. Sources live in the internal /finance docs; we
 * don't link them.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'


export const metadata: Metadata = {
  title: 'Platform — four protocols, one reference engine · COYL',
  description:
    'COYL is the proactive AI infrastructure layer for human life. Consumer coyl.ai is the proof. BIP + PAP + EAP + UAP is the protocol stack.',
  keywords: [
    'coyl platform',
    'proactive ai infrastructure',
    'behavioral ai protocol',
    'bip pap eap uap',
    'coyl cloud',
    'proactive ai reference engine',
  ],
  alternates: { canonical: '/platform' },
  openGraph: {
    title: 'COYL Platform — four protocols, one reference engine',
    description:
      'The proactive AI infrastructure layer for human life. BIP + PAP + EAP + UAP. Consumer coyl.ai is the proof case.',
    url: 'https://coyl.ai/platform',
    images: [
      {
        url: '/api/og?title=Four+protocols.+One+reference+engine.&kicker=The+Platform',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Platform',
    description:
      'Four protocols. One reference engine. The proactive AI infrastructure layer for human life.',
    images: ['/api/og?title=Four+protocols.+One+reference+engine.&kicker=The+Platform'],
  },
}

export default async function PlatformPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-platform')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Platform', url: 'https://coyl.ai/platform' },
        ]}
      />

      <article className="space-y-24 pb-12">
        {/* HEADER */}
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The Platform
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Four protocols.{' '}
            <span className="italic text-orange-600">
              One reference engine.
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            COYL is the proactive AI infrastructure layer for human
            life. Consumer{' '}
            <a
              href="https://coyl.ai"
              className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
            >
              coyl.ai
            </a>{' '}
            is the proof case. The protocol stack &mdash; BIP, PAP,
            EAP, UAP &mdash; is the moat.
          </p>
        </header>

        {/* 01 · WHAT THIS IS, EXACTLY */}
        <section className="space-y-8 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            01 &middot; What this is, exactly
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            The first AI layer that wraps{' '}
            <span className="italic text-orange-600">behavioral reality.</span>
          </h2>

          <div className="max-w-2xl space-y-6">
            <p className="text-base leading-[1.7] text-gray-700">
              Every AI before COYL wraps around external reality.
              Claude wraps around documents. ChatGPT wraps around
              language. Cursor wraps around codebases. Each of them
              answers questions about something outside the user.
              COYL wraps around the user themselves &mdash; archetype,
              danger window, excuse pattern, self-trust score &mdash;
              the behavioral substrate every other AI has to guess at.
            </p>

            <p className="text-base leading-[1.7] text-gray-700">
              The consumer app at{' '}
              <a
                href="https://coyl.ai"
                className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
              >
                coyl.ai
              </a>{' '}
              is the proof. Users take an audit, get an archetype,
              receive interrupts at the moments that matter, get a
              model snapshot at day 30, 60, 90. It works. It compounds.
              It&rsquo;s the demonstration that behavioral AI is real.
            </p>

            <p className="text-base leading-[1.7] text-gray-700">
              The protocol stack is what extends this to every LLM and
              every device. Any foundation lab can integrate against
              COYL. Any device manufacturer can extend it. The
              behavioral substrate stops being COYL&rsquo;s alone and
              becomes the layer the rest of the AI ecosystem builds
              against.
            </p>
          </div>
        </section>

        {/* 02 · THE FOUR PROTOCOLS */}
        <section className="space-y-12 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 &middot; The protocol stack
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              BIP. PAP. EAP.{' '}
              <span className="italic text-orange-600">UAP.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Four protocols. One reference engine. Each protocol is
              Apache 2.0. Each has a reference implementation at COYL
              Cloud (UAP is spec-only today — reference engine ships
              post-Series-A). Together they form the infrastructure
              layer for proactive AI.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
            {PROTOCOLS.map((p) => (
              <div
                key={p.name}
                className="flex flex-col border-t border-orange-500 pt-6"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {p.kicker}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {p.name}
                </h3>
                <p className="mt-4 text-base leading-[1.65] text-gray-700">
                  {p.body}
                </p>
                <p className="mt-4 border-l-2 border-orange-200 pl-4 font-serif text-base italic leading-[1.55] text-gray-700">
                  {p.example}
                </p>
                <div className="mt-6">
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
                  >
                    {p.linkLabel} &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 03 · THE REFERENCE ENGINE */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 &middot; The reference engine
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              COYL Cloud.{' '}
              <span className="italic text-orange-600">
                The implementation everyone else integrates against.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The protocols are open. The reference engine is not.
              COYL Cloud is the trained, audited, observable
              implementation of all three &mdash; the one foundation
              labs and device manufacturers connect to first. Same
              play Anthropic ran with MCP, same play Stripe ran with
              checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {ENGINE.map((e) => (
              <div
                key={e.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {e.kicker}
                </p>
                <h3 className="mt-3 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
                  {e.title}
                </h3>
                <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                  {e.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 04 · WHO'S BUILDING ON COYL */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              04 &middot; Who&rsquo;s building on COYL
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Foundation labs. Device manufacturers.{' '}
              <span className="italic text-orange-600">Healthcare.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The honest state of partner conversations. Confirmed
              entries replace placeholders as agreements close.
            </p>
          </div>

          <div className="space-y-8">
            {PARTNERS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 gap-6 border-t border-orange-500 pt-6 md:grid-cols-12 md:gap-10"
              >
                <div className="md:col-span-4">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                    {row.label}
                  </p>
                  <p className="mt-3 max-w-xs text-sm leading-[1.6] text-gray-600">
                    {row.context}
                  </p>
                </div>
                <div className="md:col-span-8">
                  <ul className="flex flex-wrap gap-2">
                    {row.entries.map((entry) => (
                      <li
                        key={entry.name}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs"
                      >
                        <span className="font-medium text-gray-900">
                          {entry.name}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-600">
                          {entry.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 05 · THE ACQUIRER MATH */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              05 &middot; The acquirer math
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Transparent because{' '}
              <span className="italic text-orange-600">
                you&rsquo;re going to map this anyway.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The strategic landscape for COYL has three acquirer
              paths. Probability and valuation ranges are the
              founder&rsquo;s best read &mdash; documented internally,
              published here because the press + corp dev audience
              maps this regardless. Disclosure builds credibility.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {ACQUIRER_PATHS.map((path) => (
              <div
                key={path.path}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {path.path}
                </p>
                <p className="mt-4 font-serif text-3xl font-normal leading-[1.05] tracking-[-0.01em] text-gray-900">
                  {path.valuation}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-gray-500">
                  {path.probability} probability
                </p>
                <p className="mt-4 text-sm leading-[1.6] text-gray-700">
                  {path.body}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Probability-weighted EV
            </p>
            <p className="mt-4 font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
              $4&ndash;5.5B.{' '}
              <span className="italic text-orange-600">Today.</span>
            </p>
            <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700">
              That&rsquo;s the current probability-weighted expected
              valuation across the three acquirer paths. The moonshot
              ceiling &mdash; foundation-lab acquisition at the top of
              the range &mdash; sits at $12B. The floor &mdash; pharma
              adjacency &mdash; sits at $4B. Sources: internal
              /finance documents; references on request.
            </p>
          </div>
        </section>

        {/* 06 · THE TEAM + CAPITAL */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              06 &middot; The team + capital
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Built by{' '}
              <span className="italic text-orange-600">
                someone who needed it.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Founder
              </p>
              <h3 className="mt-3 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                Iman Schrock
              </h3>
              <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                Founder &amp; CEO. Architected the protocol stack;
                first dataset was the founder&rsquo;s own behavior.
                See{' '}
                <Link
                  href="/about"
                  className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
                >
                  /about
                </Link>{' '}
                for the longer story.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Capital raised
              </p>
              <h3 className="mt-3 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                Pre-seed closed.{' '}
                <span className="italic text-orange-600">
                  Series A in conversation.
                </span>
              </h3>
              <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                Investor list confirmed at close. Press inquiries:{' '}
                <a
                  href="mailto:press@coyl.ai"
                  className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
                >
                  press@coyl.ai
                </a>
                .
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Advisory board
              </p>
              <h3 className="mt-3 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                Forming now.
              </h3>
              <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                Clinical + protocol + corp-dev advisors confirmed at
                close. See{' '}
                <Link
                  href="/advisors"
                  className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
                >
                  /advisors
                </Link>{' '}
                for the current roster as it lands.
              </p>
            </div>
          </div>
        </section>

        {/* 07 · CTAs */}
        <section className="space-y-6 border-t border-orange-500 pt-12">
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-4xl">
            Three ways in.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Read the protocol if you&rsquo;re a developer or partner.
            Try the consumer app if you want to feel what the
            substrate does. Reach press if you&rsquo;re writing about
            this.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/protocol"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read the protocol &rarr;
            </Link>
            <Link
              href="/audit"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Try the consumer app
            </Link>
            <a
              href="mailto:press@coyl.ai?subject=Press%20inquiry"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Press inquiries
            </a>
          </div>
        </section>

        {/* 08 · BRAND ANCHOR */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            08 &middot; The recurring anchor
          </p>
          <blockquote className="max-w-4xl font-serif text-3xl font-normal italic leading-[1.15] tracking-[-0.02em] text-gray-900 md:text-6xl">
            Stop being a chatbot.{' '}
            <span className="not-italic text-orange-600">Become behavior-aware.</span>
          </blockquote>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-600">
            The category line. LLMs read context windows. They don&rsquo;t read
            users. COYL is the protocol layer that closes that gap.
          </p>
        </section>
      </article>
    </>
  )
}

const PROTOCOLS: Array<{
  kicker: string
  name: string
  body: string
  example: string
  href: string
  linkLabel: string
}> = [
  {
    kicker: 'Protocol 01',
    name: 'BIP — Behavioral Interrupt Protocol',
    body:
      'The consumer-side protocol. Defines the Behavioral Context Object — archetype, danger window, excuse pattern, risk level — and the trigger / outcome primitives that make behavioral interrupts work. Apache 2.0. Already shipping.',
    example:
      'Your Apple Watch posts an HRV spike to BIP at 9:47 PM. BIP returns FIRE / DEFER / IGNORE against your behavioral model.',
    href: '/protocol',
    linkLabel: 'Read the BIP spec',
  },
  {
    kicker: 'Protocol 02',
    name: 'PAP — Proactive AI Protocol',
    body:
      'The LLM-partner protocol. Lets any foundation lab — Claude, ChatGPT, Gemini — propose a proactive intervention, get coordinator-checked against rate limits + scope + quiet hours, then fire through the user’s preferred modality. The trust layer for proactive AI.',
    example:
      'Claude can fire a 9 PM kitchen interrupt on your Apple Watch via PAP + EAP — without violating consent, rate limits, or your actual psyche state.',
    href: '/pap',
    linkLabel: 'Read the PAP spec',
  },
  {
    kicker: 'Protocol 03',
    name: 'EAP — Edge AI Protocol',
    body:
      'The device-fleet protocol. Lets any LLM address any device — iPhone, Watch, Mac, Chrome, Android, Wear OS — under a unified consent + audit layer. The universal SDK for cross-device LLM action.',
    example:
      'A single PAP proposal lands as a Watch haptic + iPhone voice prompt + Mac screen dim, choreographed across devices through one consent grant.',
    href: '/eap',
    linkLabel: 'Read the EAP spec',
  },
  {
    kicker: 'UAP v0.1 · Apache 2.0',
    name: 'User-Authority Protocol',
    body:
      'The fourth layer. When the user is absent and the LLM acts on their behalf, UAP is the trust contract — grant, expire, kill-switch, audit. Eight primitives. Hard invariants. The layer foundation labs need to ship agentic AI safely.',
    example:
      'Standing authority for agentic AI.',
    href: '/uap',
    linkLabel: 'Read UAP',
  },
]

const ENGINE: Array<{ kicker: string; title: string; body: string }> = [
  {
    kicker: 'Coordinator',
    title: 'Rate limits, dedup, scope, quiet hours.',
    body:
      'The brain that evaluates every proposal — across every LLM — and decides what fires, what defers, what gets dropped. Rate-limited, deduplicated, scope-checked, quiet-hours-aware. The gatekeeper that makes proactive AI safe to ship.',
  },
  {
    kicker: 'Audit logs',
    title: 'Full transparency. User-exportable. User-revocable.',
    body:
      'Every proposal, every outcome, every scope grant logged. The user exports as JSON at any time, revokes any LLM&rsquo;s authority at any time. Foundation labs cannot delete entries. The transparency layer is what makes user trust possible.',
  },
  {
    kicker: 'Device bridges',
    title: 'iOS · macOS · Watch · Android · Wear OS · browsers.',
    body:
      'Reference coordinators for every major device platform: iOS, macOS, watchOS, Chrome, Edge, Firefox, Safari, Android, Wear OS. Open-source per-platform bridges; any manufacturer can extend.',
  },
  {
    kicker: 'Consent UI',
    title: 'The OAuth flow for behavioral intervention authority.',
    body:
      'A user-facing consent surface — built once, deployed across every LLM partner. Granular scopes. Revocable per LLM. Panic switch for instant universal revocation. The OAuth equivalent for behavioral intervention authority.',
  },
]

const PARTNERS: Array<{
  label: string
  context: string
  entries: Array<{ name: string; status: string }>
}> = [
  {
    label: 'Foundation labs',
    context:
      'LLM partners integrating against PAP for proactive intervention authority.',
    entries: [
      { name: 'Anthropic', status: 'Pending' },
      { name: 'OpenAI', status: 'Pending' },
      { name: 'Google', status: 'Pending' },
    ],
  },
  {
    label: 'Device manufacturers',
    context:
      'Device-platform partners integrating against EAP for cross-device action coordination.',
    entries: [
      { name: 'Apple', status: 'In conversation' },
      { name: 'Microsoft', status: 'Viva pilot' },
    ],
  },
  {
    label: 'Healthcare',
    context:
      'Clinical + pharma partners for evidence, RCTs, and GLP-1 adjacency.',
    entries: [
      { name: 'Found Health', status: 'RCT in flight' },
      { name: 'Novo Nordisk', status: 'BD' },
      { name: 'Eli Lilly', status: 'BD' },
    ],
  },
  {
    label: 'UAP — standing authority',
    context:
      'Spec published v0.1. Reference engine ships post-Series-A. Zero partners, zero integrations today — the namespace is reserved while foundation labs review.',
    entries: [
      { name: 'Spec-only', status: '0 partners' },
      { name: 'Reference engine', status: 'Post-Series-A' },
    ],
  },
]

const ACQUIRER_PATHS: Array<{
  path: string
  valuation: string
  probability: string
  body: string
}> = [
  {
    path: 'Pharma',
    valuation: '$4–6B',
    probability: '35–45%',
    body:
      'Novo Nordisk or Eli Lilly acquires for GLP-1 adjacency — the clinical evidence + the consumer distribution. The floor case. Doesn&rsquo;t extract PAP / EAP value but pays for the consumer app + clinical record.',
  },
  {
    path: 'Tech-platform',
    valuation: '$4–8B',
    probability: '20–30%',
    body:
      'Microsoft (Viva + Copilot) or Apple (Watch + Intelligence) acquires for the behavioral OS layer. EAP makes COYL the obvious cross-device coordinator for the LLM era.',
  },
  {
    path: 'Foundation lab',
    valuation: '$6–12B',
    probability: '15–25%',
    body:
      'Anthropic, OpenAI, or Google acquires to OWN the proactive AI protocol category. Protocol ownership at the foundation-model layer is worth more than applications. The ceiling case.',
  },
]
