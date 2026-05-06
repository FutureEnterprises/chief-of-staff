'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

/**
 * Condensed FAQ for the homepage. Five questions that come up repeatedly
 * in cold-traffic conversations. Each question is the version a real
 * person types into the search bar before signing up:
 *
 *   1. "Does this replace my GLP-1?" — most-asked by paid-search traffic
 *      from "ozempic alternative" / "ozempic companion app" queries.
 *   2. "What about my privacy?" — required for any health-adjacent app
 *      to clear the App Store review questionnaire.
 *   3. "Will it spam me with notifications?" — top objection from
 *      reddit r/loseit + r/glp1 voice.
 *   4. "What if it doesn't work?" — covers the cancel/refund concern.
 *   5. "Is this medical?" — compliance-required disclaimer.
 *
 * Full FAQ lives at /pricing — homepage version is the abridged 5.
 * Each `details` block is keyboard-accessible (Enter to expand).
 */

const FAQ = [
  {
    q: 'Does this replace my GLP-1 medication?',
    a: 'No. COYL works alongside Ozempic, Wegovy, Mounjaro, or any prescription. The drug suppresses appetite. COYL catches the autopilot the drug doesn’t — late-night eating, stress-eat reflex, the script in your head. Train the interrupt while you’re on the drug so it’s muscle memory when you’re off.',
  },
  {
    q: 'What’s the privacy story?',
    a: 'Your sabotage patterns are stored encrypted. Never sold, never shared with advertisers. Sensitive behavioral logs (slips, cravings, notes) are linked to your account only. We use zero third-party tracking pixels. HIPAA-eligible version available for enterprise partners under a BAA.',
  },
  {
    q: 'Will COYL spam me with notifications?',
    a: 'Typically zero to three pushes a day, fired only at moments your data predicts you’re at risk. The whole point is precision, not volume. You can mute, snooze, or downgrade tone any time without losing your data.',
  },
  {
    q: 'What if it doesn’t work for me?',
    a: 'Free tier is real software, not a 7-day demo — use it as long as you want. If you upgrade and it’s not for you, cancel any time, no questions, no guilt-trip. Your slips, commitments, and pattern data stay yours; export anytime from Settings.',
  },
  {
    q: 'Is this medical treatment?',
    a: 'No. COYL is behavioral support, not medical treatment, therapy, or diagnosis. Always work with your doctor for any clinical concerns including weight loss, eating disorders, or addiction. We are not a substitute for professional care.',
  },
]

export function HomepageFaq() {
  return (
    <section className="relative mx-auto max-w-3xl px-6 py-24 md:py-32">
      <div className="mb-12 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Honest answers
        </span>
      </div>

      <h2 className="mb-12 text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl">
        Before you sign up.
      </h2>

      <div className="space-y-3">
        {FAQ.map((f, i) => (
          <motion.details
            key={f.q}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
            className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 open:border-orange-500/20 open:bg-orange-500/[0.03]"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-base font-semibold text-white marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <span
                aria-hidden
                className="text-orange-400 transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">{f.a}</p>
          </motion.details>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-orange-500/40 hover:text-white"
        >
          More questions on /pricing &rarr;
        </Link>
        <Link
          href="/sign-up?ref=faq"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(255,102,0,0.3)]"
        >
          Start free
        </Link>
      </div>
    </section>
  )
}
