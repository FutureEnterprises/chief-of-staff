'use client'

import Link from 'next/link'
import { CoylLogo } from '@/components/brand/logo'

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-[#0a0a0a] pb-8 pt-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 md:flex-row md:justify-between md:px-12">
        <div className="flex flex-col items-center md:items-start">
          <CoylLogo size="sm" theme="dark" />
          <p className="mt-2 font-mono text-xs text-gray-600">
            Take control of your sh<span className="inline-block translate-y-[-1px]" role="img" aria-label="poop">💩</span>t.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/terms" className="transition-colors hover:text-orange-500">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-orange-500">Privacy</Link>
          <Link href="/cookies" className="transition-colors hover:text-orange-500">Cookies</Link>
          <span className="text-gray-600">&copy; {new Date().getFullYear()} COYL</span>
        </div>
      </div>
    </footer>
  )
}
