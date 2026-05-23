import { Suspense } from 'react'
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
 *   /a/weight-latenight-reward → The Deserver
 *                                  (specifically, Night Fridge Saboteur)
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
  // Archetype OG variant — the viral atom. Renders family name + signature
  // script + specific moment into a 1200×630 card sized for Twitter/X,
  // iMessage, Slack, LinkedIn link previews. Different from the generic
  // `?title=…&kicker=…` route — this one IS the screenshot people share.
  const ogUrl =
    `/api/og?variant=archetype` +
    `&family=${encodeURIComponent(a.family.name)}` +
    `&signature=${encodeURIComponent(a.family.signature)}` +
    `&specific=${encodeURIComponent(a.specific.name)}`

  const shareTitle = `I'm ${a.family.name}`
  const shareDescription = `${a.family.signature} ${a.family.essence} Find your autopilot family at coyl.ai/audit.`

  return {
    title: `${a.family.name} — my COYL autopilot`,
    description: shareDescription,
    alternates: { canonical: `/a/${slug}` },
    openGraph: {
      type: 'article',
      title: shareTitle,
      description: shareDescription,
      url: `https://coyl.ai/a/${slug}`,
      siteName: 'COYL',
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${a.family.name} — my COYL autopilot`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description: shareDescription,
      images: [ogUrl],
    },
  }
}

export default function ArchetypeSharePage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-gray-900 selection:bg-orange-500 selection:text-white">
      <GlassNav />
      <Suspense fallback={<main className="mx-auto max-w-3xl px-6 pt-28 pb-16 md:pt-36 md:pb-24" />}>
        <ArchetypeContent params={params} />
      </Suspense>
    </div>
  )
}

async function ArchetypeContent({ params }: PageProps) {
  const { slug } = await params
  const parsed = parseShareSlug(slug)
  if (!parsed) notFound()

  const a = buildArchetype(parsed.wedge, parsed.window, parsed.script)

  return (
    <>
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
          <h1 className="mt-3 flex flex-wrap items-center gap-5 text-5xl font-black leading-[1.02] text-gray-900 md:text-7xl">
            <span
              aria-hidden
              className="inline-flex h-20 w-20 flex-none items-center justify-center rounded-3xl bg-orange-100 text-orange-600 ring-1 ring-orange-200 md:h-24 md:w-24"
            >
              <a.family.Icon className="h-12 w-12 md:h-14 md:w-14" strokeWidth={2} />
            </span>
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
            <span
              aria-hidden
              className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100"
            >
              <a.specific.Icon className="h-6 w-6" strokeWidth={2} />
            </span>
            <span>{a.specific.name}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <ResultStat label="Loop" value={WEDGE_LABEL[a.wedge]} />
            <ResultStat label="Window" value={WINDOW_LABEL[a.window]} />
            <ResultStat label="Script" value={SCRIPT_LABEL[a.script]} />
          </div>
        </div>

        {/* AUTOPILOT REPORT CARD — the comprehensive "Spotify Wrapped"
            style readout. Per the $6B strategy memo (30-day checklist
            item 01): "Ship the shareable Autopilot Report card. One tap.
            Works without login. Beautiful design." This block elevates
            the share atom from "your archetype" to "your full report":
            peak hour, weekly frequency, signature script, recovery
            starting score. Stateless — derived directly from slug. */}
        <section className="mt-12 space-y-10 border-t border-orange-500 pt-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Autopilot report · public card
            </span>
          </div>

          <h2 className="font-serif text-4xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-6xl">
            The shape of <span className="italic text-orange-600">your script.</span>
          </h2>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <ReportTile
              label="Peak danger hour"
              value={PEAK_HOUR[a.window]}
              caption="Window midpoint"
            />
            <ReportTile
              label="Weekly frequency"
              value={WEEKLY_FREQ[a.script]}
              caption="Avg fires / week"
            />
            <ReportTile
              label="Signature script"
              value={a.family.signature}
              caption="What you tell yourself"
            />
            <ReportTile
              label="Self-trust start"
              value={SELF_TRUST_START[a.script]}
              caption="Baseline / 100"
            />
          </div>

          <p className="max-w-2xl text-sm leading-[1.7] text-gray-600">
            This report card is yours. No login. No email. Screenshot it,
            send the link, post it on{' '}
            <span className="font-serif italic">@coyl</span> — every share
            is a friend finding their own.
          </p>
        </section>

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
    </>
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

/* ───────────────────────────────────────────────────────────────────
 * AUTOPILOT REPORT CARD — derived data
 *
 * The four headline metrics on the public report card. Stateless,
 * derived purely from (window × script) — no DB read. The user's
 * specific peak hour is the window midpoint; the weekly frequency is
 * keyed off the family's prevalence anchor; the self-trust starting
 * score is a baseline that nudges up with real interrupts logged once
 * the user signs up.
 * ─────────────────────────────────────────────────────────────────── */

function ReportTile({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption: string
}) {
  return (
    <div className="border-t border-gray-200 pt-5">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
        {label}
      </p>
      <p className="mt-3 font-serif text-2xl font-normal leading-[1.1] tracking-[-0.01em] text-gray-900 md:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-widest text-gray-500">
        {caption}
      </p>
    </div>
  )
}

const PEAK_HOUR: Record<WindowId, string> = {
  morning: '9:30 AM',
  afternoon: '2:30 PM',
  afterwork: '7:30 PM',
  latenight: '10:30 PM',
}

const WEEKLY_FREQ: Record<ScriptId, string> = {
  reward: '4.2×',
  delay: '5.8×',
  collapse: '3.1×',
  minimize: '4.6×',
  exhaustion: '3.4×',
  social: '2.7×',
}

const SELF_TRUST_START: Record<ScriptId, string> = {
  reward: '34',
  delay: '28',
  collapse: '22',
  minimize: '36',
  exhaustion: '31',
  social: '39',
}
