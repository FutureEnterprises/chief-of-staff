import type { Metadata } from 'next'
import { PricingView } from './pricing-view'

export const metadata: Metadata = {
  title: 'Pricing — COYL',
  description:
    'Free audit + archetype card + 3 interrupts a week. Core $12/mo (or $99/yr as a commitment) for everything. Teams + clinics on PMPM.',
  keywords: [
    'coyl pricing',
    'autopilot interruption pricing',
    'behavior change app cost',
    'noom alternative pricing',
  ],
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing — COYL',
    description:
      'Free to start. $12/mo for everything. $99/year as a commitment to yourself.',
    url: 'https://coyl.ai/pricing',
    images: [
      {
        url: '/api/og?title=Less+than+one+bad+night.&kicker=Pricing',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — COYL',
    description: 'Free + Core $12/mo. Annual $99 as a commitment device. PMPM for teams + clinics.',
    images: ['/api/og?title=Less+than+one+bad+night.&kicker=Pricing'],
  },
}

/**
 * /pricing — the public, full-detail tier comparison.
 *
 * The homepage previously had pricing inline; the v4 cut moved it here so
 * the landing could focus on the single hero → CTA path. This is the
 * destination for "See pricing" links from the hero, the paywall dialog,
 * and the email briefings.
 *
 * Tier source of truth: apps/web/src/lib/services/entitlement.service.ts
 * (PLAN_LIMITS). If you change limits there, mirror the user-facing
 * features here and in components/paywall/paywall-dialog.tsx — those
 * three files together define the pricing contract.
 */
export default function PricingPage() {
  return <PricingView />
}
