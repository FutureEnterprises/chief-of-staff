import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'COYL',
    template: '%s | COYL',
  },
  description:
    'Control Your Life. COYL is your AI-powered execution partner — wound tight and ready to release on your command.',
  keywords: ['productivity', 'task management', 'ai assistant', 'control your life', 'coyl', 'follow-up', 'daily briefing'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  // Treat placeholder/invalid keys the same as missing — skip ClerkProvider
  const clerkReady = publishableKey && !publishableKey.startsWith('pk_...')
  const html = (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  )
  if (!clerkReady) return html
  return <ClerkProvider publishableKey={publishableKey!}>{html}</ClerkProvider>
}
