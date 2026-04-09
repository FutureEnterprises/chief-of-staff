'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { CoylLogo } from '@/components/brand/logo'

export function GlassNav() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/5"
      style={{
        background: 'rgba(10, 10, 10, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="group">
          <CoylLogo size="md" theme="dark" />
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium tracking-wide text-gray-400 md:flex">
          <a href="#philosophy" className="transition-colors hover:text-white">Philosophy</a>
          <a href="#engine" className="transition-colors hover:text-white">The Engine</a>
          <a href="#pricing" className="transition-colors hover:text-white">Commit</a>
        </div>

        <Link
          href="/sign-up"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-orange-500/50 hover:bg-white/10"
        >
          Initialize
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-orange-500">
            <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </motion.nav>
  )
}
