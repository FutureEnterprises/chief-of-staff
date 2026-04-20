/**
 * Schema.org structured data — Organization, Software, Website, FAQ.
 *
 * All descriptions align with the GODFILE positioning:
 * "COYL makes sure you do what you said you'd do."
 * Commitment engine framing, not productivity-app framing.
 */

export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'COYL',
    url: 'https://coyl.ai',
    logo: 'https://coyl.ai/favicon.svg',
    description:
      "The commitment engine. COYL catches broken commitments before they turn into failure loops — whether the commitment is a diet, a workout, a follow-up email, or a rule you set for yourself.",
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
    applicationCategory: 'HealthApplication',
    applicationSubCategory: 'BehavioralHealthApplication',
    operatingSystem: 'Web, iOS, Android',
    description:
      "AI-powered commitment and behavior-interruption engine. Detects your autopilot patterns — late-night eating, dropped follow-ups, avoidance loops — and interrupts at the exact moment you're about to break your own word.",
    url: 'https://coyl.ai',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description: 'Core rescue + decision + recovery flows. 20 AI assists per month.',
      },
      {
        '@type': 'Offer',
        name: 'Core',
        price: '19',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '19',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description: 'Full rescue, recovery engine, autopilot map, excuse detection.',
      },
      {
        '@type': 'Offer',
        name: 'Plus',
        price: '29',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '29',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description: 'Everything in Core + accountability partners, precision interrupts, pattern reports.',
      },
    ],
    featureList: [
      'Rescue flow — interrupt autopilot the moment before you act',
      'Decision engine — call out the real choice under the surface one',
      'Recovery engine — stop one slip from becoming a week',
      'Autopilot pattern map — learns your danger windows',
      'Excuse detection — names the sentence in your head',
      'Identity tracking — shows who you are becoming',
      'Multi-domain: weight loss, work follow-up, cravings, focus',
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
      answer:
        "COYL is a commitment and behavior-interruption engine. It detects the autopilot patterns that run your life — late-night eating, dropped follow-ups, scrolling, spending — and interrupts at the exact moment you're about to break your own word. Built first for weight loss; works for work follow-up, cravings, and procrastination.",
    },
    {
      question: 'How is COYL different from a productivity app or habit tracker?',
      answer:
        "Productivity apps assume you forgot what to do. Habit trackers assume you need reminders. COYL assumes neither — the real problem is that you know what to do and your autopilot takes over anyway. COYL's job is to fire at the exact moment of drift, name the excuse, and give you one physical move.",
    },
    {
      question: 'Does COYL work for weight loss?',
      answer:
        "Yes — it's the primary wedge. COYL catches the 9 PM kitchen moment, the weekend spiral, and the 'I already blew it' sentence that turns one slip into a week. It doesn't count calories. It interrupts the loop that breaks your calorie goals.",
    },
    {
      question: 'Does COYL work for sales and work follow-through?',
      answer:
        "Yes — /work is a full wedge. COYL catches 'I'll follow up' commitments, meeting action items, and the emails that quietly drop. Meeting → commitment → follow-up → closure. The email either went out or it didn't. Waiting is not action.",
    },
    {
      question: 'Is COYL a therapy app?',
      answer:
        "No. COYL is not a replacement for therapy, medical treatment, or professional mental-health support. It's a behavioral interruption system. If you're dealing with clinical eating disorders, substance addiction, or anything that needs licensed care, see a professional first.",
    },
    {
      question: 'Is COYL free?',
      answer:
        "Yes, there's a free tier. Core is $19/month for the full rescue + recovery engine and pattern map. Plus is $29/month and adds accountability partners + precision interrupts. Premium is $49/month with financial stakes, scenario simulator, and health integrations.",
    },
    {
      question: 'Does COYL have a mobile app?',
      answer:
        "Yes. iOS and Android, built with React Native. Interrupts fire via push notifications at your mapped danger windows.",
    },
    {
      question: 'How does the AI know when to interrupt me?',
      answer:
        "You map your danger windows during onboarding — the times and contexts where you usually slip. COYL fires at those windows, and also learns from your slip history so the interrupts sharpen over the first few weeks.",
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
    description:
      "The commitment engine that makes sure you do what you said you'd do. Catches autopilot loops before they become failure loops.",
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * BreadcrumbList \u2014 used on wedge pages for search result breadcrumbs.
 * Accepts an array of { name, url } pairs.
 */
export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
