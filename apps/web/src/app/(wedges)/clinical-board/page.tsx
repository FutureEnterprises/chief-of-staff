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
import { BreadcrumbSchema } from '@/app/structured-data'

// ISR — static editorial content; 1-day revalidate window. Full cacheComponents migration with cacheTag-based surgical invalidation tracked as a follow-up.
export const revalidate = 86400

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

export default function ClinicalBoardPage() {
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

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            The clinical eyes{' '}
            <span className="italic text-orange-600">on the work.</span>
          </h1>

          <p className="max-w-2xl font-serif text-2xl font-normal italic leading-[1.35] text-gray-700 md:text-3xl">
            Researchers and clinicians who pressure-test the science, the
            protocol, the safety, and the claims.
          </p>
        </header>

        {/* CLINICAL GRID — same template as /advisors, 4 slots */}
        <section className="grid grid-cols-1 gap-8 border-t border-gray-200 pt-16 md:grid-cols-2 md:gap-10">
          {CLINICAL.map((advisor) => (
            <article
              key={advisor.slot}
              className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 md:flex-row md:items-start md:p-8"
            >
              {/*
                CLINICAL ADVISOR PORTRAIT PLACEHOLDER
                -------------------------------------
                When confirmed, drop the portrait at:
                  apps/web/public/clinical-board/<lowercase-name>.jpg
                And swap this styled div for next/image with a real src.
              */}
              <div
                aria-hidden
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-100 via-orange-50 to-[#fafaf7]"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-2xl italic text-gray-300">
                    {advisor.slot
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {advisor.slot}
                </p>
                <h2 className="font-serif text-xl font-normal leading-[1.15] tracking-[-0.015em] text-gray-900">
                  {advisor.name}
                </h2>
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-gray-500">
                  {advisor.role}
                </p>
                <p className="pt-2 text-sm leading-[1.7] text-gray-700">
                  {advisor.bring}
                </p>
              </div>
            </article>
          ))}
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
