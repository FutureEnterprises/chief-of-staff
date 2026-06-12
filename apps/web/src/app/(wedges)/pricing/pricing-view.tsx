/**
 * THREE-TIER STRUCTURE — May 2026 GLP-1 Rebound pivot.
 *
 * Per the founder strategic decision: three tiers with clear
 * audience segmentation.
 *
 *   - Recover (free)         → audit + archetype + 3 interrupts/week
 *   - Rewire ($12/mo, $99/yr) → generic behavioral interrupt product
 *   - Rebound ($29/mo, $199/yr) → GLP-1 anti-regain layer with the
 *                                 4-archetype regain risk taxonomy
 *
 * Recover + Rewire are the same product split by depth; Rebound is
 * the separate GLP-1-specific tier with the rebound-window protocol,
 * the clinician summary export, and the four rebound archetypes
 * (Night / Weekend / Stress / Reward Rebounder).
 *
 * The B2B PMPM calculator is reused below the consumer tiers as the
 * enterprise band — explicitly labeled "For teams + clinics" so the
 * consumer reader doesn't confuse the two motions.
 *
 * Editorial treatment: Instrument Serif on the price numerals,
 * italic-orange tier labels, hairline rules between sections,
 * generous whitespace. Orange-500/600 stays the single accent.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Check, ArrowRight } from 'lucide-react'
import { PMPMCalculator } from '@/components/teams/pmpm-calculator'
import {
  CinematicScrim,
  CinematicEyebrow,
  CinematicBody,
} from '@/components/cinematic'

type Interval = 'monthly' | 'annual'

const FAQ = [
  {
    q: 'Why pay anything? Doesn’t willpower work?',
    a: 'For some people on some weeks. The reason you keep losing in the same exact moments is that the script is faster than your willpower. COYL fires before the script. That’s what you’re paying for — at $12/mo, less than one bad night out.',
  },
  {
    q: 'Why three tiers? You used to have one.',
    a: 'Two of them — Recover (free) and Rewire ($12/mo) — are the same product split by depth. Rebound ($29/mo) is the separate one. It targets the GLP-1 maintenance moment specifically: the 9 PM kitchen after the shot wears off, the weekend script, the post-taper relapse window. Different stakes, different protocol, different price. If you are not on a GLP-1, Rewire is enough.',
  },
  {
    q: 'I’m on Ozempic / Wegovy / Zepbound. Which plan?',
    a: 'Rebound. It is built specifically for the GLP-1 maintenance moment — the 9 PM kitchen, the weekend collapse, the stress-eating loop, the reward script the shot does not catch. $29/mo (or $199 for the year). Rewire works too, but Rebound carries the rebound-window protocol, the clinician summary export, and the four-archetype regain risk quiz. If you are paying for a GLP-1, you want the maintenance protocol that matches it.',
  },
  {
    q: 'How is this different from Noom?',
    a: 'Noom is daily-log coaching. COYL is moment-of-decision interruption. Noom asks you to journal what you ate. COYL fires at the exact second you’re standing in front of the fridge. Different products, different surfaces.',
  },
  {
    q: 'Why is annual cheaper? Is it just a discount?',
    a: 'Yes — and the discount is intentional. Annual is the stake. Putting $99 (Rewire) or $199 (Rebound) against your pattern at year-zero is the commitment that makes the maintenance protocol work. The savings come along for the ride: Rewire annual = $8.25/mo equivalent, Rebound annual = $16.58/mo equivalent. We do not hide the math. We just frame what the money is buying — a year-long commitment to your own pattern, not a coupon to win on the way out.',
  },
  {
    q: 'Can I cancel?',
    a: 'Anytime, no questions, prorated. We don’t guilt-trip cancellations. The whole product is built on the premise that punishment doesn’t change behavior.',
  },
  {
    q: 'Is this medical or treatment?',
    a: 'No. COYL is behavioral support, not medical treatment or diagnosis. Always work with your doctor for any clinical concerns.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your account stays on Free. Your slips, commitments, and pattern data stay yours — you can export or delete at any time from /settings.',
  },
]

export function PricingView() {
  const [interval, setInterval] = useState<Interval>('monthly')

  // Annual is the commitment frame; the savings are real but secondary.
  // Rewire: $12/mo monthly → $99/yr annual = $8.25/mo equivalent (31% off).
  // Rebound: $29/mo monthly → $199/yr annual = $16.58/mo equivalent (43% off).
  // We surface the equivalent-per-month price (no % off marketing) and let
  // the cohort math do the work: locking GLP-1 patients into a year of
  // maintenance is the retention lever that matters most for the wedge.
  const corePrice = interval === 'monthly' ? '12' : '8.25'
  const coreCadence = interval === 'monthly' ? '/mo' : '/mo, billed yearly'
  const reboundPrice = interval === 'monthly' ? '29' : '16.58'
  const reboundCadence = interval === 'monthly' ? '/mo' : '/mo, billed yearly'

  return (
    <div className="space-y-24 pb-12">
      <CinematicScrim bleedToCream className="-mx-6 -mt-24 px-6 pt-32 pb-20 md:-mx-12 md:px-12 md:pt-40 md:pb-28">
        <header className="mx-auto max-w-5xl space-y-10">
          <CinematicEyebrow label="Pricing" />
          <h1 className="font-serif text-5xl font-normal leading-[0.98] tracking-[-0.025em] text-[#f8f1e4] md:text-[6.5rem]">
            Three plans.<br />
            <span className="italic text-orange-300">Pick the one for you.</span>
          </h1>
          <CinematicBody>
            <strong className="font-serif font-normal italic text-[#f8f1e4]">
              Generic behavioral patterns?
            </strong>{' '}
            Recover (free) or Rewire ($12/mo).{' '}
            <strong className="font-serif font-normal italic text-[#f8f1e4]">
              On Ozempic, Wegovy, or Zepbound and worried about regain?
            </strong>{' '}
            Rebound ($29/mo) is built for you.
          </CinematicBody>
        </header>
      </CinematicScrim>

      <header className="space-y-10">
        {/* Monthly / Annual toggle — annual is the commitment device, not the discount */}
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setInterval('monthly')}
            aria-pressed={interval === 'monthly'}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
              interval === 'monthly'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_12px_rgba(255,102,0,0.3)]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval('annual')}
            aria-pressed={interval === 'annual'}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
              interval === 'annual'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_12px_rgba(255,102,0,0.3)]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-1.5 font-mono text-[9px] uppercase tracking-widest text-orange-700">
              commit
            </span>
          </button>
        </div>
      </header>

      {/* Three editorial tier cards: Recover (free) + Rewire (paid generic)
          + Rebound (paid GLP-1). Each card carries a "FOR" tag at the
          top so the segmentation is immediate — generic-behavior visitors
          read left-to-right toward Rewire; GLP-1 visitors see Rebound
          highlighted as the right answer for their use case. */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Free — the sample */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col border-t border-gray-200 pt-10"
        >
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-600">
            Recover
          </p>
          <p className="mb-10 mt-4 max-w-md font-serif text-2xl font-normal italic leading-[1.2] text-gray-900">
            Find your pattern. Free, forever.
          </p>

          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-serif text-7xl font-normal tracking-[-0.03em] text-gray-900">
              $0
            </span>
            <span className="text-sm text-gray-600">forever</span>
          </div>
          <p className="mb-10 max-w-md text-sm leading-[1.65] text-gray-600">
            Run the audit. Get your archetype card. Three interrupts a week,
            enough to feel the pattern get caught. No card required.
          </p>

          <Link
            href="/sign-up?ref=pricing-free"
            className="mb-10 inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-900 transition-all duration-200 hover:border-orange-400"
          >
            Take the audit
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <ul className="space-y-3">
            {[
              'Self-sabotage audit + archetype card',
              '3 interrupts / week',
              'Morning + night check-ins',
              'Self-trust score',
              'Basic autopilot map',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Core — the one paid tier */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="flex flex-col border-t border-orange-500 pt-10"
        >
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] italic text-orange-600">
            Rewire
          </p>
          <p className="mb-10 mt-4 max-w-md font-serif text-2xl font-normal italic leading-[1.2] text-gray-900">
            Catch yourself. Every time.
          </p>

          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-serif text-7xl font-normal tracking-[-0.03em] text-gray-900 tabular-nums">
              ${corePrice}
            </span>
            <span className="text-sm text-gray-600">{coreCadence}</span>
          </div>
          <p className="mb-10 max-w-md text-sm leading-[1.65] text-gray-600">
            {interval === 'monthly' ? (
              <>
                Everything COYL does. Unlimited interrupts, recovery engine,
                pattern detection, autopilot map. Cancel anytime.
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-900">Annual · $99. Commit to the year.</span>{' '}
                Put $99 against your pattern. That’s the stake. Not a discount —
                a commitment device.
              </>
            )}
          </p>

          <Link
            href={`/sign-up?ref=pricing-core-${interval}`}
            className="mb-10 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all duration-200 hover:shadow-[0_0_28px_rgba(255,102,0,0.5)]"
          >
            {interval === 'monthly' ? 'Start Rewire · $12/mo' : 'Commit · $99/year'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <ul className="space-y-3">
            {[
              'Everything in Recover',
              'Unlimited interrupts at your danger windows',
              'Full rescue flows',
              'Recovery engine — no Monday reset',
              'Pattern detection + autopilot map',
              'AI assessments (Considerate + No-BS)',
              'Daily email briefings',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Rebound — the GLP-1-specific tier. Visually emphasized
            (orange-tinted card surface + "FOR GLP-1" tag) so the visitor
            on Ozempic/Wegovy/Zepbound recognizes "this one is for me"
            without reading the feature list. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4 }}
          className="relative flex flex-col rounded-2xl border-2 border-orange-500 bg-gradient-to-br from-orange-50 via-white to-white p-8 shadow-[0_24px_60px_-24px_rgba(255,102,0,0.25)]"
        >
          <div className="absolute -top-3 left-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_16px_rgba(255,102,0,0.35)]">
              For GLP-1 maintenance
            </span>
          </div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] italic text-orange-700">
            Rebound
          </p>
          <p className="mb-10 mt-4 max-w-md font-serif text-2xl font-normal italic leading-[1.2] text-gray-900">
            Hold your patterns steady after the shot.
          </p>

          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-serif text-7xl font-normal tracking-[-0.03em] text-gray-900 tabular-nums">
              ${reboundPrice}
            </span>
            <span className="text-sm text-gray-600">{reboundCadence}</span>
          </div>
          <p className="mb-10 max-w-md text-sm leading-[1.65] text-gray-600">
            {interval === 'monthly' ? (
              <>
                The anti-regain layer for people on or tapering off
                Ozempic, Wegovy, or Zepbound. Targets the 9 PM kitchen,
                weekend collapse, stress eating, and reward-language
                scripts the shot doesn&rsquo;t catch.
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-900">Annual · $199. Commit to the year.</span>{' '}
                Less than one regain week. Equivalent to $16.58/mo
                — the year is the stake the maintenance protocol is
                built around.
              </>
            )}
          </p>

          <Link
            href={`/sign-up?ref=pricing-rebound-${interval}`}
            className="mb-10 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all duration-200 hover:shadow-[0_0_28px_rgba(255,102,0,0.5)]"
          >
            {interval === 'monthly' ? 'Start Rebound · $29/mo' : 'Commit · $199/year'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <ul className="space-y-3">
            {[
              'Everything in Rewire',
              'Regain Risk Quiz + your rebound archetype',
              'Highest-risk-window-specific interrupts (9 PM, weekend, stress, reward)',
              'GLP-1 maintenance protocol (post-taper relapse-prevention plan)',
              'Clinician summary export for your prescriber',
              'Cambridge meta-analysis-grounded pattern tracking',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs leading-[1.5] text-gray-500">
            Behavioral support, not medical treatment. Talk to your
            prescriber about dosing and taper schedule.
          </p>
        </motion.div>
      </section>

      {/* Rebound deep-dive hand-off — Rebound is now an in-page tier
          card, but the dedicated /rebound landing carries the
          maintenance research (60% regain stat), the four-family
          breakdown, and the clinic channel pricing. High-intent GLP-1
          visitors get the deeper read. */}
      <section className="border-t border-orange-500 pt-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              On a GLP-1 and want the deeper read?
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-4xl">
              The Rebound maintenance{' '}
              <span className="italic text-orange-600">research + protocol.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-[1.65] text-gray-600">
              The Cambridge meta-analysis (60% regain at one year), the
              four rebound archetypes (Night / Weekend / Stress / Reward),
              the clinic channel pricing for prescribers and medspas.
            </p>
          </div>
          <Link
            href="/rebound"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-500 bg-white px-6 py-3 text-sm font-medium text-orange-700 transition-all hover:bg-orange-50"
          >
            See Rebound in full
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Enterprise band — labeled clearly so consumer readers don't trip. */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            For teams + clinics
          </span>
        </div>
        <div className="max-w-3xl space-y-4">
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Running this for a panel?<br />
            <span className="italic text-orange-600">PMPM, not per-seat.</span>
          </h2>
          <p className="text-base leading-[1.7] text-gray-700">
            Clinics, telehealth groups, and employers run COYL on member panels
            with outcomes-tracked enrollment. Slide your headcount; the price
            is the price. No “contact us” gating.
          </p>
        </div>

        <PMPMCalculator />
      </section>

      {/* Three-beat trust band — kept from prior version, still relevant */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            What you get on every tier
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Recover is real software, <span className="italic text-orange-600">not a 7-day demo.</span>
        </h2>
        <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
          Rewire adds depth, not gates around the basics.
        </p>
        <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-3">
          {[
            {
              n: '01',
              h: 'No data hostage.',
              b: 'Cancel and you keep your slips, commitments, and pattern data. Export anytime.',
            },
            {
              n: '02',
              h: 'No shame UX.',
              b: 'Streaks are un-breakable. Patterns defeated > consecutive days.',
            },
            {
              n: '03',
              h: 'Not medical treatment.',
              b: 'Behavioral support only. Always work with your doctor for clinical concerns.',
            },
          ].map((b) => (
            <div key={b.n} className="border-t border-orange-500 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                {b.n}
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                {b.h}
              </h3>
              <p className="mt-3 text-base leading-[1.65] text-gray-700">{b.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            FAQ
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Honest answers, <span className="italic text-orange-600">before you sign up.</span>
        </h2>
        <div className="pt-4">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group border-t border-gray-200 py-6 open:border-orange-500"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-6 font-serif text-xl font-normal leading-[1.3] tracking-[-0.01em] text-gray-900 marker:hidden [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span
                  aria-hidden
                  className="mt-1 font-mono text-base text-orange-600 transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-3xl text-base leading-[1.7] text-gray-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 pt-16">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sign-up?ref=pricing-bottom"
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            Start free
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
          >
            How it works
          </Link>
        </div>
      </section>
    </div>
  )
}
