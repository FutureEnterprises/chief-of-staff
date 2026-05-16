import type { Metadata } from 'next'
import { CatchMeView } from './catch-me-view'

export const metadata: Metadata = {
  title: "Catch me tonight — COYL",
  description:
    "TikTok found you. We'll text you at 9pm — the moment your autopilot usually runs. One tap, no app install required.",
  alternates: { canonical: '/catch-me' },
  openGraph: {
    title: "Catch me tonight — COYL",
    description: "One tap. We text you at 9pm so the autopilot doesn't.",
    url: 'https://coyl.ai/catch-me',
    images: [
      {
        url: '/api/og?title=Catch+me+tonight+at+9pm.&kicker=Funnel',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Catch me tonight — COYL",
    description: "We text you at 9pm so the autopilot doesn't.",
    images: ['/api/og?title=Catch+me+tonight+at+9pm.&kicker=Funnel'],
  },
}

/**
 * /catch-me — single-question phone capture, the funnel-compression
 * landing for TikTok bio / IG link-in-bio traffic.
 *
 * Pattern from the strategy reviews: the standard TikTok → App Store
 * funnel loses 85%+ of traffic at the App Store install step. The
 * compression move is asking for a phone first (one tap), then texting
 * the user at the *actual moment* their autopilot runs (9pm), which is
 * when the value prop is most vivid. Conversion compounds: the SMS
 * deep-links to /sign-up?ref=sms.
 *
 * Page has exactly one question and one CTA. Anything else dilutes.
 */
export default function CatchMePage() {
  return <CatchMeView />
}
