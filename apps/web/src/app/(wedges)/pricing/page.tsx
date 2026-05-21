import type { Metadata } from 'next'
import { PricingView } from './pricing-view'

export const metadata: Metadata = {
  title: 'Pricing — COYL',
  description:
    'Free audit + 1 behavior loop to start. Core $9.99/mo for the full rescue + recovery engine. GLP-1 Companion $19.99/mo for weight maintenance + rebound coverage. Clinics + employers $5–$15 PMPM.',
  keywords: [
    'coyl pricing',
    'autopilot interruption pricing',
    'behavior change app cost',
    'glp-1 companion app price',
    'glp-1 maintenance pricing',
    'noom alternative pricing',
  ],
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing — COYL',
    description:
      'Free audit to start. $9.99/mo for the interrupt + recovery engine. $19.99/mo for GLP-1 maintenance + rebound coverage.',
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
    description: 'Free audit. $9.99/mo Core. $19.99/mo GLP-1 Companion. $5–$15 PMPM for clinics + employers.',
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
