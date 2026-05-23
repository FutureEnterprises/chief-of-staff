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

export const metadata: Metadata = {
  title:
    'COYL Rebound — the anti-regain layer for GLP-1 users · Ozempic, Wegovy, Zepbound',
  description:
    'When the GLP-1 shot gets quiet, the 9 PM script comes back. 60% of the weight lost on Ozempic / Wegovy / Zepbound returns within a year of stopping. COYL trains the pattern that keeps the weight off — a behavioral support layer for the moment the medication stops doing the work.',
  keywords: [
    'glp-1 weight regain',
    'stopping ozempic weight gain',
    'ozempic rebound',
    'wegovy maintenance',
    'zepbound rebound',
    'glp-1 discontinuation',
    'weight regain after glp-1',
    'glp-1 maintenance app',
    'late-night eating glp-1',
    'glp-1 behavioral support',
  ],
  alternates: { canonical: '/rebound' },
  openGraph: {
    title:
      'COYL Rebound — the anti-regain layer for GLP-1 users',
    description:
      'The shot quiets hunger. COYL trains the pattern that keeps the weight off. 60% of the weight you lost on Ozempic comes back within a year of stopping — unless you change the pattern underneath.',
    url: 'https://coyl.ai/rebound',
    images: [
      {
        url: '/api/og?title=The+shot+quiets+hunger.+COYL+trains+the+pattern.&kicker=Rebound',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Rebound — anti-regain for GLP-1',
    description:
      'The shot quiets hunger. COYL trains the pattern that keeps the weight off.',
    images: [
      '/api/og?title=The+shot+quiets+hunger.+COYL+trains+the+pattern.&kicker=Rebound',
    ],
  },
}

export default async function ReboundPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-rebound')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Rebound', url: 'https://coyl.ai/rebound' },
        ]}
      />

      {/* HERO — cinematic dark scrim, the same visual language as the
          homepage so a paid-acquisition visitor (Ozempic-stopping
          keyword search, GLP-1 maintenance ad) lands in a coherent
          chapter. */}
      <CinematicScrim
        bleedToCream
        className="-mx-6 -mt-24 px-6 pt-32 pb-24 md:-mx-12 md:px-12 md:pt-40 md:pb-32"
      >
        <header className="mx-auto max-w-5xl space-y-10">
          <CinematicEyebrow label="COYL Rebound · GLP-1 anti-regain layer" />
          <CinematicDisplay as="h1" variant="hero">
            The shot quiets hunger.
            <br />
            <span className="italic text-orange-300">
              COYL trains the pattern that keeps the weight off.
            </span>
          </CinematicDisplay>
          <CinematicBody>
            You lost 40, 60, 80 pounds on Ozempic or Wegovy or Zepbound.
            The shot did the appetite work. Now you&rsquo;re tapering, or
            stopping, or terrified of the day insurance drops coverage —
            and you remember what the 9 PM kitchen felt like before. The
            shot quieted that voice. It didn&rsquo;t train it.
          </CinematicBody>
          <CinematicBody tone="dim">
            That&rsquo;s the COYL Rebound layer. It catches the
            late-night negotiation, the weekend collapse, the
            &ldquo;I worked hard today&rdquo; script — in the
            3-second window between the impulse and the action. So
            the weight you fought for stays gone.
          </CinematicBody>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/rebound/quiz?ref=rebound-hero"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] transition-transform hover:-translate-y-0.5"
            >
              Take the 60-second regain risk quiz
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/clinical-study"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-[#e7dccb] hover:border-orange-300 hover:text-orange-300"
            >
              The research →
            </Link>
          </div>
        </header>
      </CinematicScrim>

      <article className="space-y-24 pb-12">
        {/* 01 · THE NUMBER — anchored on the Cambridge meta-analysis */}
        <section className="space-y-8">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            01 · The number
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            <span className="italic text-orange-600">60%</span> of the
            weight you lost on GLP-1 comes back{' '}
            <span className="italic text-orange-600">within a year</span>{' '}
            of stopping.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            A May 2026 Cambridge meta-analysis pooled discontinuation
            cohorts across semaglutide and tirzepatide trials and found
            patients regain an average of 60% of their initial weight
            loss in the 12 months after stopping the medication.
            Regain plateaus around 75% — meaning roughly 25% of the
            original loss is maintained without behavioral support.
          </p>
          <p className="max-w-2xl text-base leading-[1.65] text-gray-600">
            The analysis didn&rsquo;t say the drugs failed. It said the{' '}
            <em>pattern underneath the appetite</em> stayed live. Quiet
            on the medication. Loud again the day the shot wears off.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/clinical-study"
              className="inline-flex items-center gap-2 rounded-full border border-orange-500 px-5 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              Read the COYL maintenance study
            </Link>
          </div>
        </section>

        {/* 02 · THE FOUR REBOUND ARCHETYPES */}
        <section className="space-y-10 border-t border-gray-200 pt-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · The four rebound patterns
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The shot got quiet differently for{' '}
              <span className="italic text-orange-600">different people.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The 60-second regain risk quiz places you in one of four
              rebound families. Each one is a specific moment, a
              specific script, and a specific interrupt window —
              the exact 3 seconds COYL fires in.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <ReboundArchetype
              kicker="01 · Night Rebounder"
              name="The 9 PM kitchen, after the appetite came back."
              moment="The shot is wearing off by 9 PM and your hand is in the freezer before your brain catches up. The negotiation sounds reasonable. It always sounded reasonable."
              window="Highest risk: 9:00 PM – 11:30 PM"
            />
            <ReboundArchetype
              kicker="02 · Weekend Rebounder"
              name="Five clean days, one collapse Saturday."
              moment="Monday through Friday the structure holds. Saturday afternoon the schedule disappears and the script returns — the brunch order, the delivery app, the 'I deserve this' sentence."
              window="Highest risk: Saturday 14:00 – Sunday 23:00"
            />
            <ReboundArchetype
              kicker="03 · Stress Rebounder"
              name="The work-week the appetite leaked through."
              moment="The shot keeps hunger quiet until something hard happens — a presentation, a fight, a deadline. Then the script doesn't ask permission; it just runs."
              window="Highest risk: stress event + 2 hours"
            />
            <ReboundArchetype
              kicker="04 · Reward Rebounder"
              name="The 'I earned this' loop that never stops."
              moment="You finished something hard, or hit a number on the scale, or got through a tough week. The reward language is the rebound — and the shot doesn't catch it."
              window="Highest risk: 60-120 minutes after a perceived win"
            />
          </div>

          <div className="pt-2">
            <Link
              href="/rebound/quiz?ref=rebound-archetypes"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_28px_rgba(255,102,0,0.5)]"
            >
              Take the 60-second regain risk quiz
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>

        {/* 03 · HOW REBOUND WORKS */}
        <section className="space-y-10 border-t border-gray-200 pt-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 · How Rebound works
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The shot did the appetite work.{' '}
              <span className="italic text-orange-600">
                We do the pattern work.
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <HowStep
              kicker="01 · Detect"
              title="Learn your rebound window."
              body="The quiz pins your highest-risk hour, the day-of-week shape of your collapse, and the script your autopilot runs. Updates weekly as the pattern moves."
            />
            <HowStep
              kicker="02 · Interrupt"
              title="One push in the 3-second window."
              body="At 9:32 PM, when the negotiation starts, COYL fires a single specific interrupt — not a reminder, not a check-in. The sentence that names the script before it runs."
            />
            <HowStep
              kicker="03 · Recover"
              title="Same-night re-entry. No streak reset."
              body="If the slip happens, COYL doesn't punish — it routes you through the three stabilize actions (water, walk, planned next meal) and keeps the streak alive."
            />
          </div>
        </section>

        {/* 04 · PRICING */}
        <section className="space-y-10 border-t border-orange-500 pt-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              04 · Pricing
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Less than{' '}
              <span className="italic text-orange-600">one regain week.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <PricingCard
              kicker="For you"
              name="Rebound"
              price="$29"
              cadence="/mo"
              alternate="or $199 / year — commit to the year"
              features={[
                'Regain Risk Quiz + your rebound archetype',
                'Unlimited interrupts at your highest-risk window',
                'Same-night recovery engine',
                'Weekly pattern report — track the rebound shape',
                'GLP-1 maintenance protocol drafted with the Found Health study panel',
              ]}
              ctaLabel="Start Rebound"
              ctaHref="/sign-up?ref=rebound-direct"
              accent="primary"
            />
            <PricingCard
              kicker="For your clinic"
              name="Rebound for Clinics"
              price="$12–18"
              cadence=" PMPM"
              alternate="GLP-1 prescribers + telehealth + medspas"
              features={[
                'Patient invite flow + clinician dashboard',
                'Aggregate cohort retention + regain signals',
                'HIPAA-compliant integration with your EMR',
                'First 25 patients free during pilot',
                'Co-branded enrollment material',
              ]}
              ctaLabel="Talk to the clinic team"
              ctaHref="mailto:clinic@coyl.ai?subject=Rebound+for+Clinics"
              accent="ghost"
            />
          </div>
        </section>

        {/* 05 · SAFETY POSTURE */}
        <section className="space-y-6 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            05 · What this is, and what it&rsquo;s not
          </p>
          <h2 className="max-w-3xl font-serif text-2xl font-normal leading-[1.15] tracking-[-0.02em] text-gray-900 md:text-4xl">
            Behavioral support — not medical treatment.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            COYL Rebound is a behavioral support tool for people taking
            or tapering off GLP-1 medications. It is not a substitute
            for medical advice, prescription decisions, or clinical
            care. Talk to your prescriber about dosing, taper schedule,
            and any health concerns. COYL works alongside the
            medication, not in place of it. Full safety statement at{' '}
            <Link href="/safety" className="text-orange-600 underline-offset-4 hover:underline">
              /safety
            </Link>
            .
          </p>
        </section>

        {/* CLOSING */}
        <section className="space-y-10 border-t border-orange-500 pt-12">
          <blockquote className="max-w-4xl font-serif text-3xl font-normal italic leading-[1.25] text-gray-900 md:text-6xl">
            The shot quiets hunger.{' '}
            <span className="not-italic text-orange-600">
              COYL trains the pattern that keeps the weight off.
            </span>
          </blockquote>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/rebound/quiz?ref=rebound-close"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Find my rebound pattern →
            </Link>
            <Link
              href="/clinical-study"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              The maintenance study
            </Link>
            <a
              href="mailto:clinic@coyl.ai?subject=GLP-1+clinic+inquiry"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              For clinicians
            </a>
          </div>
        </section>
      </article>
    </>
  )
}

