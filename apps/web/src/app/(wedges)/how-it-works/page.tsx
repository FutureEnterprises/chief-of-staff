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

      {/* THREE LIVED MOMENTS — per the May 2026 strategist note: this
          page was too product-internal. Concrete stories first; the
          7-step loop sits as the abstract framework underneath. Each
          moment is timestamped (9:12 PM / 11:07 AM / mid-spiral) so a
          visitor reads "yes, that's me" before they ever scroll to a
          framework. */}
      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-600">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          What this looks like
        </h2>
        <h3 className="mb-10 text-3xl font-black leading-[1.1] text-gray-900 md:text-4xl">
          Three lived moments. Same mechanism.
        </h3>

        <div className="space-y-5">
          {[
            {
              time: '9:12 PM',
              title: 'The kitchen.',
              body: 'You walk past the fridge for the third time tonight. You’re not hungry. You know you’re not hungry. COYL knows it too — this is your window. The push lands before your hand touches the handle: "You’re not hungry. You’re doing it again. Close the fridge. Walk five minutes. Then decide." You close the fridge. The night doesn’t turn.',
            },
            {
              time: '11:07 AM',
              title: 'The tab switch.',
              body: 'You’re thirty-eight minutes into a deep-work block. The thought arrives — "I should check one thing." Your cursor moves toward the new-tab button. COYL fires in the half-second before the click: "One more thing becomes the morning. The doc isn’t the problem. The switch is. Stay." You stay. The block holds.',
            },
            {
              time: 'After the slip.',
              title: 'The spiral.',
              body: 'You already had the cookie. The sentence loads: "I already messed up." That sentence is the real machinery — it’s what turns one slip into the whole night, the whole week. COYL catches it: "You didn’t blow it. You’re about to blow it. Different thing. Water, brush teeth, bed in thirty. Tomorrow is the next rep, not the restart." Same-night re-entry. No Monday reset.',
            },
          ].map((m) => (
            <div
              key={m.time}
              className="grid grid-cols-1 gap-4 rounded-3xl border border-gray-200 bg-white p-6 md:grid-cols-12 md:gap-6"
            >
              <div className="md:col-span-3">
                <p className="font-mono text-xs uppercase tracking-widest text-orange-600">
                  Moment
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                  {m.time}
                </p>
                <p className="mt-1 text-sm font-semibold text-orange-700">{m.title}</p>
              </div>
              <div className="md:col-span-9">
                <p className="text-base leading-relaxed text-gray-700 md:text-lg">
                  {m.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16 rounded-3xl border border-orange-200 bg-orange-50 p-8">
        <p className="mb-2 text-xs font-mono uppercase tracking-widest text-orange-700">
          Under the hood
        </p>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">The 7-step loop</h2>
        <p className="mb-8 text-sm text-gray-700">
          Every moment above runs the same cycle. Commitment &rarr; Drift &rarr;
          Excuse &rarr; Interrupt &rarr; Action &rarr; Recovery &rarr; Learning.
          Every broken promise runs this. So does every one you keep. The loop
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
