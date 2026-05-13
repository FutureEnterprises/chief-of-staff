import type { Metadata } from 'next'
import { PricingView } from './pricing-view'

export const metadata: Metadata = {
  title: 'Pricing — COYL',
  description:
    'Free forever to start. Core $19/mo for full rescue + recovery. Plus $29/mo adds accountability partner + precision interrupts. Premium $49/mo unlocks scenario simulator + financial stakes.',
  keywords: [
    'coyl pricing',
    'autopilot interruption pricing',
    'behavior change app cost',
    'glp-1 companion app price',
    'noom alternative pricing',
  ],
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing — COYL',
    description:
      'Free to start. $19/mo for the full interrupt + recovery engine. Plus and Premium for accountability and stakes.',
    url: 'https://coyl.ai/pricing',
    images: [
      {
        url: '/api/og?title=Pay+for+the+interrupt%2C+not+for+the+guilt.&kicker=Pricing',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — COYL',
    description: 'Free to start. $19/mo Core. $29/mo Plus. $49/mo Premium. Cancel anytime.',
    images: ['/api/og?title=Pay+for+the+interrupt%2C+not+for+the+guilt.&kicker=Pricing'],
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
