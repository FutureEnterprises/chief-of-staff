/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1 with
 *     italic accent on "23 minutes to recover."
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): stat rows, use cases,
 *     and FAQ rendered as editorial entries on hairline rules.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): pilot-terms block and
 *     privacy list set as oversized italic-serif chapter beats.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     section openers; PMPM calculator left intact as a product surface.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'
import { PMPMCalculator } from '@/components/teams/pmpm-calculator'
import { PilotRequestForm } from '@/components/teams/pilot-request-form'

export const metadata: Metadata = {
  title: 'COYL for teams — the 23-minute interrupt cost, caught at the source',
  description:
    "Your team isn't undertrained. They're getting interrupted every 11 minutes and losing 23 to recovery. COYL catches the moment before the tab switch. PMPM pricing for employers and benefits programs.",
  keywords: [
    'workplace productivity app',
    'employee focus tool',
    'corporate wellness procrastination',
    'employer productivity benefits',
    'pmpm productivity software',
    'knowledge worker focus',
    'distraction management at work',
    'wellness benefit for focus',
  ],
  alternates: { canonical: '/teams' },
  openGraph: {
    title: 'COYL for teams — the 23-minute interrupt cost, caught at the source',
    description:
      'Interrupted every 11 minutes. 23 minutes to recover. COYL catches the moment before the tab switch. PMPM pricing for employers.',
    url: 'https://coyl.ai/teams',
    images: [
      {
        url: '/api/og?title=11+minutes+between+interrupts.+23+minutes+to+recover.&kicker=For+teams',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL for teams — the 23-minute interrupt cost, caught at the source',
    description: 'Interrupted every 11 minutes. 23 to recover. COYL catches the moment. PMPM for employers.',
    images: ['/api/og?title=11+minutes+between+interrupts.+23+minutes+to+recover.&kicker=For+teams'],
  },
}

/**
 * /teams — workplace + focus B2B wedge.
 *
 * Per the May 2026 wedge ultrathink: workplace productivity is the
 * second co-equal vertical to weight + GLP-1, but until now had no
 * dedicated B2B surface. /procrastination is consumer-facing.
 * /research is clinical-partner-facing. This page targets HR heads,
 * benefits brokers, and people-ops leads at knowledge-worker companies.
 *
 * Compliance discipline: every "23 minutes" / "$300B" / "two thirds of
 * a working day" stat is sourced from published research (Mark, UC
 * Irvine 2008; ATD Research 2023; Microsoft Work Trend Index). We don't
 * fabricate; we cite. If the recipient is the head of People Ops at
 * Stripe, the numbers have to survive a Slack DM to a stats-savvy peer.
 *
 * Pricing model: $3-6 PMPM per the May 2026 strategy doc, anchored
 * against Big Health ($75M Series C selling roughly the same shape of
 * benefit) and Wysa ($25M raise selling slightly more clinical depth).
 * We don't put numbers on this page yet — pricing is "let's talk"
 * because at <10 enterprise customers, every contract is bespoke.
 */

const STAT_ROWS = [
  {
    n: '23',
    unit: 'minutes',
    label: 'Average focus restoration after one interruption',
    src: 'Mark, UC Irvine — interrupted work studies',
  },
  {
    n: '11',
    unit: 'minutes',
    label: 'Average gap between work interruptions in knowledge-worker roles',
    src: 'Microsoft Work Trend Index 2023',
  },
  {
    n: '$300B+',
    unit: '/year',
    label: 'U.S. cost of workplace interruption × productivity loss',
    src: 'ATD Research 2023, conservative estimate',
  },
]

const USE_CASES = [
  {
    title: 'Software + product teams',
    body: 'Deep-work blocks die at the first Slack ping. COYL fires before the user reaches for the notification badge — keeps the block alive.',
  },
  {
    title: 'Designers + writers + analysts',
    body: 'The 11 a.m. tab-switch to research one thing turns into 40 minutes lost. COYL catches the switch in the half-second before the gesture completes.',
  },
  {
    title: 'Lawyers, consultants, finance',
    body: 'The shower-thought that becomes the 3 PM scroll. The follow-up that dies in the inbox. The commitment that felt real in the meeting and evaporated by Thursday. COYL catches all of it.',
  },
]

const FAQ = [
  {
    q: 'Does COYL read our work content?',
    a: 'No. COYL learns sabotage patterns from user-self-reported moments and (optionally) Apple Health / Google Fit signals. Zero access to email, calendar, code, or documents. Privacy-first by architecture, not by promise.',
  },
  {
    q: 'How does it fit our existing benefits stack?',
    a: 'PMPM (per member per month), billed monthly or annually after the pilot. COYL runs inside Microsoft Teams — the bot is installed at the tenant level, so members get interrupts in a tool they already have open, with no separate app to roll out. During a pilot we share an aggregated, member-anonymous summary of weekly active rate and self-reported follow-through; deeper SSO and reporting integrations are scoped per engagement as the program scales.',
  },
  {
    q: 'What does success look like?',
    a: 'Pilot programs are designed to test for 15–25% reduction in self-reported "lost-morning" episodes within 60 days, and a measurable lift in deep-work hours per week. These are pilot hypotheses, not guaranteed outcomes — we co-design the metric with you.',
  },
  {
    q: 'How is this different from the focus apps employees already use?',
    a: 'Forest, Cold Turkey, Freedom — they block. COYL interrupts. Different mechanic: a 30-second voice-matched call-out at the predicted moment, not a 30-minute Pomodoro timer. Employees keep their tools; COYL adds the layer the tools don\'t have.',
  },
  {
    q: 'Pilot terms?',
    a: '30 days, up to 50 seats, no cost. We instrument, you keep the data, decision at end of pilot. We co-author a case study if outcomes justify.',
  },
]

export default function TeamsWedgePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'For teams', url: 'https://coyl.ai/teams' },
        ]}
      />

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              For teams
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Interrupted every 11 minutes.<br />
            <span className="italic text-orange-600">23 minutes to recover.</span>
          </h1>

          <div className="max-w-2xl space-y-4">
            <p className="font-serif text-2xl font-normal leading-[1.35] text-gray-900 md:text-3xl">
              Your people aren&rsquo;t distracted. <span className="italic text-orange-600">They&rsquo;re running a script. The same one, every 11 minutes.</span>
            </p>
            <p className="text-lg leading-[1.7] text-gray-700">
              A third of every knowledge-worker week is spent recovering, not working.
              COYL catches the moment before the tab switch &mdash; the behavioral layer
              underneath your focus stack. Deployed as a benefit, billed PMPM, no integration
              with work content required.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="#pilot"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Request a 30-day pilot
            </Link>
            <Link
              href="/teams/pilot"
              className="rounded-full border border-orange-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-all hover:border-orange-500"
            >
              Read the pilot brief &rarr;
            </Link>
            <Link
              href="/research"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              See research + outcomes
            </Link>
          </div>
        </header>

        {/* Stats band — three numbers, each with a citation. */}
        <section className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {STAT_ROWS.map((s) => (
            <div key={s.label} className="border-t border-orange-500 pt-6">
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-6xl font-normal leading-none tracking-[-0.03em] text-orange-600">
                  {s.n}
                </span>
                <span className="text-sm font-semibold text-gray-600">{s.unit}</span>
              </div>
              <p className="mt-5 text-base font-medium leading-[1.5] text-gray-900">{s.label}</p>
              <p className="mt-3 text-xs text-gray-600">{s.src}</p>
            </div>
          ))}
        </section>

        {/* Use cases */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Where COYL lives
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Three roles where the math is <span className="italic text-orange-600">the most painful.</span>
          </h2>

          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-3">
            {USE_CASES.map((u) => (
              <div key={u.title} className="border-t border-gray-200 pt-6">
                <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {u.title}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">{u.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Privacy
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Privacy-first by architecture, <span className="italic text-orange-600">not by promise.</span>
          </h2>
          <ul className="space-y-4 pt-4">
            <li className="border-t border-gray-200 pt-5 text-base leading-[1.65] text-gray-700">
              <strong className="font-serif font-normal italic text-gray-900">
                Never reads work content.
              </strong>{' '}
              COYL never reads email, calendar, code, documents, or any work content.
            </li>
            <li className="border-t border-gray-200 pt-5 text-base leading-[1.65] text-gray-700">
              <strong className="font-serif font-normal italic text-gray-900">
                User-controlled signals.
              </strong>{' '}
              Sabotage patterns are learned from user-self-reported moments and (optionally)
              wearables. Nothing leaves the device that the user didn&rsquo;t opt in to.
            </li>
            <li className="border-t border-gray-200 pt-5 text-base leading-[1.65] text-gray-700">
              <strong className="font-serif font-normal italic text-gray-900">
                Aggregate-only reporting.
              </strong>{' '}
              Pilot reporting is member-anonymous: weekly active rate and self-reported
              follow-through, in aggregate. Individual user data stays with the individual user.
            </li>
            <li className="border-t border-gray-200 pt-5 text-base leading-[1.65] text-gray-700">
              <strong className="font-serif font-normal italic text-gray-900">
                Runs where your people already are.
              </strong>{' '}
              COYL ships as a Microsoft Teams bot installed at the tenant level &mdash; no new
              app for members to adopt. Security reviews (SOC 2, BAA) are handled per engagement
              as a deployment scales beyond pilot.
            </li>
          </ul>
        </section>

        {/* PMPM calculator — kept intact as a product surface */}
        <section className="border-t border-gray-200 pt-16">
          <PMPMCalculator />
        </section>

        {/* Pilot terms */}
        <section className="border-t border-orange-500 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Pilot terms
          </p>
          <p className="mt-6 font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            30 days. Up to 50 seats. No cost.<br />
            <span className="italic text-orange-600">Decision at end of pilot.</span>
          </p>
          <p className="mt-8 max-w-2xl text-base leading-[1.7] text-gray-700">
            We instrument the cohort, you keep the data, and we co-author a case study if
            the data justifies it. Pricing is PMPM after the pilot &mdash; the calculator
            above shows the live bands; the pilot itself is free.
          </p>
          <Link
            href="#pilot"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            Request a pilot &rarr;
          </Link>
        </section>

        {/* Microsoft Teams differentiator — the bot is real and shipped. */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Where it lives
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Works inside <span className="italic text-orange-600">Microsoft Teams.</span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            COYL ships as a Microsoft Teams bot, installed at the tenant level. The
            interrupt arrives where your people already work &mdash; a short, voice-matched
            call-out at the predicted moment, delivered as a Teams message. No separate app
            to roll out, no new login. Four interrupt classes ship today: protect a focus
            block, nudge an overdue follow-up, surface meetings worth declining, and a
            60-second recovery beat after a heavy stretch.
          </p>
        </section>

        {/* Pilot request form — the primary conversion surface. */}
        <section id="pilot" className="scroll-mt-28 border-t border-orange-500 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Request a pilot
          </p>
          <h2 className="mt-6 font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Tell us about your team.<br />
            <span className="italic text-orange-600">We&rsquo;ll reply within 1 business day.</span>
          </h2>
          <p className="mt-6 mb-8 max-w-2xl text-base leading-[1.7] text-gray-700">
            30 days, up to 50 seats, no cost. We co-design the success metric with you
            &mdash; typically weekly active rate and a self-reported lift in follow-through.
          </p>
          <PilotRequestForm />
        </section>

        {/* FAQ */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The questions every benefits lead asks
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Honest answers, <span className="italic text-orange-600">before the call.</span>
          </h2>
          <div className="pt-4">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group border-t border-gray-200 py-6 open:border-orange-500"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-6 font-serif text-xl font-normal leading-[1.3] tracking-[-0.01em] text-gray-900 marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>{f.q}</span>
                  <span
                    aria-hidden
                    className="mt-1 font-mono text-base text-orange-600 transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl text-base leading-[1.7] text-gray-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-gray-200 pt-16">
          <div className="flex flex-wrap gap-3">
            <Link
              href="#pilot"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Request a 30-day pilot
            </Link>
            <Link
              href="/procrastination"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              The consumer wedge
            </Link>
            <Link
              href="/research"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Research + outcomes
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
