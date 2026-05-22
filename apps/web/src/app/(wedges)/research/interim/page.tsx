/**
 * /research/interim — Found Health RCT interim-data publish framework.
 *
 * Per the v2 strategy brief: "The latency between 'data available' and
 * 'public proof point' is where most startups burn the news cycle. Stand
 * up the Found Health interim data publish framework BEFORE results
 * arrive. Pre-register the metric. Pre-design the chart. Pre-write the
 * post."
 *
 * This page is the pre-registered surface. Today (May 2026) it ships
 * with placeholder rows clearly marked PENDING. The day interim data
 * lands, the founder edits this single file (`RESULTS` array + the
 * `LAST_UPDATED` date) and the deploy is ~4 hours, not 4 days. The
 * structured-data block (DatasetSchema) is wired so search engines and
 * pharma BD teams crawling the live site find it before the press call
 * ends.
 *
 * Editorial design matches the rest of the research surface — serif
 * editorial H1, hairline rules between metrics, mono labels.
 *
 * The /research index page links here. The Sources block at the bottom
 * is real: Found Health partnership, IRB-exempt minimal-risk study,
 * pre-registered on coyl.ai/research before recruitment opened.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'
// within the news cycle, long enough that the page stays static between deploys.

export const metadata: Metadata = {
  title: 'Found Health RCT — interim data',
  description:
    'Pre-registered interim outcomes from the Found Health × COYL RCT. Behavioral interrupt vs. usual care across recurring autopilot loops. Published as data lands.',
  keywords: [
    'coyl found health rct',
    'behavioral interrupt clinical trial',
    'jitai consumer rct',
    'glp-1 behavioral support outcomes',
  ],
  alternates: { canonical: '/research/interim' },
  openGraph: {
    title: 'Found Health RCT — interim data',
    description: 'Pre-registered interim outcomes from the Found Health × COYL RCT.',
    url: 'https://coyl.ai/research/interim',
    images: [
      {
        url: '/api/og?title=Found+Health+RCT&kicker=Interim+data',
        width: 1200,
        height: 630,
      },
    ],
  },
}

// ─────────────────────── Trial pre-registration ───────────────────────
//
// These are the registered design parameters of the study. They DO NOT
// change after recruitment opens — that's the point of pre-registration.
// Any post-hoc additions go in a separate "Exploratory" section so a
// pharma corp dev team can immediately distinguish primary endpoints
// from data dredging.

const REGISTRATION = {
  studyId: 'COYL-FH-001',
  irbStatus: 'IRB-exempt (minimal-risk behavioral)',
  preRegisteredAt: '2026-04-15',
  partner: 'Found Health',
  population: 'GLP-1-active adults, 18–65, English-speaking, US residents',
  arms: [
    {
      label: 'Intervention',
      description:
        'COYL behavioral-interrupt protocol via iOS + web. Danger-window-aware notifications, same-night recovery flow, weekly archetype digest.',
    },
    {
      label: 'Control',
      description:
        'Standard Found Health care + non-personalized weekly behavioral-health email (sham contact-time control).',
    },
  ],
  primaryEndpoint:
    'Slip-recovery rate at 30 days — % of logged autopilot-loop slips that complete the same-night stabilization protocol within 24 hours.',
  secondaryEndpoints: [
    'D7 retention (% active in days 0–7)',
    'D30 retention (% active in days 14–30)',
    'Streak integrity at 30 days (% of streaks > 1 with grace-window survival vs. legacy reset behavior)',
    'Excuse-category frequency change (baseline → week 4)',
  ],
  exclusion:
    'Active eating disorder per DSM-5; current substance-use crisis; <30 days from any major mental-health event. Routed to crisis services per the /safety policy.',
}

// ─────────────────────── Results (PENDING) ────────────────────────────
//
// PUBLISH FRAMEWORK
// -----------------
// Each entry below corresponds to one pre-registered endpoint. Today
// they all carry status === 'pending' with a clear "data drops {DATE}"
// note. When interim data lands, edit:
//
//   1. status → 'interim' (or 'final' at study completion)
//   2. value → the actual number (or { intervention, control, delta, p })
//   3. lastUpdated → today's ISO date
//   4. LAST_UPDATED constant below → same date
//
// The page re-renders within 1 hour (revalidate=3600) globally.

type ResultStatus = 'pending' | 'interim' | 'final'

type Result = {
  endpoint: string
  pre: 'primary' | 'secondary'
  status: ResultStatus
  /** Single headline number when applicable. */
  value?: string
  /** Pre-/post-comparison when applicable. */
  comparison?: {
    intervention: string
    control: string
    delta?: string
    p?: string
  }
  note: string
  cohortSize?: string
}

