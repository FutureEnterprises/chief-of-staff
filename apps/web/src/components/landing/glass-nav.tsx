'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { CoylLogo } from '@/components/brand/logo'

/**
 * GlassNav — May 2026 two-track IA, consumer-only surface.
 *
 * Per rounds 2 + 3 of the consumer-facing audit, the protocol-tier
 * surface (BIP/PAP/EAP/UAP/RAP, Platform overview, Developers) is
 * STRIPPED from this nav. The full subdomain split (developers.coyl.ai)
 * is deferred until the Microsoft Viva conversation lands; the lighter
 * middle path is to keep the consumer nav purely consumer-facing.
 *
 * Protocol surfaces remain reachable:
 *   - by direct URL (/bip, /pap, /eap, /uap, /rap, /platform, /developers)
 *   - via the /protocol hub page (linked from the footer's quiet
 *     "Developers & foundation-lab partners" handoff)
 *
 * Consumer-facing structure (the only structure now):
 *
 *   PRIMARY (consumer)
 *     Rebound          — the anti-regain wedge landing
 *     Take the audit   — the viral funnel entry
 *     How it works     — the 3-second-window mechanism
 *     Pricing          — Recover / Rewire / Rebound
 *
 * Other surfaces (research, manifesto, advisors, vertical-specific
 * wedge pages) live in the footer for direct-link traffic.
 */

export function GlassNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // Escape closes the mobile drawer. No desktop dropdowns to close
  // since the consumer nav is now a flat link surface.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <motion.nav
      ref={navRef}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200"
      style={{
        background: 'rgba(250, 250, 247, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="group">
          <CoylLogo size="md" theme="light" />
        </Link>

        {/* Desktop nav — consumer-led primary surface.
            Protocol dropdown removed per the rounds 2 + 3 audit:
            consumer focus, full subdomain split deferred until Viva
            conversation. Protocol pages stay reachable by URL and via
            the /protocol hub linked from the footer. */}
        <div className="hidden items-center gap-1 text-sm font-medium tracking-wide text-gray-600 md:flex">
          <Link
            href="/rebound"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
          >
            Rebound
          </Link>
          <Link
            href="/audit"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
          >
            Take the audit
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
          >
            Pricing
          </Link>
          {/* Invite-only front door — the waitlist is the craze launch's
              capture + referral surface (audit → card → waitlist). Given
              a subtle accent so it reads as the "join" action without
              displacing the auth CTA. */}
          <Link
            href="/waitlist"
            className="rounded-full px-3 py-1.5 font-semibold text-orange-600 transition-colors hover:text-orange-700"
          >
            Waitlist
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-full border border-gray-200 bg-white p-2 text-gray-700 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* CTA — auth-aware. Signed-in users see a pair:
              [Dashboard →]   [Sign out]
            Signed-out users see the standard signup CTA.
            Mobile gets the same pair inside the drawer; desktop hides
            here and shows in the drawer per the `hidden md:flex` rule. */}
        <NavAuthCta onCloseDropdowns={() => {}} />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileDrawer onClose={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// DropdownTrigger + DropdownPanel removed alongside the PROTOCOL nav
// dropdown (rounds 2 + 3 audit: consumer focus, subdomain split
// deferred). No remaining consumer nav surface uses a dropdown.

function MobileDrawer({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#fafaf7] md:hidden"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <Link href="/" onClick={onClose}>
          <CoylLogo size="md" theme="light" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-full border border-gray-200 bg-white p-2 text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="h-[calc(100vh-72px)] overflow-y-auto px-6 pb-12 pt-8">
        {/* Primary — consumer surface */}
        <div className="mb-10">
          <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-orange-600">
            For you
          </p>
          <ul className="space-y-1">
            <MobileLink href="/rebound" label="Rebound" description="The anti-regain layer for GLP-1 users." onClose={onClose} />
            <MobileLink href="/audit" label="Take the 60-second audit" description="Find your autopilot family." onClose={onClose} />
            <MobileLink href="/how-it-works" label="How it works" description="Detect, interrupt, recover — the 3-step loop." onClose={onClose} />
            <MobileLink href="/pricing" label="Pricing" description="Recover (free) + Rewire ($12/mo) + Rebound." onClose={onClose} />
            <MobileLink href="/waitlist" label="Join the waitlist" description="COYL is invite-only. Request access + jump the line." onClose={onClose} />
          </ul>
        </div>

        {/* Protocol mobile section removed — consumer focus per rounds
            2 + 3 audit. Protocol pages stay reachable by direct URL
            and via the /protocol hub linked from the footer. Full
            subdomain split deferred until Viva conversation lands. */}

        <div className="mt-10">
          <NavAuthCta onCloseDropdowns={onClose} fullWidth />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * NavAuthCta — the auth-aware CTA cluster shared by desktop nav + mobile
 * drawer. Signed-out users see a single "Start free" button. Signed-in
 * users see two: a primary "Dashboard" link going to /today plus a
 * secondary "Sign out" pill. While Clerk loads (useUser.isLoaded is
 * false) we render a soft skeleton placeholder to avoid CLS — if we
 * defaulted to the signed-out CTA and then flipped after hydration,
 * users would see "Start free" flash before "Dashboard" lands. The
 * placeholder is sized to match either state.
 */
function NavAuthCta({
  onCloseDropdowns,
  fullWidth = false,
}: {
  onCloseDropdowns: () => void
  fullWidth?: boolean
}) {
  const { isLoaded, isSignedIn } = useUser()

  // Pre-hydration placeholder. Same height as the eventual CTA so the
  // layout doesn't shift when Clerk resolves.
  if (!isLoaded) {
    return (
      <div
        aria-hidden
        className={
          fullWidth
            ? 'flex h-12 w-full rounded-full bg-white/40'
            : 'hidden h-10 w-28 rounded-full bg-white/40 md:block'
        }
      />
    )
  }

  if (isSignedIn) {
    return (
      <div
        className={
          fullWidth
            ? 'flex flex-col gap-2'
            : 'hidden items-center gap-2 md:flex'
        }
      >
        <Link
          href="/today"
          onClick={onCloseDropdowns}
          className={
            (fullWidth
              ? 'flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold'
              : 'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold') +
            ' bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_16px_rgba(255,102,0,0.3)] transition-all hover:shadow-[0_0_24px_rgba(255,102,0,0.5)]'
          }
        >
          Dashboard
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            onClick={onCloseDropdowns}
            className={
              (fullWidth
                ? 'flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold'
                : 'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold') +
              ' border border-gray-300 bg-white text-gray-900 transition-colors hover:border-orange-300 hover:bg-orange-50'
            }
          >
            Sign out
          </button>
        </SignOutButton>
      </div>
    )
  }

  // Signed-out — original single CTA.
  return (
    <Link
      href={fullWidth ? '/sign-up?ref=nav-mobile' : '/sign-up?ref=nav'}
      onClick={onCloseDropdowns}
      className={
        fullWidth
          ? 'flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]'
          : 'hidden items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)] transition-all hover:shadow-[0_0_24px_rgba(255,102,0,0.5)] md:flex'
      }
    >
      Start free
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

function MobileLink({
  href,
  label,
  description,
  onClose,
}: {
  href: string
  label: string
  description?: string
  onClose: () => void
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className="flex flex-col rounded-xl px-3 py-2 hover:bg-orange-50"
      >
        <span className="text-base font-semibold text-gray-900">{label}</span>
        {description && (
          <span className="text-xs text-gray-600">{description}</span>
        )}
      </Link>
    </li>
  )
}

// MobileSection removed — only the PROTOCOL mobile section used it,
// and that section is now stripped from the consumer drawer.
