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
    { title: '"I already blew it" spiral', body: 'One bad meal doesn\'t wreck the week. The story after it does. COYL rewrites the story tonight.' },
    { title: 'Skipped weigh-ins', body: 'Avoidance is a behavior. COYL names it and gets you back to data.' },
    { title: 'Stress-triggered overeating', body: 'The emotion is real. The script you run with it is optional. COYL makes it visible.' },
  ]

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Weight loss</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        Weight loss doesn&apos;t fail at lunch.<br />
        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">It fails at 9 PM.</span>
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-600">
        The autopilot runs after the meal plan ends &mdash; late-night kitchen, weekend
        drift, the &ldquo;I already blew it&rdquo; loop. COYL catches the script the second
        it fires, not the next morning when the damage is already done.
      </p>

      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        {painPoints.map((p) => (
          <div key={p.title} className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-2 text-base font-bold text-gray-900">{p.title}</h3>
            <p className="text-sm text-gray-600">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">What COYL actually does</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li>• <strong className="text-gray-900">Risk Window setup</strong> — you map (or we infer) your danger hours</li>
          <li>• <strong className="text-gray-900">Food rescue flows</strong> — one tap for binge urge, delivery urge, late-night opening the fridge</li>
          <li>• <strong className="text-gray-900">Slip recovery protocol</strong> — hydrate, protein-first next meal, no starvation compensation, no Monday reset</li>
          <li>• <strong className="text-gray-900">Weekly Autopilot Autopsy</strong> — the exact first point of leakage, the excuse you used most, next week&apos;s one focus</li>
          <li>• <strong className="text-gray-900">Self-trust rebuilding</strong> — a score that measures whether you&apos;re becoming someone you can count on</li>
        </ul>
      </section>

      <p className="mb-8 text-sm italic text-gray-500">
        COYL is a behavioral support tool. It is not medical advice, nutrition counseling, or a
        substitute for a clinician.
      </p>

      <Link href="/sign-up?wedge=weight-loss" className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">
        Build my weight-loss interrupt plan
      </Link>
    </>
  )
}
