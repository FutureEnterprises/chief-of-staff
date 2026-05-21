'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { CoylLogo } from '@/components/brand/logo'

/**
 * GlassNav — May 2026 IA expansion.
 *
 * Prior version surfaced only 3 links (How it works / Pricing / Research)
 * + a CTA, leaving 16 wedge pages discoverable only via the footer. That
 * created a "tour the footer to find anything" navigation IA — fine for
 * a brochure site, broken for a category launch where every wedge page
 * is a load-bearing surface (audit is the viral hook, /teams is the B2B
 * revenue lane, /clinical-study is the credibility moat).
 *
 * New structure:
 *
 *   Product           (dropdown)  → How it works, Autopilot map, Decision
 *                                   support, Recovery engine, Audit (tool)
 *   Patterns          (dropdown)  → GLP-1, Weight loss, Procrastination,
 *                                   Recurring loops, Work, Catch me tonight
 *                                   (the "Patterns COYL Catches" library —
 *                                   strategist's mandate: do NOT call them
 *                                   "use cases", "solutions", or
 *                                   "treatment areas". They are patterns.)
 *   For teams         (link)      → /teams
 *   Research          (dropdown)  → Clinical study, The science,
 *                                   Research + outcomes, Content
 *   Pricing           (link)      → /pricing
 *   CTA               (button)    → /sign-up
 *
 * Mobile: hamburger → full-screen drawer with flat list of every link.
 * Desktop: hover-or-tap dropdowns; only one panel open at a time.
 */

type DropdownLink = {
  label: string
  href: string
  description?: string
}

type DropdownKey = 'product' | 'use-cases' | 'research' | null

const PRODUCT: DropdownLink[] = [
  { label: 'Manifesto', href: '/manifesto', description: 'AI has never met human behavior before. Read the category claim.' },
  { label: 'How it works', href: '/how-it-works', description: 'Detect, interrupt, recover — the three-step loop.' },
  { label: 'Autopilot audit', href: '/audit', description: '60 seconds. Find your archetype. Share the card.' },
  { label: 'Autopilot map', href: '/autopilot-map', description: 'Your danger windows visualised over the week.' },
  { label: 'Decision support', href: '/decision-support', description: 'Real-time guidance at the 3-second window.' },
  { label: 'Recovery engine', href: '/recovery', description: 'Same-night re-entry. No spiral. No restart.' },
  { label: 'Catch me tonight', href: '/catch-me', description: 'One SMS at 9 PM — the moment, caught.' },
]

const USE_CASES: DropdownLink[] = [
  { label: 'GLP-1 companion', href: '/glp1', description: 'For the moments medication does not touch.' },
  { label: 'Weight loss', href: '/weight-loss', description: 'The 9 PM kitchen, not the diet plan.' },
  { label: 'Procrastination + focus', href: '/procrastination', description: 'The tab switch, before it wins.' },
  { label: 'Recurring loops', href: '/destructive-behaviors', description: 'Autopilot patterns you keep returning to — not clinical crisis.' },
  { label: 'Work follow-through', href: '/work', description: 'The shower-thought that derails the deep-work block.' },
  { label: 'Caught moments', href: '/caught', description: 'Shareable archetype cards.' },
]

const RESEARCH: DropdownLink[] = [
  { label: 'The science', href: '/science', description: 'Pattern interrupts, JITAI, recovery psychology.' },
  { label: 'Clinical study', href: '/clinical-study', description: 'Study-readiness package — protocol drafted.' },
  { label: 'Research + outcomes', href: '/research', description: 'What we measure, what we will publish.' },
  { label: 'Press', href: '/press', description: 'AI is leaving the prompt box — for journalists.' },
  { label: 'Safety', href: '/safety', description: 'What COYL is for, and what it is not. Real-help routing.' },
  { label: 'Content playbook', href: '/content', description: 'Long-form writing on behavior, AI, and habit.' },
  { label: 'Changelog', href: '/changelog', description: 'What shipped, what is shipping next.' },
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

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 text-sm font-medium tracking-wide text-gray-600 md:flex">
          <DropdownTrigger
            label="Product"
            id="product"
            open={open === 'product'}
            onToggle={() => setOpen(open === 'product' ? null : 'product')}
            onEnter={() => setOpen('product')}
          />
          <DropdownTrigger
            label="Patterns"
            id="patterns"
            open={open === 'use-cases'}
            onToggle={() => setOpen(open === 'use-cases' ? null : 'use-cases')}
            onEnter={() => setOpen('use-cases')}
          />
          <Link
            href="/teams"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
            onClick={() => setOpen(null)}
          >
            For teams
          </Link>
          <DropdownTrigger
            label="Research"
            id="research"
            open={open === 'research'}
            onToggle={() => setOpen(open === 'research' ? null : 'research')}
            onEnter={() => setOpen('research')}
          />
          <Link
            href="/pricing"
            className="rounded-full px-3 py-1.5 transition-colors hover:text-gray-900"
            onClick={() => setOpen(null)}
          >
            Pricing
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

        {/* CTA — desktop only; mobile gets it inside the drawer */}
        <Link
          href="/sign-up?ref=nav"
          onClick={() => setOpen(null)}
          className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)] transition-all hover:shadow-[0_0_24px_rgba(255,102,0,0.5)] md:flex"
        >
          Start free
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Desktop dropdown panels */}
      <AnimatePresence>
        {open === 'product' && (
          <DropdownPanel key="product" links={PRODUCT} onClose={() => setOpen(null)} />
        )}
        {open === 'use-cases' && (
          <DropdownPanel key="use-cases" links={USE_CASES} onClose={() => setOpen(null)} />
        )}
        {open === 'research' && (
          <DropdownPanel key="research" links={RESEARCH} onClose={() => setOpen(null)} />
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
      className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
        open ? 'text-gray-900' : 'hover:text-gray-900'
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

function DropdownPanel({ links, onClose }: { links: DropdownLink[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute left-0 right-0 top-full hidden border-b border-gray-200 bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] md:block"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-6 py-6 md:px-12 lg:grid-cols-3">
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
        <MobileSection title="Product" links={PRODUCT} onClose={onClose} />
        <MobileSection title="Patterns COYL catches" links={USE_CASES} onClose={onClose} />
        <div className="mt-8 border-t border-gray-200 pt-8">
          <Link
            href="/teams"
            onClick={onClose}
            className="mb-3 block text-base font-bold text-gray-900"
          >
            For teams →
          </Link>
          <Link
            href="/pricing"
            onClick={onClose}
            className="mb-3 block text-base font-bold text-gray-900"
          >
            Pricing →
          </Link>
        </div>
        <MobileSection title="Research" links={RESEARCH} onClose={onClose} />

        <Link
          href="/sign-up?ref=nav-mobile"
          onClick={onClose}
          className="mt-10 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start free
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </motion.div>
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
