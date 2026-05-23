/**
 * /rb/[family] — public Rebound archetype share-result page.
 *
 * The destination every shared "I'm a Night Rebounder" link points
 * at. Renders the archetype card with cinematic dark treatment, a
 * "find yours" CTA back to /rebound/quiz, and an OG meta block that
 * makes Twitter / iMessage / Slack / Threads previews show the
 * family + signature + risk window via /api/og?variant=archetype.
 *
 * Stateless: the family slug encodes everything. Bad slug → notFound.
 * Public, no auth, no DB. Lives under the dark consumer-funnel
 * surface so a paid-acquisition click → share lands in coherent
 * visual chapter the whole way through.
 *
 * Mirrors /a/[slug] (the generic audit share page) but with the
 * 4-family Rebound taxonomy from lib/rebound-archetype.ts.
 */
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { familyBySlug } from '@/lib/rebound-archetype'
import { GlassNav } from '@/components/landing/glass-nav'

type PageProps = { params: Promise<{ family: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { family } = await params
  const def = familyBySlug(family)
  if (!def) {
    return { title: 'Rebound archetype not found · COYL' }
  }

  // The archetype OG variant takes family + signature + specific. For
  // Rebound, "specific" is the highest-risk window — the texture that
  // proves the family fits the user's actual moment. cta/ctaUrl
  // override the default "Find your autopilot family / coyl.ai/audit"
  // footer so the shared preview routes recipients to the Rebound
  // funnel, not the generic audit.
  const ogUrl =
    `/api/og?variant=archetype` +
    `&family=${encodeURIComponent(def.name)}` +
    `&signature=${encodeURIComponent(def.signature)}` +
    `&specific=${encodeURIComponent(def.riskWindow)}` +
    `&stat=${encodeURIComponent(def.shareStat)}` +
    `&cta=${encodeURIComponent('Find your rebound pattern')}` +
    `&ctaUrl=${encodeURIComponent('coyl.ai/rebound/quiz')}`

  const shareTitle = `I'm ${def.name}`
  const shareDescription = `${def.signature} ${def.essence} Find your rebound pattern at coyl.ai/rebound/quiz.`

  return {
    title: `${def.name} — my GLP-1 rebound pattern · COYL`,
    description: shareDescription,
    alternates: { canonical: `/rb/${family}` },
    openGraph: {
      type: 'article',
      title: shareTitle,
      description: shareDescription,
      url: `https://coyl.ai/rb/${family}`,
      siteName: 'COYL',
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${def.name} — GLP-1 rebound archetype`,
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

export default function ReboundSharePage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-gray-900 selection:bg-orange-500 selection:text-white">
      <GlassNav />
      <Suspense fallback={<main className="mx-auto max-w-3xl px-6 pt-28 pb-16 md:pt-36 md:pb-24" />}>
        <ReboundShareContent params={params} />
      </Suspense>
    </div>
  )
}

async function ReboundShareContent({ params }: PageProps) {
  const { family } = await params
  const def = familyBySlug(family)
  if (!def) notFound()
  const Icon = def.Icon

  return (
    <main className="mx-auto max-w-3xl px-6 pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Cinematic archetype card — same visual language as the /rebound/quiz
          result reveal. Dark warm-charcoal panel, dual radial glow, scan-
          line texture, serif italic family name. Recipient lands in the
          same emotional chapter the sharer just experienced. */}
      <div className="relative isolate mb-8 overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0f0e0c] p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55),0_10px_30px_-10px_rgba(255,102,0,0.25)] md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              radial-gradient(50% 60% at 18% 32%, rgba(255, 138, 76, 0.22) 0%, transparent 70%),
              radial-gradient(45% 55% at 82% 80%, rgba(255, 102, 0, 0.18) 0%, transparent 70%)
            `,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
          }}
        />

        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-400">
          I&rsquo;m
        </p>
        <p className="mt-4 flex flex-wrap items-baseline gap-4">
          <span
            aria-hidden
            className="inline-flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30 md:h-16 md:w-16"
          >
            <Icon className="h-8 w-8 md:h-9 md:w-9" strokeWidth={1.8} />
          </span>
          <span className="font-serif text-[clamp(2.4rem,6vw,4.2rem)] italic font-normal leading-[0.98] tracking-[-0.025em] text-[#f8f1e4]">
            {def.name}.
          </span>
        </p>
        <p className="mt-6 max-w-xl text-base leading-[1.6] text-[#d9d1c2] md:text-lg">
          {def.essence}
        </p>
        <p className="mt-5 font-serif text-xl italic leading-snug text-orange-300 md:text-2xl">
          {def.signature}
        </p>
        <p className="mt-3 text-sm leading-[1.6] text-[#a59a87]">
          {def.prevalenceCopy}
        </p>
        <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#a59a87]">
            Highest-risk window
          </p>
          <p className="mt-2 text-base font-semibold text-[#f5efe6]">
            {def.riskWindow}
          </p>
        </div>
      </div>

      {/* The three interrupts — what COYL would catch for this family */}
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
          What COYL would catch
        </span>
      </div>
      <h2 className="mb-6 max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
        The three interrupts for{' '}
        <span className="italic text-orange-600">this rebound pattern.</span>
      </h2>
      <div className="mb-12 space-y-3">
        {def.interrupts.map((text, i) => (
          <div
            key={i}
            className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/5 px-5 py-4"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-orange-500">
              Interrupt {i + 1}
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{text}</p>
          </div>
        ))}
      </div>

      {/* CTA — back to the quiz for the recipient who landed here cold */}
      <section className="rounded-3xl border border-orange-300 bg-gradient-to-br from-orange-50 via-white to-white p-6 md:p-8">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          Wondering which one is yours?
        </p>
        <h3 className="mt-4 font-serif text-2xl font-normal italic tracking-[-0.01em] text-gray-900 md:text-3xl">
          60 seconds. 3 questions. Your rebound pattern on the other side.
        </h3>
        <p className="mt-4 max-w-xl text-base leading-[1.7] text-gray-700">
          Four families: Night, Weekend, Stress, Reward. Each one is a
          specific moment, a specific script, and a specific risk window
          — the exact 3 seconds COYL fires in.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/rebound/quiz?ref=share-incoming"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] transition-transform hover:-translate-y-0.5"
          >
            Take the regain risk quiz
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M1 7h12m0 0L8 2m5 5L8 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/rebound"
            className="text-sm font-semibold text-orange-700 underline-offset-4 hover:underline"
          >
            What is Rebound?
          </Link>
        </div>
      </section>

      <p className="mt-12 text-center text-[11px] uppercase tracking-[0.28em] text-gray-500">
        COYL · Shared without identity. The archetype, not the person.
      </p>
    </main>
  )
}
