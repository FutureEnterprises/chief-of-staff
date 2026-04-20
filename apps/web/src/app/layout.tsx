import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { CookieConsent } from '@/components/cookie-consent'
import { OrganizationSchema, WebSiteSchema } from './structured-data'
import './globals.css'

// Root metadata \u2014 positioned for search + social preview around the
// current "commitment engine" framing. Title stays under 60 chars to
// avoid SERP truncation; description sits in the 150-160 band.
export const metadata: Metadata = {
  title: {
    default: "COYL \u2014 It's not the mistake. It's what you do after.",
    template: '%s | COYL',
  },
  description:
    "COYL catches broken commitments before they become failure loops. Interrupts the autopilot moment you're about to fold \u2014 late-night eating, dropped follow-ups, spiraling. Built first for weight loss.",
  keywords: [
    'commitment engine',
    'behavior interruption',
    'autopilot interruption app',
    'weight loss app',
    'late-night eating stop',
    'follow-through app',
    'sales follow-up tool',
    'stop binge eating app',
    'quit doomscrolling',
    'accountability app',
    'behavior change AI',
    'coyl',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'),
  alternates: {
    canonical: '/',
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'COYL',
    locale: 'en_US',
    url: 'https://coyl.ai',
    title: "COYL \u2014 It's not the mistake. It's what you do after.",
    description:
      "The commitment engine. Catches autopilot loops before they turn into failure loops. Built first for weight loss \u2014 works for work follow-up, cravings, procrastination.",
  },
  twitter: {
    card: 'summary_large_image',
    title: "COYL \u2014 It's not the mistake. It's what you do after.",
    description:
      "Catches broken commitments before they become failure loops. Works on the exact moment you usually fold.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const clerkReady = publishableKey && !publishableKey.startsWith('pk_...')

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {clerkReady
          ? <ClerkProvider publishableKey={publishableKey!}>{children}</ClerkProvider>
          : children
        }
        <CookieConsent />
      </body>
    </html>
  )
}
