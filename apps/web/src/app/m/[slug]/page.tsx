import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@repo/database'
import { ShareActions } from '@/components/share/share-actions'
import { CoylLogo } from '@/components/brand/logo'

/**
 * /m/[slug] — public Autopilot Map snapshot share page.
 *
 * The "Spotify Wrapped for self-sabotage" artifact. A weekly cron
 * generates an AutopilotMapSnapshot per active user with the four
 * stats below; the user shares the link, and any visitor — auth or
 * not — sees the moment rendered as a 4-card editorial grid.
 *
 * Mirrors /i/[code] (the per-interrupt share) in framing rules:
 *   - No identity is revealed. The card is the moment, not the person.
 *   - robots: noindex — these are user-shared moments, not SEO surface.
 *   - OG meta points at /api/og/autopilot-map/[slug] for the 1200×630
 *     PNG that Twitter/iMessage/Slack/LinkedIn renders inline.
 *
 * The page is a server component that reads the snapshot by shareSlug
 * (the 8-char hex stamped at generation time). notFound() if revoked
 * or unknown.
 */

type PageProps = { params: Promise<{ slug: string }> }

// Snapshot shape — typed locally so this file compiles before the
// sibling Prisma migration lands. Once the AutopilotMapSnapshot model
// exists in schema.prisma and `pnpm db:generate` runs, the runtime
// lookup below produces an object that matches this shape exactly.
type SnapshotView = {
  topExcuse: string
  topExcuseCount: number
  peakWindowLabel: string
  peakWindowSlips: number
  slipsThisWeek: number
  recoveredCount: number
  recoveryRate: number
  patternSignature: string
  weekLabel: string
  shareSlug: string
}

// Human-readable phrasing for each ExcuseCategory enum value. Mirrors
// the comments on the ExcuseCategory enum in schema.prisma so the
// recipient (who may have never used COYL) can read the card without
// needing taxonomy context.
const EXCUSE_COPY: Record<string, { label: string; sentence: (n: number) => string }> = {
  DELAY: {
    label: 'DELAY',
    sentence: (n) => `You said "I'll start tomorrow" ${n} times this week.`,
  },
  REWARD: {
    label: 'REWARD',
    sentence: (n) => `You told yourself "I deserve it" ${n} times this week.`,
  },
  MINIMIZATION: {
    label: 'MINIMIZATION',
    sentence: (n) => `You said "one time won't matter" ${n} times this week.`,
  },
  COLLAPSE: {
    label: 'COLLAPSE',
    sentence: (n) => `You said "I already blew it" ${n} times this week.`,
  },
  EXHAUSTION: {
    label: 'EXHAUSTION',
    sentence: (n) => `You said "I'm too tired" ${n} times this week.`,
  },
  EXCEPTION: {
    label: 'EXCEPTION',
    sentence: (n) => `You said "this week is weird" ${n} times this week.`,
  },
  COMPENSATION: {
    label: 'COMPENSATION',
    sentence: (n) => `You said "I'll make up for it later" ${n} times this week.`,
  },
  SOCIAL_PRESSURE: {
    label: 'SOCIAL',
    sentence: (n) => `You said "I can't say no here" ${n} times this week.`,
  },
}

