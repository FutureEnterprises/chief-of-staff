'use client'
import { useState } from 'react'
import type { User } from '@repo/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/ui/motion-button'
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
    <PageTransition className="mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your account and preferences</p>
      </div>

      <StaggerList className="space-y-6">
        {/* Account card */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-zinc-100 p-1.5 dark:bg-zinc-800">
                  <UserIcon className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Account</CardTitle>
                  <CardDescription>Your profile and plan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <UserButton />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <Badge variant={isPro ? 'default' : 'secondary'} className={isPro ? 'bg-teal-600' : ''}>
                  {isPro ? 'Pro' : 'Free'} Plan
                </Badge>
                {!isPro && (
                  <span className="text-xs text-zinc-400">
                    {user.aiAssistsUsed ?? 0} / 20 AI assists used this month
                  </span>
                )}
                {isPro && (
                  <span className="text-xs text-zinc-500">Unlimited AI assists</span>
                )}
              </div>

              {!isPro && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                        Upgrade to Pro
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-500">
                        Unlimited AI assists, follow-up escalation, and advanced insights for $12/mo.
                      </p>
                    </div>
                    <MotionButton
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
                      onClick={() => setShowPaywall(true)}
                    >
                      <Zap className="h-3 w-3" />
                      Upgrade
                    </MotionButton>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Preferences card */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-zinc-100 p-1.5 dark:bg-zinc-800">
                  <Bell className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Preferences</CardTitle>
                  <CardDescription>Customize how COYL works for you</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Timezone
                </label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="America/New_York"
                />
                <p className="text-xs text-zinc-400">
                  IANA timezone format. Used for scheduling reminders and date calculations.
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Daily Email Briefing
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Receive a morning summary of priorities, overdue tasks, and follow-ups
                  </p>
                </div>
                <Toggle checked={emailBriefing} onChange={setEmailBriefing} />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Save button */}
        <StaggerItem>
          <div className="flex justify-end">
            <MotionButton onClick={handleSave} loading={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </MotionButton>
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-teal-500' : 'bg-zinc-200 dark:bg-zinc-700'
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
