import type { Metadata } from 'next'
import { ReboundQuiz } from './rebound-quiz'

export const metadata: Metadata = {
  title:
    'Regain Risk Quiz — find your GLP-1 rebound pattern in 60 seconds · COYL',
  description:
    'Are you a Night, Weekend, Stress, or Reward Rebounder? The 60-second quiz that pins your highest-risk window when the GLP-1 medication gets quiet. No signup. Shareable result.',
  keywords: [
    'glp-1 regain risk quiz',
    'glp-1 rebound type',
    'ozempic rebound pattern',
    'wegovy regain risk',
    'zepbound rebound',
    'glp-1 maintenance quiz',
  ],
  alternates: { canonical: '/rebound/quiz' },
  openGraph: {
    title: 'What is your GLP-1 rebound pattern?',
    description:
      'The 60-second regain risk quiz. Four rebound families: Night, Weekend, Stress, Reward. Find yours.',
    url: 'https://coyl.ai/rebound/quiz',
    images: [
      {
        url: '/api/og?title=What+is+your+GLP-1+rebound+pattern?&kicker=Regain+Risk+Quiz',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GLP-1 Regain Risk Quiz',
    description:
      'Night / Weekend / Stress / Reward Rebounder — find yours in 60 seconds.',
    images: [
      '/api/og?title=What+is+your+GLP-1+rebound+pattern?&kicker=Regain+Risk+Quiz',
    ],
  },
}

export default function ReboundQuizPage() {
  return <ReboundQuiz />
}
