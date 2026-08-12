'use client'

import Link from 'next/link'
import { CoylLogo } from '@/components/brand/logo'
import { NewsletterSignup } from '@/components/newsletter/signup'

/**
 * Landing footer — expanded per the May 2026 homepage audit; recut into
 * the consumer-vortex IA per the founder's directive (Aug 2026):
 * "technical things move into about-us/technical-spec; the website
 * should be fun — a vortex to bring in customers."
 *
 * Four categories now:
 *   Product    — the consumer funnel (audit first, Rebound = money path)
 *   Company    — about, manifesto, press, safety + the research cluster
 *   Technology — the demoted protocol surface (/protocol, /platform,
 *                /developers + the five spec pages). One column, small
 *                type. These pages keep their URLs (SEO + credibility)
 *                but exit the consumer funnel entirely.
 *   Account    — legal + sign-in
 *
 * Brand mark + tagline stays in the lead column.
 */
export function LandingFooter() {
  // Consumer funnel order: the audit (the toy) leads, Rebound (the
  // money path) sits second, then mechanism, pricing, and the wedge
  // pages. Three-leg wedge balance retained (weight + work +
  // recurring-loops) so visitors see "any compulsive behavior" not
  // "weight loss with extras."
  const product = [
    { label: 'Take the 60-second audit', href: '/audit' },
    { label: 'Rebound (GLP-1)', href: '/rebound' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'How COYL knows you', href: '/how-coyl-knows-you' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Get the iPhone app', href: '/waitlist' },
    { label: 'Join the waitlist', href: '/waitlist' },
    { label: 'Autopilot map', href: '/autopilot-map' },
    { label: 'Weight loss', href: '/weight-loss' },
    { label: 'Procrastination + focus', href: '/procrastination' },
    { label: 'Recurring loops', href: '/recurring-loops' },
    { label: 'Work follow-through', href: '/work' },
    { label: 'For teams (employer)', href: '/teams' },
  ]

  const company = [
    { label: 'About', href: '/about' },
    { label: 'Manifesto', href: '/manifesto' },
    // Advisors + clinical board hidden until at least one credible name
    // can be published (Q3 2026 per the audit answer). "Forming" reads
    // as a weak signal; cleaner to absent the surface entirely than to
    // signal under-construction. Pages still exist at /advisors and
    // /clinical-board for anyone with a direct link.
    { label: 'Press kit', href: '/press' },
    { label: 'Safety', href: '/safety' },
    { label: 'For clinicians', href: '/clinician' },
    { label: 'Research + outcomes', href: '/research' },
    { label: 'Clinical study', href: '/clinical-study' },
    { label: 'The science', href: '/science' },
    { label: 'Decision support', href: '/decision-support' },
    { label: "What's new (changelog)", href: '/changelog' },
  ]

  // The demoted technical surface — protocol hub, platform overview,
  // developer docs, and the five spec pages. Deliberately one small
  // column: reachable (SEO + the technical audience that wants it),
  // invisible to the consumer funnel.
  const technology = [
    { label: 'Protocol overview', href: '/protocol' },
    { label: 'Platform', href: '/platform' },
    { label: 'Developers', href: '/developers' },
    { label: 'BIP — Behavioral Interrupt', href: '/bip' },
    { label: 'PAP — Proactive AI', href: '/pap' },
    { label: 'EAP — Edge AI', href: '/eap' },
    { label: 'UAP — User Authority', href: '/uap' },
    { label: 'RAP — Risk Assessment', href: '/rap' },
  ]

  const legal = [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Sign in', href: '/sign-in' },
  ]

  return (
    <footer className="relative z-10 border-t border-gray-200 bg-[#fafaf7] pb-8 pt-16">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* Newsletter capture — every bouncing visitor is a free lead we
            otherwise lose. Footer placement gets the visitor who scrolled
            all the way without converting. */}
        <div className="mb-12">
          <NewsletterSignup source="footer" />
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 flex flex-col md:col-span-1">
            <CoylLogo size="sm" theme="light" />
            <p className="mt-3 max-w-[14rem] text-xs leading-relaxed text-gray-500">
              The missing behavioral interface between AI and real life.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-gray-600">
              Behavioral support · Not medical treatment
            </p>
          </div>

          <FooterColumn title="Product" links={product} />
          <FooterColumn title="Company" links={company} />
          <FooterColumn title="Technology" links={technology} small />
          <FooterColumn title="Account" links={legal} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-gray-200 pt-6 md:flex-row md:items-center">
          <span className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} COYL &middot; Catch yourself before you do it again.
          </span>
          <div className="flex flex-wrap items-center gap-5">
            {/* The bottom-bar "Developers & foundation-lab partners"
                handoff was superseded by the Technology column above —
                same destination (/protocol), one canonical home. */}
            <Link
              href="/audit?ref=footer"
              className="text-xs font-bold text-orange-600 transition-colors hover:text-orange-700"
            >
              Take the 60-second audit &rarr;
            </Link>
            <Link
              href="/waitlist?source=footer"
              className="text-xs font-bold text-orange-600 transition-colors hover:text-orange-700"
            >
              Request access &rarr;
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  small = false,
}: {
  title: string
  links: Array<{ label: string; href: string }>
  /** Demoted columns (Technology) render smaller + quieter — reachable,
      not part of the consumer funnel. */
  small?: boolean
}) {
  return (
    <div>
      <p
        className={`mb-3 font-mono text-[10px] font-bold uppercase tracking-widest ${
          small ? 'text-gray-400' : 'text-orange-600'
        }`}
      >
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={`${l.href}:${l.label}`}>
            <Link
              href={l.href}
              className={
                small
                  ? 'text-xs text-gray-500 transition-colors hover:text-gray-900'
                  : 'text-sm text-gray-600 transition-colors hover:text-gray-900'
              }
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
