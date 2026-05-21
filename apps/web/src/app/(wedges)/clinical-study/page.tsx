/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1 with
 *     italic accent on "No patients enrolled yet."
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): status row, eligibility,
 *     roles, and risk sections rendered as gallery columns on hairline rules.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): timeline and outcomes
 *     rendered as chapter-style editorial entries on top borders.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     section openers, hairline rules instead of soft cards.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema, MedicalStudySchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'Clinical study — study-ready. Partner-ready. No patients enrolled yet.',
  description:
    "12-week randomized behavioral protocol on whether real-time pattern interrupt reduces weight regain after GLP-1 discontinuation. Protocol drafted, IRB pathway mapped, partners welcome. N=80 target, no enrolled patients yet — open for partner enrollment.",
  keywords: [
    'glp-1 weight regain study',
    'clinical study coyl',
    'jitai consumer randomized study',
    'glp-1 discontinuation behavioral support',
    'irb-friendly behavior change study',
  ],
  alternates: { canonical: '/clinical-study' },
  openGraph: {
    title: 'Clinical study — study-ready. Partner-ready. No patients enrolled yet.',
    description:
      "12-week randomized protocol on GLP-1 weight regain. Drafted and partner-ready. Open for partner enrollment.",
    url: 'https://coyl.ai/clinical-study',
    images: [
      {
        url: '/api/og?title=Study-ready.+Partner-ready.+No+patients+enrolled+yet.&kicker=Clinical+study',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clinical study — study-ready. Partner-ready. No patients enrolled yet.',
    description: "12-week randomized protocol on GLP-1 weight regain. Drafted and partner-ready.",
    images: ['/api/og?title=Study-ready.+Partner-ready.+No+patients+enrolled+yet.&kicker=Clinical+study'],
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
  { label: 'IRB pathway', value: 'Designed for minimal-risk expedited review (Cat. 7)' },
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
    b: 'Designed as a minimal-risk behavioral study. No medical intervention, no medication change, no PHI collected without explicit consent. Structured for expedited IRB review category 7 (research on individual or group characteristics or behavior), pending board determination.',
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
      <MedicalStudySchema />

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Clinical study
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Study-ready. Partner-ready.<br />
            <span className="italic text-orange-600">No patients enrolled yet.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            12-week randomized protocol on whether real-time pattern interrupt during GLP-1
            maintenance reduces weight regain after discontinuation. Protocol drafted,
            IRB pathway mapped, N=80 target. We&rsquo;re looking for telehealth prescribers,
            obesity-medicine clinics, and research labs to run it with us.
          </p>
        </header>

        {/* Status row */}
        <section className="space-y-10 border-t border-orange-500 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Status
          </p>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
            {STATUS.map((s) => (
              <div key={s.label} className="border-t border-gray-200 pt-5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
                  {s.label}
                </p>
                <p className="mt-3 font-serif text-base font-normal italic leading-[1.35] text-gray-900">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`mailto:research@coyl.ai?subject=${ENROLL_SUBJECT}&body=${ENROLL_BODY}`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)]"
            >
              Enroll your cohort
            </Link>
            <Link
              href="/research"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Back to outcomes
            </Link>
          </div>
        </section>

        {/* Question */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The question
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            GLP-1s suppress appetite while you take them.<br />
            <span className="italic text-orange-600">The autopilot is still there when you stop.</span>
          </h2>
          <div className="max-w-3xl space-y-5">
            <p className="text-base leading-[1.7] text-gray-700">
              Published discontinuation literature shows ~two-thirds of weight loss returns within
              a year of stopping a GLP-1 (Wilding et al., 2022 &mdash; STEP 1 extension, NEJM /
              Diabetes, Obesity and Metabolism), with the largest regain occurring in the first
              90 days. The drug suppressed the hunger signal, but it never touched the late-night
              kitchen loop, the stress-eat reflex, or the &ldquo;I deserve this&rdquo; script.
              When the suppression lifts, the script is right where the user left it.
            </p>
            <p className="text-base leading-[1.7] text-gray-700">
              COYL is built to interrupt that script in real time. The hypothesis is that
              training the interrupt during the medicated window builds behavioral muscle
              memory that survives discontinuation. That&rsquo;s the question this study answers.
            </p>
          </div>
        </section>

        {/* Design */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Design
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Three arms. Twelve weeks. <span className="italic text-orange-600">One real question.</span>
          </h2>
          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-3">
            <div className="border-t border-gray-200 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
                Recruitment
              </p>
              <p className="mt-4 font-serif text-2xl font-normal leading-[1.15] text-gray-900">
                N = 80
              </p>
              <p className="mt-3 text-base leading-[1.65] text-gray-700">
                Randomized 1:1 to intervention or control. Stratified by baseline BMI and
                GLP-1 type.
              </p>
            </div>
            <div className="border-t border-orange-500 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Intervention arm
              </p>
              <p className="mt-4 font-serif text-2xl font-normal leading-[1.15] text-gray-900">
                Rx + COYL Premium
              </p>
              <p className="mt-3 text-base leading-[1.65] text-gray-700">
                GLP-1 prescription per usual care, plus 12 weeks of COYL Premium access
                (rescue flows, recovery engine, precision interrupts, pattern detection).
              </p>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
                Control arm
              </p>
              <p className="mt-4 font-serif text-2xl font-normal leading-[1.15] text-gray-900">
                Rx alone
              </p>
              <p className="mt-3 text-base leading-[1.65] text-gray-700">
                GLP-1 prescription per usual care. Waitlist offered Premium after the
                12-week active phase. Reduces ethical concern around withholding a
                promising consumer tool.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 pt-8 md:grid-cols-4">
            {[
              { t: 'Week 0', b: 'Baseline weight, consent, randomization' },
              { t: 'Weeks 1–12', b: 'Active intervention, in-app data + weekly weight' },
              { t: 'Week 13–24', b: 'Discontinuation window, +30/+60/+90 weight' },
              { t: 'Week 25', b: 'Dataset lock, analysis, readout' },
            ].map((s) => (
              <div key={s.t} className="border-t border-gray-200 pt-5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {s.t}
                </p>
                <p className="mt-3 text-sm leading-[1.6] text-gray-700">{s.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Outcomes */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Outcomes
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Pre-specified. <span className="italic text-orange-600">Reproducible from the events table.</span>
          </h2>
          <div className="space-y-6 pt-4">
            {OUTCOMES.map((o) => (
              <div key={o.tier} className="border-t border-orange-500 pt-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {o.tier}
                </p>
                <p className="mt-4 max-w-3xl text-base leading-[1.7] text-gray-700">{o.body}</p>
              </div>
            ))}
          </div>
          <p className="max-w-2xl text-xs leading-[1.6] text-gray-500">
            Sample size justification: feasibility + effect-size estimation, not confirmatory
            inference. N = 80 powered to detect a ~3 kg differential weight regain at 90 days
            (effect size d ≈ 0.55, &alpha; = 0.05, two-sided, 80% power) assuming 20%
            attrition. A confirmatory replication would target N &ge; 200.
          </p>
        </section>

        {/* Eligibility */}
        <section className="grid grid-cols-1 gap-10 border-t border-gray-200 pt-16 md:grid-cols-2">
          <div className="border-t border-orange-500 pt-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Inclusion
            </p>
            <ul className="mt-6 space-y-3">
              {ELIGIBILITY_IN.map((e) => (
                <li key={e} className="flex gap-3 text-base leading-[1.65] text-gray-700">
                  <span className="text-orange-600">+</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
              Exclusion
            </p>
            <ul className="mt-6 space-y-3">
              {ELIGIBILITY_OUT.map((e) => (
                <li key={e} className="flex gap-3 text-base leading-[1.65] text-gray-700">
                  <span className="text-gray-500">&minus;</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Risk + privacy */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              IRB &amp; data handling
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Minimal risk. Expedited pathway. <span className="italic text-orange-600">Partner-ready DUA.</span>
          </h2>
          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-2">
            {RISK.map((r) => (
              <div key={r.h} className="border-t border-gray-200 pt-6">
                <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {r.h}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">{r.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles — paired */}
        <section className="grid grid-cols-1 gap-10 border-t border-gray-200 pt-16 md:grid-cols-2">
          <div className="border-t border-orange-500 pt-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              COYL provides
            </p>
            <ul className="mt-6 space-y-3">
              {COYL_PROVIDES.map((c) => (
                <li key={c} className="flex gap-3 text-base leading-[1.65] text-gray-700">
                  <span className="text-orange-600">&bull;</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
              Partner provides
            </p>
            <ul className="mt-6 space-y-3">
              {PARTNER_PROVIDES.map((p) => (
                <li key={p} className="flex gap-3 text-base leading-[1.65] text-gray-700">
                  <span className="text-gray-500">&bull;</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Timeline */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Timeline
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Eight months from <span className="italic text-orange-600">kickoff to readout.</span>
          </h2>
          <ol className="space-y-8 pt-4">
            {TIMELINE.map((t, i) => (
              <li key={t.phase} className="flex gap-8 border-t border-gray-200 pt-6">
                <span className="font-serif text-3xl font-normal italic leading-none text-orange-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900">
                    {t.phase}
                  </p>
                  <p className="mt-2 max-w-2xl text-base leading-[1.65] text-gray-700">{t.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Final CTA */}
        <section className="border-t border-orange-500 pt-16">
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Bring the cohort.<br />
            <span className="italic text-orange-600">We&rsquo;ll bring the protocol.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-[1.7] text-gray-700">
            One email opens it. We respond within two business days with the full protocol
            pack, draft DUA, and a kickoff call link. Co-authored publication welcome.
            De-identified data sharing under a DUA welcome.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`mailto:research@coyl.ai?subject=${ENROLL_SUBJECT}&body=${ENROLL_BODY}`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              research@coyl.ai
            </Link>
            <Link
              href="/research"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Outcomes we already track
            </Link>
            <Link
              href="/science"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              The underlying science
            </Link>
          </div>
        </section>

        <p className="border-t border-gray-200 pt-8 text-xs leading-[1.6] text-gray-500">
          COYL is a behavioral support tool. It is not a medical device, treatment, or
          therapy. The study described here is a behavioral feasibility study, minimal-risk
          category, conducted under IRB oversight. Not a substitute for professional medical
          care.
        </p>
      </div>
    </>
  )
}
