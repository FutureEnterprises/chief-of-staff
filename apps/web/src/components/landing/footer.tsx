'use client'

import Link from 'next/link'
import { CoylLogo } from '@/components/brand/logo'
import { NewsletterSignup } from '@/components/newsletter/signup'

/**
 * Landing footer — expanded per the May 2026 homepage audit.
 *
 * Old footer was Terms / Privacy / Cookies / © which signals "not a
 * real company yet." A real footer with category-grouped links signals
 * a product visitors can navigate, raises trust, and gives Google more
 * internal links for SEO.
 *
 * Three categories: Product (consumer surfaces), Partners (B2B + research),
 * Legal (compliance). Brand mark + tagline stays in the lead column.
 */
export function LandingFooter() {
  // Three-leg wedge balance per the May 2026 ultrathink: weight + work
  // + destructive get equal surface in the footer. Procrastination is
  // the workplace consumer lead, /teams is the workplace B2B lead,
  // /work is the follow-through niche. All three first-class wedges so
  // visitors see "any compulsive behavior" not "weight loss with extras."
  const product = [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Procrastination + focus', href: '/procrastination' },
    { label: 'For teams (employer)', href: '/teams' },
    { label: 'GLP-1 companion', href: '/glp1' },
    { label: 'Weight loss', href: '/weight-loss' },
    { label: 'Work follow-through', href: '/work' },
  ]

  const partners = [
    { label: 'Research + outcomes', href: '/research' },
    { label: 'Clinical study', href: '/clinical-study' },
    { label: 'The science', href: '/science' },
    { label: 'Decision support', href: '/decision-support' },
    { label: 'Destructive patterns', href: '/destructive-behaviors' },
    { label: 'Autopilot map', href: '/autopilot-map' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Content playbook', href: '/content' },
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

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 flex flex-col md:col-span-1">
            <CoylLogo size="sm" theme="dark" />
            <p className="mt-3 max-w-[14rem] text-xs leading-relaxed text-gray-500">
              The pattern-interrupt AI for people who already know what to do.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-gray-600">
              Behavioral support · Not medical treatment
            </p>
          </div>

          <FooterColumn title="Product" links={product} />
          <FooterColumn title="More" links={partners} />
          <FooterColumn title="Account" links={legal} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-gray-200 pt-6 md:flex-row md:items-center">
          <span className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} COYL &middot; Stop the script before it runs your life.
          </span>
          <Link
            href="/sign-up?ref=footer"
            className="text-xs font-bold text-orange-600 transition-colors hover:text-orange-700"
          >
            Start free &rarr;
          </Link>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: Array<{ label: string; href: string }>
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-orange-600">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
