import type { MetadataRoute } from 'next'

/**
 * /robots.txt — crawl directives.
 *
 * Policy: allow everything by default, explicitly disallow only the
 * authenticated app shell and API routes. The previous version used an
 * allow-list, which silently blocked Google from indexing every new
 * wedge page until someone remembered to update this file. The
 * allow-everything-then-disallow-app-routes posture means new public
 * pages are indexable the moment they ship.
 *
 * Disallow categories:
 *   1. Authenticated app routes — per-user content, not indexable
 *   2. Auth flow routes — Clerk-managed, no SEO value
 *   3. API routes — JSON endpoints (except /api/og, which is a public
 *      image used by social platforms — implicitly allowed because
 *      crawlers requesting it are fetching the image, not crawling)
 *   4. Onboarding — gated post-signup
 *
 * Per-bot rules: block CCBot and the legacy `anthropic-ai` token (which
 * Anthropic itself has deprecated in favor of ClaudeBot). Allow GPTBot,
 * PerplexityBot, ChatGPT-User, and ClaudeBot — these are AI search/
 * referral crawlers that send real traffic, worth more than the load.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Authenticated app surfaces
          '/today',
          '/inbox',
          '/tasks',
          '/chat',
          '/assessment',
          '/follow-ups',
          '/projects',
          '/insights',
          '/decide',
          '/rescue',
          '/commitments',
          '/patterns',
          '/simulate',
          '/settings',
          // Onboarding + auth
          '/onboarding',
          '/sign-in',
          '/sign-up',
          // API
          '/api/',
        ],
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
