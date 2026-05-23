import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'
import {
  CinematicScrim,
  CinematicEyebrow,
  CinematicDisplay,
  CinematicBody,
} from '@/components/cinematic'
import { allReboundFamilies } from '@/lib/rebound-archetype'

/**
 * /rebound/for-clinicians — the GLP-1 prescriber one-pager.
 *
 * Built per the May 2026 audit instruction: "Start prescriber outreach
 * now. Make a short clinical one-pager and send it to 50 high-profile
 * GLP-1 prescribers on X/LinkedIn. Offer them free access to Rebound
 * with a co-branded landing page; a handful of enthusiastic prescribers
 * can expose you to thousands of high-risk patients."
 *
 * Sibling to /clinician (the general clinic acquisition page). This one
 * is GLP-1-specific, sits inside the Rebound consumer funnel, and is
 * shaped for a single use: a prescriber reading on their phone between
 * patients after a cold DM. Scannable in <3 minutes. One ask. One CTA.
 *
 * Structure:
 *   1. Hero — Cambridge meta-analysis stat as the lead claim
 *   2. The clinical problem (month 7, the prescription ends, the
 *      patient calls in October weighing more than they started)
 *   3. The four maintenance phenotypes (Night / Weekend / Stress /
 *      Reward Rebounders) — pulled from lib/rebound-archetype so the
 *      copy stays in sync with the consumer quiz
 *   4. The offer — free for the first 25 patients on the panel,
 *      $9/patient/mo after, co-branded /rebound landing page with the
 *      clinic logo + NPI
 *   5. The ask — /clinician/onboarding (existing 4-step flow)
 *
 * Visual: matches /rebound — CinematicScrim hero (dark warm-charcoal),
 * cream body, Instrument Serif italic accents, signature orange. Reads
 * as a chapter in the Rebound consumer funnel the patient will land in.
 *
 * Citations: Cambridge meta-analysis on GLP-1 discontinuation regain.
 * The /rebound landing page already uses the "60% within a year" line;
 * this page makes it the primary clinical hook.
 */

const PAGE_TITLE = 'Rebound for GLP-1 prescribers — the behavioral layer your patients are missing'
const PAGE_DESCRIPTION =
  '60% of the weight your patients lost on Ozempic, Wegovy, or Zepbound comes back within a year of stopping. COYL Rebound catches the four maintenance patterns underneath. Free for your first 25 patients, co-branded landing page included.'

