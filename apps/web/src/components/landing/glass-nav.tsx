'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { CoylLogo } from '@/components/brand/logo'

/**
 * GlassNav — May 2026 two-track IA.
 *
 * Restructured per the founder strategic decision to separate the
 * consumer-facing surface (Rebound — the GLP-1 anti-regain wedge)
 * from the protocol-tier surface (BIP/PAP/EAP/UAP/RAP — the
 * developer/M&A/foundation-lab story). Two surfaces, one company,
 * preserved independently so consumer execution and protocol
 * execution can run in parallel without trampling each other.
 *
 * Structure:
 *
 *   PRIMARY (consumer)
 *     Rebound          — the anti-regain wedge landing
 *     Take the audit   — the viral funnel entry
 *     How it works     — the 3-second-window mechanism
 *     Pricing          — Recover / Rewire / Rebound
 *
 *   PROTOCOL (developer + M&A)
 *     Protocol         — dropdown to the full 5-spec stack
 *
 * Other surfaces (research, manifesto, advisors, vertical-specific
 * wedge pages) live in the footer for direct-link traffic but stay
 * off the primary nav so neither audience is fighting two stories.
 */

type DropdownLink = {
  label: string
  href: string
  description?: string
}

type DropdownKey = 'protocol' | null

/**
 * The protocol-tier menu — single dropdown that houses every
 * developer / M&A / foundation-lab surface. Visually demoted to a
 * subtle "Protocol" trigger at the right end of the primary nav so
 * the consumer story leads and the protocol thesis is one click
 * deep but never hidden.
 */
const PROTOCOL: DropdownLink[] = [
  { label: 'Platform overview', href: '/platform', description: 'Five protocols, one reference engine. The M&A + partner-facing story.' },
  { label: 'Protocol stack', href: '/protocol', description: '"Stop being a chatbot. Become behavior-aware." The full stack.' },
  { label: 'UAP — Standing Consent', href: '/uap', description: 'The foundation. What the user permits, refuses, can override.' },
  { label: 'BIP — Behavioral Context', href: '/protocol#bip', description: 'The substrate. What loop the user is in right now.' },
  { label: 'PAP — Proactive Intervention', href: '/pap', description: 'LLMs propose, coordinator arbitrates. Cross-vendor Switzerland.' },
  { label: 'EAP — Cross-Device Action', href: '/eap', description: 'Per-action execution across the user’s device fleet.' },
  { label: 'RAP — Safety Routing', href: '/rap', description: 'When the AI stops coaching and routes to a human.' },
  { label: 'Developers', href: '/developers', description: 'SDKs, code examples, getting started against COYL.' },
]

export function GlassNav() {
  const [open, setOpen] = useState<DropdownKey>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // Click-outside closes desktop dropdowns. Mobile drawer has its own
  // close affordance.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!navRef.current) return
      if (!navRef.current.contains(e.target as Node)) setOpen(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
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
        <Link href="/" className="group" onClick={() => setOpen(null)}>
          <CoylLogo size="md" theme="light" />
        </Link>

        {/* Desktop nav — consumer-led primary surface */}
        <div className="hidden items-center gap-1 text-sm font-medium tracking-wide text-gray-600 md:flex">
          <Link
            href="/rebound"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
            onClick={() => setOpen(null)}
          >
            Rebound
          </Link>
          <Link
            href="/audit"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
            onClick={() => setOpen(null)}
          >
            Take the audit
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
            onClick={() => setOpen(null)}
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
            onClick={() => setOpen(null)}
          >
            Pricing
          </Link>

          {/* Subtle protocol-tier menu — visually demoted to a small
              divider + muted trigger so the consumer audience reads
              the primary nav as the story while developer / M&A
              visitors find the protocol surface one click in. */}
          <span aria-hidden className="mx-2 h-4 w-px bg-gray-300" />
          <DropdownTrigger
            label="Protocol"
            id="protocol"
            open={open === 'protocol'}
            onToggle={() => setOpen(open === 'protocol' ? null : 'protocol')}
            onEnter={() => setOpen('protocol')}
          />
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
        <NavAuthCta onCloseDropdowns={() => setOpen(null)} />
      </div>

      {/* Desktop dropdown panel — protocol only */}
      <AnimatePresence>
        {open === 'protocol' && (
          <DropdownPanel
            key="protocol"
            links={PROTOCOL}
            eyebrow="For developers, foundation labs, and partners"
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileDrawer onClose={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

function DropdownTrigger({
  label,
  id,
  open,
  onToggle,
  onEnter,
}: {
  label: string
  id: string
  open: boolean
  onToggle: () => void
  onEnter: () => void
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={`${id}-panel`}
      onClick={onToggle}
      onMouseEnter={onEnter}
      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em] transition-colors ${
        open ? 'text-orange-700' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {label}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      >
        <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function DropdownPanel({
  links,
  eyebrow,
  onClose,
}: {
  links: DropdownLink[]
  eyebrow?: string
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute left-0 right-0 top-full hidden border-b border-gray-200 bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] md:block"
    >
      <div className="mx-auto max-w-7xl px-6 py-6 md:px-12">
        {eyebrow && (
          <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            {eyebrow}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="group flex flex-col gap-1 rounded-2xl border border-transparent p-4 transition-colors hover:border-orange-200 hover:bg-orange-50"
            >
              <span className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
                {l.label}
              </span>
              {l.description && (
                <span className="text-xs leading-relaxed text-gray-600">{l.description}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

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
          </ul>
        </div>

        {/* Secondary — protocol surface */}
        <MobileSection title="Protocol · for developers + partners" links={PROTOCOL} onClose={onClose} />

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

function MobileSection({
  title,
  links,
  onClose,
}: {
  title: string
  links: DropdownLink[]
  onClose: () => void
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-orange-600">
        {title}
      </p>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={onClose}
              className="flex flex-col rounded-xl px-3 py-2 hover:bg-orange-50"
            >
              <span className="text-base font-semibold text-gray-900">{l.label}</span>
              {l.description && (
                <span className="text-xs text-gray-600">{l.description}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
