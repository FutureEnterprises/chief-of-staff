import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Lost the thread',
  robots: { index: false, follow: false },
}

/**
 * 404 — make the page a conversion surface, not a dead end.
 *
 * Default Next.js 404s are wasted real estate. ~3% of all traffic hits a
 * 404 at some point in a session (Cloudflare 2024 traffic data). That's
 * 3% of the audience landing on a "nope" page when they could be landing
 * on "this is what we do, want it?"
 *
 * Brand-voice 404 with three exit ramps:
 *  - Primary CTA: the homepage (the highest-converting destination)
 *  - Secondary: pricing (the second-highest)
 *  - Tertiary: rescue (the actual product value moment for anyone who
 *    came here through a broken push deep-link)
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-200">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">
          404
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-6xl">
          You missed it.<br />
          <span className="text-orange-400">Sign up so we catch you next time.</span>
        </h1>
        <p className="mt-5 max-w-md text-base text-gray-400">
          The page you tried doesn&rsquo;t exist or moved. The real interrupt is on
          the inside &mdash; here&rsquo;s where to find what you came for.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            Take me home
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
          >
            See pricing
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
          >
            How it works
          </Link>
        </div>

        <p className="mt-12 max-w-md text-xs leading-relaxed text-gray-600">
          If you got here from a notification that broke, that&rsquo;s on us. Tell
          us at{' '}
          <a href="mailto:hello@coyl.ai" className="text-orange-400 underline">
            hello@coyl.ai
          </a>{' '}
          and we&rsquo;ll fix the link.
        </p>
      </div>
    </main>
  )
}
