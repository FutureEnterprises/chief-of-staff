'use client'

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
  const partners = [
    {
      Icon: Stethoscope,
      label: 'Telehealth GLP-1 prescribers',
      body: 'Add real-time relapse prevention to your weight care program. White-label available.',
    },
    {
      Icon: Building2,
      label: 'Employers + health plans',
      body: 'Reduce regain post-discontinuation. PMPM pricing. Outcome reporting.',
    },
    {
      Icon: FlaskConical,
      label: 'Research labs + clinics',
      body: 'Co-author outcome studies. De-identified data sharing under DUA.',
    },
  ]

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.04] via-orange-500/[0.02] to-transparent p-8 md:p-12"
      >
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-8 bg-orange-500" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
            For partners
          </span>
        </div>

        <h2 className="mb-4 text-3xl font-black leading-tight text-white md:text-4xl">
          The relapse-prevention layer{' '}
          <span className="text-orange-400">beneath your weight care program.</span>
        </h2>

        <p className="mb-10 max-w-2xl text-base text-gray-400">
          Real-time pattern interrupt during the medication, behavioral muscle memory after.
          Designed to slot under existing GLP-1 protocols without rebuilding your stack.
        </p>

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {partners.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-white/5 bg-black/30 p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08] text-orange-400">
                <p.Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">{p.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/research"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)]"
          >
            See research + outcomes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="mailto:partners@coyl.ai?subject=COYL%20partnership"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-gray-200 hover:border-orange-500/40 hover:text-white"
          >
            partners@coyl.ai
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
