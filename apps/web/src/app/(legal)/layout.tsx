import Link from 'next/link'
import { CoylLogo } from '@/components/brand/logo'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300">
      {/* Nav */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/">
            <CoylLogo size="sm" theme="dark" />
          </Link>
          <Link href="/" className="text-sm text-gray-500 transition-colors hover:text-orange-500">
            Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} COYL. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/terms" className="transition-colors hover:text-orange-500">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-orange-500">Privacy</Link>
            <Link href="/cookies" className="transition-colors hover:text-orange-500">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
