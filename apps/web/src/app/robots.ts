import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/terms', '/privacy', '/cookies', '/llms.txt'],
        disallow: [
          '/today',
          '/inbox',
          '/tasks',
          '/chat',
          '/assessment',
          '/follow-ups',
          '/projects',
          '/insights',
          '/settings',
          '/onboarding',
          '/sign-in',
          '/sign-up',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
