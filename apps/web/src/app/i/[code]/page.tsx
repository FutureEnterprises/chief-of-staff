import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSharedCardByCode } from '@/lib/rescue-share'
import { AutopilotCard } from '@/components/share/autopilot-card'
import { ShareActions } from '@/components/share/share-actions'
import { CoylLogo } from '@/components/brand/logo'

/**
 * /i/[code] — public Autopilot Interrupted share page.
 *
 * The destination every shareable interrupt card points at. Renders:
 *   - The visual card (same component used in-product)
 *   - Share actions for the recipient to forward it
 *   - "What is this?" explainer block (the recipient hasn't seen COYL)
 *   - A sign-up CTA that lands the visitor on /sign-up with attribution
 *
 * Pre-fetched server-side so the OG meta tags reflect the actual moment
 * (Twitter/iMessage/Slack scrape this URL and use the meta to render
 * link previews — the existing /api/og route generates the 1200x630
 * PNG using the card data as query params).
 *
 * Public route — no auth. Anyone with the link can view. The page
 * intentionally avoids revealing user identity; the moment is shared,
 * not the person.
 */

type PageProps = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const card = await getSharedCardByCode(code).catch(() => null)

  if (!card) {
    return {
      title: 'Not found',
      robots: { index: false, follow: false },
    }
  }

  const title = `Autopilot interrupted at ${card.localTimeLabel}. COYL caught me.`
  const description = `${card.triggerLabel}. Streak: ${card.streakCount}. Self-trust: ${card.selfTrustScore ?? '—'}.`
  // Variant=card → the four-line atom (1200×630 OG-shaped).
  const ogImage =
    `/api/og?variant=card` +
    `&time=${encodeURIComponent(card.localTimeLabel)}` +
    `&behavior=${encodeURIComponent(card.triggerLabel)}` +
    `&streak=${encodeURIComponent(String(card.streakCount))}`

  return {
    title,
    description,
    robots: { index: false, follow: true }, // share URLs shouldn't crowd the index
    openGraph: {
      type: 'website',
      title,
      description,
      url: `https://coyl.ai/i/${card.shareCode}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'COYL caught me.' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  const { code } = await params
  const card = await getSharedCardByCode(code).catch(() => null)

  if (!card) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  const shareUrl = `${baseUrl}/i/${card.shareCode}`
  const shareText = `Autopilot interrupted at ${card.localTimeLabel}. ${card.triggerLabel}. COYL caught me.`

  return (
    <main className="min-h-screen bg-[#0e0d0b] text-[#e7dccb]">
      {/* Minimal header — brand mark only. No nav, no distractions. */}
      <header className="border-b border-white/5 bg-[#0e0d0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <CoylLogo size="sm" theme="dark" />
          </Link>
          <Link
            href="/sign-up?ref=share"
            className="rounded-full bg-[#ff6600] px-4 py-1.5 text-xs font-bold text-[#0e0d0b] shadow-[0_0_14px_-2px_rgba(255,102,0,0.5)]"
          >
            Start free
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-10 md:py-16">
        {/* The card — locked to 1080×1080 Instagram-native aspect so the
            on-page render matches the screenshot atom 1:1. */}
        <AutopilotCard data={card} variant="square" />

        {/* Share actions — for the recipient to forward */}
        <ShareActions shareUrl={shareUrl} shareText={shareText} />

        {/* Soft "audit yourself" CTA — for the friend who lands here cold */}
        <Link
          href="/sign-up?ref=share"
          className="mt-8 flex items-center justify-between rounded-2xl border border-orange-500/20 bg-[#100e0a] px-5 py-4 text-sm font-medium text-[#f5efe6] transition-colors hover:border-orange-500/50 hover:bg-[#13110c]"
        >
          <span>Take the audit yourself</span>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6600]">
            &rarr;
          </span>
        </Link>

        {/* "What is this?" explainer */}
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#ff6600]">
            What is this
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            COYL fires the second before you fold.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Every other behavior-change app intervenes <em>before</em> the moment
            (reminders) or <em>after</em> the moment (journaling). COYL fires{' '}
            <em>in</em> the 3-second window between trigger and action &mdash;
            the only window that matters. The card above is what it looks like
            when it works.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/sign-up?ref=share"
              className="rounded-full bg-[#ff6600] px-5 py-2.5 text-sm font-bold text-[#0e0d0b] shadow-[0_0_18px_rgba(255,102,0,0.35)]"
            >
              Catch me next time &rarr;
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
            >
              How it works
            </Link>
          </div>
        </section>

        <p className="mt-10 text-center text-[11px] text-gray-600">
          Shared anonymously. No identity. The moment, not the person.
        </p>
      </div>
    </main>
  )
}
