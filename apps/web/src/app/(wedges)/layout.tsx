import Link from 'next/link'
import { GlassNav } from '@/components/landing/glass-nav'

/**
 * Wedge layout — shared frame for every public marketing page that
 * isn't the homepage (/pricing, /clinical-study, /glp1, /procrastination,
 * /teams, /weight-loss, /work, /research, /science, /audit, /catch-me,
 * /how-it-works, /destructive-behaviors, /decision-support, /recovery,
 * /caught, /autopilot-map, /content, /changelog).
 *
 * Uses the SAME GlassNav as the homepage so a visitor clicking from
 * the homepage into any wedge gets a continuous navigation experience.
 * Previous bug: each surface had its own nav with different links,
 * which read as two separate sites stitched together. One nav, one
 * brand.
 */
export default function WedgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-gray-900 selection:bg-orange-500 selection:text-white">
      <GlassNav />

      {/* pt-24 to clear the sticky nav (88px tall). Wedge content was
          previously starting at py-16 because the nav was inline; with
          a fixed/sticky nav we need explicit clearance. */}
      <main className="mx-auto max-w-4xl px-6 pt-24 pb-16 md:pt-32 md:pb-24">{children}</main>

      <footer className="border-t border-gray-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} COYL &middot; Stop the script before it runs your life.</span>
          <div className="flex gap-4">
            <Link href="/how-it-works" className="hover:text-orange-600">How it works</Link>
            <Link href="/pricing" className="hover:text-orange-600">Pricing</Link>
            <Link href="/research" className="hover:text-orange-600">Research</Link>
            <Link href="/terms" className="hover:text-orange-600">Terms</Link>
            <Link href="/privacy" className="hover:text-orange-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
