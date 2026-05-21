'use client'

import { motion } from 'motion/react'
import { Check, X } from 'lucide-react'

/**
 * Comparison table — the single highest-leverage differentiation surface.
 *
 * Per the May 2026 homepage audit (§7): cold visitors compare COYL to
 * Noom, MyFitnessPal, Calibrate, Found in their head and have no
 * structured way to evaluate the choice. This table forces the
 * comparison and wins on three axes:
 *
 *   1. WHEN it acts — only COYL fires at the moment of decision.
 *      Calorie trackers fire after the fact; coaches fire on a daily
 *      cadence.
 *   2. BAD-DAY HANDLING — only COYL has "no restart, continue."
 *      Streak-based products literally penalize the moment users need
 *      support most.
 *   3. PRICE — Core $9.99/mo is materially below MFP+ Premium ($20),
 *      Noom ($60/mo + Rx), and Calibrate ($1,649/yr ≈ $137/mo). The
 *      $19.99 GLP-1 tier is still half of Noom's monthly price. This
 *      is launch pricing (Scenario B), tuned for category capture, not
 *      ARPU maximization.
 *
 * Honest about competitors: Noom $60/mo, Calibrate $137/mo are real
 * publicly-quoted prices. MFP Premium is $20/mo. We don't lie about
 * them; we don't need to. The structural diff is enough.
 *
 * Compliance note: don't say competitors "fail" or "don't work." Say
 * what they do (track, coach, lessons) and what COYL does (interrupt
 * at decision moment). Factual, not adversarial.
 */
const ROWS = [
  {
    label: 'What you do',
    tracker: 'Log every meal',
    coach: 'Read daily lessons',
    coyl: 'Nothing — until the moment',
  },
  {
    label: 'When it acts',
    tracker: 'After you ate',
    coach: 'Once a day',
    coyl: '30 seconds before you slip',
  },
  {
    label: 'Bad-day handling',
    tracker: 'Streak broken',
    coach: '"Restart Monday"',
    coyl: 'No restart. Continue.',
  },
  {
    label: 'GLP-1 companion',
    tracker: false,
    coach: 'Some',
    coyl: true,
  },
  {
    label: 'Pattern prediction',
    tracker: false,
    coach: false,
    coyl: true,
  },
  {
    label: 'Price (consumer)',
    tracker: '$10–20/mo',
    coach: '$60–137/mo',
    coyl: '$9.99/mo',
  },
]

export function ComparisonTable() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="mb-12 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Vs. the alternatives
        </span>
      </div>

      <h2 className="mb-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
        Not another tracker.<br />
        <span className="text-orange-400">Not another coach.</span>
      </h2>
      <p className="mb-12 max-w-2xl text-lg text-gray-400">
        Calorie trackers tell you what happened. Coaching apps schedule a check-in.
        COYL fires in the 30 seconds you actually decide.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent"
      >
        {/* Header row */}
        <div className="grid grid-cols-4 gap-2 border-b border-white/5 bg-black/40 px-3 py-4 md:px-6">
          <div />
          <ColHeader label="Calorie trackers" sub="MyFitnessPal · Lose It" />
          <ColHeader label="Coaching apps" sub="Noom · Calibrate" />
          <ColHeader label="COYL" featured />
        </div>

        {/* Rows */}
        {ROWS.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-4 gap-2 px-3 py-4 md:px-6 ${
              i % 2 === 1 ? 'bg-white/[0.015]' : ''
            }`}
          >
            <div className="text-xs font-mono uppercase tracking-widest text-gray-500 md:text-sm md:font-semibold md:normal-case md:tracking-tight md:text-gray-400">
              {row.label}
            </div>
            <Cell value={row.tracker} />
            <Cell value={row.coach} />
            <Cell value={row.coyl} featured />
          </div>
        ))}
      </motion.div>

      <p className="mt-6 text-xs text-gray-600">
        Prices verified May 2026. Noom: ~$60/mo subscription + Rx pass-through. Calibrate: $1,649/year (~$137/mo).
        MyFitnessPal Premium: $20/mo. We don&rsquo;t need them to be wrong; we need to be different.
      </p>
    </section>
  )
}

function ColHeader({
  label,
  sub,
  featured = false,
}: {
  label: string
  sub?: string
  featured?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span
        className={`text-sm font-bold ${
          featured ? 'text-orange-400' : 'text-white'
        }`}
      >
        {label}
      </span>
      {sub && <span className="mt-0.5 text-[10px] text-gray-600">{sub}</span>}
    </div>
  )
}

function Cell({
  value,
  featured = false,
}: {
  value: string | boolean
  featured?: boolean
}) {
  if (value === true) {
    return (
      <div className={featured ? 'text-orange-400' : 'text-emerald-400'}>
        <Check className="h-4 w-4" />
      </div>
    )
  }
  if (value === false) {
    return (
      <div className="text-gray-700">
        <X className="h-4 w-4" />
      </div>
    )
  }
  return (
    <span
      className={`text-xs leading-snug md:text-sm ${
        featured ? 'font-bold text-white' : 'text-gray-400'
      }`}
    >
      {value}
    </span>
  )
}