const OG_URL =
  '/api/og?' +
  'variant=archetype' +
  '&family=' + encodeURIComponent('Rebound for prescribers') +
  '&signature=' + encodeURIComponent('"60% comes back within a year."') +
  '&stat=' + encodeURIComponent('Cambridge meta-analysis · GLP-1 discontinuation') +
  '&specific=' + encodeURIComponent('Free for your first 25 patients') +
  '&cta=' + encodeURIComponent('Onboard your clinic') +
  '&ctaUrl=' + encodeURIComponent('coyl.ai/rebound/for-clinicians')

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'glp-1 prescriber',
    'ozempic clinician',
    'wegovy provider',
    'zepbound prescriber',
    'glp-1 maintenance behavioral support',
    'weight regain after glp-1',
    'glp-1 discontinuation rebound',
    'endocrinologist obesity medicine app',
    'clinical-grade behavioral intervention',
  ],
  alternates: { canonical: '/rebound/for-clinicians' },
  openGraph: {
    title: 'COYL Rebound — for GLP-1 prescribers',
    description:
      '60% of the weight your patients lost on Ozempic comes back within a year. COYL Rebound catches the four patterns underneath. Free for your first 25 patients.',
    url: 'https://coyl.ai/rebound/for-clinicians',
    siteName: 'COYL',
    images: [
      {
        url: OG_URL,
        width: 1200,
        height: 630,
        alt: 'COYL Rebound — GLP-1 prescriber one-pager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Rebound for GLP-1 prescribers',
    description:
      '60% of the weight your patients lost comes back within a year. COYL Rebound catches the four maintenance patterns underneath.',
    images: [OG_URL],
  },
}

// Three clinical moments the prescriber actually recognizes. The same
// editorial pattern /clinician uses, but reframed for the GLP-1 follow-
// up visit. Reads like a Sequel pull-quote: kicker label, italic
// headline, body that finishes the thought.
const CLINICAL_MOMENTS = [
  {
    kicker: 'Month 3',
    headline: 'The 18% loss. The chart looks like a win.',
    body: 'The shot is working. Appetite is quiet. The patient is grateful. You schedule the next follow-up six months out because nothing about the chart says you need to see them sooner. The behavioral pattern that put the weight on in the first place is untouched, but nothing in the visit surfaces it.',
  },
  {
    kicker: 'Month 7',
    headline: 'Insurance drops coverage. Or the patient tapers.',
    body: 'The dose comes down. The appetite returns — but the appetite was never the only thing. The 9 PM script, the Saturday afternoon collapse, the post-deadline reward — none of it was trained while the medication was doing the work. You won\'t see this in a chart for another four months.',
  },
  {
    kicker: 'Month 11',
    headline: 'The October follow-up. The weight is back.',
    body: 'Your patient is sitting in front of you having gained back most of what they lost, asking if the shot can go back up. The Cambridge meta-analysis predicted this — 60% regain within a year of discontinuation. COYL would have caught it in the late-night phone unlock at month 6.',
  },
] as const

export default async function ReboundForCliniciansPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-rebound-clinicians')

  const families = allReboundFamilies()

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Rebound', url: 'https://coyl.ai/rebound' },
          {
            name: 'For clinicians',
            url: 'https://coyl.ai/rebound/for-clinicians',
          },
        ]}
      />

      {/* HERO — cinematic scrim with the Cambridge stat as the lead.
          Bleeds past the (wedges) layout padding so the panel feels
          like a chapter cover, not a section. */}
      <CinematicScrim
        bleedToCream
        className="-mx-6 -mt-24 px-6 pt-32 pb-24 md:-mx-12 md:px-12 md:pt-40 md:pb-32"
      >
        <header className="mx-auto max-w-5xl space-y-10">
          <CinematicEyebrow label="COYL Rebound · for GLP-1 prescribers" />
          <CinematicDisplay as="h1" variant="hero">
            60% of the weight your patients lost{' '}
            <span className="italic text-orange-300">
              comes back within a year of stopping.
            </span>
          </CinematicDisplay>
          <CinematicBody>
            The Cambridge meta-analysis on GLP-1 discontinuation
            (Wilding et&nbsp;al., 2022) is the cleanest number we have on
            the rebound. The medication suppressed appetite. It
            didn&rsquo;t train the pattern underneath. When the dose
            drops, the pattern returns — and your panel sees it in the
            month-11 follow-up.
          </CinematicBody>
          <CinematicBody tone="dim">
            COYL Rebound is the behavioral layer that runs while the
            shot is doing the work and after it stops. Four GLP-1-
            specific maintenance phenotypes. A 3-second interrupt at
            the moment the script fires. Built for the prescriber who
            wants to see the slip before the October phone call.
          </CinematicBody>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/clinician/onboarding?ref=rebound-clinician"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] transition-transform hover:-translate-y-0.5"
            >
              Onboard your clinic — first 25 patients free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M1 7h12m0 0L8 2m5 5L8 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <a
              href="mailto:clinicians@coyl.ai?subject=Rebound%20pilot%20--%20clinic%20outreach"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-[#e7dccb] hover:border-orange-300 hover:text-orange-300"
            >
              clinicians@coyl.ai →
            </a>
          </div>
        </header>
      </CinematicScrim>

      <article className="space-y-24 pb-12">
        {/* THE CLINICAL ARC — three moments that map to the panel-level
            rebound the prescriber will see in their own follow-ups.
            Same editorial chain /clinician uses but reframed for the
            GLP-1 timeline specifically. */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The arc you already see
            </span>
          </div>
          <h2 className="mb-12 max-w-3xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Three follow-ups,{' '}
            <span className="italic text-orange-600">one pattern.</span>
          </h2>
          <div className="space-y-12">
            {CLINICAL_MOMENTS.map((m) => (
              <article key={m.headline} className="border-t border-gray-200 pt-10">
                <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {m.kicker}
                </p>
                <h3 className="mb-4 max-w-3xl font-serif text-2xl font-normal italic leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                  {m.headline}
                </h3>
                <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
                  {m.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* THE FOUR PHENOTYPES — pulled directly from lib/rebound-
            archetype so the clinician sees the same taxonomy the
            patient takes the quiz on. Stripped of the share-card
            theatrics — kept as a clean four-card phenotype grid the
            prescriber can recognize from their own panel. */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The maintenance phenotypes
            </span>
          </div>
          <h2 className="mb-6 max-w-3xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Four patterns. Four{' '}
            <span className="italic text-orange-600">interrupt protocols.</span>
          </h2>
          <p className="mb-10 max-w-2xl text-base leading-[1.7] text-gray-700">
            Every GLP-1 patient on your panel resolves to one of these
            four. The quiz at <Link href="/rebound/quiz" className="text-orange-700 underline-offset-4 hover:underline">/rebound/quiz</Link>{' '}
            assigns the phenotype in 60 seconds. The phenotype determines
            the danger window, the signature script, and the interrupt
            COYL fires.
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {families.map((f) => {
              const Icon = f.Icon
              return (
                <div
                  key={f.slug}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      aria-hidden
                      className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <h3 className="font-serif text-xl font-normal italic leading-tight tracking-[-0.01em] text-gray-900 md:text-2xl">
                      {f.name}
                    </h3>
                  </div>
                  <p className="mb-4 text-sm leading-[1.65] text-gray-700">
                    {f.essence}
                  </p>
                  <div className="mb-3 rounded-lg border-l-[3px] border-orange-500/60 bg-orange-500/5 px-3 py-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-orange-700">
                      Danger window
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {f.riskWindow}
                    </p>
                  </div>
                  <p className="text-xs italic leading-relaxed text-gray-600">
                    {f.prevalenceCopy}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* THE OFFER — the audit's specific ask: free for the first 25
            patients, co-branded landing page included. Two-column
            editorial pricing block, same shape as /clinician but
            calibrated for the cold-outreach prescriber. */}
        <section className="border-t border-gray-200 pt-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The pilot offer
            </span>
          </div>
          <h2 className="mb-10 max-w-3xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Free for your first 25 patients.{' '}
            <span className="italic text-orange-600">Honest after that.</span>
          </h2>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="border-l-0 pl-0 md:border-l md:border-gray-200 md:pl-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                The pilot — 90 days
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-5xl font-normal tracking-[-0.03em] text-gray-900 tabular-nums">
                  Free
                </span>
                <span className="text-sm text-gray-600">· first 25 patients</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-[1.6] text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                  <span>Co-branded /rebound landing page with your clinic name and NPI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                  <span>Direct enrollment link you hand a patient at the visit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                  <span>Real-time pre-slip signal on every patient — week-over-week</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                  <span>HIPAA-aware data layer, BAA executed before the pilot starts</span>
                </li>
              </ul>
            </div>

            <div className="border-l-0 pl-0 md:border-l md:border-gray-200 md:pl-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                After the pilot
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-5xl font-normal tracking-[-0.03em] text-gray-900 tabular-nums">
                  $9
                </span>
                <span className="text-sm text-gray-600">/patient/mo</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-[1.6] text-gray-600">
                Per-patient seat. Paid by the patient on the consumer
                Rebound tier, or by the clinic at a negotiated PMPM.
                Clinician dashboard, BAA, and white-label included at no
                additional cost.
              </p>
              <p className="mt-4 max-w-xs text-xs leading-[1.6] text-gray-500">
                The math: if 60% of GLP-1 patients regain within a year
                and one preserved patient is worth $1,200&ndash;$2,400 in
                avoided escalation, this prices in below the noise.
              </p>
            </div>
          </div>
        </section>

        {/* THE ASK — single CTA. Reuse /clinician/onboarding so we don't
            fork onboarding flows. The ref query param lets the audit
            funnel telemetry attribute the signup to the prescriber
            channel. */}
        <section className="border-t border-orange-500 pt-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The ask
            </span>
          </div>
          <h2 className="mb-8 max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Onboard the clinic.{' '}
            <span className="italic text-orange-600">Pick your first 25 patients.</span>
          </h2>
          <p className="mb-8 max-w-2xl text-base leading-[1.7] text-gray-700">
            Four screens — clinic name + NPI, patient population, SSO
            setup, BAA execution. Under five minutes. You leave the flow
            with a co-branded /rebound URL you can hand to the next
            patient on the calendar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/clinician/onboarding?ref=rebound-clinician-ask"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Start the clinic
              <span aria-hidden>&rarr;</span>
            </Link>
            <Link
              href="/rebound/quiz"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3.5 text-sm font-medium text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
            >
              Take the patient quiz yourself
            </Link>
          </div>
        </section>

        {/* CITATIONS — single line of attribution. The Cambridge meta-
            analysis is the clinical hook; the COYL maintenance protocol
            cohort line is the COYL-side claim. Both stated honestly. */}
        <section className="border-t border-gray-200 pt-10">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            Citations
          </p>
          <ul className="mt-4 space-y-3 text-xs leading-[1.7] text-gray-600">
            <li>
              Wilding JPH, Batterham RL, Davies M, et&nbsp;al. Weight
              regain and cardiometabolic effects after withdrawal of
              semaglutide. <em>Diabetes Obes Metab.</em> 2022;24(8):
              1553&ndash;1564. STEP&nbsp;1 extension trial. Patients
              regained ~two-thirds of prior weight loss within one year
              of treatment discontinuation.
            </li>
            <li>
              Per-phenotype prevalence ranges are derived from the COYL
              maintenance protocol pre-launch cohort and the
              danger-window-learner priors. Until N&nbsp;&gt;&nbsp;20
              these are pre-cohort ranges, not finalized published
              statistics &mdash; surfaced for clinical judgment, not
              regulatory claims.
            </li>
          </ul>
        </section>

        {/* RECURRING ANCHOR — same brand mantra every wedge page closes
            on. Keeps the prescriber leaving with one phrase. */}
        <section className="border-t border-gray-200 pt-12 text-center">
          <p className="font-serif text-2xl font-normal italic leading-[1.3] text-gray-700 md:text-3xl">
            AI for the moment before behavior happens.
          </p>
        </section>
      </article>
    </>
  )
}
