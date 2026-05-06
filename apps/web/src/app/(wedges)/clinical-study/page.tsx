import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'Clinical study — 12-week GLP-1 maintenance protocol — COYL',
  description:
    'Open for partner enrollment. 12-week, randomized, minimal-risk behavioral study testing whether real-time pattern interrupt reduces weight regain after GLP-1 discontinuation. Protocol drafted, IRB pathway mapped, recruitment target N=80.',
  keywords: [
    'glp-1 weight regain study',
    'clinical study coyl',
    'jitai consumer randomized study',
    'glp-1 discontinuation behavioral support',
    'irb-friendly behavior change study',
  ],
  alternates: { canonical: '/clinical-study' },
  openGraph: {
    title: 'COYL Clinical Study — Open for partner enrollment',
    description:
      '12-week randomized study on GLP-1 weight regain. Protocol drafted. IRB pathway mapped. Looking for telehealth prescribers and clinics with a GLP-1 cohort.',
    url: 'https://coyl.ai/clinical-study',
  },
}

/**
 * /clinical-study — the partner-readiness destination.
 *
 * Strategic context (May 2026 competitive landscape audit):
 *   The partners-strip on the homepage promises "white-label", "PMPM",
 *   "DUA" and "outcome reporting". No telehealth GLP-1 prescriber,
 *   employer health plan, or research lab will sign on those promises
 *   without published outcomes. Outcomes require a study. A study
 *   requires a protocol a PI can take to an IRB. This page is that
 *   protocol — visible, concrete, and partner-ready — so a clinical
 *   partner clicking through from the homepage sees something they can
 *   actually act on, not vaporware.
 *
 *   This is the gating artifact for the $60M B2B portion of the
 *   path-to-$100M plan. Until we have a published readout, it's the
 *   surface that opens BD conversations.
 *
 * Honesty constraints:
 *   - The study is OPEN — protocol drafted, partners not yet enrolled.
 *     Don't imply enrollment is in progress until a partner signs.
 *   - All numbers are pre-specified; no outcome data quoted.
 *   - Effect-size assumption (3 kg differential weight regain at 90d
 *     post-discontinuation) is sourced from the published GLP-1
 *     discontinuation literature; cite primary source on /science.
 *   - Frame as "feasibility + effect-size estimation" — not
 *     confirmatory — so the N=80 sample is honest for what it can
 *     deliver. Confirmatory studies need N=200+ and external funding.
 *
 * Page maintained alongside docs/clinical-study/protocol.md (the IRB-
 * ready document a PI hands to a review board). If you change the
 * sample size, primary endpoint, eligibility, or timeline here, mirror
 * the change in protocol.md or the partner pack drifts out of sync.
 */

const STATUS = [
  { label: 'Protocol', value: 'Drafted v0.9' },
  { label: 'IRB pathway', value: 'Minimal-risk expedited (Cat. 7)' },
  { label: 'Sample size', value: 'N = 80 (1:1 randomized)' },
  { label: 'Duration', value: '12 weeks active + 90d follow-up' },
  { label: 'Status', value: 'Open for partner enrollment' },
]

const OUTCOMES = [
  {
    tier: 'Primary',
    body: 'Weight regain at 90 days post GLP-1 discontinuation. Effect-size estimation, not powered for confirmatory inference. H₁: COYL + Rx arm regains less weight than Rx-alone arm.',
  },
  {
    tier: 'Secondary',
    body: 'Program-adherence rate (% of weeks with ≥3 logged check-ins), late-night-eating frequency from self-report, time-from-slip-to-recovery in hours, study retention at week 12.',
  },
  {
    tier: 'Exploratory',
    body: 'Correlation between Patterns Defeated count (in-app metric) and weight outcome. Excuse-category distribution shifts pre/post intervention. Self-trust score trajectory.',
  },
]

const ELIGIBILITY_IN = [
  'Adults 18–65, BMI 27–45',
  'Prescribed a GLP-1 (semaglutide, tirzepatide, liraglutide) within the last 90 days',
  'iOS or Android smartphone, English fluency',
  'Willing to log weight at baseline, week 12, and at +30 / +60 / +90 days post-discontinuation',
]

const ELIGIBILITY_OUT = [
  'Active or historical eating disorder (within last 12 months)',
  'Current psychiatric crisis or active suicidal ideation',
  'Concurrent enrollment in another behavior-change study',
  'Pregnant, lactating, or planning pregnancy during study window',
]

const COYL_PROVIDES = [
  'Premium product access for all enrolled participants (12 weeks active + 90-day follow-up window)',
  'Engineering integration (deep links from partner platform, optional SSO)',
  'De-identified outcome dataset, partner-shared under DUA',
  'Co-authored manuscript, primary authorship negotiable',
  'Statistical analysis support (pre-registered SAP)',
  'Branded onboarding + cohort identification',
]

