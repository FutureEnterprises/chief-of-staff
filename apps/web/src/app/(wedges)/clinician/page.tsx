import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

/**
 * /clinician — public B2B acquisition surface for the GLP-1 prescriber
 * channel.
 *
 * Where /glp1 sells the PATIENT (compulsive autopilot the drug doesn't
 * touch), /clinician sells the PRESCRIBER: the panel-level, pre-slip
 * behavioral signal that gives the doctor a thirty-day jump on the
 * "month 7, the prescription ends" rebound that costs them outcomes.
 *
 * Positioning per the May 2026 ultrathink:
 *   - Drug suppresses appetite. COYL catches the script.
 *   - Prescriber needs the panel-level signal BEFORE the patient calls.
 *   - Free Pro tier for clinicians + first 5 patients are free, after
 *     that $9/patient/mo. (The patient pays the consumer COYL tier;
 *     this is the clinic-side fee that unlocks panel analytics + BAA
 *     coverage + white-label.)
 *
 * Style: cream background + Instrument Serif + signature orange to
 * stay consistent with /glp1, /pricing, /psyche — luxury editorial,
 * not clinical SaaS chrome. The clinician is reading this on their
 * phone between patients; the page has to feel inevitable, not
 * brochure-y.
 */
export const metadata: Metadata = {
  title:
    'COYL for clinicians — the behavioral layer your GLP-1 patients are missing.',
  description:
    'The drug suppresses appetite. COYL catches the autopilot the drug never reaches. Real-time pre-slip behavioral signal on your panel, HIPAA-aware, free for your first 5 patients.',
  keywords: [
    'glp-1 prescriber',
    'ozempic clinician dashboard',
    'wegovy provider tools',
    'glp-1 patient behavior monitoring',
    'pre-slip signal',
    'weight maintenance behavioral support',
    'glp-1 adherence',
  ],
  alternates: { canonical: '/clinician' },
  openGraph: {
    title: 'The behavioral layer your GLP-1 patients are missing.',
    description:
      'COYL catches the autopilot the drug never reaches. Pre-slip behavioral signal on your panel, in real time.',
    url: 'https://coyl.ai/clinician',
    images: [
      {
        url: '/api/og?title=The+behavioral+layer+your+GLP-1+patients+are+missing.&kicker=For+clinicians',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The behavioral layer your GLP-1 patients are missing.',
    description:
      'COYL catches the autopilot the drug never reaches. For prescribers.',
    images: [
      '/api/og?title=The+behavioral+layer+your+GLP-1+patients+are+missing.&kicker=For+clinicians',
    ],
  },
}

// Three lived moments — the same editorial pattern /how-it-works uses.
// Each moment is a frame in the prescriber's clinical week: the call
// they didn't get to make, the dashboard glance, the pre-emptive
// intervention. Reads like Letter / Sequel pull-quotes.
const LIVED_MOMENTS = [
  {
    kicker: 'Month 7',
    headline: 'The prescription ends. The autopilot returns.',
    body: 'The drug worked. The 18% loss is there in the chart. And then it isn’t. The patient is back at 9 PM, in front of the fridge, with the same script the medication never wrote over. You see it in regain velocity at month 9. COYL sees it in the late-night phone unlock at month 6.',
  },
  {
    kicker: 'Your dashboard',
    headline: 'The pattern, before the slip.',
    body: 'Mon 9:14 PM is when the panel slips. Not the night of the regain — the night before. Self-trust dips two days ahead. Excuse density spikes a week ahead. COYL surfaces the pre-slip pattern as a colored cohort cell, not a CSV.',
  },
  {
    kicker: 'The intervention',
    headline: 'Fires before the patient calls you.',
    body: 'When the autopilot signal crosses the threshold, COYL fires the 3-second interrupt to the patient — in-app, SMS, or push, depending on what worked last time. You see the hold-rate in your dashboard the next morning. The panic call you would have gotten on Tuesday doesn’t happen.',
  },
] as const

const WHAT_YOU_GET = [
  'Real-time pre-slip behavioral signals on your panel',
  'Anonymized aggregate cohort metrics',
  'Per-patient intervention effectiveness reporting',
  'HIPAA-compliant BAA-covered data infrastructure',
  'White-label option for clinic branding',
] as const

export default function ClinicianPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'For clinicians', url: 'https://coyl.ai/clinician' },
        ]}
      />

      {/* EYEBROW + H1 + subhead — the editorial opening atom shared with
          /glp1, /psyche, /pricing. Hairline rule, mono micro-label, then
          the Instrument Serif H1 with an italic accent on the line that
          carries the claim. */}
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          For clinicians
        </span>
      </div>

      <h1 className="mb-6 max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
        The behavioral layer<br />
        your GLP-1 patients are{' '}
        <span className="italic text-orange-600">missing.</span>
      </h1>

      <p className="mb-10 max-w-2xl text-lg leading-[1.65] text-gray-700">
        The drug suppresses appetite. COYL catches the autopilot the drug
        never reaches.
      </p>

      <div className="mb-20 flex flex-wrap gap-3">
        <Link
          href="/clinician/onboarding"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start the clinic &rarr;
        </Link>
        <Link
          href="#dashboard-preview"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
        >
          See the dashboard
        </Link>
      </div>

      {/* THREE LIVED MOMENTS — editorial chain like /how-it-works.
          Each lives on its own hairline rule. No icons, no gradients,
          no pills — the moment IS the unit. */}
      <section className="mb-20 space-y-12">
        {LIVED_MOMENTS.map((m) => (
          <article
            key={m.headline}
            className="border-t border-gray-200 pt-10"
          >
            <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              {m.kicker}
            </p>
            <h2 className="mb-4 max-w-3xl font-serif text-3xl font-normal italic leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
              {m.headline}
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              {m.body}
            </p>
          </article>
        ))}
      </section>

      {/* DASHBOARD PREVIEW — anchor target for the secondary CTA above.
          Static placeholder card linking to /provider/cohort. Once a
          real screenshot is rendered we'll swap the placeholder for an
          <Image> src=/screenshots/provider-cohort.png. */}
      <section
        id="dashboard-preview"
        className="mb-20 border-t border-gray-200 pt-12"
      >
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          Your dashboard
        </p>
        <h2 className="mb-6 max-w-3xl font-serif text-3xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
          The panel,{' '}
          <span className="italic text-orange-600">at a glance.</span>
        </h2>
        <p className="mb-8 max-w-2xl text-base leading-[1.65] text-gray-700">
          Three cards. Sortable patient list. Per-patient drilldown with
          intervention hold rate, danger windows, self-trust trend. No
          raw biometric samples — just the signal you can act on in clinic.
        </p>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: 'Total patients', value: '24' },
              { label: 'Slips · last 7 days', value: '6' },
              { label: 'Avg self-trust', value: '71' },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-md border border-gray-200 bg-gray-50 p-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  {c.label}
                </p>
                <p className="mt-3 font-serif text-3xl tracking-tight text-gray-900">
                  {c.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500">
              Real cohort view at /provider/cohort.
            </p>
            <Link
              href="/provider/cohort"
              className="rounded-full border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:border-orange-500 hover:text-orange-700"
            >
              Open cohort &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET — five bullets, editorial list. Same hairline-on-
          hairline rhythm as /pricing's tier feature list. */}
      <section className="mb-20 border-t border-gray-200 pt-12">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          What you get
        </p>
        <h2 className="mb-8 max-w-3xl font-serif text-3xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
          Built for the prescriber,{' '}
          <span className="italic text-orange-600">not the IT team.</span>
        </h2>
        <ul className="space-y-3">
          {WHAT_YOU_GET.map((line) => (
            <li
              key={line}
              className="flex items-start gap-3 border-b border-gray-100 pb-3 text-base leading-relaxed text-gray-800 last:border-0"
            >
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* PRICING — editorial pricing block. No tier cards. Two prices,
          on hairline rules. Same treatment as /glp1's GLP-1 Plus block. */}
      <section className="mb-20 border-t border-gray-200 pt-12">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          The deal
        </p>
        <h2 className="mb-8 max-w-3xl font-serif text-3xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
          Free to start.{' '}
          <span className="italic text-orange-600">Honest after that.</span>
        </h2>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="border-l-0 pl-0 md:border-l md:border-gray-200 md:pl-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
              Clinician Pro
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-5xl font-normal tracking-[-0.03em] text-gray-900 tabular-nums">
                Free
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-[1.55] text-gray-600">
              Forever-free for the clinician account. Dashboard, BAA,
              white-label — all included.
            </p>
          </div>

          <div className="border-l-0 pl-0 md:border-l md:border-gray-200 md:pl-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
              Patient seats
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-5xl font-normal tracking-[-0.03em] text-gray-900 tabular-nums">
                $9
              </span>
              <span className="text-sm text-gray-600">/patient/mo</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-[1.55] text-gray-600">
              First 5 patients on the clinic’s panel are free. After 5,
              $9/patient/mo — paid by patient or by clinic at negotiated
              PMPM.
            </p>
          </div>
        </div>
      </section>

      {/* THE ASK — one-line claim, single CTA. Same pattern /audit and
          /pricing close with. No second link competing for the click. */}
      <section className="mb-20 border-t border-orange-500 pt-12">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          The ask
        </p>
        <h2 className="mb-8 max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Onboard your first 5 patients{' '}
          <span className="italic text-orange-600">in 30 seconds.</span>
        </h2>
        <Link
          href="/clinician/onboarding"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start the clinic
          <span aria-hidden>&rarr;</span>
        </Link>
      </section>

      {/* RECURRING ANCHOR — the brand mantra. Appears on every wedge
          page so the visitor leaves with one phrase in their head. */}
      <section className="border-t border-gray-200 pt-12 text-center">
        <p className="font-serif text-2xl font-normal italic leading-[1.3] text-gray-700 md:text-3xl">
          AI for the moment before behavior happens.
        </p>
      </section>
    </>
  )
}
