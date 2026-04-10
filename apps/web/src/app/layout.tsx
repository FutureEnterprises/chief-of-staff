import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { CookieConsent } from '@/components/cookie-consent'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'COYL — AI Willpower',
    template: '%s | COYL',
  },
  description:
    'Control Over Your Life. The AI that hounds you until it\'s done. Morning briefings. Night reviews. Relentless follow-through.',
  keywords: ['productivity', 'task management', 'ai assistant', 'control your life', 'coyl', 'follow-up', 'daily briefing', 'ai willpower'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'),
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'COYL',
    title: 'COYL — AI Willpower',
    description: 'The AI that hounds your a$$ until it\'s done. Morning briefings. Night reviews. Zero excuses.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL — AI Willpower',
    description: 'The AI that hounds your a$$ until it\'s done.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const clerkReady = publishableKey && !publishableKey.startsWith('pk_...')

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
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
