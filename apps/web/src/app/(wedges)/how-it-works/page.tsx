import type { Metadata } from 'next'
import Link from 'next/link'
import { CoreLoop } from '@/components/landing/core-loop'

export const metadata: Metadata = {
  title: 'How COYL works — the behavioral interface between AI and real life',
  description:
    "Detect the script. Interrupt the moment. Recover before the spiral. The three-step loop behind every COYL surface — the layer that catches you in real life, not the next morning.",
  keywords: [
    'how coyl works',
    'autopilot interruption mechanism',
    'jitai behavior change',
    'pattern interrupt how it works',
    'real-time behavior change',
    'recovery engine behavior change',
    'detect interrupt recover',
  ],
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    title: 'How COYL works — detect, interrupt, recover',
    description:
      "The behavioral interface between AI and real life. Detect the script. Interrupt the moment. Recover before the spiral.",
    url: 'https://coyl.ai/how-it-works',
    images: [
      {
        url: '/api/og?title=Detect.+Interrupt.+Recover.&kicker=How+it+works',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How COYL works — detect, interrupt, recover',
    description: 'The behavioral interface between AI and real life. Detect, interrupt, recover.',
    images: ['/api/og?title=Detect.+Interrupt.+Recover.&kicker=How+it+works'],
  },
}

export default function HowItWorksPage() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">How it works</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        Detect the script.<br />Interrupt the moment.<br />Recover before the spiral.
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-600">
        COYL is the behavioral interface between AI and real life. It learns where your
        autopilot takes over, catches you in the moments that matter, and keeps one bad
        decision from becoming a bad week.
      </p>

      <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            n: '01',
            title: 'Detect the script',
            body: 'COYL learns your danger windows, your excuse patterns, and your failure sequences. It sees the shape of your autopilot before you do.',
          },
          {
            n: '02',
            title: 'Interrupt the moment',
            body: 'Precision interrupts fire when the script is about to run. Tap a rescue trigger. Ask a decision. Get called out on the exact excuse you were about to use.',
          },
          {
            n: '03',
            title: 'Recover before the spiral',
            body: 'Built for bad days, not perfect users. Shame-resistant re-entry. Same-night recovery. Resume the streak, don\'t restart the plan.',
          },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="mb-3 text-xs font-mono text-orange-500">{s.n}</p>
            <h3 className="mb-2 text-lg font-bold text-gray-900">{s.title}</h3>
            <p className="text-sm text-gray-600">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">The 7-step loop</h2>
        <p className="mb-8 text-sm text-gray-600">
          Commitment &rarr; Drift &rarr; Excuse &rarr; Interrupt &rarr; Action &rarr; Recovery &rarr; Learning.
          Every broken promise runs this cycle. So does every one you keep. The loop
          is what separates COYL from a chatbot or a reminder app.
        </p>
        <CoreLoop />
      </section>

      <div className="flex gap-3">
        <Link href="/sign-up" className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">Build my anti-autopilot plan</Link>
        <Link href="/science" className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800">See the research</Link>
      </div>
    </>
  )
}
