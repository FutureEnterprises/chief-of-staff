import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'Changelog — what we shipped this week',
  description:
    'COYL ships every week. The protocol pages, the precision-interrupt engine, the GLP-1 companion, the recovery engine — built in public. Latest releases and what they unlock.',
  keywords: [
    'coyl changelog',
    'coyl release notes',
    'behavior change app updates',
    'product changelog',
  ],
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'Changelog — what we shipped this week',
    description:
      "Built in public. The latest from COYL: clinical study protocol, real-time pattern interrupt, GLP-1 companion, recovery engine.",
    url: 'https://coyl.ai/changelog',
    images: [
      {
        url: '/api/og?title=Built+in+public.+Shipped+this+week.&kicker=Changelog',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog — what we shipped this week',
    description: 'COYL ships every week. Built in public.',
    images: ['/api/og?title=Built+in+public.+Shipped+this+week.&kicker=Changelog'],
  },
}

/**
 * /changelog — a real product changelog, not a marketing fluff page.
 *
 * Three reasons this exists:
 *   1. Credibility — "still shipping" beats "still pitching"
 *   2. SEO — gives Google a high-frequency-update signal on the domain
 *   3. Recruiting — engineers read changelogs before they apply
 *
 * Cadence: every Monday. Each entry is one sentence on WHY, two lines on
 * WHAT, and a deep link to the relevant page where applicable. No
 * marketing language; the brand voice is the same as the rest of the
 * product — short, direct, name the thing.
 *
 * Update protocol: when shipping a public-facing change, add it here in
 * the same commit. This file should never be more than a week stale.
 */

type Release = {
  date: string // ISO YYYY-MM-DD
  title: string
  body: string
  links?: Array<{ label: string; href: string }>
}

// Most recent first. Pulled from real git history of the launch sprint.
const RELEASES: Release[] = [
  {
    date: '2026-05-16',
    title: 'Real-time intervention surface on /today',
    body:
      "When you're inside a known danger window right now, /today turns into a live intervention banner instead of a passive dashboard. Same matching logic the precision-interrupt cron uses for push notifications, surfaced server-side so web-only users see the moment too. Also shipped: rescue deep-link handling, consent-architecture feedback bar (helpful / not the moment), and a /changelog page so the build cadence is visible.",
    links: [
      { label: 'Open /today', href: '/today' },
      { label: 'Rescue', href: '/rescue' },
    ],
  },
  {
    date: '2026-05-12',
    title: 'Clinical study protocol — open for partner enrollment',
    body:
      "Published a 12-week IRB-friendly behavioral RCT protocol testing whether real-time pattern interrupt during GLP-1 maintenance reduces weight regain at 90 days post-discontinuation. N=80, randomized 1:1, minimal-risk expedited review pathway. Telehealth platforms and obesity-medicine clinics can enroll a cohort. Repo also includes the IRB submission narrative and four partner-outreach templates.",
    links: [
      { label: 'See the protocol', href: '/clinical-study' },
      { label: 'Research overview', href: '/research' },
    ],
  },
  {
    date: '2026-05-12',
    title: 'Stripe tier-mapping fix + four-tier checkout',
    body:
      "Webhook was hardcoding planType: 'PRO' on every successful checkout, regardless of which tier the user purchased — Plus customers paying $29/mo were getting Core features. Added price-ID-to-tier mapping in handleCheckoutCompleted and handleSubscriptionUpdated. Six Stripe live price IDs (CORE/PLUS/PREMIUM × M/A) wired and documented in .env.example.",
    links: [{ label: 'Pricing', href: '/pricing' }],
  },
  {
    date: '2026-05-12',
    title: 'SEO + social: dynamic OG images on every page',
    body:
      "Every shared link previously fell back to favicon — Twitter, LinkedIn, iMessage, Slack, Discord all rendered a tiny icon. Now 9 pages render 1200x630 branded cards via /api/og at the edge. Root metadata refreshed away from the stale 'commitment engine' framing toward autopilot interruption + GLP-1 + Noom-alternative keywords. Structured data refreshed: added the missing Premium tier, contact points, and 10 SERP-intent FAQ entries.",
  },
  {
    date: '2026-05-11',
    title: 'Workplace + procrastination vertical, in full',
    body:
      "Three-leg wedge architecture: weight + GLP-1 (consumer), workplace + focus (consumer + employer B2B), destructive patterns (consumer). Built /procrastination as a co-equal vertical and /teams as the employer-facing B2B surface with PMPM pricing language.",
    links: [
      { label: 'Procrastination', href: '/procrastination' },
      { label: 'For teams', href: '/teams' },
    ],
  },
  {
    date: '2026-05-10',
    title: 'GLP-1 companion: day-3 interrupt + onboarding step',
    body:
      "Hourly cron fires push to users on day-3-after-injection-weekday at their local 5-9pm window — the discontinuation-relevant moment when appetite suppression starts wearing off. Onboarding picks up drug name and injection weekday; settings tile lets users update or end the protocol. Closes the GLP-1 funnel end-to-end.",
    links: [{ label: 'GLP-1 wedge', href: '/glp1' }],
  },
  {
    date: '2026-05-09',
    title: 'Recovery Mode UI on /today',
    body:
      "When a user logs a slip, /today flips into Recovery Mode for 24h: emerald banner, 'You slipped. Good. Now we stop the damage.' framing, link to build the recovery plan. Streak stays preserved — no Monday reset. Brand promise: no shame, continue.",
  },
  {
    date: '2026-05-08',
    title: 'Account deletion + data export',
    body:
      "Apple App Store guideline 5.1.1(v) and GDPR Article 17 compliance: full account deletion with active-subscription guard (409 if still subscribed), plus one-tap JSON data export of profile + commitments + slips + decisions + events from /settings. 365-day cap.",
  },
  {
    date: '2026-05-07',
    title: 'Heuristic danger-window learner',
    body:
      "Daily cron at 03:00 UTC computes a (day x hour) histogram from each user's slip history and updates their active danger windows. HealthKit signals (steps, sleep, heart rate, active calories) feed into the correlation step as risk-context weighting.",
  },
]

export default function ChangelogPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Changelog', url: 'https://coyl.ai/changelog' },
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Changelog
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        What we shipped<br />
        <span className="text-orange-600">this week.</span>
      </h1>

      <p className="mb-12 max-w-2xl text-lg text-gray-600">
        COYL ships every Monday. No press releases, no roadmap theater &mdash; the
        protocol pages, the precision-interrupt engine, the recovery flow,
        the GLP-1 companion. Built in public.
      </p>

      <div className="space-y-8">
        {RELEASES.map((r) => (
          <article
            key={r.date + r.title}
            className="rounded-2xl border border-gray-200 bg-white p-6"
          >
            <p className="font-mono text-[11px] uppercase tracking-widest text-orange-500">
              {new Date(r.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">{r.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.body}</p>
            {r.links && r.links.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {r.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-500/[0.1]"
                  >
                    {l.label} &rarr;
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.05] to-transparent p-8">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Want updates as we ship?</h2>
        <p className="mb-5 text-sm text-gray-600">
          One email a week. Tactics for catching your autopilot + new product drops.
          Unsubscribe anytime.
        </p>
        <Link
          href="/sign-up?ref=changelog"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)]"
        >
          Start free
        </Link>
      </div>
    </>
  )
}
