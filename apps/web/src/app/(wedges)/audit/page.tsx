import type { Metadata } from 'next'
import { AuditView } from './audit-view'

export const metadata: Metadata = {
  title: 'Autopilot Audit \u2014 find your 3 sabotage moments in 60 seconds',
  description:
    "You don't have a discipline problem. You have 3 specific moments where the script always runs. Find them in 60 seconds. No signup. COYL turns them into interrupt protocols.",
  keywords: [
    'autopilot audit',
    'self-sabotage quiz',
    'behavior pattern analysis',
    'free habit diagnostic',
    'identify triggers',
    'behavior interruption',
  ],
  alternates: { canonical: '/audit' },
  openGraph: {
    title: 'Autopilot Audit \u2014 find your 3 sabotage moments in 60 seconds',
    description:
      "You don't have a discipline problem. You have 3 moments. Find them in 60 seconds.",
    url: 'https://coyl.ai/audit',
  },
}

/**
 * /audit \u2014 the pre-signup Autopilot Audit lead magnet.
 *
 * Purpose (per Viral $100M ARR Playbook v2 \u00a74.1 tactic 1): give every
 * visitor a concrete "wow" before they create an account. Three questions
 * map to their top sabotage moments by wedge + time-of-day + excuse style.
 * The output is an emotionally-resonant result ("your autopilot runs at
 * 9pm in the kitchen, and your excuse is 'I already blew it'") that makes
 * signup the obvious next move instead of the friction it usually is.
 *
 * Implementation is fully client-side \u2014 no DB writes, no API, no auth.
 * Questions \u2192 rule-based mapping \u2192 result view. The point is time-to-value
 * under 60 seconds, not a perfect AI analysis. The AI version ships after
 * signup as part of the onboarding "autopilot map" flow.
 */

export default function AuditPage() {
  return <AuditView />
}
