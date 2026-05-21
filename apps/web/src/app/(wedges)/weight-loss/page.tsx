/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references: Letter (28523918) — serif H1 with italic accent.
 * Sequel (50c47480) — hairline editorial composition for pain-point columns.
 * Cori Corinne (08b879e1) — gallery-grade breathing around primary CTA.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'COYL for weight loss \u2014 weight loss doesn\u2019t fail at lunch. It fails at 9 PM.',
  description:
    "Diets fail in the autopilot moment, not the meal plan. COYL catches the 9 PM kitchen, the weekend drift, the 'I already blew it' loop \u2014 the moments calories and macros never see.",
  keywords: [
    'weight loss app',
    'stop binge eating',
    'late night eating',
    'weekend overeating',
    'stop eating at night',
    'emotional eating app',
    'stop food spiral',
  ],
  alternates: { canonical: '/weight-loss' },
  openGraph: {
    title: 'Weight loss doesn\u2019t fail at lunch. It fails at 9 PM.',
    description:
      "Diets fail in the autopilot moment, not the meal plan. COYL catches the 9 PM kitchen, the weekend drift, the 'I already blew it' loop.",
    url: 'https://coyl.ai/weight-loss',
    images: [
      {
        url: '/api/og?title=Weight+loss+doesn%27t+fail+at+lunch.+It+fails+at+9+PM.&kicker=Weight+loss',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weight loss doesn\u2019t fail at lunch. It fails at 9 PM.',
    description: "Diets fail in the autopilot moment, not the meal plan. COYL catches the script.",
    images: ['/api/og?title=Weight+loss+doesn%27t+fail+at+lunch.+It+fails+at+9+PM.&kicker=Weight+loss'],
  },
}

export default function WeightLossPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Weight loss', url: 'https://coyl.ai/weight-loss' },
        ]}
      />
      <WeightLossContent />
    </>
  )
}

function WeightLossContent() {
  const painPoints = [
    { title: 'Late-night kitchen autopilot', body: 'You\'re not hungry. You\'re on autopilot. COYL fires at 9 PM.' },
    { title: 'Weekend collapse', body: 'Friday night leaks into Saturday leaks into Sunday. One interruption resets the loop.' },
    { title: 'Delivery-app autopilot', body: 'Your thumb opens the app before you decide. COYL catches the impulse.' },
    { title: '"I already blew it" spiral', body: 'One bad meal doesn\'t wreck the week. The story after it does. COYL interrupts the story tonight.' },
    { title: 'Skipped weigh-ins', body: 'Avoidance is a behavior. COYL names it and gets you back to data.' },
    { title: 'Stress-triggered overeating', body: 'The emotion is real. The script you run with it is optional. COYL makes it visible.' },
  ]

  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <span className="h-px w-10 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">Weight loss</span>
      </div>
      <h1 className="mb-10 font-serif text-5xl font-normal leading-[1.0] tracking-[-0.03em] text-gray-900 md:text-7xl">
        Weight loss doesn&apos;t fail at lunch.<br />
        <span className="italic text-orange-600">It fails at 9 PM.</span>
      </h1>
      <p className="mb-20 max-w-2xl text-lg leading-[1.7] text-gray-600">
        The autopilot runs after the meal plan ends &mdash; late-night kitchen, weekend
        drift, the &ldquo;I already blew it&rdquo; loop. COYL catches the script the second
        it fires, not the next morning when the damage is already done.
      </p>

      <section className="mb-20 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
        {painPoints.map((p) => (
          <div key={p.title} className="border-t border-gray-200 pt-5">
            <h3 className="mb-3 font-serif text-xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">{p.title}</h3>
            <p className="text-sm leading-[1.65] text-gray-600">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-20 border-l border-orange-500 pl-6 md:pl-8">
        <p className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">What COYL actually does</p>
        <h2 className="mb-8 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-5xl">
          A precision interrupt, <span className="italic text-orange-600">where the script always runs.</span>
        </h2>
        <ul className="space-y-4 text-base leading-[1.65] text-gray-700">
          <li><strong className="font-serif font-normal italic text-gray-900">Risk Window setup.</strong> You map (or we infer) your danger hours.</li>
          <li><strong className="font-serif font-normal italic text-gray-900">Food rescue flows.</strong> One tap for binge urge, delivery urge, late-night opening the fridge.</li>
          <li><strong className="font-serif font-normal italic text-gray-900">Slip recovery protocol.</strong> Hydrate, protein-first next meal, no starvation compensation, no Monday reset.</li>
          <li><strong className="font-serif font-normal italic text-gray-900">Weekly Autopilot Autopsy.</strong> The exact first point of leakage, the excuse you used most, next week&apos;s one focus.</li>
          <li><strong className="font-serif font-normal italic text-gray-900">Self-trust rebuilding.</strong> A score that measures whether you&apos;re becoming someone you can count on.</li>
        </ul>
      </section>

      <p className="mb-10 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
        COYL is a behavioral support tool. Not medical advice or a substitute for a clinician.
      </p>

      <Link href="/sign-up?wedge=weight-loss" className="inline-flex items-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600">
        Build my weight-loss interrupt plan
      </Link>
    </>
  )
}
