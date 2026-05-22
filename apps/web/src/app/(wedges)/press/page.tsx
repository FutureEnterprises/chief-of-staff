/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): press release as editorial
 *     spread; massive serif H1, mono kicker, single accent.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): blockquotes set as hairline
 *     editorial pull-quotes instead of card-wrapped boxes.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): literary press-kit voice,
 *     calm hierarchy, serif italic for the founder quote.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'Press — AI is leaving the prompt box',
  description:
    "COYL is the first AI built for the moment before behavior happens — the missing behavioral interface between AI and real life. Press inquiries: press@coyl.ai.",
  alternates: { canonical: '/press' },
  openGraph: {
    title: 'COYL Press — AI is leaving the prompt box',
    description:
      'The first consumer AI that intervenes at the real-world moment when human behavior is about to happen.',
    url: 'https://coyl.ai/press',
    images: [
      {
        url: '/api/og?title=AI+is+leaving+the+prompt+box.&kicker=Press',
        width: 1200,
        height: 630,
      },
    ],
  },
}

/**
 * /press — for journalists, analysts, and tech press.
 *
 * Per the May 2026 virality dispatch: "AI is leaving the chatbox" is
 * the headline-worthy framing. This page gives press the category
 * sentence, the four-line stack, the founder quote, the boundaries
 * (behavioral support, not medical treatment), and the contact.
 *
 * Intentionally short. Press pages that bury the lede are skipped.
 */
export default function PressPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Press', url: 'https://coyl.ai/press' },
        ]}
      />

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Press · 2026
            </span>
          </div>
          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            AI is leaving<br />
            <span className="italic text-orange-600">the prompt box.</span>
          </h1>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            COYL is one of the first consumer systems where AI attempts to
            intervene in human behavior <em>before</em> action occurs.
            This page is for press, analysts, and partners who want the
            short version.
          </p>
        </header>

        <section className="border-l border-orange-500 pl-8 md:pl-10">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The category sentence
          </p>
          <p className="mt-6 font-serif text-3xl font-normal leading-[1.15] tracking-[-0.015em] text-gray-900 md:text-5xl">
            COYL is the missing behavioral interface between AI and{' '}
            <span className="italic text-orange-600">real life.</span>
          </p>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The short version
            </span>
          </div>
          <h2 className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            In four lines.
          </h2>
          <ul className="space-y-6 text-base text-gray-700">
            <li className="border-l border-gray-200 pl-6 transition-colors hover:border-orange-500">
              <strong className="text-gray-900">What it is.</strong> A real-time
              AI that detects autopilot patterns (the 9 PM kitchen, the
              tab-switch, the post-GLP-1 rebound, the &ldquo;I already messed
              up&rdquo; spiral) and interrupts them in the 3-second window
              before behavior runs.
            </li>
            <li className="border-l border-gray-200 pl-6 transition-colors hover:border-orange-500">
              <strong className="text-gray-900">What it is not.</strong> A
              tracker, a journal, a chatbot, a habit app, or a clinical
              treatment. COYL is behavioral support — not medical treatment.
            </li>
            <li className="border-l border-gray-200 pl-6 transition-colors hover:border-orange-500">
              <strong className="text-gray-900">Why now.</strong> Three
              things just arrived together — models that understand
              patterns, edge devices that are always with you, and twenty
              years of behavioral-timing science (JITAI) finally
              productizable.
            </li>
            <li className="border-l border-gray-200 pl-6 transition-colors hover:border-orange-500">
              <strong className="text-gray-900">Beachheads.</strong>{' '}
              GLP-1 maintenance, late-night eating, weight regain, and
              workplace focus. Designed to extend into any recurring
              human loop.
            </li>
          </ul>
        </section>

        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              For lead paragraphs
            </span>
          </div>
          <h2 className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            The four-line story.
          </h2>
          <blockquote className="border-l border-orange-500 pl-8">
            <p className="space-y-2 font-serif text-2xl font-normal leading-[1.25] text-gray-900 md:text-4xl">
              Search engines organized information.<br />
              Social networks organized attention.<br />
              Large language models organized language.<br />
              <span className="italic text-orange-600">COYL organizes the 3 seconds between impulse and action.</span>
            </p>
          </blockquote>
        </section>

        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Founder quote
            </span>
          </div>
          <blockquote>
            <p className="font-serif text-3xl font-normal italic leading-[1.4] text-gray-900 md:text-4xl">
              The most powerful AI in history can answer any question
              you ask. We are building the one that meets you when no
              question gets asked — the moment you already know what you
              are about to do, and you do it anyway.
            </p>
            <p className="mt-8 flex items-center gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-600">
              <span aria-hidden className="h-px w-8 bg-orange-500" />
              Iman Schrock · Founder, COYL
            </p>
          </blockquote>
        </section>

        <section className="border-t border-orange-500 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Press contact
          </p>
          <h2 className="mt-5 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-4xl">
            For interviews, screenshots, demos.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-[1.7] text-gray-700">
            Embargoed previews and the launch list — write to:
          </p>
          <a
            href="mailto:press@coyl.ai?subject=Press%20inquiry"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600"
          >
            press@coyl.ai
          </a>
          <p className="mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            Response in one business day &middot; tech, business, and health press
          </p>
        </section>

        <section className="space-y-6 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Background reading
          </p>
          <ul className="space-y-3 text-base text-gray-700">
            <li>
              <Link href="/manifesto" className="font-serif italic text-gray-900 underline-offset-4 hover:text-orange-600 hover:underline">
                The manifesto
              </Link>{' '}
              &middot; the long version of the category claim
            </li>
            <li>
              <Link href="/science" className="font-serif italic text-gray-900 underline-offset-4 hover:text-orange-600 hover:underline">
                The science
              </Link>{' '}
              &middot; pattern interrupts, JITAI, dual-process theory
            </li>
            <li>
              <Link href="/clinical-study" className="font-serif italic text-gray-900 underline-offset-4 hover:text-orange-600 hover:underline">
                Clinical study
              </Link>{' '}
              &middot; study-readiness package
            </li>
            <li>
              <Link href="/research" className="font-serif italic text-gray-900 underline-offset-4 hover:text-orange-600 hover:underline">
                Research + outcomes
              </Link>{' '}
              &middot; what we measure, what we will publish
            </li>
            <li>
              <Link href="/how-it-works" className="font-serif italic text-gray-900 underline-offset-4 hover:text-orange-600 hover:underline">
                How it works
              </Link>{' '}
              &middot; the 7-step loop
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
