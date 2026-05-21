/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): family explainer reads as
 *     editorial spread; massive serif H1, single accent on family identity.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): the signature script
 *     becomes a gallery-grade pull-quote rather than a card box.
 *   - 08b879e1-2871-488f-b573-38e438e9a85c (Cori Corinne): parchment-grade
 *     hero, oversized italic serif accent.
 */

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

      <div className="space-y-24 pb-12">
        {/* HERO — the family card. Big, screenshot-able, designed to
            survive as the lone surface someone might bookmark. */}
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              A COYL autopilot family
            </span>
          </div>

          <div className="space-y-6">
            <f.Icon className="h-12 w-12 text-orange-600" strokeWidth={1.25} />
            <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
              <span className="italic text-orange-600">{f.name}</span>
            </h1>
          </div>

          <p className="max-w-3xl font-serif text-2xl font-normal italic leading-[1.4] text-gray-900 md:text-3xl">
            {f.essence}
          </p>
        </header>

        {/* DESCRIPTION — the why. */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              What this family is
            </span>
          </div>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            {f.description}
          </p>
        </section>

        {/* SIGNATURE SCRIPT — the screenshot atom. */}
        <section className="border-l border-orange-500 pl-8 md:pl-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The signature script
          </p>
          <p className="mt-8 font-serif text-5xl font-normal italic leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-8xl">
            {f.signature}
          </p>
          <p className="mt-10 max-w-xl text-lg leading-[1.7] text-gray-700">
            {f.prevalenceCopy}
          </p>
        </section>

        {/* WHAT COYL DOES ABOUT IT — generic at family level, specific
            interrupts come from /audit. */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              What COYL does about it
            </span>
          </div>
          <h2 className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            A 3-second interrupt, <span className="italic text-orange-600">at the exact moment.</span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            COYL learns the shape of your family&rsquo;s autopilot — the time
            of day, the cue, the sentence — and fires precision interrupts
            in the 3-second window before the script runs. Not a journal.
            Not a tracker. An interrupt at the exact moment.
          </p>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            To get YOUR specific moments — the wedge, window, and signature
            COYL would fire for you — take the 60-second audit. Three
            questions, no signup, your archetype on the other side.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600"
            >
              Take the audit →
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Read the manifesto
            </Link>
          </div>
        </section>

        {/* OTHER FAMILIES — link to peers so visitors who recognise
            themselves elsewhere can flip immediately. */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The other five families
            </span>
          </div>
          <h2 className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Six total. Most people belong to one.
          </h2>
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 pt-4 md:grid-cols-2">
            {otherFamilies.map((other) => (
              <Link
                key={other.slug}
                href={`/audit/${other.slug}`}
                className="group block border-t border-gray-200 pt-5 transition-colors hover:border-gray-900"
              >
                <p className="flex items-center gap-3 font-serif text-xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 transition-colors group-hover:text-orange-600">
                  <other.Icon className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                  <span>{other.name}</span>
                </p>
                <p className="mt-3 text-sm leading-[1.65] text-gray-600">
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
