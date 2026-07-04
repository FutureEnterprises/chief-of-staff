import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CoylLogo } from '@/components/brand/logo'
import { AuditCta } from '@/components/share/audit-cta'
import { DarkCanvas } from '@/components/share/dark-canvas'
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
 *
 * Visual language: warm-dark editorial, matched to /card/[slug] — the
 * recipient taps a dark card in iMessage and should land on the same
 * canvas, not a bright-white seam. See /card/[slug]/page.tsx for the
 * canonical palette (#0e0c0a canvas, #f5efe6 text, #ff6600 accent).
 */

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseShareSlug(slug)
  if (!parsed) return { title: 'Archetype not found · COYL' }

  const a = buildArchetype(parsed.wedge, parsed.window, parsed.script)
  // Archetype OG variant — the viral atom. Renders family name + signature
  // script + specific moment + prevalence stat into a 1200×630 card sized
  // for Twitter/X, iMessage, Slack, LinkedIn link previews. Different from
  // the generic `?title=…&kicker=…` route — this one IS the screenshot
  // people share.
  //
  // Round-3 audit fix: previously this OG URL omitted the stat param, so
  // generic audit shares fell back to the "I'M" eyebrow even though the
  // underlying FAMILIES table has razor-sharp prevalence copy on every
  // archetype ("69% of you tell yourself this — and 0% of you have ever
  // been right about it"). Now the prevalence line IS the eyebrow — the
  // first thing a viewer reads on the Twitter/iMessage preview.
  //
  // Keep the FULL prevalence sentence (up to 90 chars) — the back half
  // after the em-dash ("…most often within 90 minutes of finishing
  // something hard") is the part that actually hooks the share. The OG
  // eyebrow wraps to two lines, so the whole line fits. Only fall back to
  // the em-dash cut if the full string still exceeds 90 chars.
  const fullStat = a.family.prevalenceCopy.trim()
  let shareStat: string
  if (fullStat.length <= 90) {
    shareStat = fullStat
  } else {
    const dashIndex = fullStat.indexOf('—')
    shareStat = (dashIndex > 0 ? fullStat.slice(0, dashIndex) : fullStat).trim().slice(0, 90)
  }
  const ogUrl =
    `/api/og?variant=archetype` +
    `&family=${encodeURIComponent(a.family.name)}` +
    `&signature=${encodeURIComponent(a.family.signature)}` +
    `&specific=${encodeURIComponent(a.specific.name)}` +
    `&stat=${encodeURIComponent(shareStat)}`

  // Lead with the prevalence stat — the most viral element on the page.
  // Round-3 audit fix (v3 external pass, 2026-05-24) called out that the
  // OG image already leads with the stat but the HTML <title> + openGraph
  // title were still falling back to "my COYL autopilot" descriptor text.
  // Now every surface (browser tab, link preview where image fails to
  // render, twitter card text, OG alt) leads with the archetype + its
  // signature script — the line that earns the click.
  const shareTitle = `${a.family.name}: ${a.family.signature}`
  const shareDescription = `${a.family.essence} Find your autopilot family at coyl.ai/audit.`

  return {
    title: shareTitle,
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
          alt: shareTitle,
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
    <div className="min-h-screen bg-[#0e0c0a] text-[#f5efe6] selection:bg-orange-500 selection:text-white">
      <DarkCanvas />
      <header className="border-b border-white/[0.06] bg-[#0e0c0a]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <CoylLogo size="sm" theme="dark" />
          </Link>
          <Link
            href="/audit"
            className="rounded-full bg-[#ff6600] px-4 py-1.5 text-xs font-bold text-[#0e0c0a] shadow-[0_0_14px_-2px_rgba(255,102,0,0.5)]"
          >
            Take the audit
          </Link>
        </div>
      </header>
      <Suspense fallback={<main className="mx-auto max-w-3xl px-6 py-16 md:py-24" />}>
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
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        {/* FAMILY CARD — the screenshot atom. Big, screenshot-able,
            same shape across all 6 families so the visual identity is
            consistent through the share network. */}
        <div className="rounded-3xl border border-white/[0.10] bg-white/[0.02] p-8 md:p-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-6 bg-orange-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-orange-500">
              My COYL autopilot
            </span>
          </div>

          <p className="font-mono text-sm uppercase tracking-widest text-[#8a7f6d]">I&rsquo;m</p>
          <h1 className="mt-3 flex flex-wrap items-center gap-5 font-serif text-5xl leading-[1.02] tracking-[-0.02em] text-[#f5efe6] md:text-7xl">
            <span
              aria-hidden
              className="inline-flex h-20 w-20 flex-none items-center justify-center rounded-3xl bg-orange-500/[0.12] text-orange-400 ring-1 ring-orange-500/25 md:h-24 md:w-24"
            >
              <a.family.Icon className="h-12 w-12 md:h-14 md:w-14" strokeWidth={2} />
            </span>
            <span>{a.family.name}</span>
          </h1>

          <p className="mt-6 max-w-xl text-xl leading-relaxed text-[#cdc2ad] md:text-2xl">
            {a.family.essence}
          </p>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#cdc2ad]">
            {a.family.description}
          </p>

          <div className="mt-6 rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-orange-400">
              Signature script
            </p>
            <p className="mt-1 font-serif text-xl italic text-orange-300 md:text-2xl">
              {a.family.signature}
            </p>
            <p className="mt-2 text-sm text-[#cdc2ad]">
              {a.family.prevalenceCopy}
            </p>
          </div>
        </div>

        {/* RECIPIENT FAST PATH — the loop dies in the screens between
            landing and "Start the audit". One above-the-fold tap, right
            under the sharer's card, before any sharer-oriented content. */}
        <AuditCta
          surface="a"
          archetypeSlug={a.family.slug}
          className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 shadow-[0_12px_32px_-8px_rgba(255,102,0,0.45)] transition-transform hover:scale-[1.01]"
        >
          <span className="text-base font-black text-white md:text-lg">
            What would <em className="not-italic underline decoration-white/50 underline-offset-4">yours</em> be?
          </span>
          <span className="whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/90">
            60 sec · no signup &rarr;
          </span>
        </AuditCta>

        {/* SPECIFIC CARD — the texture. Smaller, secondary visual
            priority, but anchors the family to a real moment in the
            user's life so the family claim feels proven, not abstract. */}
        <div className="mt-8 rounded-3xl border border-white/[0.10] bg-white/[0.02] p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8a7f6d]">
            Specifically, your moment looks like
          </p>
          <p className="mt-2 flex items-center gap-3 font-serif text-2xl text-[#f5efe6] md:text-3xl">
            <span
              aria-hidden
              className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-500/[0.12] text-orange-400 ring-1 ring-orange-500/25"
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
        <section className="mt-12 space-y-10 border-t border-white/[0.08] pt-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-500">
              Autopilot report · public card
            </span>
          </div>

          <h2 className="font-serif text-4xl font-normal leading-[1.02] tracking-[-0.02em] text-[#f5efe6] md:text-6xl">
            The shape of <span className="italic text-orange-400">your script.</span>
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

          <p className="max-w-2xl text-sm leading-[1.7] text-[#cdc2ad]">
            This report card is yours. No login. No email. Screenshot it,
            send the link, post it on{' '}
            <span className="font-serif italic">@coyl</span> — every share
            is a friend finding their own.
          </p>
        </section>

        {/* CONVERSION — Find your own archetype */}
        <section className="mt-12">
          <h2 className="font-serif text-3xl font-normal leading-tight text-[#f5efe6] md:text-5xl">
            Find <span className="italic text-orange-400">yours.</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg text-[#cdc2ad]">
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
              className="rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-[#f5efe6] transition-colors hover:border-orange-400/50 hover:text-orange-200"
            >
              What is {a.family.name}?
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-[#f5efe6] transition-colors hover:border-orange-400/50 hover:text-orange-200"
            >
              Read the manifesto
            </Link>
          </div>
        </section>

        {/* INVITE LOOP — shared result traffic should not dead-end at
            "cool card". Give recipients an immediate way to attach this
            archetype to their launch spot before they drift. */}
        <section className="mt-12 overflow-hidden rounded-3xl border border-orange-500/25 bg-orange-500/[0.06] p-8 md:p-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-orange-500" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-orange-500">
              Invite-only app
            </span>
          </div>

          <h2 className="mt-6 max-w-2xl font-serif text-4xl font-normal leading-[1.05] text-[#f5efe6] md:text-5xl">
            Want COYL to catch {a.family.name}{' '}
            <span className="italic text-orange-400">before it runs?</span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#cdc2ad] md:text-lg">
            The audit is free. The app is opening in waves. Join with this
            archetype attached; every friend who joins through you moves you
            up the line.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/waitlist?archetype=${a.family.slug}&source=a-share`}
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.28)]"
            >
              Request access for {a.family.name} →
            </Link>
            <Link
              href={`/card/${a.family.slug}`}
              className="rounded-full border border-orange-500/25 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-[#f5efe6] transition-colors hover:border-orange-400/50 hover:text-orange-200"
            >
              See the share card
            </Link>
          </div>
        </section>

        {/* CATEGORY EXPLAINER — "what is this" for visitors who arrived
            from a friend's share with no context. */}
        <section className="mt-16 rounded-3xl border border-white/[0.10] bg-white/[0.02] p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-orange-500">
            What is COYL?
          </p>
          <p className="mt-3 text-2xl font-bold leading-tight text-[#f5efe6] md:text-3xl">
            The first AI built for the moment{' '}
            <span className="italic text-orange-400">before</span> behavior happens.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cdc2ad]">
            COYL is the missing behavioral interface between AI and real
            life. It detects your autopilot patterns and interrupts them
            in real time — before the fridge opens, before the tab wins,
            before one slip becomes the night.
          </p>
          <p className="mt-4 text-xs italic text-[#8a7f6d]">
            Behavioral support — not medical treatment.
          </p>
        </section>

        <footer className="mt-12 flex items-center justify-between border-t border-white/[0.08] pt-6">
          <Link href="/" className="flex items-center gap-2">
            <CoylLogo size="sm" />
          </Link>
          <Link
            href="/audit"
            className="text-xs font-bold text-orange-400 hover:text-orange-300"
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
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a7f6d]">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-[#f5efe6]">{value}</p>
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
    <div className="border-t border-white/[0.08] pt-5">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-500">
        {label}
      </p>
      <p className="mt-3 font-serif text-2xl font-normal leading-[1.1] tracking-[-0.01em] text-[#f5efe6] md:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-widest text-[#8a7f6d]">
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
