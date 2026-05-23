/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1
 *     with italic accent on "Things we'll publish."
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): metrics + study designs
 *     rendered as gallery columns on top borders.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): live-study banner kept
 *     as the page's single decisive product surface; "not this" disclaimer
 *     list rendered as serif-italic chapter beats.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     openers; hairline rules instead of card chrome.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'Research — outcomes we measure, things we’ll publish — COYL',
  description:
    "The outcomes we track today, the studies we'll publish next. Clinics, telehealth providers, and payers can study real-time pattern interrupt with us. Behavioral support, not medical treatment.",
  keywords: [
    'coyl outcomes',
    'autopilot interruption research',
    'glp-1 relapse prevention study',
    'jitai consumer outcomes',
    'behavior change clinical research',
  ],
  alternates: { canonical: '/research' },
  openGraph: {
    title: 'Outcomes we measure. Things we’ll publish.',
    description:
      "The outcomes we track today, the studies we'll publish next.",
    url: 'https://coyl.ai/research',
    images: [
      {
        url: '/api/og?title=Outcomes+we+measure.+Things+we%27ll+publish.&kicker=Research+%26+Outcomes',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outcomes we measure. Things we’ll publish.',
    description: "The outcomes we track today, the studies we'll publish next.",
    images: ['/api/og?title=Outcomes+we+measure.+Things+we%27ll+publish.&kicker=Research+%26+Outcomes'],
  },
}

/**
 * /research — outcomes + clinical-partner outreach.
 *
 * Distinct from /science (which is peer-reviewed academic citations
 * underpinning the JITAI / autopilot framework). This page is the
 * partner-facing surface: what we measure on our own users, what we
 * intend to publish, and the inbound for clinics or telehealth GLP-1
 * providers who want to run a study with us.
 *
 * Strategic role per the May 2026 competitive landscape: clinical
 * evidence is the gating artifact for B2B (employer / payer / GLP-1
 * partner) revenue. Big Health, Pelago, Omada, and Noom all have
 * published outcomes that unlock PBM-formulary and employer channels;
 * COYL has none. This page is the surface that says "here's what we
 * measure today, here's the study we want to run, here's how to
 * partner." Until we have a published paper, this is the placeholder
 * that primes BD conversations.
 *
 * Numbers are honest aggregates from the live system or marked as
 * "early signal." Never quote outcomes we haven't actually measured.
 * Compliance: every claim must be reproducible from the events table.
 */

const METRICS = [
  {
    label: 'PATTERNS DEFEATED',
    title: 'Slips intercepted before completion',
    body: 'Counted via SLIP_RECOVERED + AUTOPILOT_INTERRUPTED events within 30 minutes of a danger-window firing. Reported per-user weekly on /today and aggregated monthly.',
    note: 'Live metric',
  },
  {
    label: 'SAME-NIGHT RECOVERY',
    title: 'Slips logged + stabilized within 24h',
    body: 'A slip counts as recovered when the user completes the three stabilize actions (water, walk, planned next meal) within 24h of logging. Tracked via the SLIP_RECOVERED event.',
    note: 'Live metric',
  },
  {
    label: 'STREAK INTEGRITY',
    title: 'Days kept vs. days reset',
    body: 'COYL’s streak survives one missed day (grace window) and resets only on a logged slip without same-night recovery. Designed to avoid the streak-anxiety failure mode that drives users to lie to preserve streaks in legacy habit apps.',
    note: 'Live metric',
  },
  {
    label: 'EXCUSE FREQUENCY',
    title: 'Top excuse categories per user, by week',
    body: 'Excuses are detected silently from chat + decision logs and bucketed into 8 categories (DELAY, REWARD, MINIMIZATION, COLLAPSE, EXHAUSTION, EXCEPTION, COMPENSATION, SOCIAL_PRESSURE). The user sees their top 3 each week. We see the full distribution.',
    note: 'Live metric',
  },
  {
    label: 'DANGER-WINDOW ACCURACY',
    title: 'Predicted vs. actual slip windows',
    body: 'The heuristic learner (daily cron) computes (day-of-week × hour-of-day) histograms from the last 30 days of slips per user, writes the top 3 peak windows back to user.dangerWindows. Accuracy = % of slips that fell inside a learned window in the following 7 days.',
    note: 'Reporting from May 2026 onward',
  },
]

const STUDY_DESIGN = [
  {
    n: '01',
    title: 'GLP-1 maintenance study (priority)',
    body: 'N=50–100 GLP-1 patients, 12 weeks, COYL alongside Rx vs. Rx-only. Primary outcome: weight regain at 90 days post-discontinuation. Secondary: adherence-to-program rate, late-night-eating frequency from self-report.',
  },
  {
    n: '02',
    title: 'Late-night-eating cohort',
    body: 'N=200, 8 weeks, COYL vs. waitlist control. Primary outcome: % reduction in self-reported post-9pm eating episodes by week 8. Secondary: pattern-defeated count, retention.',
  },
  {
    n: '03',
    title: 'Re-entry / shame loop',
    body: 'Qualitative + quantitative. Compare time-to-resume after a logged slip in COYL’s recovery flow vs. legacy Monday-restart cohort. Outcome: hours-to-resume and 30-day retention delta.',
  },
]

const NOT_THIS = [
  'Not a medical device, treatment, or therapy.',
  'Not a substitute for professional mental-health care, eating-disorder treatment, or clinical addiction services.',
  'Not making weight-loss claims tied to specific drug interactions.',
  'Not collecting PHI without explicit consent and BAA where required.',
]

export default function ResearchPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Research & Outcomes', url: 'https://coyl.ai/research' },
        ]}
      />

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Research &amp; outcomes
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Outcomes we measure.<br />
            <span className="italic text-orange-600">Things we&rsquo;ll publish.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Most behavior-change apps measure engagement &mdash; app opens, sessions, content
            consumed. COYL measures the only thing that matters: did the user catch themselves
            before the loop completed? Here&rsquo;s what we track today, what we&rsquo;ll
            publish next, and how to study it with us.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/clinical-study"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              See the 12-week protocol &rarr;
            </Link>
            <Link
              href="/science"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Read the underlying science
            </Link>
          </div>
        </header>

        {/* Live-study banner — page's primary product CTA */}
        <section className="border-t border-orange-500 pt-16">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
              Open for partner enrollment
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">
              Protocol v0.9 &middot; IRB pathway: minimal-risk expedited
            </span>
          </div>
          <h2 className="mt-6 font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            GLP-1 weight-regain study &mdash; <span className="italic text-orange-600">protocol live.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700">
            12 weeks, N=80, randomized 1:1. Tests whether real-time pattern interrupt
            during GLP-1 maintenance reduces weight regain in the 90 days after
            discontinuation. The protocol is drafted and partner-ready.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/clinical-study"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)]"
            >
              Read the protocol &rarr;
            </Link>
            <Link
              href="/research/interim"
              className="inline-flex items-center gap-2 rounded-full border border-orange-500 px-5 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-50"
            >
              Interim data ledger &rarr;
            </Link>
          </div>
        </section>

        {/* Metrics */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              What we measure
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Five outcome metrics, <span className="italic text-orange-600">none of which are &ldquo;app opens.&rdquo;</span>
          </h2>

          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-2">
            {METRICS.map((m) => (
              <div key={m.title} className="border-t border-gray-200 pt-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {m.label}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {m.title}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">{m.body}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">
                  {m.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Three studies */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              On the bench
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Three studies <span className="italic text-orange-600">we want to run.</span>
          </h2>
          <p className="max-w-3xl text-base leading-[1.7] text-gray-700">
            We&rsquo;re looking for telehealth GLP-1 prescribers, university research labs,
            and obesity-medicine clinics willing to co-author. We provide product access,
            de-identified outcome data, and engineering support. You provide IRB and patient
            recruitment.
          </p>
          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-3">
            {STUDY_DESIGN.map((s) => (
              <div key={s.n} className="border-t border-orange-500 pt-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {s.n}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {s.title}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What COYL is not */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              What COYL is not
            </span>
          </div>
          <h3 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Behavioral support, <span className="italic text-orange-600">not medical treatment.</span>
          </h3>
          <ul className="space-y-5 pt-4">
            {NOT_THIS.map((line) => (
              <li
                key={line}
                className="border-t border-gray-200 pt-5 font-serif text-xl font-normal italic leading-[1.3] text-gray-900"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>

        {/* For partners */}
        <section className="border-t border-orange-500 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            For partners
          </p>
          <p className="mt-6 max-w-3xl text-lg leading-[1.7] text-gray-700">
            If you run a clinic, a telehealth GLP-1 program, or a research lab and want to
            study real-time pattern interrupt with a real patient cohort,{' '}
            <strong className="font-serif font-normal italic text-gray-900">
              we want to talk.
            </strong>{' '}
            Co-authored publications welcome. De-identified data sharing under a DUA welcome.
          </p>
          <Link
            href="mailto:research@coyl.ai?subject=Clinical%20study%20partnership"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            research@coyl.ai
          </Link>
        </section>

        <section className="border-t border-gray-200 pt-16">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/science"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              The underlying science
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              How COYL works
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
