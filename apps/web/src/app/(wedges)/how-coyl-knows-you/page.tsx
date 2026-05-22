import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import { KnowsYouView } from './knows-you-view'


export const metadata: Metadata = {
  title: 'How COYL knows you — the honest answer',
  description:
    "The breakdown: 80% of what COYL knows today comes from what you tell us. That's the cold start. Here's the arc that changes — and how the dataset compounds into the model no LLM can synthesize.",
  keywords: [
    'how coyl works',
    'behavioral data privacy',
    'longitudinal behavioral model',
    'pre-conscious behavior',
    'user input dependent',
    'coyl data model',
    'behavioral context object',
  ],
  alternates: { canonical: '/how-coyl-knows-you' },
  openGraph: {
    title: 'How COYL knows you — the honest answer',
    description:
      "80% of what COYL knows today comes from what you tell us. That's the cold start. Here's the arc that changes.",
    url: 'https://coyl.ai/how-coyl-knows-you',
    images: [
      {
        url: '/api/og?title=How+COYL+knows+you&kicker=The+honest+answer',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How COYL knows you — the honest answer',
    description:
      "80% of what COYL knows today comes from what you tell us. The arc that changes that.",
    images: ['/api/og?title=How+COYL+knows+you&kicker=The+honest+answer'],
  },
}

export default async function HowCoylKnowsYouPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-how-coyl-knows-you')

  return <KnowsYouView />
}
