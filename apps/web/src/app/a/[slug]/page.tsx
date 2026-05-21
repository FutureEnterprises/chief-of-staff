import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GlassNav } from '@/components/landing/glass-nav'
import { CoylLogo } from '@/components/brand/logo'
import {
  buildArchetype,
  parseShareSlug,
  type WedgeId,
  type WindowId,
  type ScriptId,
} from '@/lib/audit-archetype'

/**
 * /a/[slug] — public specific-result share page.
 *
 * The viral atom. Every shared audit result points here:
 *   /a/weight-latenight-reward → 🎁 The Deserver
 *                                  (specifically, 🌙 Night Fridge Saboteur)
 *
 * Two-tier rendering per the May 2026 virality dispatch:
 *   FAMILY headlines (the meme — "I'm a Deserver" travels)
 *   SPECIFIC is the texture (the moment — "Night Fridge Saboteur" proves
 *   the family fits this specific user)
 *
 * Stateless — the slug encodes (wedge, window, script). The page:
 *   1. Validates the slug. Bad slug → 404.
 *   2. Computes the archetype (family + specific).
 *   3. Generates social meta with the FAMILY in title/OG (more shareable).
 *   4. Renders the family card with specific moment as a sub-card.
 *   5. CTA: "Find your own" → /audit.
 *
 * Per the family-tier model, there's also /audit/[family-slug] which
 * shows the family explainer without specific context. /a/[slug] is
 * "MY result"; /audit/[family-slug] is "what this family means."
 */

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseShareSlug(slug)
  if (!parsed) return { title: 'Archetype not found · COYL' }

  const a = buildArchetype(parsed.wedge, parsed.window, parsed.script)
  const ogTitle = encodeURIComponent(`${a.family.emoji} ${a.family.name}`)
  const ogKicker = encodeURIComponent('My COYL autopilot')

  return {
    title: `${a.family.name} — my COYL autopilot`,
    description: `${a.family.essence} ${a.family.signature} — find your archetype with the 60-second autopilot audit.`,
    alternates: { canonical: `/a/${slug}` },
    openGraph: {
      type: 'article',
      title: `${a.family.emoji} I'm ${a.family.name}`,
      description: `${a.family.essence} Find yours with the COYL autopilot audit.`,
      url: `https://coyl.ai/a/${slug}`,
      siteName: 'COYL',
      images: [
        {
          url: `/api/og?title=${ogTitle}&kicker=${ogKicker}`,
          width: 1200,
          height: 630,
          alt: `${a.family.emoji} ${a.family.name} — my COYL autopilot`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${a.family.emoji} I'm ${a.family.name}`,
      description: `${a.family.essence} Find yours.`,
      images: [`/api/og?title=${ogTitle}&kicker=${ogKicker}`],
    },
  }
}

export default async function ArchetypeSharePage({ params }: PageProps) {
  const { slug } = await params
  const parsed = parseShareSlug(slug)
  if (!parsed) notFound()

  const a = buildArchetype(parsed.wedge, parsed.window, parsed.script)

  return (
    <div className="min-h-screen bg-[#fafaf7] text-gray-900 selection:bg-orange-500 selection:text-white">
      <GlassNav />

      <main className="mx-auto max-w-3xl px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        {/* FAMILY CARD — the screenshot atom. Big, screenshot-able,
            same shape across all 6 families so the visual identity is
            consistent through the share network. */}
        <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)] md:p-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
              My COYL autopilot
            </span>
          </div>

          <p className="font-mono text-sm uppercase tracking-widest text-gray-500">I&rsquo;m</p>
          <h1 className="mt-3 flex flex-wrap items-baseline gap-3 text-5xl font-black leading-[1.02] text-gray-900 md:text-7xl">
            <span aria-hidden>{a.family.emoji}</span>
            <span>{a.family.name}</span>
          </h1>

          <p className="mt-6 max-w-xl text-xl leading-relaxed text-gray-700 md:text-2xl">
            {a.family.essence}
          </p>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
            {a.family.description}
          </p>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-orange-700">
              Signature script
            </p>
            <p className="mt-1 text-xl font-black italic text-gray-900 md:text-2xl">
              {a.family.signature}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {a.family.prevalenceCopy}
            </p>
          </div>
        </div>

        {/* SPECIFIC CARD — the texture. Smaller, secondary visual
            priority, but anchors the family to a real moment in the
            user's life so the family claim feels proven, not abstract. */}
        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
            Specifically, your moment looks like
          </p>
          <p className="mt-2 flex items-center gap-3 text-2xl font-black text-gray-900 md:text-3xl">
            <span aria-hidden>{a.specific.emoji}</span>
            <span>{a.specific.name}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <ResultStat label="Loop" value={WEDGE_LABEL[a.wedge]} />
            <ResultStat label="Window" value={WINDOW_LABEL[a.window]} />
            <ResultStat label="Script" value={SCRIPT_LABEL[a.script]} />
          </div>
        </div>

        {/* CONVERSION — Find your own archetype */}
        <section className="mt-12">
          <h2 className="text-3xl font-black leading-tight text-gray-900 md:text-5xl">
            Find <span className="text-orange-600">yours.</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg text-gray-600">
            60 seconds. No signup, no email. Three questions reveal the
            family you belong to — and the exact moment your autopilot
            runs.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Take the 60-second audit →
            </Link>
            <Link
              href={`/audit/${a.family.slug}`}
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              What is {a.family.name}?
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the manifesto
            </Link>
          </div>
        </section>

        {/* CATEGORY EXPLAINER — "what is this" for visitors who arrived
            from a friend's share with no context. */}
        <section className="mt-16 rounded-3xl border border-gray-200 bg-white p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-orange-600">
            What is COYL?
          </p>
          <p className="mt-3 text-2xl font-black leading-tight text-gray-900 md:text-3xl">
            The first AI built for the moment{' '}
            <span className="text-orange-600">before</span> behavior happens.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-700">
            COYL is the missing behavioral interface between AI and real
            life. It detects your autopilot patterns and interrupts them
            in real time — before the fridge opens, before the tab wins,
            before one slip becomes the night.
          </p>
          <p className="mt-4 text-xs italic text-gray-500">
            Behavioral support — not medical treatment.
          </p>
        </section>

        <footer className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
          <Link href="/" className="flex items-center gap-2">
            <CoylLogo size="sm" theme="light" />
          </Link>
          <Link
            href="/audit"
            className="text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            Take your audit →
          </Link>
        </footer>
      </main>
    </div>
  )
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-gray-900">{value}</p>
    </div>
  )
}

const WEDGE_LABEL: Record<WedgeId, string> = {
  weight: 'Food / weight',
  work: 'Work follow-through',
  destructive: 'Recurring loops',
  consistency: 'Consistency',
  spending: 'Spending',
  focus: 'Focus / procrastination',
}

const WINDOW_LABEL: Record<WindowId, string> = {
  morning: 'Morning (6 AM–noon)',
  afternoon: 'Afternoon (noon–5 PM)',
  afterwork: 'After-work (5–9 PM)',
  latenight: 'Late-night (9 PM–2 AM)',
}

const SCRIPT_LABEL: Record<ScriptId, string> = {
  reward: '"I deserve this."',
  delay: '"I\'ll start tomorrow."',
  collapse: '"I already messed up."',
  minimize: '"One time won\'t matter."',
  exhaustion: '"I\'m too tired tonight."',
  social: '"I couldn\'t say no."',
}
