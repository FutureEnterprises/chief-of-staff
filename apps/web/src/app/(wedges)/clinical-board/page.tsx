/**
 * /clinical-board — the clinical advisory board.
 *
 * Companion to /advisors. The acquisition-roadmap doc treats the
 * clinical board as a distinct surface from the general advisory
 * board because the questions the clinical board answers are
 * categorically different: science, protocol, safety, IRB, regulatory.
 * An acquirer (especially pharma) reads the clinical board as the
 * answer to "does this thing actually work and is it safe."
 *
 * Strategy: same template as /advisors, four slots tuned to the four
 * loaded-bearing clinical questions. Names land as the GLP-1
 * weight-regain trial enrolls; until then the slots are honest.
 *
 * Photo placeholder convention mirrors /advisors:
 *   - Drop portraits at `apps/web/public/clinical-board/<name>.jpg`
 *     and swap the styled div for <Image .../> when ready.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'

/**
 * ROUND-3 AUDIT GATE — May 2026.
 *
 * Gated parallel to /advisors per founder decision. Returns 404 until
 * at least one credible clinical board member can be named publicly
 * (target: Q3 2026 with GLP-1 RCT enrollment). Flip GATE_ACTIVE →
 * false (or delete) to relight the page when a name confirms.
 */
const GATE_ACTIVE = true


export const metadata: Metadata = {
  title: 'Clinical board — the clinical eyes on the work · COYL',
  description:
    "COYL's clinical advisory board — researchers and clinicians who pressure-test the protocol and the science.",
  alternates: { canonical: '/clinical-board' },
  openGraph: {
    title: 'COYL Clinical board — the clinical eyes on the work',
    description:
      'Researchers and clinicians who pressure-test the protocol, the safety, and the science.',
    url: 'https://coyl.ai/clinical-board',
    images: [
      {
        url: '/api/og?title=The+clinical+eyes+on+the+work.&kicker=Clinical+board',
        width: 1200,
        height: 630,
      },
    ],
  },
}

/**
 * CLINICAL ROSTER
 * ---------------
 * Four slots matching the four load-bearing clinical questions:
 *   1. Does the predictive model hold at scale → PI on the weight-regain RCT.
 *   2. Is the moment-of-intervention safe → behavioral medicine clinician.
 *   3. Is the consent + IRB structure clean → bioethics specialist.
 *   4. Does the regulatory path exist → digital therapeutic reg expert.
 */
const CLINICAL = [
  {
    slot: 'Principal Investigator',
    name: 'Clinical advisor — pending trial enrollment',
    role: 'GLP-1 weight-regain trial',
    bring:
      'Whether COYL changes the outcome curve when medication runs out.',
  },
  {
    slot: 'Behavioral medicine clinician',
    name: 'Clinical advisor — pending trial enrollment',
    role: 'JITAI experience',
    bring:
      'Whether the moment-of-intervention is safe for the people most likely to need it.',
  },
  {
    slot: 'Bioethics + IRB specialist',
    name: 'Clinical advisor — pending trial enrollment',
    role: 'human-subjects research',
    bring: 'Whether consent, exit, and harm-minimisation are clean.',
  },
  {
    slot: 'Digital therapeutic regulatory expert',
    name: 'Clinical advisor — pending trial enrollment',
    role: 'FDA-regulated digital health',
    bring: 'Whether the path to a defensible regulatory posture exists.',
  },
]

export default async function ClinicalBoardPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-clinical-board')

  // Round-3 audit gate — return 404 until a credible name lands.
  if (GATE_ACTIVE) notFound()

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Clinical board', url: 'https://coyl.ai/clinical-board' },
        ]}
      />

      <article className="space-y-24 pb-12">
        {/* OPENING */}
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Clinical board
            </span>
          </div>

          <h1 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.025em] text-gray-900 md:text-7xl">
            Clinical board{' '}
            <span className="italic text-orange-600">forming with the trial.</span>
          </h1>

          <p className="max-w-2xl font-serif text-2xl font-normal italic leading-[1.35] text-gray-700 md:text-3xl">
            Names land as the GLP-1 weight-regain RCT enrolls. Public
            confirmations Q3 2026.
          </p>
        </header>

        {/* HONEST — one paragraph, not four cards. Per the May 2026
            audit pass: empty seats on a clinical board read as
            fragility to any acquirer doing diligence. One honest
            paragraph reads as "the work is in motion." Cards land
            when names land. */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            The COYL clinical advisory board carries four load-bearing
            seats: a Principal Investigator on the GLP-1 weight-regain
            RCT, a behavioral medicine clinician scoping the
            maintenance protocol, a digital therapeutic regulatory
            advisor (FDA pathway), and an IRB / ethics chair. The
            outreach is in motion alongside the trial enrollment
            timeline. Names land when names land.
          </p>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            We&rsquo;re not posting placeholder names on a clinical
            board. The seats are mapped against the four hardest
            questions any pharma or telehealth diligence asks:{' '}
            <em>does the model hold at scale, does the protocol
            survive clinical review, what&rsquo;s the regulatory path,
            and is the safety surface real.</em>{' '}
            If you do work on one of those four, see the section
            below.
          </p>
        </section>

        {/* HONEST NOTE — explains the empty slots without apologising */}
        <section className="border-l border-orange-500 pl-8 md:pl-10">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            A note
          </p>
          <p className="mt-6 font-serif text-2xl font-normal italic leading-[1.4] text-gray-900 md:text-3xl">
            Names land as the trial enrolls. Until then, the slots are
            honest about being open.
          </p>
        </section>

        {/* RELATED — link out to the work the board would oversee */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The work
            </span>
          </div>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-4xl">
            What the clinical board is pressure-testing.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            The research program, the trial design, and the outcomes COYL
            is committing to are public.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/research"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Research + outcomes
            </Link>
            <Link
              href="/clinical-study"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Clinical study
            </Link>
            <Link
              href="/advisors"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Advisory board
            </Link>
          </div>
        </section>
      </article>
    </>
  )
}