function ReboundArchetype({
  kicker,
  name,
  moment,
  window: riskWindow,
}: {
  kicker: string
  name: string
  moment: string
  window: string
}) {
  return (
    <div className="border-t border-orange-500 pt-6">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
        {kicker}
      </p>
      <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
        {name}
      </h3>
      <p className="mt-4 text-base leading-[1.7] text-gray-700">{moment}</p>
      <p className="mt-4 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-gray-500">
        {riskWindow}
      </p>
    </div>
  )
}

function HowStep({
  kicker,
  title,
  body,
}: {
  kicker: string
  title: string
  body: string
}) {
  return (
    <div className="border-t border-gray-200 pt-6">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
        {kicker}
      </p>
      <h3 className="mt-3 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-[1.65] text-gray-700">{body}</p>
    </div>
  )
}

function PricingCard({
  kicker,
  name,
  price,
  cadence,
  alternate,
  features,
  ctaLabel,
  ctaHref,
  accent,
}: {
  kicker: string
  name: string
  price: string
  cadence: string
  alternate: string
  features: string[]
  ctaLabel: string
  ctaHref: string
  accent: 'primary' | 'ghost'
}) {
  const borderColor = accent === 'primary' ? 'border-orange-500' : 'border-gray-200'
  const ctaClass =
    accent === 'primary'
      ? 'inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_28px_rgba(255,102,0,0.5)]'
      : 'inline-flex w-fit items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-900 hover:border-orange-300'

  return (
    <div className={`flex flex-col gap-6 border-t ${borderColor} pt-8`}>
      <div>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          {kicker}
        </p>
        <h3 className="mt-3 font-serif text-3xl font-normal tracking-[-0.01em] text-gray-900">
          {name}
        </h3>
      </div>
      <div>
        <p className="flex items-baseline gap-2">
          <span className="font-serif text-6xl font-normal tracking-[-0.03em] text-gray-900">
            {price}
          </span>
          <span className="text-sm text-gray-600">{cadence}</span>
        </p>
        <p className="mt-2 text-sm text-gray-600">{alternate}</p>
      </div>
      <ul className="space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-1 shrink-0 text-orange-600" aria-hidden>
              <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaHref} className={ctaClass}>
        {ctaLabel}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
