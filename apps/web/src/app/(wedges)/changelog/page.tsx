/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1 with
 *     italic accent on "Shipped this week."
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): each release re-rendered
 *     as an editorial dispatch — date kicker, serif headline, body, "for you"
 *     italic pull-line, link row.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): hairline borders between
 *     entries; no card chrome.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): newsletter
 *     CTA set on a single top border, not a glowing card.
 */

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
  forYou: string // plain-English user-facing translation of the change
  links?: Array<{ label: string; href: string }>
}

// Most recent first. Pulled from real git history of the launch sprint.
const RELEASES: Release[] = [
  {
    date: '2026-05-16',
    title: 'Real-time intervention surface on /today',
    body:
      "When you're inside a known danger window right now, /today turns into a live intervention banner instead of a passive dashboard. Same matching logic the precision-interrupt cron uses for push notifications, surfaced server-side so web-only users see the moment too. Also shipped: rescue deep-link handling, consent-architecture feedback bar (helpful / not the moment), and a /changelog page so the build cadence is visible.",
    forYou:
      "Open /today during your danger hours and you'll see a live interrupt banner — not just yesterday's stats. The web now catches you in the moment, not after.",
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
    forYou:
      "If your GLP-1 clinic asks whether COYL is studied, point them here — there's a real trial protocol they can join.",
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
    forYou:
      "If you paid for Plus or Premium and didn't see the features unlock — that's fixed. You'll get the tier you actually paid for now.",
    links: [{ label: 'Pricing', href: '/pricing' }],
  },
  {
    date: '2026-05-12',
    title: 'SEO + social: dynamic OG images on every page',
    body:
      "Every shared link previously fell back to favicon — Twitter, LinkedIn, iMessage, Slack, Discord all rendered a tiny icon. Now 9 pages render 1200x630 branded cards via /api/og at the edge. Root metadata refreshed away from the stale 'commitment engine' framing toward autopilot interruption + GLP-1 + Noom-alternative keywords. Structured data refreshed: added the missing Premium tier, contact points, and 10 SERP-intent FAQ entries.",
    forYou:
      "Share a COYL link in iMessage or Slack and it now shows a real preview card — not a tiny broken icon.",
  },
  {
    date: '2026-05-11',
    title: 'Workplace + procrastination vertical, in full',
    body:
      "Three-leg wedge architecture: weight + GLP-1 (consumer), workplace + focus (consumer + employer B2B), destructive patterns (consumer). Built /procrastination as a co-equal vertical and /teams as the employer-facing B2B surface with PMPM pricing language.",
    forYou:
      "COYL isn't just for weight. If your loop is procrastination or follow-through at work, those have their own pages now.",
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
    forYou:
      "On GLP-1? Tell COYL your injection day and you'll get a nudge on day 3 — the exact evening the cravings tend to come back.",
    links: [{ label: 'GLP-1 wedge', href: '/glp1' }],
  },
  {
    date: '2026-05-09',
    title: 'Recovery Mode UI on /today',
    body:
      "When a user logs a slip, /today flips into Recovery Mode for 24h: emerald banner, 'You slipped. Good. Now we stop the damage.' framing, link to build the recovery plan. Streak stays preserved — no Monday reset. Brand promise: no shame, continue.",
    forYou:
      "Log a slip and the app stops the bleeding instead of resetting your streak to zero. No Monday-reset shame.",
  },
  {
    date: '2026-05-08',
    title: 'Account deletion + data export',
    body:
      "Apple App Store guideline 5.1.1(v) and GDPR Article 17 compliance: full account deletion with active-subscription guard (409 if still subscribed), plus one-tap JSON data export of profile + commitments + slips + decisions + events from /settings. 365-day cap.",
    forYou:
      "You can now delete your account or export every piece of your data with one tap from Settings — your data, your call.",
  },
  {
    date: '2026-05-07',
    title: 'Heuristic danger-window learner',
    body:
      "Daily cron at 03:00 UTC computes a (day x hour) histogram from each user's slip history and updates their active danger windows. HealthKit signals (steps, sleep, heart rate, active calories) feed into the correlation step as risk-context weighting.",
    forYou:
      "The longer you use COYL, the sharper it gets at predicting your danger hours — it learns the days and times your script fires.",
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

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Changelog
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Built in public.<br />
            <span className="italic text-orange-600">Shipped this week.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            COYL ships every Monday. No press releases, no roadmap theater &mdash;
            the behavioral interface between AI and real life, built one piece at a time.
            Latest releases and what they unlock below.
          </p>
        </header>

        <div>
          {RELEASES.map((r) => (
            <article
              key={r.date + r.title}
              className="border-t border-gray-200 py-12"
            >
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                {new Date(r.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <h2 className="mt-4 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-4xl">
                {r.title}
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-[1.7] text-gray-700">{r.body}</p>
              <p className="mt-5 max-w-3xl font-serif text-lg font-normal italic leading-[1.5] text-gray-900">
                <span className="font-mono text-[10px] font-medium not-italic uppercase tracking-[0.32em] text-orange-600">
                  For you &rarr;{' '}
                </span>
                {r.forYou}
              </p>
              {r.links && r.links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                  {r.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="font-serif text-base italic text-orange-600 underline-offset-4 hover:underline"
                    >
                      {l.label} &rarr;
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <section className="border-t border-orange-500 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Subscribe
          </p>
          <h2 className="mt-6 font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Want updates <span className="italic text-orange-600">as we ship?</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700">
            One email a week. The pattern playbook — tactics, research, and what shipped.
            Unsubscribe anytime.
          </p>
          <Link
            href="/sign-up?ref=changelog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)]"
          >
            Start free
          </Link>
        </section>
      </div>
    </>
  )
}