const PARTNER_PROVIDES = [
  'IRB submission (commercial IRB acceptable — typical $3–5k fee, COYL covers if needed)',
  'Recruitment from your existing GLP-1 patient cohort',
  'Weight measurements at baseline, week 12, and three follow-up windows (telehealth scales acceptable)',
  'Optional: short clinician interview qualitative arm',
]

const TIMELINE = [
  { phase: 'Month 1', body: 'Protocol finalization, partner DUA, IRB submission' },
  { phase: 'Month 2', body: 'IRB approval (expedited timeline ~3–6 weeks), recruitment ramp' },
  { phase: 'Months 3–5', body: 'Active 12-week intervention, in-app + scale data collection' },
  { phase: 'Months 6–7', body: '90-day post-discontinuation follow-up, dataset lock, analysis' },
  { phase: 'Month 8', body: 'Readout, manuscript draft, conference abstract submission' },
]

const RISK = [
  {
    h: 'Risk profile',
    b: 'Minimal-risk behavioral study. No medical intervention, no medication change, no PHI collected without explicit consent. Falls under expedited IRB review category 7 (research on individual or group characteristics or behavior).',
  },
  {
    h: 'Privacy & data',
    b: 'De-identified outcome data only, exchanged under a Data Use Agreement (DUA). No raw chat content shared with partner. HIPAA-aligned handling end-to-end. BAA available for prescriber partners covered as Business Associates. 90-day retention post-readout, then deletion or anonymized aggregate only.',
  },
  {
    h: 'Withdrawal',
    b: 'Participants may withdraw at any time. In-app data deletion within 30 days of withdrawal request. Withdrawal does not affect their COYL Premium access — they keep the product.',
  },
  {
    h: 'Adverse events',
    b: 'Behavioral study; no expected adverse events from the intervention itself. Standard safety reporting for any participant-reported concern, escalated to PI within 24h.',
  },
]

const ENROLL_SUBJECT = encodeURIComponent('Clinical study partnership — GLP-1 cohort')
const ENROLL_BODY = encodeURIComponent(
  `Hi COYL research team,

Interested in enrolling our cohort in the 12-week GLP-1 maintenance study.

Org: [clinic / telehealth / lab name]
Cohort size (active GLP-1 patients): [N]
IRB pathway preference: [commercial / institutional / not sure]
Earliest enrollment readiness: [month]

Best,
[name]`,
)

