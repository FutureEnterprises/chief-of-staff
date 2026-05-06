import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'Research — outcomes & clinical partnerships — COYL',
  description:
    'What COYL measures, what we publish, and how clinics, telehealth providers, and payers can study real-time pattern interrupt for relapse prevention. Behavioral support, not medical treatment.',
  keywords: [
    'coyl outcomes',
    'autopilot interruption research',
    'glp-1 relapse prevention study',
    'jitai consumer outcomes',
    'behavior change clinical research',
  ],
  alternates: { canonical: '/research' },
  openGraph: {
    title: 'COYL Research & Outcomes',
    description:
      'What we measure, what we publish, and how to study real-time pattern interrupt with us.',
    url: 'https://coyl.ai/research',
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
    body: 'A slip is "recovered" when the user completes the three stabilize actions (water, walk, planned next meal) within 24h of logging. Tracked via the SLIP_RECOVERED event.',
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

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Research &amp; outcomes
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        We measure the moment.<br />
        <span className="text-orange-400">Then we publish what works.</span>
      </h1>

      <p className="mb-10 max-w-2xl text-lg text-gray-400">
        Most behavior-change apps measure engagement (app opens, sessions, content consumed).
        COYL measures the only thing that matters: did the user catch themselves before
        the autopilot completed? Here&rsquo;s what we track, what we publish, and how we
        want to study it with you.
      </p>

      <div className="mb-16 flex flex-wrap gap-3">
        <Link
          href="mailto:research@coyl.ai?subject=Clinical%20study%20partnership"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Run a study with us
        </Link>
        <Link
          href="/science"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
        >
          Read the underlying science
        </Link>
      </div>

      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          What we measure
        </h2>
        <h3 className="mb-8 text-2xl font-bold text-white md:text-3xl">
          Five outcome metrics, none of which are &ldquo;app opens.&rdquo;
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {METRICS.map((m) => (
            <div
              key={m.title}
              className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6"
            >
              <p className="mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-orange-500">
                {m.label}
              </p>
              <h3 className="mb-3 text-lg font-bold text-white">{m.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{m.body}</p>
              <p className="mt-3 inline-block rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                {m.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/[0.05] p-8">
        <h2 className="mb-6 text-2xl font-bold text-white">
          Three studies we want to run.
        </h2>
        <p className="mb-8 text-sm text-gray-400">
          We&rsquo;re looking for telehealth GLP-1 prescribers, university research labs,
          and obesity-medicine clinics willing to co-author. We provide product access,
          de-identified outcome data, and engineering support. You provide IRB and patient
          recruitment.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STUDY_DESIGN.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-orange-500/30 bg-black/40 p-5"
            >
              <p className="text-xs font-mono text-orange-500">{s.n}</p>
              <h3 className="mt-2 text-base font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          What COYL is not
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          Behavioral support, not medical treatment.
        </h3>
        <ul className="space-y-3">
          {NOT_THIS.map((line) => (
            <li
              key={line}
              className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/[0.03] px-5 py-3 text-base text-gray-200"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <p className="text-sm uppercase tracking-widest text-gray-500">For partners</p>
        <p className="mt-2 text-lg text-gray-300">
          If you run a clinic, a telehealth GLP-1 program, or a research lab and want to
          study real-time pattern interrupt with a real patient cohort,{' '}
          <span className="font-bold text-white">we want to talk.</span> Co-authored
          publications welcome. De-identified data sharing under a DUA welcome.
        </p>
        <Link
          href="mailto:research@coyl.ai?subject=Clinical%20study%20partnership"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          research@coyl.ai
        </Link>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/science"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
        >
          The underlying science
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
        >
          How COYL works
        </Link>
      </div>
    </>
  )
}
