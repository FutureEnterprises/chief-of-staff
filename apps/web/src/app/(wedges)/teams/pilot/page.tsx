import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'

/**
 * /teams/pilot — the one-page pilot brief.
 *
 * A single, printable page a champion (the HR / benefits / people-ops
 * lead who likes COYL) forwards internally to the people who say yes:
 * their manager, their security reviewer, finance. It has to survive
 * being read cold, on paper, with no salesperson in the room.
 *
 * Structure: what COYL does for teams → how a pilot runs → success
 * metrics → pricing frame → the Microsoft Teams differentiator → a
 * single "request a pilot" link back to /teams#pilot.
 *
 * NEDA-safe: this is the employer surface. It leads with and stays on
 * procrastination / focus / follow-through. ZERO weight, eating, GLP-1,
 * or body language anywhere on this page.
 *
 * Pricing: matches the live PMPMCalculator on /teams ($4–7 PMPM by
 * volume) and the published $5–15 PMPM band (docs/pitch, Microsoft Viva
 * spec). The pilot itself is free. We do NOT invent a flat per-seat
 * number that contradicts the on-site calculator.
 *
 * Print-friendly: uses Tailwind `print:` utilities to drop the screen
 * chrome (CTA buttons, dark accents) and tighten margins so a browser
 * "Print → Save as PDF" produces a clean leave-behind.
 */

export const metadata: Metadata = {
  title: 'COYL for Teams — pilot brief',
  description:
    'A one-page brief for running a 30-day COYL pilot: what it does for focus and follow-through, how the pilot runs, success metrics, pricing, and the Microsoft Teams integration.',
  alternates: { canonical: '/teams/pilot' },
  robots: { index: true, follow: true },
}

const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Install in Microsoft Teams',
    body: 'COYL ships as a Microsoft Teams bot, installed once at the tenant level. No new app for members to download, no separate login.',
  },
  {
    n: '02',
    title: 'It learns the pattern',
    body: 'Members flag the moments they lose — the tab-switch, the follow-up that dies in the inbox, the focus block that collapses at the first ping. COYL never reads work content.',
  },
  {
    n: '03',
    title: 'It interrupts at the moment',
    body: 'A short, voice-matched call-out arrives in Teams at the predicted moment: protect a focus block, send the overdue reply while it’s small, take 60 seconds before the next thing.',
  },
]

const SUCCESS_METRICS = [
  {
    metric: 'Weekly active rate',
    detail: 'What share of the cohort engages with at least one interrupt per week. The honest adoption signal — a benefit nobody opens is a benefit nobody benefits from.',
  },
  {
    metric: 'Self-reported follow-through lift',
    detail: 'Members rate, week over week, how often they did the thing they meant to. We co-design the exact question with you before the pilot starts.',
  },
]

