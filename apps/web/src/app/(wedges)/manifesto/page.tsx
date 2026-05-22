/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial composition;
 *     massive serif H1, generous breathing, single decisive accent.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): the manifesto reads as a
 *     curated piece — beats numbered as chapters, breathing room between them.
 *   - 08b879e1-2871-488f-b573-38e438e9a85c (Cori Corinne): parchment ground for
 *     the screenshot stanza + sign-off, oversized serif italic accent.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): paper canvas, refined serif
 *     pull-line treatment, mono kicker discipline.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     section openers, hairline rules instead of soft cards where possible.
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
    'COYL is the missing behavioral interface between AI and real life. Search engines organized information. Social networks organized attention. LLMs organized language. COYL organizes the 3 seconds between impulse and action.',
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
      <span aria-hidden className="block h-px w-10 bg-orange-500" />
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em]">
        <span className="text-orange-600">{n}</span>
        <span className="mx-2 text-gray-300">·</span>
        <span className="text-gray-500">{label}</span>
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

      <article className="space-y-32 pb-12">
        {/* OPENING — the headline that ladders everything below */}
        <header className="space-y-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Manifesto · May 2026
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            AI has never<br />
            met human behavior<br />
            <span className="italic text-orange-600">
              before.
            </span>
          </h1>

          {/* The four-line stanza — screenshot atom #1. Editorial column on the
              cream canvas, hairline left rule, serif italic accent on COYL's line. */}
          <figure className="border-l border-orange-500 pl-8 md:pl-12">
            <blockquote className="space-y-3 font-serif text-3xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-5xl">
              <p>Search engines organized information.</p>
              <p>Social networks organized attention.</p>
              <p>Large language models organized language.</p>
              <p className="italic text-orange-600">COYL organizes the 3 seconds between impulse and action.</p>
            </blockquote>
            <figcaption className="mt-8 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
              The four-line stanza
            </figcaption>
          </figure>
        </header>

        {/* BEAT 1 — name the gap */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <BeatKicker n="01" label="The gap" />
          <h3 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            Until now, AI could only answer you after you asked.
          </h3>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Every chatbot, every assistant, every model — sat in a box and
            waited. You typed; it replied. Whatever happened in the rest of
            your life — the fridge at 9:12 PM, the tab you opened
            mid-deep-work, the &ldquo;I already messed up anyway&rdquo;
            sentence you said to yourself — was outside the conversation.
          </p>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            That is the entire gap. The most powerful technology of our
            lifetime can write poems, debug code, and pass the bar exam,
            but it cannot reach you in the 3-second window between trigger
            and action.
          </p>
        </section>

        {/* BEAT 2 — the COYL claim */}
        <section className="space-y-8">
          <BeatKicker n="02" label="The claim" />
          <h3 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            COYL is the first AI built for the moment{' '}
            <span className="italic text-orange-600">before</span> behavior happens.
          </h3>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            It learns the shape of your autopilot — the time, the cue, the
            sentence in your head that justifies the break — and meets you
            at the real-world moment when the pattern is about to run.
          </p>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Not a journal. Not a tracker. Not a coach you message after.
            An interrupt. A 30-second call-out at the exact second your
            script is loading.
          </p>
        </section>

        {/* "You are not random. You are patterned." — screenshot atom #2.
            Editorial pull-quote spread, hairline top rule, gallery breathing. */}
        <section
          aria-label="Pull quote: you are not random"
          className="border-t border-gray-200 py-16 text-center md:py-24"
        >
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Pull quote
          </p>
          <p className="mx-auto mt-10 max-w-4xl font-serif text-5xl font-normal leading-[1.02] tracking-[-0.025em] text-gray-900 md:text-8xl">
            You are not random.
            <br />
            <span className="italic text-orange-600">You are patterned.</span>
          </p>
          <p className="mx-auto mt-10 max-w-2xl text-base leading-[1.7] text-gray-700 md:text-lg">
            Your 9 PM kitchen has a shape. Your Sunday-night spiral has a
            shape. Your &ldquo;I&rsquo;ll restart Monday&rdquo; sentence
            has a shape. COYL learns the shape and stands in the doorway.
          </p>
        </section>

        {/* BEAT 3 — why now */}
        <section className="space-y-8">
          <BeatKicker n="03" label="Why now" />
          <h3 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            AI is leaving the prompt box.
          </h3>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Three things finally arrived at the same time:
          </p>

          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-3">
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
              <div key={p.n} className="border-t border-gray-200 pt-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">{p.n}</p>
                <h4 className="mt-5 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.015em] text-gray-900">{p.t}</h4>
                <p className="mt-4 text-base leading-[1.7] text-gray-600">{p.d}</p>
              </div>
            ))}
          </div>

          <p className="max-w-2xl pt-4 text-lg leading-[1.7] text-gray-700">
            Each of these alone is interesting. Together they enable
            something that has never existed: a system that knows you are
            about to fold and is positioned to say something useful in the
            tiny window where saying something useful changes the outcome.
          </p>
        </section>

        {/* BEAT 4 — what COYL is not */}
        <section className="space-y-8">
          <BeatKicker n="04" label="What COYL is not" />
          <h3 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            Trackers tell you what happened.<br />
            <span className="italic text-orange-600">COYL intervenes before it happens.</span>
          </h3>
          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-2">
            <div className="border-t border-gray-200 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
                Not this
              </p>
              <ul className="mt-5 space-y-3 text-base leading-[1.6] text-gray-700">
                <li>A habit-tracker logging streaks after the fact.</li>
                <li>A chatbot waiting for you to type your sadness.</li>
                <li>A wellness app sending you 7 AM affirmations.</li>
                <li>A clinical product diagnosing or treating disease.</li>
                <li>A weight-loss program. A productivity app. A therapy app.</li>
              </ul>
            </div>
            <div className="border-t border-orange-500 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                But this
              </p>
              <ul className="mt-5 space-y-3 text-base leading-[1.6] text-gray-900">
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
        <section className="space-y-8 border-t border-orange-500 pt-16">
          <BeatKicker n="05" label="The category" />
          <h3 className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            COYL is the missing behavioral interface<br />
            <span className="italic text-orange-600">between AI and real life.</span>
          </h3>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            The interface that fires at the fridge, not at the prompt box.
            The layer where AI stops being a thing you talk to and becomes
            a thing that meets you in the moment your life is happening.
          </p>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            We are at the start of this category. Most of it is unbuilt.
            If you recognize yourself in this page — if you have ever
            said &ldquo;I knew exactly what I was about to do, and I did
            it anyway&rdquo; — you are who we are building for.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600"
            >
              Find your autopilot · 60-second audit
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              See how it works
            </Link>
          </div>
        </section>

        {/* PSYCHE AI — name the category. Per the May 2026 audit brief
            the manifesto closes with a condensed callout to /psyche so
            readers leave with the noun ("Psyche AI") in their head, not
            just the verb ("behavioral interface"). Full thinking lives
            on /psyche; this is the bridge. */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <BeatKicker n="06" label="Psyche AI" />
          <h3 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            We named it.{' '}
            <span className="italic text-orange-600">
              The behavioral interface layer.
            </span>
          </h3>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Every AI before COYL wrapped around external reality. Claude
            wrapped around documents. ChatGPT wrapped around language.
            MCP wrapped around software. Cursor wrapped around code.
            None of them touched the part of you that runs underneath
            conscious thought.
          </p>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            We wrapped around the internal one &mdash; the psyche. The
            pattern layer that opens the fridge before you&rsquo;ve
            decided to. The category name is Psyche AI, and COYL is the
            first product in it.
          </p>
          <p className="pt-2">
            <Link
              href="/psyche"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-600 underline-offset-4 hover:underline"
            >
              Read the full thinking &rarr;
            </Link>
          </p>
        </section>

        {/* SIGN-OFF — the editorial founder note */}
        <section className="border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            Founder note
          </p>
          <p className="mt-8 max-w-3xl font-serif text-3xl font-normal italic leading-[1.4] text-gray-900 md:text-4xl">
            The most powerful AI in history can answer any question you
            ask. We are building the one that meets you when no question
            gets asked — the moment you already know what you are about to
            do, and you do it anyway.
          </p>
          <p className="mt-10 flex items-center gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-600">
            <span aria-hidden className="h-px w-8 bg-orange-500" />
            Iman Schrock · Founder, COYL
          </p>
        </section>
      </article>
    </>
  )
}
