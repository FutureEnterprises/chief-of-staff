'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): premium B2B framing with
 *     serif headline + restrained orange accent on a single phrase.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): partner cards strip card
 *     chrome and become editorial entries on the cream canvas.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     audience labels in serif.
 */

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Stethoscope, Building2, FlaskConical } from 'lucide-react'

/**
 * Partners strip — small B2B band before the footer.
 *
 * Audit gap: the homepage was 100% consumer-facing. No surface for
 * telehealth GLP-1 prescribers, employers, or research partners — the
 * three audiences that gate $60M of the $100M revenue plan.
 *
 * Honest framing: no fake logos, no fake outcome stats. Three short
 * partner intents, each with a Lucide glyph and a destination on
 * /research (the actual partner-outreach page). The CTA is a single
 * mailto so partners can reach BD without a contact form first.
 *
 * Brand-voice note: we don't use the word "enterprise" anywhere. It
 * signals 2010-era SaaS positioning. "Telehealth", "employers",
 * "clinicians" name the actual audiences directly.
 */
export function PartnersStrip() {
  // Three buyer audiences. Each routed to its own dedicated page so the
  // CTA stays scoped to the audience, not a generic /research catch-all.
  // Per the May 2026 wedge build-out: /teams is the workplace-employer
  // surface, /research is the clinical-partner surface, /glp1 is the
  // telehealth-prescriber surface.
  const partners = [
    {
      Icon: Stethoscope,
      label: 'Telehealth GLP-1 prescribers',
      body: 'Add real-time relapse prevention to your weight care program. Co-branded enrollment + clinician dashboard.',
      href: '/rebound',
    },
    {
      Icon: Building2,
      label: 'Employers + health plans',
      body: 'Reduce focus loss + workplace procrastination. PMPM pricing. Outcome reporting.',
      href: '/teams',
    },
    {
      Icon: FlaskConical,
      label: 'Research labs + clinics',
      body: '12-week GLP-1 study open for enrollment. Protocol drafted, IRB pathway mapped.',
      href: '/clinical-study',
    },
  ]

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-32 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="border-t border-gray-200 pt-16"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            For partners
          </span>
        </div>

        <h2 className="mb-6 max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          The relapse-prevention layer{' '}
          <span className="italic text-orange-600">beneath your weight care program.</span>
        </h2>

        <p className="mb-16 max-w-2xl text-base leading-[1.7] text-gray-600">
          Real-time pattern interrupt during the medication, behavioral muscle memory after.
          Designed to slot under existing GLP-1 protocols without rebuilding your stack.
        </p>

        <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-3">
          {partners.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="group block border-t border-gray-200 pt-6 transition-all hover:border-gray-900"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center text-gray-400 transition-colors group-hover:text-orange-600">
                <p.Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900">{p.label}</h3>
              <p className="mt-3 text-sm leading-[1.65] text-gray-600">{p.body}</p>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/clinical-study"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600"
          >
            See the clinical protocol
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/research"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
          >
            Outcomes we measure
          </Link>
          <Link
            href="mailto:partners@coyl.ai?subject=COYL%20partnership"
            className="inline-flex items-center gap-2 font-mono text-xs font-medium text-gray-500 underline-offset-4 hover:text-orange-600 hover:underline"
          >
            partners@coyl.ai
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
