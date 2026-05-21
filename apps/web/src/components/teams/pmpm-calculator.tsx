'use client'

import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { Users, ArrowRight } from 'lucide-react'

/**
 * <PMPMCalculator /> — public pricing transparency for /teams.
 *
 * Friction reduction. Benefits teams want to model cost BEFORE talking
 * to sales — "Contact us" wastes their time and ours. This component
 * surfaces the real PMPM tiers, lets the buyer slide their headcount,
 * and produces a monthly + annual estimate they can paste into their
 * own deck.
 *
 * Tradeoff acknowledged: publishing PMPM caps the upside on whale
 * negotiations. The decision (correct for current stage): inbound from
 * SMB + mid-market is more valuable than reserve pricing power for
 * 5000-seat enterprise deals we aren't ready for yet.
 *
 * Tiers (mirror the brand-promise PMPM bands from the strategy doc):
 *   10–50 seats   → $7  PMPM
 *   51–250 seats  → $6  PMPM
 *   251–1000      → $5  PMPM
 *   1001+         → custom (display $4 PMPM as the indicative anchor)
 *
 * Annual prepay: 15% discount applied to the same PMPM rate. Lock-in
 * is the secondary commitment-device play described in the strategy doc.
 */

const TIERS = [
  { min: 10, max: 50, pmpm: 7, label: '10–50 seats' },
  { min: 51, max: 250, pmpm: 6, label: '51–250 seats' },
  { min: 251, max: 1000, pmpm: 5, label: '251–1,000 seats' },
  { min: 1001, max: Infinity, pmpm: 4, label: '1,001+ seats (custom)' },
] as const

const ANNUAL_DISCOUNT = 0.15

function tierFor(seats: number): typeof TIERS[number] {
  for (const t of TIERS) {
    if (seats >= t.min && seats <= t.max) return t
  }
  return TIERS[TIERS.length - 1]!
}

function fmtUSD(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function PMPMCalculator() {
  const [seats, setSeats] = useState(100)
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')

  const tier = useMemo(() => tierFor(seats), [seats])
  const monthly = seats * tier.pmpm
  const effectivePmpm = interval === 'annual' ? tier.pmpm * (1 - ANNUAL_DISCOUNT) : tier.pmpm
  const monthlyEffective = seats * effectivePmpm
  const annualTotal = monthlyEffective * 12

  const proposalSubject = encodeURIComponent('Pilot proposal request')
  const proposalBody = encodeURIComponent(
    `Hi COYL team,\n\nLooking at a pilot for ~${seats} employees.\n` +
    `Tier: ${tier.label} at $${tier.pmpm} PMPM.\n` +
    `Estimated ${interval} cost: ${fmtUSD(interval === 'monthly' ? monthlyEffective : annualTotal)}.\n\n` +
    `Org: [company name]\n` +
    `Headcount: ${seats}\n` +
    `Existing wellness vendor: [if any]\n` +
    `Preferred kickoff: [month]\n\n` +
    `Thanks,\n[name]`
  )

  return (
    <section className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-10">
      <div className="mb-2 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
          Estimate your cost
        </span>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
        PMPM pricing, no &ldquo;contact us&rdquo;.
      </h2>
      <p className="mb-8 max-w-2xl text-base text-gray-600">
        Slide to your headcount. The price is the price. Annual prepay
        saves {Math.round(ANNUAL_DISCOUNT * 100)}%. We&rsquo;ll send the
        full proposal pack when you&rsquo;re ready to talk.
      </p>

      {/* Seats input */}
      <div className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">
              Headcount
            </label>
            <div className="mt-1 flex items-baseline gap-2">
              <input
                type="number"
                min={10}
                max={10000}
                value={seats}
                onChange={(e) => {
                  const v = parseInt(e.target.value || '0', 10)
                  if (Number.isFinite(v)) {
                    setSeats(Math.max(10, Math.min(10000, v)))
                  }
                }}
                className="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 text-2xl font-black tabular-nums text-gray-900 focus:border-orange-500/40 focus:outline-none"
              />
              <span className="text-sm text-gray-500">employees</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
              Your tier
            </p>
            <p className="mt-1 text-sm font-bold text-orange-600">{tier.label}</p>
          </div>
        </div>
        <input
          type="range"
          min={10}
          max={2000}
          step={10}
          value={Math.min(seats, 2000)}
          onChange={(e) => setSeats(parseInt(e.target.value, 10))}
          className="w-full accent-orange-500"
          aria-label="Headcount slider"
        />
        <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-widest text-gray-500">
          <span>10</span>
          <span>500</span>
          <span>1,000</span>
          <span>2,000+</span>
        </div>
      </div>

      {/* Interval toggle */}
      <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-white p-1">
        <button
          onClick={() => setInterval('monthly')}
          aria-pressed={interval === 'monthly'}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            interval === 'monthly'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval('annual')}
          aria-pressed={interval === 'annual'}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            interval === 'annual'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Annual
          <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
            − {Math.round(ANNUAL_DISCOUNT * 100)}%
          </span>
        </button>
      </div>

      {/* Output */}
      <motion.div
        key={`${seats}-${interval}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            PMPM rate
          </p>
          <p className="mt-2 text-2xl font-black text-gray-900 tabular-nums">
            ${effectivePmpm.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            per member, per month
            {interval === 'annual' && (
              <span className="text-gray-500"> (annual prepay)</span>
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-orange-300 bg-orange-50 p-5 shadow-[0_0_24px_rgba(255,102,0,0.08)]">
          <p className="text-[10px] font-mono uppercase tracking-widest text-orange-700">
            Monthly cost
          </p>
          <p className="mt-2 text-3xl font-black text-gray-900 tabular-nums">
            {fmtUSD(monthlyEffective)}
          </p>
          <p className="mt-1 text-xs text-gray-700">
            {seats.toLocaleString()} × ${effectivePmpm.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Annual total
          </p>
          <p className="mt-2 text-3xl font-black text-gray-900 tabular-nums">
            {fmtUSD(annualTotal)}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Pilot 30 days free
          </p>
        </div>
      </motion.div>

      {/* Tier table */}
      <div className="mt-8">
        <p className="mb-3 text-[11px] font-mono uppercase tracking-widest text-gray-500">
          Volume tiers
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {TIERS.map((t) => {
            const active = t === tier
            return (
              <div
                key={t.label}
                className={`rounded-xl border px-3 py-3 ${
                  active
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <p className={`text-[10px] font-mono uppercase tracking-widest ${
                  active ? 'text-orange-700' : 'text-gray-500'
                }`}>
                  {t.label}
                </p>
                <p className={`mt-1 text-base font-black tabular-nums ${
                  active ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  ${t.pmpm}/PMPM
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:teams@coyl.ai?subject=${proposalSubject}&body=${proposalBody}`}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          <Users className="h-4 w-4" />
          Get the pilot proposal
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
        <p className="text-xs text-gray-600">
          We respond within 1 business day with the full proposal pack.
        </p>
      </div>
    </section>
  )
}
