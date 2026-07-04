/**
 * /card/[slug] — the public archetype card landing page.
 *
 * Where the viral loop lands. Someone screenshots the 9:16 card from the
 * audit (or sees a friend's), this is the page the link points at:
 *   - Renders the card visually (HTML twin of the /api/og/archetype PNG)
 *     so it's screenshot-ready on its own
 *   - Share / download / copy actions (the OG 9:16 PNG is the asset)
 *   - "Not you? Take the 60-second audit" — the acquisition CTA
 *   - A browse row of the other archetypes ("which one is your friend?")
 *
 * 10 slugs → 10 statically-generated, individually-shareable, SEO-indexed
 * pages. Each one is a viral asset. OG meta points at the 1200×630
 * landscape atom (link scrapers crop portrait); the 9:16 PNG remains the
 * Download/story asset.
 *
 * NEDA-safe: behavioral/pattern language only. No body/weight/calorie copy.
 *
 * Public route — must be in proxy.ts isPublicRoute (added as '/card/(.*)').
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ARCHETYPE_CARDS,
  ALL_CARD_SLUGS,
  getArchetypeCard,
} from '@/lib/archetype-cards'
import { ArchetypeShareActions } from '@/components/share/archetype-share-actions'
import { ArchetypeRarityPill } from '@/components/share/archetype-rarity-pill'
import { AuditCta } from '@/components/share/audit-cta'
import { DarkCanvas } from '@/components/share/dark-canvas'

// No `export const revalidate` — Next.js 16 cacheComponents rejects the
// segment config. generateStaticParams still statically generates all 10
// card pages at build time; they're fully static (no dynamic data).

export function generateStaticParams() {
  return ALL_CARD_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const card = getArchetypeCard(slug)
  if (!card) return { title: 'Pattern not found · COYL' }
  // Link previews need LANDSCAPE (X/Slack/LinkedIn crop to ~1.91:1 — the
  // 9:16 story PNG center-crops to empty dark space with the name cut off).
  // The 9:16 route stays as the Download/story asset only.
  const img =
    `/api/og?variant=archetype` +
    `&family=${encodeURIComponent(card.name)}` +
    `&signature=${encodeURIComponent(card.signature)}` +
    `&specific=${encodeURIComponent(card.window)}` +
    `&stat=${encodeURIComponent(card.rarity)}` +
    `&cta=${encodeURIComponent("What's your pattern?")}`
  const title = `${card.name} — what's your pattern? · COYL`
  const description = `${card.essence} ${card.rarity} Take the 60-second audit.`
  return {
    title,
    description,
    alternates: { canonical: `/card/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://coyl.ai/card/${slug}`,
      images: [{ url: img, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [img] },
  }
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const card = getArchetypeCard(slug)
  if (!card) notFound()

  const others = ALL_CARD_SLUGS.filter(
    (s) => s !== slug && ARCHETYPE_CARDS[s]?.family === card.family,
  )

  return (
    <main className="min-h-screen bg-[#0e0c0a] px-6 py-16 text-[#f5efe6]">
      <DarkCanvas />
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-14 md:flex-row md:items-start md:gap-20">
        {/* The visual card — HTML twin of the OG PNG, screenshot-ready */}
        <div className="w-full max-w-[360px] shrink-0">
          <div
            className="relative flex aspect-[9/16] w-full flex-col overflow-hidden rounded-3xl p-7"
            style={{ background: '#0e0c0a', border: '1px solid rgba(245,239,230,0.12)' }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,102,0,0.22) 0%, rgba(255,102,0,0) 70%)' }}
            />
            <div className="flex items-center gap-2">
              <span className="h-px w-6 bg-orange-500" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.32em] text-orange-500">
                COYL · Your pattern
              </span>
            </div>
            <div className="flex-1" />
            <h1 className="font-serif text-[2.4rem] font-bold leading-[0.98] tracking-[-0.02em]">
              {card.name}
            </h1>
            <p className="mt-3 font-serif text-xl italic text-orange-300">{card.signature}</p>
            <p className="mt-3 text-sm leading-[1.5] text-[#cdc2ad]">{card.essence}</p>
            <div className="mt-6 border-t-2 border-orange-500 pt-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#8a7f6d]">
                Your danger window
              </p>
              <p className="mt-1 text-sm font-semibold">{card.window}</p>
            </div>
            <div className="mt-4">
              <ArchetypeRarityPill slug={slug} name={card.name} fallback={card.rarity} />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.10] pt-3">
              <span className="text-[10px] text-[#8a7f6d]">60-second audit</span>
              <span className="text-[11px] font-bold text-orange-500">coyl.ai/audit</span>
            </div>
          </div>
        </div>

        {/* Copy + actions */}
        <div className="flex flex-1 flex-col gap-7 pt-2">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-500">
              {card.family === 'rebound' ? 'Rebound archetype' : 'Autopilot archetype'}
            </p>
            <h2 className="mt-4 font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] md:text-6xl">
              You&rsquo;re <span className="italic text-orange-400">{card.name}</span>.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-[1.6] text-[#cdc2ad]">{card.essence}</p>
          </div>

          {/* RECIPIENT FAST PATH — outranks the sharer-oriented actions.
              Most visitors here were sent a friend's card; their next
              tap must be the quiz, not the waitlist. */}
          <AuditCta
            surface="card"
            archetypeSlug={slug}
            className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 shadow-[0_0_28px_rgba(255,102,0,0.35)] transition-transform hover:scale-[1.01]"
          >
            <span className="text-base font-black text-white">
              Not you? Find <em className="not-italic underline decoration-white/50 underline-offset-4">yours</em>.
            </span>
            <span className="whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/90">
              60 sec · no signup &rarr;
            </span>
          </AuditCta>

          <ArchetypeShareActions slug={slug} name={card.name} />

          {/* FOMO bridge — card → waitlist, archetype carried for a warm
              "we'll open your pattern first" confirmation. */}
          <div className="rounded-2xl border border-orange-400/25 bg-orange-500/[0.06] p-5">
            <p className="text-sm leading-[1.6] text-[#cdc2ad]">
              The app is invite-only.{' '}
              <Link
                href={`/waitlist?archetype=${slug}&source=card`}
                className="font-semibold text-orange-400 underline-offset-4 hover:underline"
              >
                Request access →
              </Link>{' '}
              and we&rsquo;ll open {card.name} first.
            </p>
          </div>

          {/* Browse other archetypes — "which one is your friend?" */}
          <div className="border-t border-white/[0.08] pt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a7f6d]">
              Or tag the friend who&rsquo;s…
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {others.map((s) => (
                <Link
                  key={s}
                  href={`/card/${s}`}
                  className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-[#cdc2ad] transition-colors hover:border-orange-400/50 hover:text-orange-200"
                >
                  {ARCHETYPE_CARDS[s]?.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
