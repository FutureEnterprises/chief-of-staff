'use client'
/**
 * LUXURY EDITORIAL OVERHAUL — May 2026 (commitments, dark)
 * Refero references applied:
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): editorial restraint,
 *     cream-on-warm-canvas hierarchy, gallery rhythm.
 *   - 067fe2b3-9411-42b9-9ea4-39338344f66d (Liron Moran): serif rules read
 *     as chapter lines, not form values.
 *   - c00d3961-a100-4c22-91fe-75f6e488e579 (Pipe): ONE warm orange action
 *     mark per surface; charcoal interactive panels.
 * Each rule the user holds themselves to gets set in Instrument Serif —
 * it's the literal sentence the operator is keeping or breaking. Treat it
 * like editorial copy, not a database row.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion/animations'
import { Plus, Check, X, CheckCircle2, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

type Commitment = {
  id: string
  rule: string
  domain: string
  frequency: string
  active: boolean
  keepCount: number
  breakCount: number
  lastCheckedAt: string | null
  startedAt: string
}

type Stake = {
  id: string
  amountCents: number
  charityLabel: string
  status: 'active' | 'released' | 'charged' | 'refunded'
  commitment: { id: string } | null
}

const DOMAINS = [
  { value: 'FOOD', label: 'Food', emoji: '🍽️' },
  { value: 'EXERCISE', label: 'Exercise', emoji: '💪' },
  { value: 'CRAVING', label: 'Craving', emoji: '🔥' },
  { value: 'SLEEP', label: 'Sleep', emoji: '🌙' },
  { value: 'SPENDING', label: 'Spending', emoji: '💳' },
  { value: 'FOCUS', label: 'Focus', emoji: '🎯' },
  { value: 'DIGITAL', label: 'Digital', emoji: '📱' },
  { value: 'RELATIONSHIP', label: 'Relationship', emoji: '💬' },
  { value: 'OTHER', label: 'Other', emoji: '✨' },
]

export function CommitmentsView() {
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [stakes, setStakes] = useState<Stake[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rule, setRule] = useState('')
  const [domain, setDomain] = useState('OTHER')
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'ONE_TIME'>('DAILY')
  const [saving, setSaving] = useState(false)
  const [stakingCommitmentId, setStakingCommitmentId] = useState<string | null>(null)
  const [stakeError, setStakeError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/v1/commitments'),
        fetch('/api/v1/stakes'),
      ])
      const cData = await cRes.json()
      setCommitments(cData.commitments ?? [])
      if (sRes.ok) {
        const sData = await sRes.json()
        setStakes(sData.stakes ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  async function placeStake(commitmentId: string, amountCents: number) {
    setStakeError(null)
    try {
      const res = await fetch('/api/v1/stakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, commitmentId, charityLabel: 'GiveDirectly' }),
      })

      // 402 with clientSecret = SCA / 3DS challenge required. Hand off
      // to Stripe.js to render the bank challenge modal, then retry
      // the stake endpoint once confirmed.
      if (res.status === 402) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string
          clientSecret?: string
          message?: string
        }
        if (body.error === 'sca_required' && body.clientSecret) {
          const ok = await handleScaChallenge(body.clientSecret)
          if (!ok) {
            setStakeError('Authentication failed or cancelled')
            return
          }
          // Retry the stake — the card is now "known good"
          return placeStake(commitmentId, amountCents)
        }
        setStakeError(body.message ?? body.error ?? 'Could not place stake')
        return
      }

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        setStakeError(err.error ?? 'Could not place stake')
        return
      }
      setStakingCommitmentId(null)
      await load()
    } catch {
      setStakeError('Network error — try again')
    }
  }

  /**
   * Run the Stripe.js 3DS challenge for an SCA-required payment intent.
   * Lazy-loads @stripe/stripe-js so the bundle stays clean for users
   * who never stake. Returns true on successful authentication.
   */
  async function handleScaChallenge(clientSecret: string): Promise<boolean> {
    try {
      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
      )
      if (!stripe) return false

      const result = await stripe.handleNextAction({ clientSecret })
      if (result.error) {
        console.warn('3DS challenge failed', result.error.message)
        return false
      }
      return result.paymentIntent?.status === 'requires_capture' ||
             result.paymentIntent?.status === 'succeeded'
    } catch (err) {
      console.warn('SCA challenge error', err)
      return false
    }
  }

  function stakeFor(commitmentId: string): Stake | undefined {
    return stakes.find((s) => s.commitment?.id === commitmentId && s.status === 'active')
  }

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate() {
    if (!rule.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: rule.trim(), domain, frequency }),
      })
      if (res.ok) {
        setRule('')
        setShowForm(false)
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleCheck(commitmentId: string, kept: boolean) {
    await fetch('/api/v1/commitments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commitmentId, kept }),
    })
    await load()
  }

  const activeCommitments = commitments.filter((c) => c.active)
  const inactiveCommitments = commitments.filter((c) => !c.active)

  return (
    <PageTransition className="relative mx-auto max-w-3xl px-6 py-10 sm:py-12">
      {/* Warm restraint glow — single ambient orange wash, top-right. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(700px at 90% -10%, rgba(255,102,0,0.06), transparent 65%)',
        }}
      />

      <header className="mb-12 flex items-end justify-between border-b border-white/[0.05] pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500/70" />
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
              Commitments
            </p>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-normal leading-[1.04] tracking-[-0.015em] text-[#f5f3ee] sm:text-5xl">
            Rules you made to yourself.
          </h1>
          <p className="mt-3 max-w-lg font-sans text-[14px] leading-relaxed text-[#a39d92]">
            Track them. Keep them. Each is a sentence you&rsquo;re either holding or letting go of.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="hidden shrink-0 items-center gap-2 border-b border-orange-500/40 pb-1 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-400 transition-colors hover:border-orange-500 hover:text-orange-300 sm:inline-flex"
        >
          <Plus className="h-3 w-3" />
          New commitment
        </button>
      </header>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-8 inline-flex items-center gap-2 border-b border-orange-500/40 pb-1 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-400 transition-colors hover:border-orange-500 hover:text-orange-300 sm:hidden"
      >
        <Plus className="h-3 w-3" />
        New commitment
      </button>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 border-y border-white/[0.05] py-8"
        >
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
            Write the rule
          </p>
          <input
            autoFocus
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            placeholder="No food after 9 PM."
            className="w-full border-0 bg-transparent p-0 font-serif text-2xl font-normal leading-snug tracking-[-0.01em] text-[#f5f3ee] outline-none placeholder:text-[#5f5a52] placeholder:italic sm:text-3xl"
          />

          <div className="mt-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
              Domain
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {DOMAINS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDomain(d.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
                    domain === d.value
                      ? 'border-orange-500/60 bg-orange-500/[0.08] text-orange-300'
                      : 'border-white/[0.08] bg-[#0e0d0b] text-[#a39d92] hover:border-white/[0.18] hover:text-[#f5f3ee]',
                  )}
                >
                  <span>{d.emoji}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
              Frequency
            </p>
            <div className="flex gap-1.5">
              {(['DAILY', 'WEEKLY', 'ONE_TIME'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={cn(
                    'border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                    frequency === f
                      ? 'border-orange-500/60 bg-orange-500/[0.08] text-orange-300'
                      : 'border-white/[0.08] bg-[#0e0d0b] text-[#a39d92] hover:border-white/[0.18] hover:text-[#f5f3ee]',
                  )}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => setShowForm(false)}
              className="font-mono text-[11px] uppercase tracking-[0.20em] text-[#8a847a] transition-colors hover:text-[#f5f3ee]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!rule.trim() || saving}
              className="inline-flex items-center gap-2 border-b border-orange-500/60 pb-1 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-300 transition-colors hover:border-orange-500 hover:text-orange-200 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Create rule →'}
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <p className="border-y border-white/[0.05] py-16 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
          Loading&hellip;
        </p>
      ) : commitments.length === 0 ? (
        <div className="border-y border-white/[0.05] py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
            Nothing here yet
          </p>
          <p className="mx-auto mt-4 max-w-md font-serif text-3xl font-normal leading-[1.1] tracking-[-0.012em] text-[#f5f3ee] sm:text-4xl">
            Start with one rule. Something specific, something trackable.
          </p>
        </div>
      ) : (
        <>
          {activeCommitments.length > 0 && (
            <div className="mb-12">
              <div className="mb-5 flex items-baseline justify-between border-b border-white/[0.05] pb-3">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
                  Active
                </h2>
                <span className="font-mono text-[10px] tabular-nums text-[#8a847a]">
                  {String(activeCommitments.length).padStart(2, '0')}
                </span>
              </div>
              <StaggerList className="divide-y divide-white/[0.05]">
                {activeCommitments.map((c) => {
                  const stake = stakeFor(c.id)
                  const isStaking = stakingCommitmentId === c.id
                  return (
                    <StaggerItem key={c.id}>
                      <div className="py-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-serif text-2xl font-normal leading-snug tracking-[-0.01em] text-[#f5f3ee]">
                              {c.rule}
                            </p>
                            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#8a847a]">
                              <span>{emojiFor(c.domain)} {c.domain.toLowerCase()}</span>
                              <span className="mx-2 text-[#5f5a52]">/</span>
                              <span>{c.frequency.replace('_', ' ').toLowerCase()}</span>
                              <span className="mx-2 text-[#5f5a52]">/</span>
                              <span className="text-emerald-400/80">{c.keepCount} kept</span>
                              {c.breakCount > 0 && (
                                <>
                                  <span className="mx-2 text-[#5f5a52]">/</span>
                                  <span className="text-red-400/80">{c.breakCount} broken</span>
                                </>
                              )}
                              {stake && (
                                <>
                                  <span className="mx-2 text-[#5f5a52]">/</span>
                                  <span className="text-orange-400">
                                    ${(stake.amountCents / 100).toFixed(0)} staked &rarr; {stake.charityLabel}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleCheck(c.id, true)}
                              className="flex h-9 w-9 items-center justify-center border border-emerald-500/30 text-emerald-400/90 transition-colors hover:bg-emerald-500/[0.08]"
                              title="Kept it"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCheck(c.id, false)}
                              className="flex h-9 w-9 items-center justify-center border border-red-500/30 text-red-400/90 transition-colors hover:bg-red-500/[0.08]"
                              title="Broke it"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {!stake && (
                          <div className="mt-5 border-t border-white/[0.04] pt-4">
                            {!isStaking ? (
                              <button
                                onClick={() => {
                                  setStakingCommitmentId(c.id)
                                  setStakeError(null)
                                }}
                                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-400 transition-colors hover:text-orange-300"
                              >
                                <DollarSign className="h-3 w-3" />
                                Add a financial stake
                              </button>
                            ) : (
                              <div>
                                <p className="mb-3 font-sans text-[13px] leading-relaxed text-[#a39d92]">
                                  Pick a stake. Break the rule &rarr; the money goes to GiveDirectly. Keep it &rarr; your card is never charged.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[1000, 2500, 5000].map((amt) => (
                                    <button
                                      key={amt}
                                      onClick={() => placeStake(c.id, amt)}
                                      className="border border-orange-500/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-300 transition-colors hover:bg-orange-500/[0.10]"
                                    >
                                      Stake ${(amt / 100).toFixed(0)}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => {
                                      setStakingCommitmentId(null)
                                      setStakeError(null)
                                    }}
                                    className="font-mono text-[11px] uppercase tracking-[0.20em] text-[#8a847a] transition-colors hover:text-[#f5f3ee]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {stakeError && (
                                  <p className="mt-2 font-mono text-[11px] text-red-400">{stakeError}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </StaggerItem>
                  )
                })}
              </StaggerList>
            </div>
          )}

          {inactiveCommitments.length > 0 && (
            <div>
              <div className="mb-5 flex items-baseline justify-between border-b border-white/[0.05] pb-3">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
                  Past
                </h2>
                <span className="font-mono text-[10px] tabular-nums text-[#8a847a]">
                  {String(inactiveCommitments.length).padStart(2, '0')}
                </span>
              </div>
              <ul className="divide-y divide-white/[0.04]">
                {inactiveCommitments.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3 opacity-60">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#8a847a]" />
                    <p className="font-serif text-base italic text-[#a39d92]">{c.rule}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </PageTransition>
  )
}

function emojiFor(domain: string) {
  return DOMAINS.find((d) => d.value === domain)?.emoji ?? '✨'
}
