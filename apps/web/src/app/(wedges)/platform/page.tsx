/**
 * /platform — the buyer-facing entry point for the COYL authority layer.
 *
 * Audience: Head of AI Platform, CTO, CISO, AI governance / Trust &
 * Safety. They arrive asking "what is COYL, and why would I integrate
 * it?" This page answers in plain English before it ever meets an
 * acronym: COYL is the authority layer for LLMs acting in the world.
 *
 * Positioning frame (shared verbatim with /protocol):
 *   MCP connects agents to tools. A2A lets agents talk to agents.
 *   COYL is permission, audit, control, and provenance for agents
 *   acting on a person's behalf — scoped, revocable, rate-limited,
 *   auditable, provenance-signed, kill-switchable, portable across
 *   models and devices.
 *
 * Honest status, everywhere on this page:
 *   - Specs published, Apache 2.0.
 *   - Reference engine + @coyl/protocol SDK in alpha, in this repo.
 *   - The five-layer stack is implemented, not vaporware.
 *   - The safety floor (RAP) is live and gates BOTH the agent path
 *     and the consumer interrupt path.
 *   - A runnable authority demo exists.
 *   - Design partners invited. No hosted production API is promised.
 *
 * Same luxury editorial idiom as /protocol and /developers — serif H1
 * with italic-orange accent, mono kicker eyebrows, hairline-rule
 * sections, cream canvas.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'
import {
  CinematicScrim,
  CinematicEyebrow,
  CinematicDisplay,
  CinematicBody,
} from '@/components/cinematic'


export const metadata: Metadata = {
  title: 'COYL — the authority layer for LLMs acting in the world',
  description:
    'Permission, audit, control, and provenance for AI agents acting on a person’s behalf — scoped, revocable, rate-limited, auditable, provenance-signed, kill-switchable, portable across models and devices. Specs are Apache 2.0; reference engine + SDK in alpha; design partners invited.',
  keywords: [
    'authority layer for ai agents',
    'agent permission and audit',
    'agentic ai consent',
    'ai agent kill switch',
    'provenance for ai actions',
    'coyl protocol stack',
  ],
  alternates: { canonical: '/platform' },
  openGraph: {
    title: 'COYL — the authority layer for LLMs acting in the world',
    description:
      'Permission, audit, control, and provenance for agents acting on a person’s behalf. Scoped, revocable, auditable, kill-switchable. Apache 2.0 specs; alpha reference engine + SDK; design partners invited.',
    url: 'https://coyl.ai/platform',
    images: [
      {
        url: '/api/og?title=The+authority+layer+for+LLMs+acting+in+the+world&kicker=The+Platform',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL — the authority layer for LLMs acting in the world',
    description:
      'Permission, audit, control, and provenance for agents acting on a person’s behalf. Apache 2.0 specs; alpha reference engine + SDK; design partners invited.',
    images: ['/api/og?title=The+authority+layer+for+LLMs+acting+in+the+world&kicker=The+Platform'],
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

      <CinematicScrim bleedToCream className="-mx-6 -mt-24 px-6 pt-32 pb-20 md:-mx-12 md:px-12 md:pt-40 md:pb-28">
        <header className="mx-auto max-w-5xl space-y-10">
          <CinematicEyebrow label="The Platform" />
          <CinematicDisplay as="h1" variant="hero">
            COYL is the authority layer for{' '}
            <span className="italic text-orange-300">
              LLMs acting in the world.
            </span>
          </CinematicDisplay>
          <CinematicBody>
            MCP connects agents to tools. A2A lets agents talk to
            agents. COYL is the layer underneath both:{' '}
            <strong className="font-serif font-normal italic text-[#f8f1e4]">
              permission, audit, control, and provenance
            </strong>{' '}
            for an agent acting on a person&rsquo;s behalf. Scoped.
            Revocable. Rate-limited. Auditable. Provenance-signed.
            Kill-switchable. Portable across every model and device.
          </CinematicBody>
          <CinematicBody tone="dim">
            The moment an LLM stops answering questions and starts
            doing things for someone, it needs a contract for{' '}
            <em>what it&rsquo;s allowed to do, who it answers to, and
            how the person takes control back.</em>{' '}
            That contract is the missing layer. COYL is building it as
            open specs (Apache&nbsp;2.0) with a reference engine and a
            typed SDK — both in alpha, both in this repository.
          </CinematicBody>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="mailto:protocol@coyl.ai?subject=Design%20partner%20interest"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Become a design partner &rarr;
            </a>
            <Link
              href="/protocol"
              className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-[#e7dccb] hover:border-orange-300 hover:text-orange-300"
            >
              Read the stack
            </Link>
          </div>
        </header>
      </CinematicScrim>

      <article className="space-y-24 pb-12">

        {/* 01 · THE PROBLEM IN PLAIN ENGLISH */}
        <section className="space-y-8 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            01 &middot; What this is, in plain English
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            An agent that can act needs a contract for{' '}
            <span className="italic text-orange-600">
              how far it can go.
            </span>
          </h2>

          <div className="max-w-2xl space-y-6">
            <p className="text-base leading-[1.7] text-gray-700">
              Connecting a model to tools is the easy part — that&rsquo;s
              what MCP already does. The hard part is everything that has
              to be true before you let that model act on a real
              person&rsquo;s behalf when they aren&rsquo;t watching: a
              grant that says exactly what&rsquo;s permitted, a hard
              expiry, a way to refuse the irreversible, a tamper-evident
              record of what happened, and a single switch that takes all
              of it back in seconds.
            </p>

            <p className="text-base leading-[1.7] text-gray-700">
              COYL is that layer. The person grants bounded authority.
              The agent acts only inside it. Every action is checked
              against scope, rate limits, quiet hours, and a safety
              floor before it fires — and every representation action is
              signed so the recipient can verify who acted and under
              whose authority. One consent surface across every model;
              one kill switch across every device.
            </p>

            <p className="text-base leading-[1.7] text-gray-700">
              It works the same way whether the &ldquo;agent&rdquo; is a
              foundation-model assistant acting overnight or COYL&rsquo;s
              own consumer app at{' '}
              <a
                href="https://coyl.ai"
                className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
              >
                coyl.ai
              </a>{' '}
              nudging someone at the right moment. The authority layer
              doesn&rsquo;t care who&rsquo;s acting. It cares whether the
              person said yes, and whether the action is still inside
              what they said yes to.
            </p>
          </div>
        </section>

        {/* 02 · THE FIVE-LAYER STACK — value first, acronyms second */}
        <section className="space-y-12 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 &middot; The stack — implemented, not aspirational
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Five layers.{' '}
              <span className="italic text-orange-600">
                One safety floor under all of them.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Each layer answers one question, in plain English, and each
              is implemented in this repository today — read, propose,
              act, hold standing authority, and stop. The acronyms are a
              reference detail; the value is the column on the right.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {LAYERS.map((p) => (
              <div
                key={p.acronym}
                className="flex flex-col border-t border-orange-500 pt-6"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {p.question}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {p.plain}
                </h3>
                <p className="mt-4 text-base leading-[1.65] text-gray-700">
                  {p.body}
                </p>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
                  {p.acronym}
                </p>
                <div className="mt-3">
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

        {/* 03 · THE SAFETY FLOOR — the T&S reviewer's first question */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 &middot; The safety floor is live
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The first thing a Trust &amp; Safety reviewer asks.{' '}
              <span className="italic text-orange-600">
                We answer it in code.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Before anyone certifies an AI that acts in a person&rsquo;s
              life, they ask one question:{' '}
              <em>
                when does the AI stop coaching and route the person to a
                human?
              </em>{' '}
              COYL&rsquo;s safety floor is the answer, and it&rsquo;s not
              a promise on a slide — it&rsquo;s a gate that runs first,
              ahead of every other check.
            </p>
          </div>

          <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              One floor, both paths
            </p>
            <p className="mt-4 max-w-3xl font-serif text-2xl font-normal leading-[1.3] text-gray-900 md:text-3xl">
              When risk crosses the floor, the coaching path closes —{' '}
              <span className="italic text-orange-600">
                and nothing fires until a human reopens it.
              </span>
            </p>
            <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700">
              The same closed-path check gates{' '}
              <strong className="font-serif font-normal italic">
                both
              </strong>{' '}
              sides of the system. On the agent side, it&rsquo;s the very
              first gate in the proposal coordinator and in standing-
              authority execution — a crisis-class assessment denies the
              action outright, ahead of scope, rate limits, and quiet
              hours. On the consumer side, the same check runs before any
              interrupt is sent: a person in a closed coaching path is
              never nudged. The classifier, the routing envelopes, and
              the closed-path store are implemented in this repo today.
            </p>
          </div>
        </section>

        {/* 04 · THE PROOF — SDK + DEMO */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              04 &middot; The proof you can run
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              A typed SDK and a runnable demo.{' '}
              <span className="italic text-orange-600">Both alpha. Both real.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The fastest way to evaluate an authority layer is to grant
              authority and try to break it. So we made that the demo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PROOF.map((e) => (
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

          <div className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The authority demo, in five steps
            </p>
            <ul className="mt-6 space-y-3 text-base leading-[1.65] text-gray-700">
              {DEMO_STEPS.map((s) => (
                <li key={s} className="flex gap-3">
                  <span className="font-mono text-xs text-orange-600">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-2xl text-sm leading-[1.6] text-gray-600">
              The denial of the irreversible send is the whole point: a
              standing grant does not let an agent do something it
              can&rsquo;t take back. It fails closed.
            </p>
          </div>
        </section>

        {/* 05 · WHO THIS IS FOR + HONEST STATUS */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              05 &middot; Who this is for, and where it stands
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Built for foundation labs and the teams shipping{' '}
              <span className="italic text-orange-600">agents that act.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              If you own an AI platform, you&rsquo;re going to ship agents
              that act on people&rsquo;s behalf — and you&rsquo;ll need a
              defensible answer for permission, audit, control, and
              provenance. We&rsquo;d rather build that answer with a few
              design partners than hand you a finished black box.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                The buyer
              </p>
              <h3 className="mt-3 font-serif text-xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-2xl">
                Head of AI Platform · CTO · CISO · AI governance.
              </h3>
              <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                The person who has to certify that an agent acting on a
                user&rsquo;s behalf is scoped, audited, and
                kill-switchable — and who would rather adopt a neutral
                layer than reinvent one per product.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                The specs
              </p>
              <h3 className="mt-3 font-serif text-xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-2xl">
                Published. Apache&nbsp;2.0.
              </h3>
              <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                The five specs are open and free to implement. The
                category only exists if the contract is open; we win on
                the engine and the integration depth, not on a closed
                document.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                The engine
              </p>
              <h3 className="mt-3 font-serif text-xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-2xl">
                Reference engine + SDK in alpha.
              </h3>
              <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                The coordinators, the safety floor, the typed{' '}
                <code className="font-mono text-[13px] text-orange-600">
                  @coyl/protocol
                </code>{' '}
                client, and the runnable demo are in this repo. Wire
                shapes can still change before 1.0 — which is exactly why
                we&rsquo;re inviting design partners now.
              </p>
            </div>
          </div>
        </section>

        {/* 06 · DESIGN-PARTNER CTA */}
        <section className="space-y-6 border-t border-orange-500 pt-12">
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-4xl">
            Become a design partner.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            If your team is shipping agents that act on a person&rsquo;s
            behalf, we want to build the authority layer with you. Read
            the stack, run the demo, then start a conversation. One inbox,
            one human on the other end.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:protocol@coyl.ai?subject=Design%20partner%20interest"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Become a design partner &rarr;
            </a>
            <Link
              href="/protocol"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the protocol stack
            </Link>
            <Link
              href="/developers"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Developer console
            </Link>
          </div>
        </section>

        {/* 07 · BRAND ANCHOR */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            07 &middot; The line
          </p>
          <blockquote className="max-w-4xl font-serif text-3xl font-normal italic leading-[1.15] tracking-[-0.02em] text-gray-900 md:text-6xl">
            The authority layer for{' '}
            <span className="not-italic text-orange-600">
              LLMs acting in the world.
            </span>
          </blockquote>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-600">
            Tools without permission is a liability. COYL is the
            permission, audit, control, and provenance an agent needs
            before it acts on someone&rsquo;s behalf.
          </p>
        </section>
      </article>
    </>
  )
}

/**
 * The five layers, value-first. `question` is the plain-English job the
 * layer does; `plain` is the headline; `acronym` is the secondary
 * reference (so a reader grasps the value before meeting the acronym).
 */
const LAYERS: Array<{
  question: string
  plain: string
  body: string
  acronym: string
  href: string
  linkLabel: string
}> = [
  {
    question: 'Read · what loop is the person in?',
    plain: 'Behavioral context.',
    body:
      'A read API that returns the person’s current behavioral state — abstractions only, no raw personal data. Apps emit the signals they already collect; this layer coordinates the meaning so the others have ground truth to act on.',
    acronym: 'BIP — Behavioral Interrupt Protocol',
    href: '/protocol',
    linkLabel: 'Read the spec',
  },
  {
    question: 'Propose · should the AI act right now?',
    plain: 'Proposal coordinator.',
    body:
      'An LLM proposes an action; the coordinator decides FIRE, DEFER, or REJECT against scope, rate limits, dedup, and quiet hours. If two models target the same moment, only one fires. The person is never spammed by every model at once.',
    acronym: 'PAP — Proactive-Action Protocol',
    href: '/pap',
    linkLabel: 'Read the spec',
  },
  {
    question: 'Act · how does the action reach the person?',
    plain: 'Cross-device execution.',
    body:
      'One action at a time across watch, phone, browser, and ambient surfaces, each carrying a reversibility class. Irreversible actions never auto-fire — they route to a per-action confirmation. One consent surface across every device.',
    acronym: 'EAP — Execution-Action Protocol',
    href: '/eap',
    linkLabel: 'Read the spec',
  },
  {
    question: 'Authority · what may it do while you’re away?',
    plain: 'Standing authority.',
    body:
      'A bounded grant for the moments the person is absent — scope-limited, time-limited (hard expiry), rule-governed, audit-signed. The kill switch revokes every grant. Irreversibles always re-confirm, even under a standing grant.',
    acronym: 'UAP — User-Authority Protocol',
    href: '/uap',
    linkLabel: 'Read the spec',
  },
  {
    question: 'Stop · when does it route to a human?',
    plain: 'Safety floor.',
    body:
      'When risk crosses the floor, the coaching path closes and routes to a human — overriding every other layer. This runs first, on both the agent path and the consumer interrupt path. Implemented in this repo today.',
    acronym: 'RAP — Risk Assessment Protocol',
    href: '/rap',
    linkLabel: 'Read the spec',
  },
]

const PROOF: Array<{ kicker: string; title: string; body: string }> = [
  {
    kicker: 'The SDK',
    title: '@coyl/protocol — typed, alpha, zero-dependency.',
    body:
      'A TypeScript SDK with two clients: UAPClient for standing-authority grants (grant / precheck / execute / revoke / audit / kill-switch / verify-provenance) and EAPDeviceClient for the device side (register, poll for approved actions, report outcomes, publish sensor snapshots). Typed against the live route handlers, not the spec prose. Alpha — wire shapes may change before 1.0.',
  },
  {
    kicker: 'The demo',
    title: 'A standing grant you can try to break.',
    body:
      'A runnable script issues a scoped, expiring grant, then walks the full trust contract against a coordinator: a reversible action is allowed and audited, an irreversible send is denied, provenance on an allowed representation action is verified, and the kill switch ends all authority — after which the next action is dead.',
  },
]

const DEMO_STEPS: string[] = [
  'GRANT — issue a scoped, expiring, rule-bounded standing grant.',
  'EXECUTE a reversible action — allowed, and written to the audit log.',
  'EXECUTE an irreversible send — denied; it fails closed and demands per-action confirmation.',
  'PROVENANCE — verify the cryptographic signature on an allowed representation action.',
  'KILL_SWITCH — kill all authority, then prove the next action is denied.',
]
