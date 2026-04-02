import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Chief of Staff',
    template: '%s | Chief of Staff',
  },
  description:
    'Your AI-powered execution partner. Morning planning, follow-up enforcement, and daily briefings — so nothing important slips through.',
  keywords: ['productivity', 'ai assistant', 'task management', 'follow-up', 'daily briefing'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const html = (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  )
  if (!publishableKey) return html
  return <ClerkProvider publishableKey={publishableKey}>{html}</ClerkProvider>
}
