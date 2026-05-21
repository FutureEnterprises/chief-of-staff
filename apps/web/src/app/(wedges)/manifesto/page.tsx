/**
 * AESTHETIC UPGRADE — May 2026
 * Refero references applied:
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): vellum/off-white
 *     literary-cafe canvas; high-contrast serif/grotesque pairing; calm
 *     deliberate negative space; print-editorial restraint.
 *   - db0d25bb-3ec0-4953-bf0f-0deba2f82194 (Kindsight): editorial/heritage
 *     authority; serif display for the screenshot stanza; terracotta/amber
 *     accent used decisively rather than decoratively.
 *   - c4bae95a-a69e-41e2-a600-596980210523 (Dialog): oversized lightweight
 *     grotesque headline with editorial almost-handwritten delicacy.
 *
 * What changed (vs the prior utility-grade essay):
 *   1. Four-line stanza — promoted to a dedicated screenshot-atom block:
 *      its own framed card on a cream-to-white wash, serif display
 *      typography on the four lines, tighter leading, and a small "the
 *      four-line stanza" caption underneath so people know what they are
 *      sharing. This is the line journalists will quote.
 *   2. Beat headers (01 · The gap …) — vertical accent line + a slim
 *      uppercased number/title pairing. The kicker is larger, tracked
 *      tighter, and lives on its own row above each H3, so each beat
 *      opens like a chapter, not a paragraph.
 *   3. "You are not random. You are patterned." — promoted from inline
 *      blockquote to a full-width section with a warm gradient backdrop
 *      and large serif display type. This is the second-most quotable
 *      atom; it now reads as one.
 *   4. Headline H1 — leading dropped from 0.95 to 0.9 and tracking
 *      tightened to -0.04em; the "before." accent gets a thin orange
 *      underline gesture, not just color.
 *   5. Founder-note close — adds a subtle decorative em-dash glyph and a
 *      light cream backdrop, signing off like an editorial column.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'
import { SafetyBanner } from '@/components/safety/safety-banner'

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

// Reusable beat-header treatment so every chapter opens with the same
// visual gesture: a vertical orange tick + uppercased number kicker.
// Pulling it into a local component keeps the JSX below readable.
function BeatKicker({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="block h-6 w-px bg-orange-500" />
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-orange-600">
        <span className="text-orange-500">{n}</span>
        <span className="mx-2 text-gray-300">·</span>
        <span className="text-gray-700">{label}</span>
      </span>
    </div>
  )
}

export default function ManifestoPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Manifesto', url: 'https://coyl.ai/manifesto' },
        ]}
      />

      <article className="space-y-24 pb-12">
        {/* OPENING — the headline that ladders everything below */}
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
              Manifesto · May 2026
            </span>
          </div>

          <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.04em] text-gray-900 md:text-7xl">
            AI has never<br />
            met human behavior<br />
            <span className="relative inline-block text-orange-600">
              before.
              <span
                aria-hidden
                className="absolute -bottom-2 left-0 right-1 h-1 rounded-full bg-orange-400/70"
              />
            </span>
          </h1>

          {/* The four-line stanza — screenshot atom #1. Promoted into a
              framed card with a soft cream wash, serif display lines, and
              a tiny caption. People will literally screenshot this. */}
          <figure className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-[#fdf6ee] via-white to-white p-8 shadow-[0_18px_50px_-24px_rgba(255,102,0,0.18)] md:p-12">
            <span
              aria-hidden
              className="absolute left-0 top-8 h-16 w-1 rounded-r-full bg-gradient-to-b from-orange-500 to-orange-300"
            />
            <blockquote className="space-y-2 font-serif text-2xl leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
              <p>Search engines organized information.</p>
              <p>Social networks organized attention.</p>
              <p>Large language models organized language.</p>
              <p className="font-black text-orange-700">COYL organizes intervention.</p>
            </blockquote>
            <figcaption className="mt-6 font-mono text-[11px] uppercase tracking-[0.28em] text-gray-500">
              The four-line stanza
            </figcaption>
          </figure>
        </header>

        {/* BEAT 1 — name the gap */}
        <section className="space-y-6 border-t border-gray-200 pt-12">
          <BeatKicker n="01" label="The gap" />
          <h3 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.02em] text-gray-900 md:text-5xl">
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
          <BeatKicker n="02" label="The claim" />
          <h3 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.02em] text-gray-900 md:text-5xl">
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
        </section>

        {/* "You are not random. You are patterned." — screenshot atom #2.
            Promoted out of the inline blockquote into a full-width section
            with a warm gradient backdrop and large serif display type. */}
        <section
          aria-label="Pull quote: you are not random"
          className="relative -mx-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-100/50 via-[#fdf6ee] to-white px-6 py-16 text-center md:-mx-12 md:px-12 md:py-24"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent"
          />
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-orange-700">
            Pull quote
          </p>
          <p className="mx-auto mt-6 max-w-3xl font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            You are not random.
            <br />
            <span className="text-orange-700">You are patterned.</span>
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-700 md:text-lg">
            Your 9 PM kitchen has a shape. Your Sunday-night spiral has a
            shape. Your &ldquo;I&rsquo;ll restart Monday&rdquo; sentence
            has a shape. COYL learns the shape and stands in the doorway.
          </p>
        </section>

        {/* BEAT 3 — why now */}
        <section className="space-y-6">
          <BeatKicker n="03" label="Why now" />
          <h3 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.02em] text-gray-900 md:text-5xl">
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
              <div
                key={p.n}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_12px_32px_-14px_rgba(255,102,0,0.18)]"
              >
                <p className="mb-3 font-mono text-xs font-bold tracking-widest text-orange-600">{p.n}</p>
                <h4 className="mb-2 text-lg font-bold tracking-[-0.01em] text-gray-900">{p.t}</h4>
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
          <BeatKicker n="04" label="What COYL is not" />
          <h3 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.02em] text-gray-900 md:text-5xl">
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

          <SafetyBanner variant="inline" />
        </section>

        {/* BEAT 5 — the category sentence */}
        <section className="space-y-6 rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
          <BeatKicker n="05" label="The category" />
          <h3 className="text-3xl font-black leading-tight tracking-[-0.02em] text-gray-900 md:text-5xl">
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
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_22px_-6px_rgba(255,102,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-transform hover:scale-[1.02]"
            >
              Find your autopilot · 60-second audit
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:border-orange-300"
            >
              See how it works
            </Link>
          </div>
        </section>

        {/* SIGN-OFF — the editorial founder note */}
        <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-[#fbf8f3] px-8 py-12 md:px-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-gray-500">
            Founder note
          </p>
          <p
            aria-hidden
            className="mt-6 font-serif text-5xl leading-none text-orange-400/60"
          >
            &ldquo;
          </p>
          <p className="-mt-4 max-w-3xl text-xl leading-relaxed text-gray-900 md:text-2xl">
            The most powerful AI in history can answer any question you
            ask. We are building the one that meets you when no question
            gets asked — the moment you already know what you are about to
            do, and you do it anyway.&rdquo;
          </p>
          <p className="mt-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] text-gray-600">
            <span aria-hidden className="h-px w-6 bg-orange-500" />
            Iman Schrock · Founder, COYL
          </p>
        </section>
      </article>
    </>
  )
}
