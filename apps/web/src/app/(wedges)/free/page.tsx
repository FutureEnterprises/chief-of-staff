/**
 * /free — the public commitment.
 *
 * The free consumer tier is a brand-foundational decision. This page
 * is where we say so out loud, in writing, so that when the inevitable
 * pressure comes to charge for the floor of the product — and it
 * always comes — the answer is already in print.
 *
 * Linked from:
 *   - the founder essay ("behavioral-support-did-not-slow-glp1-regain")
 *   - the v3 seed deck (slide 4: "what we're building")
 *   - the /rebound + /weight-loss + /work + /procrastination wedge pages
 *
 * Source of truth: docs/strategy/free-consumer-tier.md. Copy on this
 * page paraphrases the strategy doc for a consumer audience; the
 * strategy doc is the canonical version for investors + board.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'
import { Capsule } from '@/components/brand/capsule'

export const metadata: Metadata = {
  title: 'Free for everyone on a GLP-1 — and staying that way · COYL',
  description:
    "The behavioral interrupt that catches the 9 PM negotiation is free. Forever. For every patient on a GLP-1 — including the uninsured, the cost-discontinuers, and the cash-pay patients whose employer didn't pick the right benefits vendor.",
  keywords: [
    'coyl free',
    'rebound free',
    'glp-1 behavioral support free',
    'free behavioral interrupt',
    'free for everyone on a glp-1',
    'rebound consumer free tier',
  ],
  alternates: { canonical: '/free' },
  openGraph: {
    title: 'Free for everyone on a GLP-1 · COYL',
    description:
      "The behavioral interrupt that catches the 9 PM negotiation is free. Forever. The floor of the product never gets a paywall.",
    url: 'https://coyl.ai/free',
    images: [
      {
        url: '/api/og?title=Free+for+everyone+on+a+GLP-1.&kicker=The+commitment',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free for everyone on a GLP-1 · COYL',
    description:
      "The behavioral interrupt is free. Forever. The floor of the product never gets a paywall.",
    images: ['/api/og?title=Free+for+everyone+on+a+GLP-1.&kicker=The+commitment'],
  },
}

const FLOOR_FEATURES = [
  {
    title: 'The archetype quiz',
    body: 'Ninety seconds. Three questions. The family of autopilot you keep running, named — so you can see the shape of it instead of just living inside it.',
    cta: { label: 'Take the audit', href: '/audit' },
  },
  {
    title: 'The 9 PM catch',
    body: 'A precise interrupt at the moment the script is about to run. Before the hand moves. Specific to your archetype, your window, your script — not a generic notification.',
    cta: { label: 'How it works', href: '/how-it-works' },
  },
  {
    title: 'The kill switch',
    body: "If COYL ever doesn't feel right — one tap, everything stops. Your audit log is yours. You can read it. You can export it. You can delete it. We don't.",
    cta: { label: 'The protocol', href: '/uap' },
  },
  {
    title: 'Same-night recovery',
    body: 'You slipped. The script "I already messed up" is the real machinery — it turns one slip into the night, the week. We catch that one too. No Monday reset.',
    cta: { label: 'Recovery engine', href: '/recovery' },
  },
] as const

const NOT_FOR_SALE = [
  {
    title: 'The archetype quiz',
    text: 'Never gets a paywall. The free quiz is the front door for every patient on a GLP-1, considering one, or coming off one. Forever.',
  },
  {
    title: 'The basic danger-window interrupts',
    text: 'The 9 PM catch, the tab-switch catch, the post-slip catch — never paywalled, even when more sophisticated tools (cohort analytics, clinician dashboards) become paid.',
  },
  {
    title: 'The kill switch and audit log',
    text: "The user's right to stop the system and read the trail is never paywalled. That's the trust contract, and the trust contract is the product.",
  },
  {
    title: 'The science behind the catch',
    text: 'Our protocols (BIP, PAP, EAP, UAP) are published, open, and free for any developer or clinician to build on. The behavior change layer for agentic AI is a public good.',
  },
] as const

export default function FreePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Free', url: 'https://coyl.ai/free' },
        ]}
      />

      <article className="space-y-32 pb-12">
        {/* OPENING */}
        <header className="space-y-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The commitment
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Free for everyone on a GLP-1.
            <br />
            <span className="italic text-orange-600">And staying that way.</span>
          </h1>

          <p className="max-w-3xl font-serif text-2xl font-normal italic leading-[1.35] text-gray-700 md:text-3xl">
            The behavioral interrupt that catches the 9 PM negotiation is
            free. Forever. For every patient on a GLP-1 — including the
            uninsured, the cost-discontinuers, and the cash-pay patients
            whose employer didn&rsquo;t pick the right benefits vendor.
          </p>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            This page is the public version of a brand-foundational
            decision. We&rsquo;re saying it on the record, in writing, so
            that when the inevitable pressure comes to charge for the
            floor — and it always comes — the answer is already in print.
          </p>
        </header>

        {/* THE PROMISE */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              What free means
            </span>
          </div>

          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            The mechanism that catches the moment works{' '}
            <span className="italic text-orange-600">
              whether or not your employer pays for it.
            </span>
          </h2>

          <p className="max-w-3xl text-lg leading-[1.7] text-gray-700">
            Gating the catch behind a paywall would be incompatible with
            why we built this. The 9 PM script doesn&rsquo;t care what
            insurance plan you&rsquo;re on. The catch shouldn&rsquo;t
            either.
          </p>

          <div className="grid grid-cols-1 gap-10 pt-6 md:grid-cols-2">
            {FLOOR_FEATURES.map((f) => (
              <div key={f.title} className="border-t border-orange-500 pt-5">
                <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">
                  {f.body}
                </p>
                <Link
                  href={f.cta.href}
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-orange-600 hover:text-orange-700"
                >
                  {f.cta.label} <span aria-hidden>&rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* THE RULES */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The rules we keep
            </span>
          </div>

          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            What never goes{' '}
            <span className="italic text-orange-600">behind a paywall.</span>
          </h2>

          <p className="max-w-3xl text-base leading-[1.7] text-gray-700">
            Some products evolve toward paywalls because the founders
            forgot what they promised in year one. We&rsquo;re writing
            the rules down now so we don&rsquo;t have that excuse.
          </p>

          <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
            {NOT_FOR_SALE.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-orange-200 bg-orange-50/40 p-6"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-orange-700">
                  Never paywalled
                </p>
                <p className="mt-3 font-serif text-xl font-semibold leading-[1.25] text-gray-900">
                  {r.title}
                </p>
                <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                  {r.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS ECONOMICALLY */}
        <section className="space-y-10 border-t border-orange-500 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              How it stays free
            </span>
          </div>

          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Telehealth prescribers and employer plans{' '}
            <span className="italic text-orange-600">pay for the operation.</span>
          </h2>

          <div className="max-w-3xl space-y-5 text-base leading-[1.7] text-gray-700">
            <p>
              When you&rsquo;re a patient at a clinic or on a benefits plan
              that pays COYL, the clinic sees richer tools — cohort
              analytics, clinician dashboards, PHI-compliant audit. You
              don&rsquo;t see a different interrupt. Same catch. Same
              moment. Same script.
            </p>
            <p>
              When you&rsquo;re not — when your clinic doesn&rsquo;t pay
              COYL, when your employer doesn&rsquo;t cover behavioral
              health, when you&rsquo;re cash-pay or uninsured or in a
              maintenance window after losing access to the drug — the
              catch is still there. Same fire. The clinician dashboards
              just aren&rsquo;t.
            </p>
            <p>
              The patients aren&rsquo;t the customer. The patients are
              the people we work for. The customer is the buyer with
              budget — the prescriber, the employer, eventually the PBM.
              That structure is what lets the floor stay free.
            </p>
          </div>
        </section>

        {/* THE PUBLIC RECORD */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              On the record
            </span>
          </div>

          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            If a future board member asks us to{' '}
            <span className="italic text-orange-600">charge for the catch.</span>
          </h2>

          <div className="max-w-3xl space-y-5 text-base leading-[1.7] text-gray-700">
            <p>
              The answer is no. They&rsquo;ve read this page. They knew it
              before they took the round. The free tier is pinned as an
              exhibit to the seed investor side letter.
            </p>
            <p>
              An investor who finds this incompatible with their model is
              the wrong investor for COYL. The next one will think it&rsquo;s
              the most defensible thing in the deck.
            </p>
            <p className="font-serif italic text-gray-700">
              &mdash; Iman Schrock, founder
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Start
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-5xl">
            Take the <Capsule>90-second audit</Capsule>. Name your pattern.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Three questions. No signup. Your autopilot family on the other
            side — and the catch is yours from there. Free, like every
            other piece of the floor.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/audit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Start the audit &rarr;
            </Link>
            <Link
              href="/protocol"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              See the protocols
            </Link>
          </div>
        </section>
      </article>
    </>
  )
}
