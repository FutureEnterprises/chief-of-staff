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
import { updateUserSettings, updateGlp1Profile } from '@/app/actions/settings'
import { UserButton } from '@clerk/nextjs'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { Bell, Zap, User as UserIcon, Heart, Flame, Syringe, Download, Trash2, AlertTriangle } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

interface SettingsViewProps {
  user: User
}

export function SettingsView({ user }: SettingsViewProps) {
  const [timezone, setTimezone] = useState(user.timezone)
  const [emailBriefing, setEmailBriefing] = useState(user.emailBriefingEnabled)
  const [reminderIntensity, setReminderIntensity] = useState(user.reminderIntensity ?? 'STANDARD')
  const [saving, setSaving] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const isPro = user.planType === 'PRO' || user.planType === 'TEAM'

  async function handleSave() {
    setSaving(true)
    try {
      await updateUserSettings({ timezone, emailBriefingEnabled: emailBriefing, reminderIntensity: reminderIntensity as 'GENTLE' | 'STANDARD' | 'RELENTLESS' })
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
                  {isPro ? '500 Charges / month' : `${user.aiAssistsUsed ?? 0} / 20 Charges used this month`}
                </span>
              </div>

              {!isPro && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 shadow-glow-orange/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Upgrade to Pro</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        500 Charges, follow-up escalation, Beast Mode, and advanced insights for $14.99/mo.
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

              {/* COYL Mode Toggle */}
              <div>
                <p className="mb-1 text-sm font-medium text-foreground">COYL Mode</p>
                <p className="mb-3 text-xs text-muted-foreground">How should COYL talk to you?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReminderIntensity('GENTLE')}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      reminderIntensity === 'GENTLE'
                        ? 'border-orange-500/40 bg-orange-500/10 shadow-glow-orange/20'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      reminderIntensity === 'GENTLE' ? 'bg-orange-500/20 text-orange-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Mentor Mode</p>
                      <p className="text-[10px] text-muted-foreground">Supportive, encouraging</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setReminderIntensity('RELENTLESS')}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      reminderIntensity === 'RELENTLESS'
                        ? 'border-red-500/40 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      reminderIntensity === 'RELENTLESS' ? 'bg-red-500/20 text-red-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Flame className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Beast Mode</p>
                      <p className="text-[10px] text-muted-foreground">Savage, no mercy</p>
                    </div>
                  </button>
                </div>
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

        {/* GLP-1 companion profile — feeds the day-3 interrupt cron and
            unlocks the 90-day relapse-prevention protocol when the user
            comes off the drug. Self-contained section with its own save
            action so it doesn't touch reminder / briefing state. */}
        <StaggerItem>
          <Glp1ProfileCard user={user} />
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

        {/* Danger zone — data export + account deletion. Required by Apple
            App Store guideline 5.1.1(v) (in-app account deletion since
            2022) and GDPR Articles 15 + 17 (right to access + right to
            erasure). Live at /settings is the canonical surface; mobile
            app links to this URL via the existing settings tab. */}
        <StaggerItem>
          <DangerZoneCard />
        </StaggerItem>
      </StaggerList>

      <PaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </PageTransition>
  )
}

/**
 * GLP-1 companion profile card.
 *
 * Lets users self-identify as on Ozempic / Wegovy / Mounjaro / etc, set
 * their injection weekday, and mark themselves off-the-drug. This is the
 * data that drives the day-3 interrupt cron (post-injection hunger
 * return is reliably ~72 hours after the dose for semaglutide /
 * tirzepatide) and unlocks the clinician-shareable summary feature.
 *
 * Self-contained state + save so the user can update without touching
 * the parent settings form.
 */
