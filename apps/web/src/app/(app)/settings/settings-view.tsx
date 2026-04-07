'use client'
import { useState } from 'react'
import type { User } from '@repo/database'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition, StaggerList, StaggerItem, motion } from '@/components/motion/animations'
import { toast } from '@/hooks/use-toast'
import { updateUserSettings } from '@/app/actions/settings'
import { UserButton } from '@clerk/nextjs'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { Bell, Zap, User as UserIcon } from 'lucide-react'

interface SettingsViewProps {
  user: User
}

export function SettingsView({ user }: SettingsViewProps) {
  const [timezone, setTimezone] = useState(user.timezone)
  const [emailBriefing, setEmailBriefing] = useState(user.emailBriefingEnabled)
  const [saving, setSaving] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const isPro = user.planType === 'PRO' || user.planType === 'TEAM'

  async function handleSave() {
    setSaving(true)
    try {
      await updateUserSettings({ timezone, emailBriefingEnabled: emailBriefing })
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition className="relative mx-auto max-w-2xl p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-8">
        <h1 className="heading-1">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <StaggerList className="space-y-6">
        {/* Account */}
        <StaggerItem>
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-xl bg-orange-500/10 p-2">
                <UserIcon className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h3 className="heading-4">Account</h3>
                <p className="text-xs text-muted-foreground">Your profile and plan</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserButton />
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="glass flex items-center gap-3 rounded-xl p-3">
                <Badge variant={isPro ? 'brand' : 'secondary'}>
                  {isPro ? 'Pro' : 'Free'} Plan
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {isPro ? 'Unlimited AI assists' : `${user.aiAssistsUsed ?? 0} / 20 AI assists used this month`}
                </span>
              </div>

              {!isPro && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 shadow-glow-orange/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Upgrade to Pro</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Unlimited AI assists, follow-up escalation, and advanced insights for $12/mo.
                      </p>
                    </div>
                    <Button variant="brand" size="sm" onClick={() => setShowPaywall(true)}>
                      <Zap className="h-3 w-3" /> Upgrade
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </StaggerItem>

        {/* Preferences */}
        <StaggerItem>
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-xl bg-orange-500/10 p-2">
                <Bell className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h3 className="heading-4">Preferences</h3>
                <p className="text-xs text-muted-foreground">Customize how COYL works for you</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Timezone</label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="America/New_York"
                  className="focus-glow"
                />
                <p className="text-xs text-muted-foreground">IANA timezone format. Used for scheduling reminders.</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Daily Email Briefing</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Receive a morning summary of priorities, overdue tasks, and follow-ups
                  </p>
                </div>
                <Toggle checked={emailBriefing} onChange={setEmailBriefing} />
              </div>
            </div>
          </GlassCard>
        </StaggerItem>

        {/* Save */}
        <StaggerItem>
          <div className="flex justify-end">
            <Button variant="brand" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </Button>
          </div>
        </StaggerItem>
      </StaggerList>

      <PaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </PageTransition>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-gradient-warm' : 'bg-muted'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
