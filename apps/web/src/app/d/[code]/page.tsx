import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@repo/database'
import { ShareActions } from '@/components/share/share-actions'
import { CoylLogo } from '@/components/brand/logo'
import { formatDeltaLabel } from '@/lib/daily-number'

/**
 * /d/[code] — PUBLIC daily-number share page.
 *
 * The destination every daily-card share URL points at. Renders the
 * full-bleed editorial four-element layout:
 *
 *   DAY 47.
 *   +3
 *   You held a 9 PM moment last night.
 *   — COYL
 *
 * Below: a "Take the audit" CTA for cold visitors who landed via
 * someone's share. Match the /i/[code] aesthetic — but with the cream
 * canvas + Instrument Serif treatment specified by the daily-ritual
 * brand brief (vs. the dark-charcoal interrupt-card treatment).
 *
 * The shareCode is the row's @unique String — distinct from the row id
 * so URLs can't be enumerated. No auth required.
 *
 * Server-rendered so the OG meta tags are present at scrape time
 * (Twitter/iMessage/Slack request this URL and parse the meta to render
 * link previews — the /d/[code]/og route generates the PNG using the
 * same row).
 */

type PageProps = { params: Promise<{ code: string }> }

async function fetchDaily(code: string) {
  // The shareCode column is @unique. Return the minimum payload the
  // page + metadata need.
  return prisma.dailyNumber.findUnique({
    where: { shareCode: code },
    select: {
      id: true,
      shareCode: true,
      dayNumber: true,
      selfTrustScore: true,
      selfTrustDelta: true,
      identitySentence: true,
      archetype: true,
      shareCount: true,
      generatedAt: true,
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const daily = await fetchDaily(code).catch(() => null)

  if (!daily) {
    return {
      title: 'Not found',
      robots: { index: false, follow: false },
    }
  }

  const deltaLabel = formatDeltaLabel(daily.selfTrustDelta, { ascii: true })
  const title = `Day ${daily.dayNumber}. ${deltaLabel}.`
  const description = daily.identitySentence
  const ogImage = `/d/${daily.shareCode}/og`

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `https://coyl.ai/d/${daily.shareCode}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function DailyNumberSharePage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-[#f6efe4] text-[#1a1814]">
      <header className="border-b border-black/[0.06] bg-[#f6efe4]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <CoylLogo size="sm" theme="light" />
          </Link>
          <Link
            href="/sign-up?ref=daily"
            className="rounded-full bg-[#ff6600] px-4 py-1.5 text-xs font-bold text-[#0e0d0b] shadow-[0_0_14px_-2px_rgba(255,102,0,0.4)]"
          >
            Start free
          </Link>
        </div>
      </header>
      <Suspense fallback={<div className="mx-auto max-w-xl px-6 py-10 md:py-16" />}>
        <DailyContent params={params} />
      </Suspense>
    </main>
  )
}

async function DailyContent({ params }: PageProps) {
  const { code } = await params
  const daily = await fetchDaily(code).catch(() => null)

  if (!daily) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  const shareUrl = `${baseUrl}/d/${daily.shareCode}`
  const deltaLabel = formatDeltaLabel(daily.selfTrustDelta)
  const deltaIsPositive = daily.selfTrustDelta > 0
  const deltaIsNegative = daily.selfTrustDelta < 0
  const shareText = `Day ${daily.dayNumber}. ${formatDeltaLabel(daily.selfTrustDelta, { ascii: true })}. ${daily.identitySentence} — COYL`

  return (
    <>
      <div className="mx-auto max-w-xl px-6 py-10 md:py-16">
        {/* The card — full-bleed editorial four-element layout. Cream
            canvas, Instrument Serif, single orange focal moment on the
            delta. Locked to a 1:1 square so the on-page render matches
            the 1080×1080 share asset 1:1. */}
        <section
          aria-label={`Day ${daily.dayNumber}. ${deltaLabel}. ${daily.identitySentence}`}
          className="relative aspect-square w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-[#f6efe4] shadow-[0_30px_60px_-20px_rgba(26,24,20,0.18)]"
        >
          {/* Soft warm wash for depth — no decorative gloss */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 35%, rgba(255,102,0,0.06), transparent 60%)',
            }}
          />

          <div className="relative flex h-full w-full flex-col justify-between px-[9%] py-[10%]">
            {/* 1. Day number — mono micro, gray-500 */}
            <p className="font-mono text-[clamp(11px,1.9cqw,18px)] uppercase tracking-[0.28em] text-[#6b6557]">
              Day {daily.dayNumber}.
            </p>

            {/* 2. Delta — Instrument Serif huge, orange focal moment */}
            <div className="flex flex-col gap-[2%]">
              <p
                className={`font-serif leading-[0.9] tracking-[-0.04em] ${
                  deltaIsPositive
                    ? 'text-[#ff6600]'
                    : deltaIsNegative
                      ? 'text-[#9a3a1a]'
                      : 'text-[#1a1814]'
                }`}
                style={{
                  fontSize: 'clamp(72px, 22cqw, 256px)',
                }}
              >
                {deltaLabel}
              </p>

              {/* 3. Identity sentence — Instrument Serif large, gray-900 */}
              <p className="font-serif text-[clamp(22px,5.4cqw,56px)] leading-[1.05] tracking-[-0.012em] text-[#1a1814]">
                {daily.identitySentence}
              </p>
            </div>

            {/* 4. Signoff — mono micro, gray-400 */}
            <p className="font-mono text-[clamp(11px,1.9cqw,18px)] uppercase tracking-[0.28em] text-[#9a8f7a]">
              &mdash; COYL
            </p>
          </div>
        </section>

        {/* Share actions — for the recipient to forward */}
        <ShareActions shareUrl={shareUrl} shareText={shareText} tone="light" />

        {/* Audit CTA for cold visitors — same affordance the interrupt
            share page uses, retuned for the cream surface. */}
        <Link
          href="/audit?ref=daily"
          className="mt-8 flex items-center justify-between rounded-2xl border border-orange-500/30 bg-white/60 px-5 py-4 text-sm font-medium text-[#1a1814] transition-colors hover:border-orange-500/60 hover:bg-white"
        >
          <span>Take the audit yourself</span>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6600]">
            &rarr;
          </span>
        </Link>

        {/* "What is this?" explainer */}
        <section className="mt-12 rounded-3xl border border-black/[0.08] bg-white/70 p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#ff6600]">
            What is this
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-[-0.02em] text-[#1a1814] md:text-4xl">
            One number. One sentence. Same time every day.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#54503f]">
            Every day at 8 PM, COYL gives you your Self-Trust delta and a
            single sentence about who you are right now. Not a streak you
            can lose, not a stat dump &mdash; an identity grounding. People
            share Wordle because it&apos;s daily, simple, and finite. This
            is that, for the person you&apos;re becoming.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/sign-up?ref=daily"
              className="rounded-full bg-[#ff6600] px-5 py-2.5 text-sm font-bold text-[#0e0d0b] shadow-[0_0_18px_rgba(255,102,0,0.3)]"
            >
              Get my Day 1 &rarr;
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-black/10 bg-white/80 px-5 py-2.5 text-sm font-semibold text-[#1a1814] hover:border-orange-500/40 hover:text-[#9a3a1a]"
            >
              How it works
            </Link>
          </div>
        </section>

        {daily.shareCount > 0 && (
          <p className="mt-10 text-center text-[11px] uppercase tracking-[0.22em] text-[#9a8f7a]">
            Seen by {daily.shareCount}{' '}
            {daily.shareCount === 1 ? 'person' : 'people'}
          </p>
        )}
      </div>
    </>
  )
}
