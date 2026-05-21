import Link from 'next/link'
import { CoylLogo } from '@/components/brand/logo'

export default function WedgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-gray-900 selection:bg-orange-500 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-[#fafaf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <CoylLogo size="sm" theme="light" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-700 md:flex">
            <Link href="/how-it-works" className="hover:text-orange-600">How it works</Link>
            <Link href="/procrastination" className="hover:text-orange-600">Procrastination</Link>
            <Link href="/teams" className="hover:text-orange-600">For teams</Link>
            <Link href="/glp1" className="hover:text-orange-600">GLP-1</Link>
            <Link href="/weight-loss" className="hover:text-orange-600">Weight loss</Link>
            <Link href="/pricing" className="hover:text-orange-600">Pricing</Link>
            <Link href="/research" className="hover:text-orange-600">Research</Link>
          </nav>
          <Link
            href="/sign-up"
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(255,102,0,0.3)] hover:shadow-[0_0_30px_rgba(255,102,0,0.5)]"
          >
            Start
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">{children}</main>

      <footer className="border-t border-gray-200 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} COYL &middot; Stop the script before it runs your life.</span>
          <div className="flex gap-4">
            <Link href="/content" className="hover:text-orange-600">Content playbook</Link>
            <Link href="/terms" className="hover:text-orange-600">Terms</Link>
            <Link href="/privacy" className="hover:text-orange-600">Privacy</Link>
            <Link href="/cookies" className="hover:text-orange-600">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
