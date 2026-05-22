/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1 with
 *     italic accent on "Follow-through is."
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): "you said / what really happened"
 *     pairs as gallery columns, not card boxes.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): the meeting → closure stages
 *     reframed as hairline-ruled chapter entries.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     section openers, hairline rules, no card chrome.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: "COYL for work — productivity isn't the problem. Follow-through is.",
  description:
    "The email you said you'd send. The meeting you didn't close out. The follow-up you let slip. COYL catches the moment the commitment drops, not after the deal is gone.",
  keywords: [
    'sales follow up tool',
    'follow through at work',
    'meeting action items',
    'sales commitment tracker',
    'stop dropping follow-ups',
    'accountability for sales',
    'work follow-through app',
  ],
  alternates: { canonical: '/work' },
  openGraph: {
    title: "Productivity isn't the problem. Follow-through is.",
    description:
      "COYL catches the moment the commitment drops, not after the deal is gone.",
    url: 'https://coyl.ai/work',
    images: [
      {
        url: '/api/og?title=Productivity+isn%27t+the+problem.+Follow-through+is.&kicker=Work',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Productivity isn't the problem. Follow-through is.",
    description: "COYL catches the moment the commitment drops, not after the deal is gone.",
    images: ['/api/og?title=Productivity+isn%27t+the+problem.+Follow-through+is.&kicker=Work'],
  },
}

/**
 * /work — the employee / work-follow-through wedge page.
 *
 * Positioning (per GODFILE §12): COYL makes sure you follow through at
 * work. Not a productivity app. Not a task manager. A commitment engine
 * that catches the broken promises — the email you didn’t send, the
 * meeting you didn’t close, the follow-up that dropped — before they
 * compound into missed deals or dropped balls.
 *
 * Same engine as the weight-loss wedge; different language and examples.
 */

const WORK_MOMENTS = [
  {
    you: '"I’ll follow up."',
    real: 'You never did. The thread went cold. The deal moved on.',
  },
  {
    you: '"I’ll respond tomorrow."',
    real: '14 days later it’s buried under 200 emails you also haven’t answered.',
  },
  {
    you: '"No reply means stop."',
    real: 'No reply means follow up again. Waiting is not action.',
  },
  {
    you: '"I’ll get to it after lunch."',
    real: 'After lunch is after standup is after the 3 PM slump is tomorrow.',
  },
]

const CAPABILITIES = [
  {
    title: 'Meeting → commitment',
    body: 'Every meeting you log generates the list of things you said you’d do. No lost action items.',
  },
  {
    title: 'Commitment → follow-up',
    body: 'Each follow-up is tracked. Deadline, channel, owner. COYL pings before it slips.',
  },
  {
    title: 'Follow-up → closure',
    body: 'Either you closed it or you didn’t. No middle ground. The loop either reports kept or broken.',
  },
]

export default function WorkWedgePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Work', url: 'https://coyl.ai/work' },
        ]}
      />

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Work
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Productivity isn&apos;t the problem.<br />
            <span className="italic text-orange-600">Follow-through is.</span>
          </h1>

          <div className="max-w-2xl space-y-4 font-serif text-2xl font-normal leading-[1.35] text-gray-900 md:text-3xl">
            <p>The follow-up didn&rsquo;t die in your inbox.</p>
            <p>It died at 3 PM with the thought: <span className="italic text-orange-600">&ldquo;They probably moved on anyway.&rdquo;</span></p>
            <p>That thought is a script. COYL catches it before the thread goes cold.</p>
          </div>
        </header>

        {/* ENTERPRISE B2B BAND — per the $6B strategy memo Fix 02:
            /work is the Salesforce / Microsoft Viva / Agentforce thesis
            in plain sight. It was previously a buried wedge; the memo's
            audit said it needs an enterprise-grade CTA as prominent as
            the consumer one. This top band reframes the page so an HR
            director, RevOps lead, or M&A team reading the URL sees the
            commercial pitch above the fold. */}
        <section className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Enterprise · For teams + sales orgs
            </span>
          </div>
          <h2 className="mt-6 font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            The behavioral interrupt layer{' '}
            <span className="italic text-orange-600">your stack is missing.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-[1.7] text-gray-700">
            Viva, Copilot, Agentforce, and every productivity tool you
            own can analyze what already happened. COYL fires at the
            three-second window before the follow-up gets dropped, the
            doc gets closed, the email gets ghosted. We ship as a Slack
            + Teams + Edge extension, or as an embeddable API for your
            existing platform. PMPM pricing, SSO via Okta / Azure AD /
            Google Workspace, SOC 2 in progress.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="mailto:enterprise@coyl.ai?subject=Pilot%20%E2%80%94%20%5Bcompany%5D&body=Hi%20COYL%20team%2C%0A%0AWe%E2%80%99re%20interested%20in%20a%2030-day%20pilot.%0A%0ACompany%3A%20%0AHeadcount%3A%20%0AExisting%20stack%3A%20%0APreferred%20kickoff%3A%20%0A%0AThanks%2C"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Start a 30-day pilot →
            </a>
            <Link
              href="/teams"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              PMPM pricing + proposal pack
            </Link>
            <span className="text-xs uppercase tracking-widest text-gray-500">
              Microsoft Viva partner application in flight
            </span>
          </div>
        </section>

        {/* Excuses gallery — "you said / what really happened" pairs as editorial columns */}
        <section className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {WORK_MOMENTS.map((m, i) => (
            <div key={i} className="border-t border-gray-200 pt-6">
              <p className="font-serif text-2xl font-normal italic leading-[1.2] text-orange-600">
                {m.you}
              </p>
              <p className="mt-4 text-base leading-[1.65] text-gray-700">{m.real}</p>
            </div>
          ))}
        </section>

        {/* Stages — chapter-style hairline entries */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The arc of every commitment
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Meeting. Commitment. Follow-up. <span className="italic text-orange-600">Closure.</span>
          </h2>

          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="border-t border-orange-500 pt-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  Stage
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {c.title}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quotable scripts */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The four sentences that kill deals
            </span>
          </div>
          <h3 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            COYL catches them <span className="italic text-orange-600">in your head.</span>
          </h3>
          <ul className="space-y-6 pt-4">
            {[
              'You said you’d follow up. Did you?',
              'Waiting is not action.',
              'No reply doesn’t mean stop.',
              'Send the email.',
            ].map((line) => (
              <li
                key={line}
                className="border-t border-gray-200 pt-5 font-serif text-2xl font-normal italic leading-[1.2] text-gray-900"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>

        {/* Same engine */}
        <section className="border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            Same engine
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-[1.7] text-gray-700">
            COYL for weight loss catches the 9 PM kitchen. COYL for work catches the email
            you never sent.{' '}
            <strong className="font-serif font-normal italic text-gray-900">
              Different problem, same loop.
            </strong>{' '}
            A commitment is broken before you realize it. COYL interrupts.
          </p>
        </section>

        <section className="border-t border-gray-200 pt-16">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-up?ref=work"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Catch the next dropped follow-up &rarr;
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              How it works
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
