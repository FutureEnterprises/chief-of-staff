import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Instrument_Serif } from 'next/font/google'
import { CookieConsent } from '@/components/cookie-consent'
import { PostHogProvider } from '@/components/telemetry/posthog-provider'
import { OrganizationSchema, WebSiteSchema } from './structured-data'
import './globals.css'

/**
 * Instrument Serif — luxury editorial display face.
 *
 * Refined high-contrast serif from the Instrument Foundry. Free, OFL,
 * weight 400 + italic. Used for display headings and pull-quotes
 * across both marketing and app surfaces. Pairs with Geist Sans for
 * body. The combination gives the brand a luxury fintech /
 * editorial feel (Letter, Sequel, Cluely reference set) without
 * pulling away from the orange brand DNA.
 *
 * Loaded with display:swap so FOUT-not-FOIT — better Core Web Vitals
 * + the page is readable while the serif loads.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
})

// Root metadata \u2014 positioned for search + social preview around the
// autopilot-interruption framing (post-v4 rebrand). Title stays under 60
// chars to avoid SERP truncation; description sits in the 150\u2013160 band.
//
// Keywords cover the four highest-intent buyer searches: GLP-1
// companions, late-night-eating, procrastination/focus, and the
// autopilot/JITAI category language. Brand-name keyword is included
// last (Google rewards brand-name presence in keyword arrays for
// disambiguation against the dictionary word "coil").
//
// openGraph.images points at the dynamic /api/og route so every share
// \u2014 Twitter/X, LinkedIn, iMessage, Slack, Discord, Facebook \u2014 gets a
// branded 1200\u00d7630 preview instead of collapsing to a tiny favicon.
const OG_DEFAULT = '/api/og?title=AI+for+the+moment+before+behavior+happens.&kicker=COYL'

export const metadata: Metadata = {
  title: {
    default: "COYL \u2014 Catch yourself before you do it again",
    template: '%s | COYL',
  },
  description:
    "COYL \u2014 AI that wraps around the behavioral layer of the human psyche. Real-time interrupts before the script runs. The missing interface between who you intend to be and what you actually do.",
  keywords: [
    'decision interrupt layer',
    'autopilot interruption',
    'real-time behavior change',
    'jitai consumer app',
    'glp-1 companion app',
    'ozempic behavior change',
    'wegovy maintenance app',
    'weight regain after glp-1',
    'stop late night eating',
    'stop binge eating app',
    'pattern interrupt app',
    'procrastination intervention',
    'workplace focus app',
    'noom alternative',
    'recovery engine app',
    'coyl',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'),
  alternates: {
    canonical: '/',
  },
  manifest: '/site.webmanifest',
  // No explicit icons: ... — Next.js 16 auto-discovers
  // src/app/icon.png (favicon) and src/app/apple-icon.png (Apple
  // touch icon). Both are the founder's chrome-half-C mark cropped
  // from /public/coyl-logo-full.png. Don't add an `icons:` override
  // here unless intentionally bypassing the file convention.
  openGraph: {
    type: 'website',
    siteName: 'COYL',
    locale: 'en_US',
    url: 'https://coyl.ai',
    title: "COYL \u2014 Catch yourself before you do it again",
    description:
      "AI that wraps around the behavioral layer of the human psyche. Real-time interrupts before the script runs. The missing interface between who you intend to be and what you actually do.",
    images: [
      {
        url: OG_DEFAULT,
        width: 1200,
        height: 630,
        alt: 'COYL \u2014 Catch yourself before you do it again',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@coylapp',
    creator: '@coylapp',
    title: "COYL \u2014 Catch yourself before you do it again",
    description:
      "AI that wraps around the behavioral layer of the human psyche. Real-time interrupts before the script runs. The missing interface between who you intend to be and what you actually do.",
    images: [OG_DEFAULT],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'health',
  applicationName: 'COYL',
  authors: [{ name: 'COYL' }],
  creator: 'COYL',
  publisher: 'COYL',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const clerkReady = publishableKey && !publishableKey.startsWith('pk_...')

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`} suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PostHogProvider>
          {clerkReady
            ? <ClerkProvider publishableKey={publishableKey!} afterSignOutUrl="/">{children}</ClerkProvider>
            : children
          }
        </PostHogProvider>
        <CookieConsent />
      </body>
    </html>
  )
}
