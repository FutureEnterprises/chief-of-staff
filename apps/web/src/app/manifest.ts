import type { MetadataRoute } from 'next'

/**
 * manifest.ts — Next.js file convention. Emits /manifest.webmanifest.
 *
 * Replaces the stale hand-written public/site.webmanifest, which still
 * carried the retired "Control Over Your Life / hounds your a$$" copy and
 * pointed at /favicon.svg (deleted in the May 24 logo swap — see the
 * /favicon.ico → /icon.png redirect in next.config.ts). The root layout
 * no longer sets `manifest: '/site.webmanifest'`, so this convention file
 * is the single source of truth for PWA install metadata.
 *
 * Brand tokens kept in sync with the OG route + globals: warm-dark
 * background (#0a0a0a) and the orange brand accent (#ff6600).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'COYL — Catch yourself before you do it again',
    short_name: 'COYL',
    description:
      'Real-time autopilot interruption for behavior change. COYL fires in the moment of drift — before the slip, not the morning after.',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#ff6600',
    orientation: 'portrait',
    categories: ['health', 'lifestyle', 'productivity'],
    icons: [
      {
        src: '/coyl-mark-square.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/coyl-mark-square.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/coyl-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
