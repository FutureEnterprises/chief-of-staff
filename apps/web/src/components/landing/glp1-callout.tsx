'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

/**
 * GLP-1 callout band — sits between the hero and BrandStatement on the
 * homepage. Surfaces the urgent, payer-funded wedge (Ozempic / Wegovy /
 * Mounjaro relapse) without replacing the brand-defining "CONTROL YOUR
 * LIFE" hero. This is the wedge framing that opens telehealth-partner
 * conversations and resonates with the 15M+ GLP-1 users who already
 * know they're going to regain when the prescription ends.
 *
 * Design notes:
 *   • Single horizontal band, not a full section. The hero gets its
 *     full moment first; this is the "by the way, if you're on the
 *     drug…" beat.
 *   • Pulsing red dot mirrors the AUTOPILOT DETECTED card aesthetic so
 *     visitors recognize the brand visual language immediately.
 *   • Dual-tone copy: declarative truth on the left, soft CTA on the
 *     right. No alarmism.
 *   • Links to /glp1 (the dedicated wedge page already shipped).
 */
export function Glp1Callout() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="group relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.06] via-red-500/[0.04] to-transparent px-6 py-7 md:px-10 md:py-9"
      >
        {/* Subtle radial accent in the corner — same warmth as the rest of the site. */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,102,0,0.35), transparent 70%)' }}
        />

        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-red-500"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-400">
                On Ozempic, Wegovy, or Mounjaro?
              </span>
            </div>

            <h2 className="text-2xl font-black leading-tight text-white md:text-3xl">
              The drug suppresses appetite.{' '}
              <span className="text-orange-400">
                COYL catches the autopilot the drug doesn&rsquo;t.
              </span>
            </h2>

            <p className="mt-3 max-w-xl text-sm text-gray-400 md:text-base">
              The 9pm kitchen. The stress-eat. The &ldquo;I deserve this&rdquo; — those scripts are
              still running. We train the interrupt while you&rsquo;re on the drug so it&rsquo;s
              muscle memory when you&rsquo;re off.
            </p>
          </div>

          <Link
            href="/glp1"
            className="group/btn inline-flex shrink-0 items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/[0.08] px-5 py-3 text-sm font-bold text-orange-200 transition-all duration-200 hover:border-orange-500/60 hover:bg-orange-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          >
            See the GLP-1 companion
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
