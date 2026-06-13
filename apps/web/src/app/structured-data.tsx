/**
 * Schema.org structured data — Organization, SoftwareApplication, WebSite,
 * FAQPage, BreadcrumbList.
 *
 * All descriptions match the live autopilot-interruption framing (post-v4
 * rebrand). Earlier copies used "commitment engine" language; that was
 * removed because it (a) didn't match what's on /, /how-it-works, or any
 * wedge page, and (b) hurt Google's understanding of the site as a single
 * topical cluster.
 *
 * Schema is the single most under-leveraged SEO lever for a new domain.
 * Rich-result eligibility (FAQ accordions, sitelinks, app-card knowledge
 * panels) is unlocked by clean, accurate JSON-LD — costs nothing to ship,
 * compounds for years.
 */

export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'COYL',
    legalName: 'COYL, Inc.',
    url: 'https://www.coyl.ai',
    // /favicon.svg was deleted in the May 24 logo swap (see the
    // /favicon.ico → /icon.png redirect in next.config.ts); point Google's
    // knowledge-panel logo at a real shipped PNG instead of a 404.
    logo: 'https://www.coyl.ai/coyl-mark-square.png',
    description:
      "COYL is a decision-interrupt layer for human behavior — a real-time substrate that fires in the 3-second window between trigger and action. Late-night eating, the 9 PM kitchen, doom-scrolling, post-GLP-1 regain, workplace procrastination — caught before the script runs, not journaled after.",
    foundingDate: '2026',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'hello@coyl.ai',
        availableLanguage: 'en',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'business',
        email: 'partners@coyl.ai',
        availableLanguage: 'en',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'research',
        email: 'research@coyl.ai',
        availableLanguage: 'en',
      },
    ],
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
      "AI-powered real-time pattern interrupt. Detects autopilot loops (late-night eating, doom-scrolling, post-GLP-1 regain, workplace procrastination) and fires at the exact moment of drift — not the next morning. Includes recovery engine for shame-resistant re-entry after slips.",
    url: 'https://www.coyl.ai',
    image: 'https://www.coyl.ai/api/og?title=Stop+the+script+before+it+runs+your+life&kicker=COYL',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description: 'Self-trust score, basic autopilot map, 20 AI charges/month.',
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
        description: 'Full rescue + recovery engine, pattern detection, excuse detection, 500 AI charges/month.',
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
        description: 'Everything in Core + accountability partner, challenge pods, precision interrupts (JITAI), 1,500 AI charges/month.',
      },
      {
        '@type': 'Offer',
        name: 'Premium',
        price: '49',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '49',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description: 'Everything in Plus + scenario simulator, financial stakes, Apple Health + Google Fit + Calendar, unlimited AI.',
      },
    ],
    featureList: [
      'Real-time pattern interrupt — fires at the moment of drift, not the morning after',
      'Precision interrupts (JITAI) at learned danger windows',
      'Recovery engine — same-night recovery, no Monday reset, 1-day grace period',
      'GLP-1 companion — day-3 interrupt for Ozempic, Wegovy, Mounjaro users',
      'Excuse detection across 8 categories (Delay, Reward, Minimization, Collapse, Exhaustion, Exception, Compensation, Social Pressure)',
      'Autopilot map — learns your danger windows from slip history',
      'Self-trust score and identity-state tracking',
      'Four delivery modes — Mentor, Strategist, No-BS, Beast',
      'Multi-wedge: weight loss, procrastination, destructive behaviors, workplace focus',
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
  // Keep questions tightly matched to search-intent queries Google sees:
  // "is coyl a real app", "ozempic companion app", "noom alternative",
  // "is coyl medical", "what is coyl pricing". Each FAQ-Page item is
  // eligible for a rich-result accordion on the SERP.
  const faqs = [
    {
      question: 'What is COYL?',
      answer:
        "COYL is a real-time autopilot interruption app. It detects the patterns that run your life — late-night eating, the 9 PM kitchen, post-GLP-1 weight regain, doom-scrolling, the workplace tab switch — and fires at the exact moment of drift, before the slip happens. Built first for weight loss; the same engine works for procrastination, cravings, and destructive loops.",
    },
    {
      question: 'How is COYL different from Noom, Calm, BetterUp, or a habit tracker?',
      answer:
        "Habit trackers reward streaks the next morning. Noom coaches you in the afternoon. Calm guides a meditation later. COYL is the only app that fires in the moment of drift — pre-empting the slip, not reviewing it after. Real-time pattern interrupt, not next-day journaling.",
    },
    {
      question: 'Does COYL work for GLP-1 users (Ozempic, Wegovy, Mounjaro)?',
      answer:
        "Yes — GLP-1 maintenance is a primary wedge. The drug suppresses appetite. It does not touch the 9 PM kitchen loop, the stress-eat reflex, or the 'I deserve this' script. When the prescription ends, those scripts are still there and most of the weight comes back. COYL trains the interrupt during the medicated window so the behavior survives discontinuation. A 12-week behavioral study protocol is open for partner enrollment at coyl.ai/clinical-study.",
    },
    {
      question: 'Does COYL work for weight loss without GLP-1?',
      answer:
        "Yes — most users are not on a GLP-1. COYL catches the 9 PM kitchen moment, the weekend spiral, and the 'I already blew it' sentence that turns one slip into a lost week. It doesn't count calories. It interrupts the loop that breaks every calorie goal.",
    },
    {
      question: 'Does COYL work for procrastination and workplace focus?',
      answer:
        "Yes — /procrastination is a full wedge. The average knowledge worker loses 23 minutes per interrupt. COYL fires the moment you reach for the doom-scroll tab — before the deep-work block is dead, not after. Also available as a B2B offering for employers and benefits programs at coyl.ai/teams.",
    },
    {
      question: 'Is COYL therapy or medical treatment?',
      answer:
        "No. COYL is a behavioral support tool, not therapy, medical treatment, or a substitute for licensed care. If you're dealing with a diagnosed eating disorder, active addiction, or psychiatric crisis, please work with a qualified professional first.",
    },
    {
      question: 'How much does COYL cost?',
      answer:
        "Free forever to start (25 active commitments, 20 AI charges/month, basic autopilot map). Core is $19/month for the full rescue + recovery engine. Plus is $29/month and adds accountability partner + precision interrupts. Premium is $49/month with financial stakes, scenario simulator, and health integrations. Annual plans save ~22%. No credit card required for Free.",
    },
    {
      question: 'Does COYL have a mobile app?',
      answer:
        "Yes — iOS and Android, built with Expo / React Native. Precision interrupts fire via push notifications at your mapped danger windows. Apple Health and Google Health Connect integrations on the Premium tier.",
    },
    {
      question: 'How does COYL know when to interrupt me?',
      answer:
        "During onboarding you map your danger windows — the times and contexts where you usually slip. COYL fires push notifications at those windows. As you log slips and recoveries, the model sharpens over the first 4–6 weeks. The danger-window engine is a Just-in-Time Adaptive Intervention (JITAI), aligned with published behavioral-medicine research.",
    },
    {
      question: 'What happens to my data if I cancel?',
      answer:
        "Your account drops to the Free tier; your data stays yours. You can export everything as JSON from Settings → Data Export, or delete your account entirely. We do not hold your slip history hostage.",
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
    alternateName: 'Catch Yourself Before You Do It Again',
    url: 'https://www.coyl.ai',
    description:
      "Real-time autopilot interruption for behavior change. Catch yourself before you do it again.",
    publisher: {
      '@type': 'Organization',
      name: 'COYL',
      url: 'https://www.coyl.ai',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * MedicalStudy — for /clinical-study. Tells Google (and ChatGPT,
 * Perplexity, etc.) that the page describes a registered behavioral
 * study, not a marketing claim. Improves rich-result eligibility for
 * health-adjacent queries and gives the page a legitimate research
 * surface in AI search results.
 *
 * Status is "Recruiting" because the protocol is open for partner
 * enrollment, not yet underway. Update to "Active" when first partner
 * signs, "Completed" at readout.
 */
export function MedicalStudySchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'MedicalStudy',
    name: 'COYL-GLP1-MAINT-01 — Behavioral interrupt during GLP-1 maintenance for prevention of post-discontinuation weight regain',
    description:
      "A 12-week randomized, minimal-risk behavioral study testing whether real-time pattern-interrupt training delivered alongside an active GLP-1 receptor agonist prescription reduces weight regain in the 90 days after the medication is discontinued. N=80, randomized 1:1 to intervention (Rx + COYL Premium) versus standard care (Rx alone). Powered for effect-size estimation, not confirmatory inference.",
    url: 'https://www.coyl.ai/clinical-study',
    studyDesign: 'RandomizedControlledTrial',
    studyLocation: {
      '@type': 'Country',
      name: 'United States',
    },
    sponsor: {
      '@type': 'Organization',
      name: 'COYL, Inc.',
      url: 'https://www.coyl.ai',
    },
    status: 'Recruiting',
    healthCondition: 'Obesity, post-pharmacologic weight regain',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * BreadcrumbList — used on wedge pages for search result breadcrumbs.
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