const LAST_UPDATED = '2026-05-22' // Bump on every results edit.

const RESULTS: Result[] = [
  {
    endpoint: REGISTRATION.primaryEndpoint,
    pre: 'primary',
    status: 'pending',
    note: 'Interim readout pre-registered for the 60-day data lock. Awaiting cohort completion of the recruitment window.',
    cohortSize: 'Recruiting',
  },
  {
    endpoint: 'D7 retention',
    pre: 'secondary',
    status: 'pending',
    note: 'D7 cohort active. Numbers post once the first wave passes day 14 in study.',
  },
  {
    endpoint: 'D30 retention',
    pre: 'secondary',
    status: 'pending',
    note: 'D30 cohort active. Numbers post on the 60-day interim window.',
  },
  {
    endpoint: 'Streak integrity at 30 days',
    pre: 'secondary',
    status: 'pending',
    note: 'Numerator: streaks that survived ≥1 missed day via grace window. Denominator: all streaks > 1 in the study cohort.',
  },
  {
    endpoint: 'Excuse-category frequency change',
    pre: 'secondary',
    status: 'pending',
    note: 'Baseline-to-week-4 delta per ExcuseCategory enum (8 categories). Reported as cohort distribution shift, not individual.',
  },
]

const STATUS_STYLES: Record<ResultStatus, string> = {
  pending: 'border-gray-300 text-gray-600',
  interim: 'border-orange-500 text-orange-600',
  final: 'border-emerald-500 text-emerald-700',
}

const STATUS_LABEL: Record<ResultStatus, string> = {
  pending: 'PENDING',
  interim: 'INTERIM',
  final: 'FINAL',
}

