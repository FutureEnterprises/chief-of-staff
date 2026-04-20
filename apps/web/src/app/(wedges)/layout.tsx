import Link from 'next/link'
import { CoylLogo } from '@/components/brand/logo'

export default function WedgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 selection:bg-orange-500 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <CoylLogo size="sm" theme="dark" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-400 md:flex">
            <Link href="/how-it-works" className="hover:text-orange-400">How it works</Link>
            <Link href="/weight-loss" className="hover:text-orange-400">Weight loss</Link>
            <Link href="/destructive-behaviors" className="hover:text-orange-400">Destructive behaviors</Link>
            <Link href="/decision-support" className="hover:text-orange-400">Decision support</Link>
            <Link href="/recovery" className="hover:text-orange-400">Recovery</Link>
            <Link href="/science" className="hover:text-orange-400">Science</Link>
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

      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} COYL &middot; Stop the script before it runs your life.</span>
          <div className="flex gap-4">
            <Link href="/content" className="hover:text-orange-400">Content playbook</Link>
            <Link href="/terms" className="hover:text-orange-400">Terms</Link>
            <Link href="/privacy" className="hover:text-orange-400">Privacy</Link>
            <Link href="/cookies" className="hover:text-orange-400">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
