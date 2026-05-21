import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BreadcrumbSchema } from '@/app/structured-data'
import {
  allFamilies,
  getFamily,
  parseFamilySlug,
} from '@/lib/audit-archetype'

/**
 * /audit/[code] — canonical family-archetype explainer page.
 *
 * Six fixed URLs (one per family):
 *   /audit/the-9pm-negotiator
 *   /audit/the-monday-resetter
 *   /audit/the-deserver
 *   /audit/the-one-more-tabber
 *   /audit/the-spiral-extender
 *   /audit/the-capitulator
 *
 * Where /a/[slug] is "my specific result", /audit/[code] is "what this
 * family means in general." Used for:
 *   - SEO long-tail ("the 9 PM negotiator", "I'm a spiral extender")
 *   - The "What is The Deserver?" link from any /a/[slug] share page
 *   - Internal homepage Archetypes section linking to the family
 *     explainers for visitors who want to read before taking the audit
 *
 * Stateless. The code is the family slug. Same render path renders
 * all six pages.
 */

type PageProps = { params: Promise<{ code: string }> }

export async function generateStaticParams() {
  // Pre-render all six family pages at build time. Six routes total —
  // worth the static generation cost for the SEO + speed wins.
  return allFamilies().map((f) => ({ code: f.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const family = parseFamilySlug(code)
  if (!family) return { title: 'Archetype not found · COYL' }

  const f = getFamily(family)
  const ogTitle = encodeURIComponent(f.name)
  const ogKicker = encodeURIComponent('A COYL autopilot family')

  return {
    title: `${f.name} — a COYL autopilot family`,
    description: `${f.essence} Signature script: ${f.signature} ${f.prevalenceCopy}`,
    alternates: { canonical: `/audit/${family}` },
    openGraph: {
      type: 'article',
      title: f.name,
      description: f.essence,
      url: `https://coyl.ai/audit/${family}`,
      siteName: 'COYL',
      images: [
        {
          url: `/api/og?title=${ogTitle}&kicker=${ogKicker}`,
          width: 1200,
          height: 630,
          alt: `${f.name} — COYL autopilot family`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: f.name,
      description: f.essence,
      images: [`/api/og?title=${ogTitle}&kicker=${ogKicker}`],
    },
  }
}

export default async function FamilyExplainerPage({ params }: PageProps) {
  const { code } = await params
  const family = parseFamilySlug(code)
  if (!family) notFound()

  const f = getFamily(family)
  const otherFamilies = allFamilies().filter((other) => other.slug !== family)

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Audit', url: 'https://coyl.ai/audit' },
          { name: f.name, url: `https://coyl.ai/audit/${family}` },
        ]}
      />

      <div className="space-y-16 pb-12">
        {/* HERO — the family card. Big, screenshot-able, designed to
            survive as the lone surface someone might bookmark. */}
        <header className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
              A COYL autopilot family
            </span>
          </div>

          <h1 className="flex flex-wrap items-center gap-5 text-5xl font-black leading-[1.02] text-gray-900 md:text-7xl">
            <span
              aria-hidden
              className="inline-flex h-20 w-20 flex-none items-center justify-center rounded-3xl bg-orange-100 text-orange-600 ring-1 ring-orange-200 md:h-24 md:w-24"
            >
              <f.Icon className="h-14 w-14 md:h-16 md:w-16" strokeWidth={2} />
            </span>
            <span>{f.name}</span>
          </h1>

          <p className="max-w-2xl text-2xl leading-relaxed text-gray-800 md:text-3xl">
            {f.essence}
          </p>
        </header>

        {/* DESCRIPTION — the why. */}
        <section className="space-y-4 border-t border-gray-200 pt-12">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-orange-600">
            What this family is
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            {f.description}
          </p>
        </section>

        {/* SIGNATURE SCRIPT — the screenshot atom. */}
        <section className="rounded-3xl border border-orange-200 bg-orange-50 p-8 md:p-12">
          <p className="font-mono text-xs uppercase tracking-widest text-orange-700">
            The signature script
          </p>
          <p className="mt-4 text-4xl font-black italic leading-tight text-gray-900 md:text-6xl">
            {f.signature}
          </p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-700">
            {f.prevalenceCopy}
          </p>
        </section>

        {/* WHAT COYL DOES ABOUT IT — generic at family level, specific
            interrupts come from /audit. */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            What COYL does about it
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-gray-700">
            COYL learns the shape of your family&rsquo;s autopilot — the time
            of day, the cue, the sentence — and fires precision interrupts
            in the 3-second window before the script runs. Not a journal.
            Not a tracker. An interrupt at the exact moment.
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-gray-700">
            To get YOUR specific moments — the wedge, window, and signature
            COYL would fire for you — take the 60-second audit. Three
            questions, no signup, your archetype on the other side.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Take the audit →
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the manifesto
            </Link>
          </div>
        </section>

        {/* OTHER FAMILIES — link to peers so visitors who recognise
            themselves elsewhere can flip immediately. Also good for SEO
            internal linking + reduces bounce rate. */}
        <section className="space-y-4 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            The other five families
          </h2>
          <p className="max-w-2xl text-base text-gray-700">
            Six total. Most people belong to one with a secondary lean.
            Click any one to read its full explainer:
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {otherFamilies.map((other) => (
              <Link
                key={other.slug}
                href={`/audit/${other.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-orange-300 hover:bg-orange-50"
              >
                <p className="flex items-center gap-3 text-base font-bold text-gray-900 group-hover:text-orange-700">
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 group-hover:bg-orange-100"
                  >
                    <other.Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span>{other.name}</span>
                </p>
                <p className="mt-1 text-sm leading-snug text-gray-600">
                  {other.essence}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
