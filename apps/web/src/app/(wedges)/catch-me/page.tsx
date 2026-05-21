import type { Metadata } from 'next'
import { CatchMeView } from './catch-me-view'

export const metadata: Metadata = {
  title: "Catch yourself tonight at 9 — COYL",
  description:
    "One question, one text. We catch you at the exact moment the script usually runs — 9pm, your autopilot, no app install required.",
  alternates: { canonical: '/catch-me' },
  openGraph: {
    title: "Catch yourself tonight at 9 — COYL",
    description: "One question. One text at 9pm. The script doesn't get to write the night.",
    url: 'https://coyl.ai/catch-me',
    images: [
      {
        url: '/api/og?title=Catch+yourself+tonight+at+9.&kicker=Funnel',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Catch yourself tonight at 9 — COYL",
    description: "One question. One text at 9pm. The script doesn't get to write the night.",
    images: ['/api/og?title=Catch+yourself+tonight+at+9.&kicker=Funnel'],
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
