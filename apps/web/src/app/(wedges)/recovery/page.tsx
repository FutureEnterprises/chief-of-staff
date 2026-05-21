import type { Metadata } from 'next'
import Link from 'next/link'
import { SafetyBanner } from '@/components/safety/safety-banner'

export const metadata: Metadata = {
  title: 'Recovery — built for when you fall off',
  description: 'Most apps punish you when you slip. COYL catches you, stabilizes you, and gets you moving again — tonight, not next Monday. Same-night recovery, 1-day grace on streaks, shame-resistant re-entry.',
  keywords: [
    'recovery from slip app',
    'shame-resistant behavior change',
    'no monday reset app',
    'streak forgiveness app',
    'slip recovery protocol',
  ],
  alternates: { canonical: '/recovery' },
  openGraph: {
    title: 'Recovery — built for when you fall off',
    description: 'Most apps punish you when you slip. COYL catches you, stabilizes you, and gets you moving again.',
    url: 'https://coyl.ai/recovery',
    images: [
      {
        url: '/api/og?title=Built+for+bad+days.+Not+perfect+users.&kicker=Recovery+engine',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recovery — built for when you fall off',
    description: 'Same-night recovery. No Monday reset. 1-day grace on streaks.',
    images: ['/api/og?title=Built+for+bad+days.+Not+perfect+users.&kicker=Recovery+engine'],
  },
}

export default function RecoveryPage() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Recovery</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        Built for bad days.<br />Not perfect users.
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-600">
        Most apps ghost you when you slip. Or worse — they reset your streak and make you
        feel like you have to start over. COYL is built for the opposite: catch you fast,
        stabilize you, keep you moving.
      </p>

      <section className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-2">
        {[
          { title: 'No Monday reset', body: 'Today is still redeemable. Tomorrow is not a clean slate — it\'s the next move.' },
          { title: '1-day grace period on streaks', body: 'Miss one day? Streak holds. Resume, don\'t restart.' },
          { title: 'Same-night recovery protocol', body: 'Specific stabilizing actions within the next 2 hours and 24 hours. No vague advice.' },
          { title: 'Shame-resistant re-entry', body: 'After silence, COYL doesn\'t guilt you back. It meets you where you are.' },
          { title: 'Pattern note on every slip', body: 'What does this slip tell us about the script? Data, not judgment.' },
          { title: 'No starvation compensation', body: 'For weight loss users, we specifically block the "skip the next meal" script that makes bingeing worse.' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-2 text-base font-bold text-gray-900">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-12 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">The retention metric that matters</h2>
        <p className="mb-4 text-sm text-gray-600">
          Most apps optimize for DAU. We optimize for this:
        </p>
        <p className="text-2xl font-black text-orange-600">
          % of users who recover within 24 hours of a slip
        </p>
        <p className="mt-3 text-sm text-gray-600">
          That&apos;s the measurement that aligns product value with user value.
        </p>
      </section>

      <SafetyBanner variant="inline" />

      <Link href="/sign-up" className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">
        Start anyway
      </Link>
    </>
  )
}
