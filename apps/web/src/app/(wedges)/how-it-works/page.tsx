/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): three-line editorial H1 —
 *     Detect / Interrupt / Recover — with italic accent on "before the spiral."
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): three-step row rendered
 *     as gallery columns on top borders.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): the three "lived moments"
 *     reshaped as editorial chapters — bold serif title beside a body column.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     openers; CoreLoop preserved as a product diagram surface.
 */

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
    <div className="space-y-24 pb-12">
      <header className="space-y-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            How it works
          </span>
        </div>
        <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
          Detect the script.<br />
          Interrupt the moment.<br />
          <span className="italic text-orange-600">Recover before the spiral.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
          COYL is the behavioral interface between AI and real life. It learns where your
          autopilot takes over, catches you in the moments that matter, and keeps one bad
          decision from becoming a bad week.
        </p>
      </header>

      {/* Three steps */}
      <section className="grid grid-cols-1 gap-10 md:grid-cols-3">
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
          <div key={s.n} className="border-t border-orange-500 pt-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              {s.n}
            </p>
            <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
              {s.title}
            </h3>
            <p className="mt-3 text-base leading-[1.65] text-gray-700">{s.body}</p>
          </div>
        ))}
      </section>

      {/* THREE LIVED MOMENTS — editorial chapters */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            What this looks like
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Three lived moments. <span className="italic text-orange-600">Same mechanism.</span>
        </h2>

        <div className="space-y-12 pt-4">
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
              className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 md:grid-cols-12 md:gap-10"
            >
              <div className="md:col-span-4">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  Moment
                </p>
                <p className="mt-4 font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-gray-900 md:text-5xl">
                  {m.time}
                </p>
                <p className="mt-3 font-serif text-xl font-normal italic leading-[1.2] text-orange-600">
                  {m.title}
                </p>
              </div>
              <div className="md:col-span-8">
                <p className="text-lg leading-[1.7] text-gray-700">{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Under the hood — 7-step loop */}
      <section className="space-y-8 border-t border-orange-500 pt-16">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          Under the hood
        </p>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          The 7-step loop.<br />
          <span className="italic text-orange-600">Every moment above runs it.</span>
        </h2>
        <p className="max-w-3xl text-base leading-[1.7] text-gray-700">
          Commitment &rarr; Drift &rarr; Excuse &rarr; Interrupt &rarr; Action &rarr;
          Recovery &rarr; Learning. Every broken promise runs this. So does every one
          you keep. The loop is what separates COYL from a chatbot or a reminder app.
        </p>
        <div className="pt-6">
          <CoreLoop />
        </div>
      </section>

      {/* Mid-page brand anchor — earns its place between the loop and the CTA */}
      <section className="border-t border-orange-500 pt-16">
        <p className="max-w-5xl font-serif text-5xl font-normal italic leading-[1.05] tracking-[-0.02em] text-orange-600 md:text-7xl">
          Catch yourself before you do it again.
        </p>
        <p className="mt-10 max-w-2xl text-base leading-[1.7] text-gray-700">
          AI for the moment before behavior happens. Not the journal entry the next morning. Not the regret on Sunday. The half-second before the hand moves.
        </p>
      </section>

      <section className="border-t border-gray-200 pt-16">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sign-up"
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            Let COYL map mine &rarr;
          </Link>
          <Link
            href="/science"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
          >
            See the research
          </Link>
        </div>
      </section>
    </div>
  )
}
