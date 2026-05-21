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

      <div className="space-y-16 pb-12">
        <header className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
              Press · 2026
            </span>
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-gray-900 md:text-7xl">
            AI is leaving<br />
            <span className="text-orange-600">the prompt box.</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            COYL is one of the first consumer systems where AI attempts to
            intervene in human behavior <em>before</em> action occurs.
            This page is for press, analysts, and partners who want the
            short version.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-orange-600">
            The category sentence
          </p>
          <p className="mt-4 text-2xl font-black leading-tight text-gray-900 md:text-3xl">
            COYL is the missing behavioral interface between AI and real life.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">The short version</h2>
          <ul className="space-y-3 text-base text-gray-700">
            <li className="rounded-xl border-l-[3px] border-orange-500 bg-orange-50 px-5 py-3">
              <strong className="text-gray-900">What it is:</strong> a real-time
              AI that detects autopilot patterns (the 9 PM kitchen, the
              tab-switch, the post-GLP-1 rebound, the &ldquo;I already messed
              up&rdquo; spiral) and interrupts them in the 3-second window
              before behavior runs.
            </li>
            <li className="rounded-xl border-l-[3px] border-orange-500 bg-orange-50 px-5 py-3">
              <strong className="text-gray-900">What it is not:</strong> a
              tracker, a journal, a chatbot, a habit app, or a clinical
              treatment. COYL is behavioral support — not medical treatment.
            </li>
            <li className="rounded-xl border-l-[3px] border-orange-500 bg-orange-50 px-5 py-3">
              <strong className="text-gray-900">Why now:</strong> three
              things just arrived together — models that understand
              patterns, edge devices that are always with you, and twenty
              years of behavioral-timing science (JITAI) finally
              productizable.
            </li>
            <li className="rounded-xl border-l-[3px] border-orange-500 bg-orange-50 px-5 py-3">
              <strong className="text-gray-900">Beachheads:</strong>{' '}
              GLP-1 maintenance, late-night eating, weight regain, and
              workplace focus. Designed to extend into any recurring
              human loop.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">The four-line story</h2>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            For lead paragraphs:
          </p>
          <blockquote className="rounded-2xl border border-gray-200 bg-white p-8">
            <p className="text-xl leading-relaxed text-gray-900 md:text-2xl">
              Search engines organized information.<br />
              Social networks organized attention.<br />
              Large language models organized language.<br />
              <span className="font-bold">COYL organizes intervention.</span>
            </p>
          </blockquote>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Founder quote</h2>
          <blockquote className="rounded-2xl border border-gray-200 bg-white p-8">
            <p className="text-lg leading-relaxed text-gray-900">
              &ldquo;The most powerful AI in history can answer any question
              you ask. We are building the one that meets you when no
              question gets asked — the moment you already know what you
              are about to do, and you do it anyway.&rdquo;
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-gray-600">
              Iman Schrock · Founder, COYL
            </p>
          </blockquote>
        </section>

        <section className="rounded-3xl border border-orange-200 bg-orange-50 p-8">
          <h2 className="text-2xl font-bold text-gray-900">Press contact</h2>
          <p className="mt-3 max-w-2xl text-base text-gray-700">
            For interviews, screenshots, demos, embargoed previews, or to
            get on the launch list:
          </p>
          <a
            href="mailto:press@coyl.ai?subject=Press%20inquiry"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            press@coyl.ai
          </a>
          <p className="mt-4 text-xs text-gray-600">
            We respond within 1 business day. Embargoed builds available
            for top-tier tech, business, and health press.
          </p>
        </section>

        <section className="space-y-3 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900">Background reading</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <Link href="/manifesto" className="text-orange-600 underline">
                The manifesto
              </Link>{' '}
              · the long version of the category claim
            </li>
            <li>
              <Link href="/science" className="text-orange-600 underline">
                The science
              </Link>{' '}
              · pattern interrupts, JITAI, dual-process theory
            </li>
            <li>
              <Link href="/clinical-study" className="text-orange-600 underline">
                Clinical study
              </Link>{' '}
              · study-readiness package
            </li>
            <li>
              <Link href="/research" className="text-orange-600 underline">
                Research + outcomes
              </Link>{' '}
              · what we measure, what we will publish
            </li>
            <li>
              <Link href="/how-it-works" className="text-orange-600 underline">
                How it works
              </Link>{' '}
              · the 7-step loop
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