async function loadSnapshot(slug: string): Promise<SnapshotView | null> {
  try {
    // The AutopilotMapSnapshot model is being added in a sibling commit
    // (cron + schema). Until that lands locally, the property does not
    // exist on PrismaClient. We soft-cast through unknown so the type
    // check passes; at runtime, when the model exists, the call returns
    // the row directly.
    const client = prisma as unknown as {
      autopilotMapSnapshot?: {
        findUnique: (args: {
          where: { shareSlug: string }
        }) => Promise<SnapshotView | null>
      }
    }
    if (!client.autopilotMapSnapshot) return null
    const row = await client.autopilotMapSnapshot.findUnique({
      where: { shareSlug: slug },
    })
    return row
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const snap = await loadSnapshot(slug)

  if (!snap) {
    return {
      title: 'Map revoked',
      robots: { index: false, follow: false },
    }
  }

  const title = `An autopilot week — ${snap.weekLabel}. COYL mapped it.`
  const description = `${snap.patternSignature} · ${snap.slipsThisWeek} slips · ${snap.recoveredCount} recovered.`
  const ogImage = `/api/og/autopilot-map/${snap.shareSlug}`

  return {
    title,
    description,
    // Share URLs should never crowd the search index — they're user
    // moments, not marketing pages.
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `https://coyl.ai/m/${snap.shareSlug}`,
      images: [
        { url: ogImage, width: 1200, height: 630, alt: 'A week of autopilot, mapped.' },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function AutopilotMapSharePage({ params }: PageProps) {
  const { slug } = await params
  const snap = await loadSnapshot(slug)
  if (!snap) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  const shareUrl = `${baseUrl}/m/${snap.shareSlug}`
  const shareText = `${snap.patternSignature} — an autopilot week, mapped by COYL.`
  const twitterIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  const excuseCopy =
    EXCUSE_COPY[snap.topExcuse] ?? {
      label: snap.topExcuse,
      sentence: (n: number) => `${n} excuses logged this week.`,
    }
  const recoveryPct = Math.round(snap.recoveryRate * 100)

  return (
    <main className="min-h-screen bg-[#fafaf7] text-gray-900 selection:bg-orange-500 selection:text-white">
      {/* Minimal editorial header — single mark, single CTA. Doesn't
          use the full GlassNav because this page is one frame, one
          message: the moment, then the audit invite. */}
      <header className="border-b border-gray-200 bg-[#fafaf7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-gray-900">
            <CoylLogo size="sm" theme="light" />
          </Link>
          <Link
            href="/audit?ref=m-share"
            className="rounded-full bg-[#ff6600] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#0e0d0b] shadow-[0_0_14px_-2px_rgba(255,102,0,0.5)] hover:shadow-[0_0_18px_-2px_rgba(255,102,0,0.7)]"
          >
            Find your autopilot
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-14 pb-12 md:pt-20">
        {/* Kicker — frame as the moment, not the person. */}
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Autopilot week &middot; {snap.weekLabel}
          </span>
        </div>

        <h1 className="mt-8 font-serif text-5xl font-normal leading-[0.98] tracking-[-0.025em] text-gray-900 md:text-7xl">
          One week of autopilot,<br />
          <span className="italic text-orange-600">mapped.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700 md:text-lg">
          The same person, the same week, the same script &mdash; rendered as
          four numbers. Not identity. The moment.
        </p>
      </section>

      {/* 4-card grid: top excuse, peak window, recovery, signature.
          Single column on mobile, 2×2 on desktop. Cream cards on cream
          page — separated by hairline borders, the editorial pattern
          used across /autopilot-map and /caught. */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Card 1 — Top excuse */}
          <article className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-7 md:p-9">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Top excuse
              </p>
              <p className="mt-6 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.02em] text-gray-900 md:text-6xl">
                {excuseCopy.label}
              </p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-gray-500">
                &times; {snap.topExcuseCount}
              </p>
            </div>
            <p className="mt-8 text-sm leading-[1.6] text-gray-700 md:text-base">
              {excuseCopy.sentence(snap.topExcuseCount)}
            </p>
          </article>

          {/* Card 2 — Peak window */}
          <article className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-7 md:p-9">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Peak window
              </p>
              <p className="mt-6 font-serif text-4xl font-normal leading-[0.95] tracking-[-0.02em] text-gray-900 md:text-5xl">
                {snap.peakWindowLabel}
              </p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-gray-500">
                {snap.peakWindowSlips} slip{snap.peakWindowSlips === 1 ? '' : 's'}
              </p>
            </div>
            <p className="mt-8 text-sm leading-[1.6] text-gray-700 md:text-base">
              {snap.peakWindowLabel} caught the script {snap.peakWindowSlips}{' '}
              time{snap.peakWindowSlips === 1 ? '' : 's'}. Same hour. Same
              week. Different choice next time.
            </p>
          </article>

          {/* Card 3 — Recovery */}
          <article className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-7 md:p-9">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Recovery
              </p>
              <p className="mt-6 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.02em] text-gray-900 md:text-6xl">
                {recoveryPct}
                <span className="text-3xl text-orange-600 md:text-4xl">%</span>
              </p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-gray-500">
                {snap.recoveredCount} of {snap.slipsThisWeek} slips
              </p>
            </div>
            <p className="mt-8 text-sm leading-[1.6] text-gray-700 md:text-base">
              {snap.recoveredCount} of {snap.slipsThisWeek} slips recovered
              within 24 hours. The point of the map isn&apos;t never falling
              &mdash; it&apos;s the loop that catches you when you do.
            </p>
          </article>

          {/* Card 4 — Signature, the pull-quote */}
          <article className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-[#fafaf7] p-7 md:p-9">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Signature
              </p>
              <p className="mt-6 font-serif text-2xl font-normal italic leading-[1.25] tracking-[-0.01em] text-gray-900 md:text-3xl">
                &ldquo;{snap.patternSignature}&rdquo;
              </p>
            </div>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.28em] text-gray-500">
              {snap.weekLabel}
            </p>
          </article>
        </div>

        {/* Share row — Twitter intent + copy-link button. */}
        <div className="mt-10 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={twitterIntent}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-900 hover:border-orange-500/60 hover:text-orange-700"
            >
              Share on Twitter
            </a>
            <ShareActions shareUrl={shareUrl} shareText={shareText} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">
            The moment, not the person
          </p>
        </div>
      </section>

      {/* CTA — find your own autopilot */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-orange-500" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  Your turn
                </span>
              </div>
              <h2 className="mt-6 font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
                Find your own autopilot,{' '}
                <span className="italic text-orange-600">on a card.</span>
              </h2>
              <p className="mt-5 text-base leading-[1.65] text-gray-700">
                The audit takes 4 minutes. At the end you get the same four
                numbers, your own. Share it, screenshot it, or keep it.
              </p>
            </div>
            <Link
              href="/audit?ref=m-share"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6600] px-6 py-3 text-sm font-semibold text-[#0e0d0b] shadow-[0_0_18px_rgba(255,102,0,0.35)] hover:shadow-[0_0_24px_rgba(255,102,0,0.5)]"
            >
              Take the audit &rarr;
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-[#fafaf7] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <span>
            &copy; 2026 COYL &middot; Catch yourself before you do it again.
          </span>
          <div className="flex gap-4">
            <Link href="/how-it-works" className="hover:text-orange-600">
              How it works
            </Link>
            <Link href="/autopilot-map" className="hover:text-orange-600">
              Autopilot map
            </Link>
            <Link href="/privacy" className="hover:text-orange-600">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
