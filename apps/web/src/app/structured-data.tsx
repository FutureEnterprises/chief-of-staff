export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'COYL',
    url: 'https://coyl.ai',
    logo: 'https://coyl.ai/favicon.svg',
    description: 'AI-powered productivity platform that hounds you until your tasks are done. Morning briefings, night reviews, relentless follow-through.',
    foundingDate: '2026',
    sameAs: [],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function SoftwareApplicationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'COYL',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web, iOS, Android',
    description: 'Control Over Your Life. The AI that tracks every commitment you make and won\'t stop until it\'s done. Morning planning, night reviews, follow-up escalation, and AI-powered performance assessments.',
    url: 'https://coyl.ai',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description: '50 active tasks, 20 Charges/month, morning & night reviews',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '14.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '14.99',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description: 'Unlimited tasks, 500 Charges/month, Beast Mode, follow-up automation, AI assessments',
      },
    ],
    featureList: [
      'AI-powered task capture and extraction',
      'Morning planning sessions',
      'Night review sessions',
      'Follow-up tracking and escalation',
      'Mentor Mode and Beast Mode AI tones',
      'AI performance assessments (Considerate + No BS)',
      'Daily email briefings',
      'Mobile apps (iOS + Android)',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function FAQSchema() {
  const faqs = [
    {
      question: 'What is COYL?',
      answer: 'COYL (Control Over Your Life) is an AI-powered productivity platform that tracks every task and commitment you make. It conducts morning planning sessions, night reviews, and escalates follow-ups until they\'re resolved. Think of it as a pitbull for your to-do list.',
    },
    {
      question: 'What are Charges?',
      answer: 'Every AI interaction in COYL is called a Charge. When the AI helps you plan your day, reviews your night, breaks down a task, or gives you a performance assessment — that\'s one Charge. Free users get 20/month, Pro users get 500/month.',
    },
    {
      question: 'What is Beast Mode?',
      answer: 'Beast Mode is COYL\'s savage, no-mercy AI tone. It calls out procrastination, avoidance, and dropped commitments directly. No sugarcoating. The alternative is Mentor Mode, which is warm and encouraging. You choose your vibe in Settings.',
    },
    {
      question: 'What is the AI Assessment feature?',
      answer: 'The AI Assessment analyzes 30 days of your task data — completion rates, overdue patterns, priority distribution — and delivers a detailed performance review. Choose Considerate mode for supportive coaching, or No BS mode for brutal honesty.',
    },
    {
      question: 'Is COYL free?',
      answer: 'Yes. The Free plan includes 50 active tasks, 20 AI Charges per month, morning and night reviews, and daily email briefings. Pro is $14.99/month (or $99.99/year) for unlimited tasks, 500 Charges, Beast Mode, follow-up automation, and AI assessments.',
    },
    {
      question: 'Does COYL have a mobile app?',
      answer: 'Yes. COYL has native mobile apps for iOS and Android built with React Native (Expo). All features sync across web and mobile.',
    },
  ]

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function WebSiteSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'COYL',
    alternateName: 'Control Over Your Life',
    url: 'https://coyl.ai',
    description: 'AI Willpower. The AI that hounds you until it\'s done.',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
