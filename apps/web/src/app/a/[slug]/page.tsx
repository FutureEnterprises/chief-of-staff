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
 * /a/[slug] — public archetype share page.
 *
 * The viral atom. Every shared audit result points here:
 *   /a/weight-latenight-reward → 🌙 Night Fridge Saboteur
 *
 * Stateless route — the slug encodes (wedge, window, script). The page:
 *   1. Validates the slug. Bad slug → 404.
 *   2. Computes the archetype.
 *   3. Generates social meta (OG image, Twitter card) so the link
 *      preview on Twitter/iMessage/Slack shows the archetype.
 *   4. Renders a beautiful card the visitor lands on.
 *   5. Gives the visitor a single CTA: "Find your own archetype" →
 *      /audit. That CTA is the entire viral conversion loop — visitor
 *      curiosity → audit start → their own archetype → their own share.
 *
 * NOT logged or DB-persisted in v1. Adding view-tracking later is a
 * matter of swapping in analytics; the URL shape stays.
 */

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseShareSlug(slug)
  if (!parsed) return { title: 'Archetype not found · COYL' }

  const a = buildArchetype(parsed.wedge, parsed.window, parsed.script)
  const ogTitle = encodeURIComponent(`${a.emoji} ${a.name}`)
  const ogKicker = encodeURIComponent('My COYL autopilot')

  return {
    title: `${a.name} — my COYL autopilot`,
    description: `${a.prevalenceCopy} Find your archetype with the 60-second autopilot audit.`,
    alternates: { canonical: `/a/${slug}` },
    openGraph: {
      type: 'article',
      title: `${a.emoji} I'm a ${a.name}`,
      description: `${a.prevalenceCopy} Find your archetype with the COYL autopilot audit.`,
      url: `https://coyl.ai/a/${slug}`,
      siteName: 'COYL',
      images: [
        {
          url: `/api/og?title=${ogTitle}&kicker=${ogKicker}`,
          width: 1200,
          height: 630,
          alt: `${a.emoji} ${a.name} — my COYL autopilot`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${a.emoji} I'm a ${a.name}`,
      description: `${a.prevalenceCopy} Find your archetype.`,
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
        {/* ARCHETYPE CARD — the screenshot atom */}
        <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)] md:p-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
              My COYL autopilot
            </span>
          </div>

          <p className="font-mono text-sm uppercase tracking-widest text-gray-500">I am a</p>
          <h1 className="mt-3 flex flex-wrap items-baseline gap-3 text-5xl font-black leading-[1.05] text-gray-900 md:text-7xl">
            <span aria-hidden>{a.emoji}</span>
            <span>{a.name}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-700">
            {a.prevalenceCopy}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
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
            exact moment your autopilot runs — and what COYL would do
            about it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Take the 60-second audit →
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the manifesto
            </Link>
          </div>
        </section>

        {/* CATEGORY EXPLAINER — "what is this" for the visitor who
            arrived from a friend's share with no context. */}
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
  destructive: 'Destructive pattern',
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
