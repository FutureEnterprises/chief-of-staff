'use client'

import { motion } from 'motion/react'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition, StaggerList, StaggerItem, AnimatedCounter } from '@/components/motion/animations'
import { ShareButton } from '@/components/share/share-card'
import { Flame, Clock, AlertTriangle, Activity, Eye, Shield } from 'lucide-react'

const EXCUSE_LABELS: Record<string, { label: string; emoji: string }> = {
  DELAY: { label: 'Delay', emoji: '🐌' },
  REWARD: { label: 'Reward', emoji: '🎁' },
  MINIMIZATION: { label: 'Minimization', emoji: '🤏' },
  COLLAPSE: { label: 'Collapse', emoji: '💥' },
  EXHAUSTION: { label: 'Exhaustion', emoji: '😴' },
  EXCEPTION: { label: 'Exception', emoji: '📌' },
  COMPENSATION: { label: 'Compensation', emoji: '⚖️' },
  SOCIAL_PRESSURE: { label: 'Social pressure', emoji: '👥' },
}

const IDENTITY_STATES: Record<string, { label: string; color: string }> = {
  SLEEPWALKING: { label: 'Sleepwalking', color: 'text-gray-400' },
  AVOIDANT: { label: 'Avoidant', color: 'text-red-400' },
  RECOVERING: { label: 'Recovering', color: 'text-orange-400' },
  UNSTABLE_BUT_TRYING: { label: 'Unstable but trying', color: 'text-yellow-400' },
  INCREASINGLY_CONSCIOUS: { label: 'Increasingly conscious', color: 'text-blue-400' },
  RESILIENT: { label: 'Resilient', color: 'text-emerald-400' },
  DISCIPLINED: { label: 'Disciplined', color: 'text-emerald-500' },
  HIGH_SELF_TRUST: { label: 'High self-trust', color: 'text-emerald-500' },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface PatternsViewProps {
  userId: string
  userName: string
  selfTrustScore: number
  executionScore: number
  currentStreak: number
  longestStreak: number
  identityState: string
  recoveryState: string
  excusesByCategory: Array<{ category: string; count: number }>
  dangerWindows: Array<{ id: string; label: string; dayOfWeek: number; startHour: number; endHour: number; triggerType: string | null }>
  recentSlips: Array<{ id: string; trigger: string | null; createdAt: string; recoveredAt: string | null }>
  rescueSessions: Array<{ id: string; trigger: string; outcome: string; startedAt: string }>
  completedLast7Days: number
  completedLast30Days: number
  openTasks: number
  overdueTasks: number
  tasksByPriority: Array<{ priority: string; count: number }>
}

export function PatternsView({
  userId, userName,
  selfTrustScore, currentStreak, longestStreak,
  identityState, recoveryState,
  excusesByCategory, dangerWindows, recentSlips, rescueSessions,
  completedLast7Days, completedLast30Days, openTasks, overdueTasks,
}: PatternsViewProps) {
  const maxExcuse = Math.max(...excusesByCategory.map((e) => e.count), 1)
  const identity = IDENTITY_STATES[identityState] ?? IDENTITY_STATES.SLEEPWALKING!
  const rescuesInterrupted = rescueSessions.filter((r) => r.outcome === 'INTERRUPTED').length
  const rescuesTotal = rescueSessions.length
  const rescueRate = rescuesTotal > 0 ? Math.round((rescuesInterrupted / rescuesTotal) * 100) : 0
  const slipsRecovered = recentSlips.filter((s) => s.recoveredAt).length
  const slipRecoveryRate = recentSlips.length > 0 ? Math.round((slipsRecovered / recentSlips.length) * 100) : 100

  return (
    <PageTransition className="relative mx-auto max-w-5xl p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="heading-1 flex items-center gap-2">
            <Eye className="h-6 w-6 text-orange-500" />
            Patterns
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your autopilot map. The scripts you run. The excuses you use.
          </p>
        </div>
        <ShareButton userId={userId} executionScore={selfTrustScore} currentStreak={currentStreak} userName={userName} />
      </div>

      {/* Self-trust + Identity hero row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassCard variant="orange-glow">
          <p className="label-xs mb-2 text-orange-500">Self-Trust Score</p>
          <div className="flex items-baseline gap-1">
            <AnimatedCounter value={selfTrustScore} className="text-5xl font-black tabular-nums text-foreground" />
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
        </GlassCard>
        <GlassCard>
          <p className="label-xs mb-2 text-muted-foreground">Identity State</p>
          <p className={`text-xl font-bold ${identity.color}`}>{identity.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">Recovery: {recoveryState.toLowerCase()}</p>
        </GlassCard>
        <GlassCard>
          <p className="label-xs mb-2 text-muted-foreground">Streak</p>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-3xl font-black tabular-nums">{currentStreak}</span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Longest: {longestStreak} days</p>
        </GlassCard>
      </motion.div>

      {/* Stats grid */}
      <StaggerList className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Activity, label: 'Rescues interrupted', value: `${rescueRate}%`, sub: `${rescuesInterrupted}/${rescuesTotal}` },
          { icon: Shield, label: 'Slips recovered', value: `${slipRecoveryRate}%`, sub: `${slipsRecovered}/${recentSlips.length}` },
          { icon: Clock, label: 'Done this week', value: completedLast7Days, sub: `${completedLast30Days} / 30d` },
          { icon: AlertTriangle, label: 'Overdue', value: overdueTasks, sub: `${openTasks} open` },
        ].map((s, i) => (
          <StaggerItem key={i}>
            <GlassCard hover>
              <div className="mb-2 inline-flex rounded-xl bg-orange-500/10 p-2 text-orange-500">
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="label-xs mt-1 text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{s.sub}</p>
            </GlassCard>
          </StaggerItem>
        ))}
      </StaggerList>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Excuse heatmap */}
        <GlassCard>
          <h3 className="heading-4 mb-4">Top excuses (30 days)</h3>
          {excusesByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">No excuses logged yet. Either you&apos;re doing great or COYL hasn&apos;t seen enough yet.</p>
          ) : (
            <div className="space-y-3">
              {excusesByCategory
                .sort((a, b) => b.count - a.count)
                .map((e) => {
                  const info = EXCUSE_LABELS[e.category] ?? { label: e.category, emoji: '❓' }
                  const pct = Math.round((e.count / maxExcuse) * 100)
                  return (
                    <div key={e.category}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {info.emoji} {info.label}
                        </span>
                        <span className="text-muted-foreground">{e.count}×</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-gradient-warm"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </GlassCard>

        {/* Danger windows */}
        <GlassCard>
          <h3 className="heading-4 mb-4">Danger windows</h3>
          {dangerWindows.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">
              No danger windows mapped yet. Set them up in onboarding or Settings.
            </p>
          ) : (
            <div className="space-y-2">
              {dangerWindows.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                  <div>
                    <p className="text-sm font-semibold">{w.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {w.dayOfWeek === -1 ? 'Every day' : DAYS[w.dayOfWeek]} &middot; {String(w.startHour).padStart(2, '0')}:00–{String(w.endHour).padStart(2, '0')}:00
                      {w.triggerType ? ` · ${w.triggerType}` : ''}
                    </p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent slips */}
        <GlassCard className="md:col-span-2">
          <h3 className="heading-4 mb-4">Recent slips</h3>
          {recentSlips.length === 0 ? (
            <p className="text-sm text-emerald-500">No slips this month. That&apos;s real.</p>
          ) : (
            <div className="space-y-2">
              {recentSlips.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <div>
                    <p className="text-sm">{s.trigger ?? 'Slip'}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                  {s.recoveredAt ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                      Recovered
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Open
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </PageTransition>
  )
}
