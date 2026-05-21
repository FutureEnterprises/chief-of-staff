import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'Manifesto — AI has never met human behavior before',
  description:
    'COYL is the missing behavioral interface between AI and real life. Search engines organized information. Social networks organized attention. LLMs organized language. COYL organizes intervention.',
  keywords: [
    'behavioral interface',
    'behavioral interface for ai',
    'ai for human behavior',
    'ai leaving the prompt box',
    'edge ai behavior',
    'pattern interrupt manifesto',
    'coyl manifesto',
    'autopilot interrupt category',
  ],
  alternates: { canonical: '/manifesto' },
  openGraph: {
    title: 'COYL Manifesto — AI has never met human behavior before',
    description:
      'The first AI built for the moment before behavior happens. The missing behavioral interface between AI and real life.',
    url: 'https://coyl.ai/manifesto',
    images: [
      {
        url: '/api/og?title=AI+has+never+met+human+behavior+before.&kicker=Manifesto',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Manifesto',
    description: 'AI has never met human behavior before. COYL is the missing interface.',
    images: ['/api/og?title=AI+has+never+met+human+behavior+before.&kicker=Manifesto'],
  },
}

/**
 * /manifesto — the category-creation page.
 *
 * Per the May 2026 virality dispatch: the manifesto is the page that
 * journalists, investors, and early-adopter users use to understand
 * what category COYL belongs to. Without a manifesto, COYL reads as
 * "a habit app with AI"; with one, COYL reads as the first product
 * in a new category (behavioral interfaces).
 *
 * Design discipline:
 *   - Typography-driven, not section-stacked. Reads like an essay.
 *   - One pull-quote per beat, max. Designed for screenshot virality.
 *   - The four-line stanza ("Search engines... / Social networks... /
 *     LLMs... / COYL...") is the screenshot people will share.
 *   - "You are not random. You are patterned." is the second-most
 *     quotable line — appears at the inflection from "AI is leaving
 *     the prompt box" to "and meeting you at the fridge."
 *   - Ends with the category sentence: "the missing behavioral
 *     interface between AI and real life." This is the noun-phrase
 *     that becomes the press shorthand.
 *
 * NO feature comparison, NO pricing, NO product screenshots. Those
 * live on /how-it-works and /pricing. This page exists to install one
 * sentence in the reader's head.
 */
export default function ManifestoPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Manifesto', url: 'https://coyl.ai/manifesto' },
        ]}
      />

      <article className="space-y-20 pb-12">
        {/* OPENING — the headline that ladders everything below */}
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
              Manifesto · May 2026
            </span>
          </div>

          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-gray-900 md:text-7xl">
            AI has never<br />
            met human behavior<br />
            <span className="text-orange-600">before.</span>
          </h1>

          <p className="max-w-2xl text-xl leading-relaxed text-gray-700 md:text-2xl">
            Search engines organized information.<br />
            Social networks organized attention.<br />
            Large language models organized language.<br />
            <span className="font-bold text-gray-900">COYL organizes intervention.</span>
          </p>
        </header>

        {/* BEAT 1 — name the gap */}
        <section className="space-y-6 border-t border-gray-200 pt-12">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-orange-600">
            01 · The gap
          </h2>
          <h3 className="max-w-3xl text-3xl font-black leading-tight text-gray-900 md:text-5xl">
            Until now, AI could only answer you after you asked.
          </h3>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            Every chatbot, every assistant, every model — sat in a box and
            waited. You typed; it replied. Whatever happened in the rest of
            your life — the fridge at 9:12 PM, the tab you opened
            mid-deep-work, the &ldquo;I already messed up anyway&rdquo;
            sentence you said to yourself — was outside the conversation.
          </p>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            That is the entire gap. The most powerful technology of our
            lifetime can write poems, debug code, and pass the bar exam,
            but it cannot reach you in the 3-second window between trigger
            and action.
          </p>
        </section>

        {/* BEAT 2 — the COYL claim */}
        <section className="space-y-6">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-orange-600">
            02 · The claim
          </h2>
          <h3 className="max-w-3xl text-3xl font-black leading-tight text-gray-900 md:text-5xl">
            COYL is the first AI built for the moment{' '}
            <span className="text-orange-600">before</span> behavior happens.
          </h3>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            It learns the shape of your autopilot — the time, the cue, the
            sentence in your head that justifies the break — and meets you
            at the real-world moment when the pattern is about to run.
          </p>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            Not a journal. Not a tracker. Not a coach you message after.
            An interrupt. A 30-second call-out at the exact second your
            script is loading.
          </p>

          <blockquote className="my-10 rounded-3xl border-l-[6px] border-orange-500 bg-orange-50 px-8 py-8">
            <p className="text-2xl font-black leading-tight text-gray-900 md:text-3xl">
              You are not random.<br />
              You are patterned.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Your 9 PM kitchen has a shape. Your Sunday-night spiral has a
              shape. Your &ldquo;I&rsquo;ll restart Monday&rdquo; sentence
              has a shape. COYL learns the shape and stands in the doorway.
            </p>
          </blockquote>
        </section>

        {/* BEAT 3 — why now */}
        <section className="space-y-6">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-orange-600">
            03 · Why now
          </h2>
          <h3 className="max-w-3xl text-3xl font-black leading-tight text-gray-900 md:text-5xl">
            AI is leaving the prompt box.
          </h3>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            Three things finally arrived at the same time:
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Models that understand patterns',
                d: 'LLMs that can read a user model, a danger window, and an excuse — and respond in real human language inside 200 ms.',
              },
              {
                n: '02',
                t: 'Edge devices that are always there',
                d: 'Watch on wrist. Phone in pocket. Earbuds in ear. Push that lands in the half-second before the gesture completes.',
              },
              {
                n: '03',
                t: 'Behavioral timing as a science',
                d: 'JITAI research, dual-process theory, identity-based-habit work — twenty years of academia ready for a consumer product.',
              },
            ].map((p) => (
              <div key={p.n} className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="mb-3 font-mono text-xs text-orange-600">{p.n}</p>
                <h4 className="mb-2 text-lg font-bold text-gray-900">{p.t}</h4>
                <p className="text-sm leading-relaxed text-gray-600">{p.d}</p>
              </div>
            ))}
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            Each of these alone is interesting. Together they enable
            something that has never existed: a system that knows you are
            about to fold and is positioned to say something useful in the
            tiny window where saying something useful changes the outcome.
          </p>
        </section>

        {/* BEAT 4 — what COYL is not */}
        <section className="space-y-6">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-orange-600">
            04 · What COYL is not
          </h2>
          <h3 className="max-w-3xl text-3xl font-black leading-tight text-gray-900 md:text-5xl">
            Trackers tell you what happened.<br />
            COYL intervenes before it happens.
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-gray-500">
                Not this
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>A habit-tracker logging streaks after the fact.</li>
                <li>A chatbot waiting for you to type your sadness.</li>
                <li>A wellness app sending you 7 AM affirmations.</li>
                <li>A clinical product diagnosing or treating disease.</li>
                <li>A weight-loss program. A productivity app. A therapy app.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-orange-700">
                But this
              </p>
              <ul className="space-y-2 text-sm text-gray-900">
                <li>A precision interrupt at the moment of drift.</li>
                <li>A voice-matched call-out before the gesture completes.</li>
                <li>A real-time map of your danger windows and excuse scripts.</li>
                <li>A recovery engine that stops one slip from becoming the night.</li>
                <li>The behavioral layer underneath every app you already use.</li>
              </ul>
            </div>
          </div>

          <p className="text-xs italic text-gray-500">
            Behavioral support — not medical treatment. If you are in
            crisis or need clinical care, please reach out to a licensed
            professional or call 988 (US) for immediate help.
          </p>
        </section>

        {/* BEAT 5 — the category sentence */}
        <section className="space-y-6 rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-orange-600">
            05 · The category
          </h2>
          <h3 className="text-3xl font-black leading-tight text-gray-900 md:text-5xl">
            COYL is the missing behavioral interface<br />
            between AI and real life.
          </h3>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            The interface that fires at the fridge, not at the prompt box.
            The layer where AI stops being a thing you talk to and becomes
            a thing that meets you in the moment your life is happening.
          </p>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            We are at the start of this category. Most of it is unbuilt.
            If you recognize yourself in this page — if you have ever
            said &ldquo;I knew exactly what I was about to do, and I did
            it anyway&rdquo; — you are who we are building for.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Find your autopilot · 60-second audit
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              See how it works
            </Link>
          </div>
        </section>

        {/* SIGN-OFF — the screenshot line */}
        <section className="border-t border-gray-200 pt-12">
          <p className="text-sm uppercase tracking-widest text-gray-500">Founder note</p>
          <p className="mt-4 max-w-3xl text-xl leading-relaxed text-gray-900 md:text-2xl">
            &ldquo;The most powerful AI in history can answer any question
            you ask. We are building the one that meets you when no
            question gets asked — the moment you already know what you
            are about to do, and you do it anyway.&rdquo;
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-gray-600">
            Iman Schrock · Founder, COYL
          </p>
        </section>
      </article>
    </>
  )
}