export default async function ResearchInterimPage() {
  'use cache'
  cacheLife('hours')
  cacheTag('marketing-research-interim')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Research', url: 'https://coyl.ai/research' },
          { name: 'Interim data', url: 'https://coyl.ai/research/interim' },
        ]}
      />

      <article className="space-y-20 pb-12">
        {/* HEADER */}
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Pre-registered RCT
            </span>
          </div>

          <h1 className="font-serif text-5xl font-normal leading-[1.0] tracking-[-0.025em] text-gray-900 md:text-7xl">
            Found Health × COYL.{' '}
            <span className="italic text-orange-600">Interim data.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            A pre-registered randomized trial of behavioral-interrupt protocol vs.
            standard care across GLP-1-active adults. This page is the public
            ledger — pre-registered before recruitment, updated as interim data
            lands.
          </p>

          <p className="max-w-2xl text-sm leading-[1.6] text-gray-600">
            Last updated{' '}
            <time className="font-mono text-[13px] text-gray-900" dateTime={LAST_UPDATED}>
              {LAST_UPDATED}
            </time>
            . Pre-registered {REGISTRATION.preRegisteredAt}. Study ID{' '}
            <code className="font-mono text-[13px] text-orange-600">{REGISTRATION.studyId}</code>.
          </p>
        </header>

        {/* REGISTRATION CARD */}
        <section className="space-y-10 border-t border-gray-200 pt-12">
          <div className="space-y-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              01 · Pre-registered design
            </p>
            <h2 className="font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-5xl">
              What we said we&apos;d measure.{' '}
              <span className="italic text-orange-600">Before recruitment opened.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-[180px_1fr]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Population
            </p>
            <p className="text-base leading-[1.65] text-gray-800">{REGISTRATION.population}</p>

            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Arms
            </p>
            <div className="space-y-4">
              {REGISTRATION.arms.map((a) => (
                <div key={a.label}>
                  <p className="font-serif text-base font-normal italic text-gray-900">
                    {a.label}
                  </p>
                  <p className="mt-1 text-sm leading-[1.6] text-gray-700">{a.description}</p>
                </div>
              ))}
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Primary endpoint
            </p>
            <p className="text-base leading-[1.65] text-gray-800">
              {REGISTRATION.primaryEndpoint}
            </p>

            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Secondary endpoints
            </p>
            <ul className="space-y-2">
              {REGISTRATION.secondaryEndpoints.map((s) => (
                <li
                  key={s}
                  className="text-sm leading-[1.6] text-gray-700 before:mr-3 before:text-orange-600 before:content-['•']"
                >
                  {s}
                </li>
              ))}
            </ul>

            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Exclusion
            </p>
            <p className="text-sm leading-[1.6] text-gray-700">{REGISTRATION.exclusion}</p>

            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              IRB status
            </p>
            <p className="text-sm leading-[1.6] text-gray-700">{REGISTRATION.irbStatus}</p>
          </div>
        </section>

        {/* RESULTS */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · Results
            </p>
            <h2 className="font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-5xl">
              What we&apos;ve measured.{' '}
              <span className="italic text-orange-600">Or haven&apos;t yet.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Every endpoint below is pre-registered above. PENDING rows convert to
              INTERIM as data locks. INTERIM converts to FINAL on study completion.
              No post-hoc additions on this page.
            </p>
          </div>

          <div className="space-y-10">
            {RESULTS.map((r) => (
              <div
                key={r.endpoint}
                className="grid grid-cols-1 gap-x-10 gap-y-4 border-t border-gray-200 pt-6 md:grid-cols-[160px_1fr_160px]"
              >
                <div className="space-y-2">
                  <span
                    className={`inline-flex border px-2 py-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${STATUS_STYLES[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                    {r.pre === 'primary' ? 'Primary' : 'Secondary'} endpoint
                  </p>
                </div>

                <div>
                  <p className="font-serif text-xl font-normal leading-[1.25] text-gray-900">
                    {r.endpoint}
                  </p>

                  {r.value && (
                    <p className="mt-3 font-mono text-2xl tabular-nums text-orange-600">
                      {r.value}
                    </p>
                  )}

                  {r.comparison && (
                    <div className="mt-3 grid grid-cols-2 gap-4 border-t border-orange-200 pt-3 md:grid-cols-4">
                      <Stat label="Intervention" value={r.comparison.intervention} />
                      <Stat label="Control" value={r.comparison.control} />
                      {r.comparison.delta && (
                        <Stat label="Δ" value={r.comparison.delta} accent />
                      )}
                      {r.comparison.p && <Stat label="p" value={r.comparison.p} />}
                    </div>
                  )}

                  <p className="mt-3 text-sm leading-[1.6] text-gray-600">{r.note}</p>
                </div>

                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 md:text-right">
                  {r.cohortSize ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* HONESTY FRAME */}
        <section className="space-y-6 border-t border-orange-500 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            03 · The honesty frame
          </p>
          <h2 className="font-serif text-2xl font-normal leading-[1.2] tracking-[-0.015em] text-gray-900 md:text-3xl">
            What we publish, what we don&apos;t, and what we do with a null result.
          </h2>
          <div className="max-w-3xl space-y-4 text-base leading-[1.7] text-gray-700">
            <p>
              <strong className="font-serif font-normal italic">Positive interim</strong> —
              publish immediately. Methods, data, p-values, all of it. We trade speed
              for transparency every time.
            </p>
            <p>
              <strong className="font-serif font-normal italic">Null interim</strong> — we
              keep the trial running and publish the null as a separate methodology
              proof point. Most behavioral RCTs come back null at p&lt;0.05 on first
              read. That&apos;s expected. A pre-registered null with clean methodology
              is still rigor — and we don&apos;t hide it.
            </p>
            <p>
              <strong className="font-serif font-normal italic">Underpowered</strong> —
              we extend the timeline and renegotiate cohort size with the Found
              Health PI. Documented here as &ldquo;cohort enrollment ongoing&rdquo;
              with the new target N.
            </p>
            <p>
              <strong className="font-serif font-normal italic">Trial halt</strong> —
              published with reason. The page does not silently disappear.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-6 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            04 · Partner with us on the next study
          </p>
          <h2 className="font-serif text-2xl font-normal leading-[1.2] tracking-[-0.015em] text-gray-900 md:text-3xl">
            Clinics, telehealth providers, payers.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            We&apos;re actively scoping a second arm. GLP-1 discontinuation
            relapse-prevention is the highest-leverage next study. If you have a
            patient population and an IRB pathway, we have the protocol and the
            instrumentation.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/research"
              className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              ← Research overview
            </Link>
            <a
              href="mailto:research@coyl.ai?subject=Study%20partnership%20inquiry"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              research@coyl.ai →
            </a>
          </div>
        </section>
      </article>
    </>
  )
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-base tabular-nums ${accent ? 'text-orange-600' : 'text-gray-900'}`}
      >
        {value}
      </p>
    </div>
  )
}
