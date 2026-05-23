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
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'


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
    status: 'Seat open — confirming Q3 2026',
    role: 'ex-Noom or ex-Headspace VP',
    bring: 'How a wellness platform actually scales user trust.',
  },
  {
    slot: 'Pharma commercial leader',
    status: 'Seat open — confirming Q3 2026',
    role: 'ex-Novo Nordisk or ex-Eli Lilly',
    bring: 'How a $400B pharma actually buys an adjacent capability.',
  },
  {
    slot: 'Clinical researcher',
    status: 'Seat open — confirming Q3 2026',
    role: 'JITAI specialist',
    bring: 'Whether the predictive model holds at scale.',
  },
  {
    slot: 'Mobile platform veteran',
    status: 'Seat open — confirming Q3 2026',
    role: 'ex-Apple Health',
    bring: 'Where the HealthKit story can actually go.',
  },
  {
    slot: 'Strategic finance advisor',
    status: 'Seat open — confirming Q3 2026',
    role: 'M&A in digital health',
    bring: 'Reading the right room at the right table.',
  },
  {
    slot: 'Behavioral neuroscience PhD',
    status: 'Seat open — confirming Q3 2026',
    role: 'habit research',
    bring: 'Whether the pattern-decay claim is real.',
  },
]

export default async function AdvisorsPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-advisors')

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

          <h1 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.025em] text-gray-900 md:text-7xl">
            Advisory board{' '}
            <span className="italic text-orange-600">forming.</span>
          </h1>

          <p className="max-w-2xl font-serif text-2xl font-normal italic leading-[1.35] text-gray-700 md:text-3xl">
            Public names land Q3 2026. The seats are mapped, the
            outreach is in motion, the placeholders are gone.
          </p>
        </header>

        {/* HONEST — one paragraph, not six cards. Per the May 2026
            audit pass: six "Seat open" cards read as "we have six
            empty seats" to any M&A or partner visitor; one
            paragraph reads as "here is the strategic plan, names
            land when names land." Cleaner signal, no shipped
            credibility damage. */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            The COYL advisory board is being assembled across six
            strategic seats: a behavioral-health operator (ex-Noom /
            ex-Headspace VP), a pharma commercial leader (ex-Novo
            Nordisk / ex-Eli Lilly), a JITAI clinical researcher, a
            mobile platform veteran (ex-Apple Health), a strategic
            finance advisor (M&amp;A in digital health), and a
            behavioral neuroscience PhD focused on habit research.
            Conversations are in flight. Public confirmations and
            named bios land in Q3 2026.
          </p>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            We&rsquo;re holding the seats open until the right
            voices commit — and not posting placeholder names while
            we wait. If you do work that maps to one of these
            seats, see the section below.
          </p>
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