export default function ClinicalStudyPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Research & Outcomes', url: 'https://coyl.ai/research' },
          { name: 'Clinical Study', url: 'https://coyl.ai/clinical-study' },
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Clinical study
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        12 weeks. 80 patients.<br />
        <span className="text-orange-400">One question worth answering.</span>
      </h1>

      <p className="mb-10 max-w-2xl text-lg text-gray-400">
        Does real-time pattern interrupt during GLP-1 maintenance reduce weight regain
        after the prescription ends? The protocol is drafted. The IRB pathway is mapped.
        We&rsquo;re looking for telehealth prescribers, obesity-medicine clinics, and
        research labs with a GLP-1 cohort to run it with us.
      </p>

      {/* Status row — replaces the typical "trust badge" cluster.
          Honest status > fake credibility. */}
      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.06] to-transparent p-6 md:p-8">
        <p className="mb-5 text-xs font-mono uppercase tracking-widest text-orange-400">
          Status
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {STATUS.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                {s.label}
              </p>
              <p className="mt-1 text-sm font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`mailto:research@coyl.ai?subject=${ENROLL_SUBJECT}&body=${ENROLL_BODY}`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)]"
          >
            Enroll your cohort
          </Link>
          <Link
            href="/research"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-gray-200 hover:border-orange-500/40 hover:text-white"
          >
            Back to outcomes
          </Link>
        </div>
      </section>

      {/* Question + design */}
      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          The question
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          GLP-1s suppress appetite while you take them.<br />
          The autopilot is still there when you stop.
        </h3>
        <p className="mb-8 max-w-3xl text-base leading-relaxed text-gray-400">
          Published discontinuation literature shows ~two-thirds of weight loss returns within
          a year of stopping a GLP-1, with the largest regain occurring in the first 90 days.
          The drug suppressed the hunger signal, but it never touched the late-night
          kitchen loop, the stress-eat reflex, or the &ldquo;I deserve this&rdquo; script.
          When the suppression lifts, the script is right where the user left it.
        </p>
        <p className="max-w-3xl text-base leading-relaxed text-gray-400">
          COYL is built to interrupt that script in real time. The hypothesis is that
          training the interrupt during the medicated window builds behavioral muscle
          memory that survives discontinuation. That&rsquo;s the question this study answers.
        </p>
      </section>

      {/* Design diagram (simple ASCII-ish flow, no images required) */}
      <section className="mb-16 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <h2 className="mb-6 text-2xl font-bold text-white">Design</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
              Recruitment
            </p>
            <p className="mt-2 text-base font-bold text-white">N = 80</p>
            <p className="mt-2 text-sm text-gray-400">
              Randomized 1:1 to intervention or control. Stratified by baseline BMI and
              GLP-1 type.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.04] p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-orange-400">
              Intervention arm
            </p>
            <p className="mt-2 text-base font-bold text-white">Rx + COYL Premium</p>
            <p className="mt-2 text-sm text-gray-400">
              GLP-1 prescription per usual care, plus 12 weeks of COYL Premium access
              (rescue flows, recovery engine, precision interrupts, pattern detection).
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
              Control arm
            </p>
            <p className="mt-2 text-base font-bold text-white">Rx alone</p>
            <p className="mt-2 text-sm text-gray-400">
              GLP-1 prescription per usual care. Waitlist offered Premium after the
              12-week active phase. Reduces ethical concern around withholding a
              promising consumer tool.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { t: 'Week 0', b: 'Baseline weight, consent, randomization' },
            { t: 'Weeks 1–12', b: 'Active intervention, in-app data + weekly weight' },
            { t: 'Week 13–24', b: 'Discontinuation window, +30/+60/+90 weight' },
            { t: 'Week 25', b: 'Dataset lock, analysis, readout' },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-orange-400">
                {s.t}
              </p>
              <p className="mt-2 text-sm text-gray-300">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Outcomes
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          Pre-specified. Reproducible from the events table.
        </h3>
        <div className="space-y-3">
          {OUTCOMES.map((o) => (
            <div
              key={o.tier}
              className="rounded-2xl border-l-[3px] border-orange-500/60 bg-orange-500/[0.03] px-6 py-5"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400">
                {o.tier}
              </p>
              <p className="mt-2 text-base leading-relaxed text-gray-200">{o.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-xs text-gray-500">
          Sample size justification: feasibility + effect-size estimation, not confirmatory
          inference. N = 80 powered to detect a ~3 kg differential weight regain at 90 days
          (effect size d ≈ 0.55, &alpha; = 0.05, two-sided, 80% power) assuming 20%
          attrition. A confirmatory replication would target N &ge; 200.
        </p>
      </section>

      {/* Eligibility */}
      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-orange-400">
            Inclusion
          </p>
          <ul className="mt-4 space-y-2">
            {ELIGIBILITY_IN.map((e) => (
              <li key={e} className="flex gap-2 text-sm text-gray-300">
                <span className="text-orange-400">+</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
            Exclusion
          </p>
          <ul className="mt-4 space-y-2">
            {ELIGIBILITY_OUT.map((e) => (
              <li key={e} className="flex gap-2 text-sm text-gray-400">
                <span className="text-gray-600">&minus;</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Risk + privacy */}
      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          IRB &amp; data handling
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          Minimal risk. Expedited pathway. Partner-ready DUA.
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {RISK.map((r) => (
            <div
              key={r.h}
              className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6"
            >
              <h3 className="mb-2 text-base font-bold text-white">{r.h}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{r.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-orange-500/30 bg-orange-500/[0.04] p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-orange-400">
            COYL provides
          </p>
          <ul className="mt-4 space-y-2.5">
            {COYL_PROVIDES.map((c) => (
              <li key={c} className="flex gap-2 text-sm text-gray-200">
                <span className="text-orange-400">&bull;</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
            Partner provides
          </p>
          <ul className="mt-4 space-y-2.5">
            {PARTNER_PROVIDES.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-gray-300">
                <span className="text-gray-500">&bull;</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Timeline
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          8 months from kickoff to readout.
        </h3>
        <ol className="space-y-2">
          {TIMELINE.map((t, i) => (
            <li
              key={t.phase}
              className="flex gap-4 rounded-2xl border border-white/5 bg-black/20 p-5"
            >
              <span className="font-mono text-xl font-black text-orange-400">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-sm font-bold text-white">{t.phase}</p>
                <p className="mt-1 text-sm text-gray-400">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="mb-12 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.08] via-orange-500/[0.03] to-transparent p-8 md:p-12">
        <h2 className="mb-3 text-3xl font-black text-white md:text-4xl">
          Bring the cohort.<br />
          <span className="text-orange-400">We&rsquo;ll bring the protocol.</span>
        </h2>
        <p className="mb-6 max-w-2xl text-base text-gray-300">
          One email opens it. We respond within two business days with the full protocol
          pack, draft DUA, and a kickoff call link. Co-authored publication welcome.
          De-identified data sharing under a DUA welcome.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`mailto:research@coyl.ai?subject=${ENROLL_SUBJECT}&body=${ENROLL_BODY}`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            research@coyl.ai
          </Link>
          <Link
            href="/research"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-gray-200 hover:border-orange-500/40 hover:text-white"
          >
            Outcomes we already track
          </Link>
          <Link
            href="/science"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-gray-200 hover:border-orange-500/40 hover:text-white"
          >
            The underlying science
          </Link>
        </div>
      </section>

      <p className="text-xs text-gray-500">
        COYL is a behavioral support tool. It is not a medical device, treatment, or
        therapy. The study described here is a behavioral feasibility study, minimal-risk
        category, conducted under IRB oversight. Not a substitute for professional medical
        care.
      </p>
    </>
  )
}
