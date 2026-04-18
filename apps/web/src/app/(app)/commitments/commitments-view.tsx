'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion/animations'
import { Shield, Plus, Check, X, CheckCircle2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rule, setRule] = useState('')
  const [domain, setDomain] = useState('OTHER')
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'ONE_TIME'>('DAILY')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/commitments')
      const data = await res.json()
      setCommitments(data.commitments ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

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
                {activeCommitments.map((c) => (
                  <StaggerItem key={c.id}>
                    <div className="glass flex items-center justify-between rounded-xl p-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{c.rule}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {emojiFor(c.domain)} {c.domain.toLowerCase()} &middot; {c.frequency.replace('_', ' ').toLowerCase()} &middot;
                          <span className="ml-1 text-emerald-500">{c.keepCount} kept</span>
                          {c.breakCount > 0 && <span className="ml-1 text-red-500">&middot; {c.breakCount} broken</span>}
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
                  </StaggerItem>
                ))}
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