function Glp1ProfileCard({ user }: { user: User }) {
  // Cast through the User type so we can read the new fields without
  // requiring a global type bump everywhere.
  const u = user as User & {
    glp1Drug?: string | null
    glp1InjectionWeekday?: number | null
    glp1StartedAt?: Date | string | null
    glp1EndedAt?: Date | string | null
  }

  const [drug, setDrug] = useState<string>(u.glp1Drug ?? '')
  const [weekday, setWeekday] = useState<number | ''>(
    typeof u.glp1InjectionWeekday === 'number' ? u.glp1InjectionWeekday : '',
  )
  const [startedAt, setStartedAt] = useState<string>(
    u.glp1StartedAt
      ? new Date(u.glp1StartedAt).toISOString().slice(0, 10)
      : '',
  )
  const [offTheDrug, setOffTheDrug] = useState<boolean>(!!u.glp1EndedAt)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await updateGlp1Profile({
        glp1Drug: drug.trim() ? drug.trim() : null,
        glp1InjectionWeekday: typeof weekday === 'number' ? weekday : null,
        glp1StartedAt: startedAt
          ? new Date(`${startedAt}T00:00:00.000Z`).toISOString()
          : null,
        glp1EndedAt: offTheDrug ? new Date().toISOString() : null,
      })
      toast({
        title: 'GLP-1 profile saved',
        description: drug.trim()
          ? 'COYL will tune interrupts to your injection cycle.'
          : 'GLP-1 profile cleared.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save GLP-1 profile.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-orange-500/10 p-2">
          <Syringe className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <h3 className="heading-4">GLP-1 companion</h3>
          <p className="text-xs text-muted-foreground">
            On Ozempic, Wegovy, Mounjaro, Zepbound, or compounded? Tell COYL so it can time interrupts to your cycle.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Medication
          </label>
          <Input
            value={drug}
            onChange={(e) => setDrug(e.target.value)}
            placeholder="Ozempic / Wegovy / Mounjaro / Zepbound / Compounded / none"
            className="h-10"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Leave blank to remove the GLP-1 profile.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Injection day
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {weekdayLabels.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setWeekday(idx)}
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                  weekday === idx
                    ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                    : 'border-border bg-muted/20 text-muted-foreground hover:border-orange-500/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            COYL fires a day-3 hunger-return interrupt 72 hours after this day, in your local timezone.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Started (optional)
          </label>
          <Input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/10 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">I&rsquo;m off the drug now</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Triggers the 90-day relapse-prevention protocol.
            </p>
          </div>
          <Toggle checked={offTheDrug} onChange={setOffTheDrug} />
        </div>

        <div className="flex justify-end">
          <Button variant="brand" size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save GLP-1 profile'}
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}

/**
 * Danger zone — data export + account deletion.
 *
 * Both required by App Store guideline 5.1.1(v) and GDPR Article 17.
 *
 * Export hits GET /api/v1/user/export — server returns a JSON file as
 * an attachment, browser downloads automatically via the anchor click.
 * No client-side parsing; the user gets a raw JSON dump they can keep,
 * audit, or feed to another tool.
 *
 * Delete hits DELETE /api/v1/user — server cascades to all owned
 * records via Prisma's onDelete: Cascade. Active subscriptions return
 * 409 to force the user to cancel first (we don't auto-cancel because
 * the Stripe-side cancellation has its own UX + clawback rules).
 *
 * Two-step confirmation: a confirm prompt + the literal word "DELETE"
 * typed in. Slow on purpose. The brand promise is "no shame" —
 * accidental account deletion would burn that.
 */
function DangerZoneCard() {
  const clerk = useClerk()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/v1/user/export')
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coyl-data-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: 'Export downloaded',
        description: 'Your data is yours. Always.',
      })
    } catch {
      toast({
        title: 'Export failed',
        description: 'Try again or contact support@coyl.ai',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE') {
      toast({
        title: 'Type DELETE to confirm',
        description: 'Capital letters, exactly.',
        variant: 'destructive',
      })
      return
    }
    setDeleting(true)
    try {
      const res = await fetch('/api/v1/user', { method: 'DELETE' })
      if (res.status === 409) {
        const body = await res.json()
        toast({
          title: 'Cancel subscription first',
          description: body.message ?? 'Cancel your subscription before deleting your account.',
          variant: 'destructive',
        })
        return
      }
      if (!res.ok) throw new Error('delete failed')

      // Account is gone DB-side. Sign out the Clerk session + redirect
      // to home. We don't try to delete the Clerk record itself —
      // re-signup with the same email rebinds via the upsert in
      // ensureUserExists.
      await clerk.signOut({ redirectUrl: '/' })
    } catch {
      toast({
        title: 'Delete failed',
        description: 'Try again or contact support@coyl.ai',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-red-500/10 p-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </div>
        <div>
          <h3 className="heading-4">Your data &middot; danger zone</h3>
          <p className="text-xs text-muted-foreground">
            Your data is yours. Take it with you, or delete it for good.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Export your data</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Single JSON file: profile, commitments, slips, decisions, events. No third parties involved.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Building&hellip;
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Download
              </>
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Delete my account</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Permanent. Removes profile, commitments, slips, all events, all logs. Cannot be undone.
                Cancel any active subscription first.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete my account
                </Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <Input
                    placeholder='Type "DELETE" to confirm'
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="h-9 border-red-500/30"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setConfirmText('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                      onClick={handleDelete}
                      disabled={deleting || confirmText !== 'DELETE'}
                    >
                      {deleting ? 'Deleting…' : 'Permanently delete'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
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
