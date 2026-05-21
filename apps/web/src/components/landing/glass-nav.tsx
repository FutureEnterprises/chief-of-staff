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
      className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200"
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

        {/*
          Nav rename per the May 2026 homepage audit. Manifesto-mode labels
          ("Philosophy / The Engine / Commit / Initialize") were brand-voice
          but cold-traffic-hostile — visitors couldn't find pricing, how
          it works, or sign-up. Replaced with the standard SaaS shape: a
          clear navigation pattern + a real CTA. Brand voice stays in the
          hero copy, the BrandStatement section, and the Truth card.
        */}
        <div className="hidden items-center gap-8 text-sm font-medium tracking-wide text-gray-600 md:flex">
          <Link href="/how-it-works" className="transition-colors hover:text-gray-900">How it works</Link>
          <Link href="/pricing" className="transition-colors hover:text-gray-900">Pricing</Link>
          <Link href="/research" className="transition-colors hover:text-gray-900">Research</Link>
        </div>

        <Link
          href="/sign-up?ref=nav"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-gray-900 shadow-[0_0_16px_rgba(255,102,0,0.3)] transition-all hover:shadow-[0_0_24px_rgba(255,102,0,0.5)]"
        >
          Start free
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </motion.nav>
  )
}
