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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