export default async function TeamsPilotPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-teams-pilot')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'For teams', url: 'https://coyl.ai/teams' },
          { name: 'Pilot brief', url: 'https://coyl.ai/teams/pilot' },
        ]}
      />

      <article className="space-y-16 pb-12 print:space-y-8">
        {/* Masthead */}
        <header className="space-y-6 border-b border-gray-200 pb-10 print:pb-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500 print:bg-gray-400" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600 print:text-gray-600">
              COYL for Teams · Pilot brief
            </span>
          </div>
          <h1 className="font-serif text-4xl font-normal leading-[1.0] tracking-[-0.02em] text-gray-900 md:text-6xl">
            A 30-day pilot for focus and{' '}
            <span className="italic text-orange-600 print:text-gray-900">follow-through.</span>
          </h1>
          <p className="max-w-2xl text-lg leading-[1.65] text-gray-700">
            COYL is a behavioral layer for knowledge-worker teams. It catches the
            moment your people lose — the procrastination spiral, the broken focus
            block, the follow-up that never gets sent — and interrupts it, right
            inside Microsoft Teams. This page is the brief: what it does, how a
            pilot runs, what success looks like, and what it costs. Built to forward.
          </p>
        </header>

        {/* What COYL does */}
        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-normal tracking-[-0.01em] text-gray-900 md:text-3xl">
            What it does for a team
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Focus apps block; COYL interrupts. The difference is the mechanic: a
            short, well-timed call-out at the predicted moment of slippage, not a
            30-minute timer. Three patterns it catches most:
          </p>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <li className="border-t border-gray-200 pt-4">
              <p className="font-serif text-lg text-gray-900">Procrastination</p>
              <p className="mt-2 text-sm leading-[1.6] text-gray-700">
                The 11 a.m. tab-switch that turns into 40 minutes lost. Caught in the
                half-second before the gesture completes.
              </p>
            </li>
            <li className="border-t border-gray-200 pt-4">
              <p className="font-serif text-lg text-gray-900">Broken focus</p>
              <p className="mt-2 text-sm leading-[1.6] text-gray-700">
                Deep-work blocks that die at the first ping. COYL fires before the
                reach for the notification badge — and keeps the block alive.
              </p>
            </li>
            <li className="border-t border-gray-200 pt-4">
              <p className="font-serif text-lg text-gray-900">Follow-through</p>
              <p className="mt-2 text-sm leading-[1.6] text-gray-700">
                The reply that dies in the inbox, the commitment that felt real in the
                meeting and evaporated by Thursday. Surfaced while it’s still small.
              </p>
            </li>
          </ul>
        </section>

        {/* How a pilot runs */}
        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-normal tracking-[-0.01em] text-gray-900 md:text-3xl">
            How the pilot runs
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            <strong className="font-semibold text-gray-900">30 days. Up to 50 seats. No cost.</strong>{' '}
            You pick a willing cohort, we install the Teams bot, and the decision sits
            with you at the end.
          </p>
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((s) => (
              <li key={s.n} className="border-t border-orange-500 pt-4 print:border-gray-400">
                <p className="font-mono text-xs text-orange-600 print:text-gray-600">{s.n}</p>
                <p className="mt-2 font-serif text-lg text-gray-900">{s.title}</p>
                <p className="mt-2 text-sm leading-[1.6] text-gray-700">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Success metrics */}
        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-normal tracking-[-0.01em] text-gray-900 md:text-3xl">
            What success looks like
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Two metrics, co-designed with you before kickoff. These are pilot
            hypotheses, not guaranteed outcomes — the point of the pilot is to
            measure them honestly.
          </p>
          <dl className="space-y-4">
            {SUCCESS_METRICS.map((m) => (
              <div key={m.metric} className="border-t border-gray-200 pt-4">
                <dt className="font-serif text-lg italic text-gray-900">{m.metric}</dt>
                <dd className="mt-2 max-w-2xl text-sm leading-[1.6] text-gray-700">{m.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Pricing frame */}
        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-normal tracking-[-0.01em] text-gray-900 md:text-3xl">
            What it costs
          </h2>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 print:border-gray-300 print:bg-white">
            <p className="text-base leading-[1.7] text-gray-800">
              <strong className="font-semibold text-gray-900">The pilot is free.</strong>{' '}
              At rollout, COYL is priced PMPM (per member, per month) — published bands
              from <strong className="font-semibold text-gray-900">$7 PMPM</strong> at
              small headcounts down to <strong className="font-semibold text-gray-900">$4 PMPM</strong>{' '}
              at 1,000+ seats, with a 15% annual-prepay discount. The live calculator on
              the team page shows the exact band for your headcount — no &ldquo;contact
              us&rdquo; gate.
            </p>
          </div>
        </section>

        {/* Microsoft Teams differentiator */}
        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-normal tracking-[-0.01em] text-gray-900 md:text-3xl">
            Works inside Microsoft Teams
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            COYL is delivered as a Microsoft Teams bot, installed at the tenant level.
            Members get interrupts in a tool they already have open — no separate app to
            adopt, no new login. And by design, COYL never reads email, calendar, code,
            or documents: it learns from member-flagged moments, not work content.
          </p>
        </section>

        {/* Single CTA back to the form */}
        <section className="border-t border-orange-500 pt-10 print:border-gray-400">
          <p className="font-serif text-2xl font-normal leading-[1.2] text-gray-900 md:text-3xl">
            Ready to run one?
          </p>
          <p className="mt-3 max-w-xl text-base leading-[1.65] text-gray-700">
            Request a pilot and we’ll reply within 1 business day with terms and next steps.
          </p>
          <div className="mt-6 print:hidden">
            <Link
              href="/teams#pilot"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Request a pilot &rarr;
            </Link>
          </div>
          {/* Print fallback — the URL, since buttons don't print. */}
          <p className="mt-6 hidden text-sm text-gray-700 print:block">
            Request a pilot: coyl.ai/teams#pilot
          </p>
        </section>
      </article>
    </>
  )
}
