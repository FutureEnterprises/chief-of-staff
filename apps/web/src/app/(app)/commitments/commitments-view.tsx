'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion/animations'
import { Shield, Plus, Check, X, CheckCircle2, DollarSign } from 'lucide-react'
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
    <PageTransition className="relative mx-auto max-w-3xl p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="heading-1 flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-500" />
            Commitments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rules you&apos;ve made to yourself. Track them. Keep them.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-warm px-4 py-2 text-sm font-bold text-white shadow-glow-orange"
        >
          <Plus className="h-4 w-4" />
          New commitment
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mb-6 rounded-2xl p-5"
        >
          <label className="text-sm font-semibold">Your rule</label>
          <input
            autoFocus
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            placeholder="e.g. No food after 9 PM"
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-sm focus:shadow-glow-orange"
          />

          <div className="mt-4">
            <label className="text-xs font-semibold text-muted-foreground">Domain</label>
            <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {DOMAINS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDomain(d.value)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-all',
                    domain === d.value
                      ? 'bg-gradient-warm text-white border-transparent'
                      : 'hover:bg-muted'
                  )}
                >
                  <span>{d.emoji}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-muted-foreground">Frequency</label>
            <div className="mt-2 flex gap-1.5">
              {(['DAILY', 'WEEKLY', 'ONE_TIME'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                    frequency === f
                      ? 'bg-gradient-warm text-white border-transparent'
                      : 'hover:bg-muted'
                  )}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-2 text-sm text-muted-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!rule.trim() || saving}
              className="rounded-lg bg-gradient-warm px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create'}
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center text-sm text-muted-foreground">Loading…</div>
      ) : commitments.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-orange-500/50" />
          <h3 className="heading-3">No commitments yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with one rule. Something specific and trackable.
          </p>
        </div>
      ) : (
        <>
          {activeCommitments.length > 0 && (
            <div className="mb-8">
              <h2 className="label-xs mb-3 text-muted-foreground">Active</h2>
              <StaggerList className="space-y-2">
                {activeCommitments.map((c) => {
                  const stake = stakeFor(c.id)
                  const isStaking = stakingCommitmentId === c.id
                  return (
                    <StaggerItem key={c.id}>
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{c.rule}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {emojiFor(c.domain)} {c.domain.toLowerCase()} &middot; {c.frequency.replace('_', ' ').toLowerCase()} &middot;
                              <span className="ml-1 text-emerald-500">{c.keepCount} kept</span>
                              {c.breakCount > 0 && <span className="ml-1 text-red-500">&middot; {c.breakCount} broken</span>}
                              {stake && (
                                <span className="ml-1 text-orange-400">
                                  &middot; ${(stake.amountCents / 100).toFixed(0)} staked → {stake.charityLabel}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleCheck(c.id, true)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                              title="Kept it"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCheck(c.id, false)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                              title="Broke it"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Stake row — visible only when no active stake exists.
                            Three quick-select amounts; on click → POSTs to
                            /api/v1/stakes which authorizes via off_session
                            PaymentIntent on the customer's default card. On
                            "kept" the auth is voided; on "broken" the auth
                            is captured to GiveDirectly. */}
                        {!stake && (
                          <div className="mt-3 border-t border-white/5 pt-3">
                            {!isStaking ? (
                              <button
                                onClick={() => {
                                  setStakingCommitmentId(c.id)
                                  setStakeError(null)
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/[0.06] px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/[0.12]"
                              >
                                <DollarSign className="h-3 w-3" />
                                Add a financial stake
                              </button>
                            ) : (
                              <div>
                                <p className="mb-2 text-[11px] text-muted-foreground">
                                  Choose a stake amount. If you break the rule, the money goes to GiveDirectly. If you keep it, your card is never charged.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[1000, 2500, 5000].map((amt) => (
                                    <button
                                      key={amt}
                                      onClick={() => placeStake(c.id, amt)}
                                      className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_12px_-3px_rgba(255,102,0,0.4)]"
                                    >
                                      Stake ${(amt / 100).toFixed(0)}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => {
                                      setStakingCommitmentId(null)
                                      setStakeError(null)
                                    }}
                                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {stakeError && (
                                  <p className="mt-2 text-[11px] text-red-400">{stakeError}</p>
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
              <h2 className="label-xs mb-3 text-muted-foreground">Past</h2>
              <div className="space-y-2 opacity-60">
                {inactiveCommitments.map((c) => (
                  <div key={c.id} className="glass flex items-center gap-3 rounded-xl p-3">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{c.rule}</p>
                  </div>
                ))}
              </div>
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
