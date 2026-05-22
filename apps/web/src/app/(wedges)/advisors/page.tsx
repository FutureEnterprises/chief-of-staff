/**
 * /advisors — the advisory board.
 *
 * The $6B Acquisition Roadmap doc names "no advisory board" as part of
 * the single largest fixable risk to the strategic exit. Even two named
 * advisors flips COYL from "anonymous research project" to "company an
 * acquirer can underwrite."
 *
 * Strategy:
 *   - Ship the page layout first. The slots are honest about being
 *     open. As real advisors confirm publicly, the founder edits this
 *     file directly — each placeholder is a self-contained card object
 *     in the ADVISORS array below.
 *   - Six slots, the four most acquisition-relevant skill rooms
 *     (behavioral health ops, pharma commercial, JITAI clinical,
 *     mobile health platforms) plus two adjacent rooms (M&A finance,
 *     behavioral neuroscience). This matches the strategic-acquirer
 *     map in the roadmap doc.
 *
 * Photo placeholder convention:
 *   - When an advisor confirms, drop the portrait at
 *     `apps/web/public/advisors/<lowercase-name>.jpg` and update the
 *     advisor's `photo` field to the path. The styled div renders
 *     until the asset lands.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

// ISR — static editorial content; 1-day revalidate window. Full cacheComponents migration with cacheTag-based surgical invalidation tracked as a follow-up.
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Advisors — the people in the room with us · COYL',
  description:
    "COYL's advisory board — operators and researchers across pharma, behavioral health, mobile platforms, and AI.",
  alternates: { canonical: '/advisors' },
  openGraph: {
    title: 'COYL Advisors — the people in the room with us',
    description:
      'Operators and researchers across pharma, behavioral health, mobile platforms, and AI.',
    url: 'https://coyl.ai/advisors',
    images: [
      {
        url: '/api/og?title=The+people+in+the+room+with+us.&kicker=Advisors',
        width: 1200,
        height: 630,
      },
    ],
  },
}

/**
 * ADVISOR ROSTER
 * --------------
 * Each entry is a single card. To confirm a real advisor:
 *   1. Replace `name` with the public name.
 *   2. Replace `role` with "Title · Company".
 *   3. Keep `bring` to one sentence — the "what they bring" line that
 *      makes the slot feel earned, not decorative.
 *   4. If a portrait is approved, add a `photo` field with the path
 *      under /public/advisors/.
 *
 * Order = strategic importance for the acquisition story. Pharma
 * commercial + behavioral health ops are the two rooms the doc names
 * as most load-bearing; they sit at the top.
 */
const ADVISORS = [
  {
    slot: 'Behavioral health operator',
    name: 'Advisor name — pending public confirmation',
    role: 'ex-Noom or ex-Headspace VP',
    bring: 'How a wellness platform actually scales user trust.',
  },
  {
    slot: 'Pharma commercial leader',
    name: 'Advisor name — pending public confirmation',
    role: 'ex-Novo Nordisk or ex-Eli Lilly',
    bring: 'How a $400B pharma actually buys an adjacent capability.',
  },
  {
    slot: 'Clinical researcher',
    name: 'Advisor name — pending public confirmation',
    role: 'JITAI specialist',
    bring: 'Whether the predictive model holds at scale.',
  },
  {
    slot: 'Mobile platform veteran',
    name: 'Advisor name — pending public confirmation',
    role: 'ex-Apple Health',
    bring: 'Where the HealthKit story can actually go.',
  },
  {
    slot: 'Strategic finance advisor',
    name: 'Advisor name — pending public confirmation',
    role: 'M&A in digital health',
    bring: 'Reading the right room at the right table.',
  },
  {
    slot: 'Behavioral neuroscience PhD',
    name: 'Advisor name — pending public confirmation',
    role: 'habit research',
    bring: 'Whether the pattern-decay claim is real.',
  },
]

export default function AdvisorsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Advisors', url: 'https://coyl.ai/advisors' },
        ]}
      />

      <article className="space-y-24 pb-12">
        {/* OPENING */}
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Advisory board
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            The people in the room{' '}
            <span className="italic text-orange-600">with us.</span>
          </h1>

          <p className="max-w-2xl font-serif text-2xl font-normal italic leading-[1.35] text-gray-700 md:text-3xl">
            Operators and researchers who push us harder than we push
            ourselves.
          </p>
        </header>

        {/* ADVISOR GRID — 2 columns on md+, single column on mobile */}
        <section className="grid grid-cols-1 gap-8 border-t border-gray-200 pt-16 md:grid-cols-2 md:gap-10">
          {ADVISORS.map((advisor) => (
            <article
              key={advisor.slot}
              className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 md:flex-row md:items-start md:p-8"
            >
              {/*
                ADVISOR PORTRAIT PLACEHOLDER
                ----------------------------
                When confirmed, drop the portrait at:
                  apps/web/public/advisors/<lowercase-name>.jpg
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

        {/* JOIN US */}
        <section className="space-y-6 border-t border-orange-500 pt-16">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Join us
            </span>
          </div>

          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-5xl">
            If you do work that maps to one of these slots&hellip;
          </h2>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            &hellip;and you&rsquo;d push on COYL, write{' '}
            <Link
              href="mailto:iman@coyl.ai"
              className="text-orange-600 underline-offset-4 hover:underline"
            >
              iman@coyl.ai
            </Link>
            . The bar is one sentence: a thing you would change about the
            company by the end of the first conversation.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/about"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Read the company story
            </Link>
            <Link
              href="/clinical-board"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              See the clinical board
            </Link>
          </div>
        </section>
      </article>
    </>
  )
}
