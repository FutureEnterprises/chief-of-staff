'use client'
/**
 * LUXURY EDITORIAL OVERHAUL — May 2026 (settings, dark)
 * Refero references applied:
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): editorial restraint
 *     on a dense, functional surface. Serif on section headers only.
 *   - c00d3961-a100-4c22-91fe-75f6e488e579 (Pipe): ONE orange touchpoint
 *     per section (the section icon dot). Functional UI stays operator-grade.
 *   - 067fe2b3-9411-42b9-9ea4-39338344f66d (Liron Moran): warm charcoal
 *     canvas underneath the existing GlassCard sections.
 * Settings keeps its functional density (toggles + inputs unchanged), but
 * the page-level chrome, section headers, and h1 read editorial.
 */
import { useState } from 'react'
import type { User } from '@repo/database'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition, StaggerList, StaggerItem, motion } from '@/components/motion/animations'
import { toast } from '@/hooks/use-toast'
import { updateUserSettings, updateGlp1Profile, updateNotificationPrefs, updateDriveProfile } from '@/app/actions/settings'
import { UserButton } from '@clerk/nextjs'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { Bell, Zap, User as UserIcon, Heart, Flame, Syringe, Download, Trash2, AlertTriangle, X } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { GiftCoylCard } from '@/components/referral/gift-card'
import { CheckinsCard } from './checkins-card'
import { TeamsCard } from './teams-card'

interface SettingsViewProps {
  user: User
}

export function SettingsView({ user }: SettingsViewProps) {
  const [timezone, setTimezone] = useState(user.timezone)
  const [emailBriefing, setEmailBriefing] = useState(user.emailBriefingEnabled)
  const [reminderIntensity, setReminderIntensity] = useState(user.reminderIntensity ?? 'STANDARD')
  const [shareCardEnabled, setShareCardEnabled] = useState(user.shareCardEnabled)
  const [saving, setSaving] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const isPro = user.planType === 'PRO' || user.planType === 'TEAM'

  async function handleSave() {
    setSaving(true)
    try {
      await updateUserSettings({
        timezone,
        emailBriefingEnabled: emailBriefing,
        reminderIntensity: reminderIntensity as 'GENTLE' | 'STANDARD' | 'RELENTLESS',
        shareCardEnabled,
      })
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition className="relative mx-auto max-w-2xl px-6 py-10 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(700px at 90% -10%, rgba(255,102,0,0.06), transparent 65%)',
        }}
      />

      <header className="mb-12 border-b border-white/[0.05] pb-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-orange-500/70" />
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
            Settings
          </p>
        </div>
        <h1 className="mt-4 font-serif text-4xl font-normal leading-[1.05] tracking-[-0.015em] text-[#f5f3ee] sm:text-5xl">
          Account, voice, &amp; consent.
        </h1>
        <p className="mt-3 max-w-lg font-sans text-[14px] leading-relaxed text-[#a39d92]">
          How COYL talks to you, what it can interrupt, and the data it holds on your behalf.
        </p>
      </header>

      <StaggerList className="space-y-6">
        {/* Account */}
        <StaggerItem>
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-xl bg-orange-500/10 p-2">
                <UserIcon className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-normal leading-tight tracking-[-0.012em] text-[#f5f3ee]">Account</h3>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[#8a847a]">Profile &amp; plan</p>
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
                <h3 className="font-serif text-2xl font-normal leading-tight tracking-[-0.012em] text-[#f5f3ee]">Preferences</h3>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[#8a847a]">How COYL works for you</p>
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

              <Separator />

              {/* Share-card opt-in. Default OFF on every account. When on,
                  GET /api/share/[userId] returns a 1200×630 OG image with
                  the user's first name + execution score + streak + wedge.
                  When off, the endpoint 404s — used to make every previously
                  shared link in the wild stop revealing data until the user
                  explicitly opts in. Audit: see commit 6be9235 + the
                  20260522020000_share_card_enabled migration. */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Share cards</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Allow COYL to render OG share images with your first name, execution score, and streak.
                    Off by default — the public /api/share endpoint returns 404 until you enable it.
                  </p>
                </div>
                <Toggle checked={shareCardEnabled} onChange={setShareCardEnabled} />
              </div>
            </div>
          </GlassCard>
        </StaggerItem>

        {/* Per-interrupt opt-out + quiet hours. Lives between the basic
            settings card and the GLP-1 card because consent over what
            fires when is a higher-order concern than profile data. The
            transparency promise from /pricing + /science: opt-in, easy
            to disable, never marketing. */}
        <StaggerItem>
          <NotificationPrefsCard user={user} />
        </StaggerItem>

        {/* User-defined recurring check-ins (CheckinSchedule table).
            Sits next to NotificationPrefs because both are
            consent-shaped "how do you want me to reach you" surfaces,
            but check-ins are USER-AUTHORED cadences, not platform-
            authored interrupts. Read/write hits /api/v1/checkin-
            schedules. Cron fires from /api/cron/custom-checkins. */}
        <StaggerItem>
          <CheckinsCard />
        </StaggerItem>

        {/* Microsoft Teams integration. Sits next to CheckinsCard
            because both are user-authored "how do you want me to reach
            you" surfaces. Renders a graceful placeholder when the Graph
            integration isn't yet deployed (the agent shipping it
            concurrently is wiring up /api/v1/teams/auth/* endpoints —
            until those land, the card's auth/status fetch falls back
            to a "coming with next deploy" message). Behind the
            placeholder: 4 archetype-aware interrupt classes (Focus
            Defender, Follow-Through Pinger, Meeting Decliner, Recovery
            Coach) and per-class opt-out. */}
        <StaggerItem>
          <TeamsCard />
        </StaggerItem>

        {/* Drive profile + personalized replacement menu. Per
            product-roadmap v3 §"Gap 2": the rescue AI uses this to
            swap generic redirects for the user's pre-approved
            replacements. Highest-leverage retention fix in the app. */}
        <StaggerItem>
          <DriveProfileCard user={user} />
        </StaggerItem>

        {/* Gift COYL — give-a-month-get-a-month referral. Placed after
            notification prefs (consent-shaped surface) and before the
            GLP-1 card (profile data) so the share moment lands near
            the value-prop moment in scroll order. */}
        <StaggerItem>
          <GiftCoylCard />
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
          <h3 className="font-serif text-2xl font-normal leading-tight tracking-[-0.012em] text-[#f5f3ee]">GLP-1 companion</h3>
          <p className="mt-1 font-sans text-[12px] leading-relaxed text-[#a39d92]">
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
 * Notification preferences — per-class opt-out + quiet hours.
 *
 * Three booleans (one per interrupt cron) + two hour pickers. Saves
 * directly via updateNotificationPrefs (no batching with the basic
 * settings save — different concern, different cadence). Defaults match
 * the policy in lib/notification-prefs.ts: every class on, no quiet hours.
 *
 * Transparency note: the card shows the user EXACTLY which interrupt
 * cron fires when. This is the consent-architecture surface — opt-in
 * by default, but the user can see what's running and turn each off.
 */
function NotificationPrefsCard({ user }: { user: User }) {
  const initialPrefs = (user.notificationPrefs ?? null) as null | {
    dangerWindow?: boolean
    glp1Day3?: boolean
    postSlip?: boolean
    quietHoursStart?: number | null
    quietHoursEnd?: number | null
  }
  const [dangerWindow, setDangerWindow] = useState(initialPrefs?.dangerWindow !== false)
  const [glp1Day3, setGlp1Day3] = useState(initialPrefs?.glp1Day3 !== false)
  const [postSlip, setPostSlip] = useState(initialPrefs?.postSlip !== false)
  const [quietStart, setQuietStart] = useState<number | null>(initialPrefs?.quietHoursStart ?? null)
  const [quietEnd, setQuietEnd] = useState<number | null>(initialPrefs?.quietHoursEnd ?? null)
  const [savingPrefs, setSavingPrefs] = useState(false)

  async function save() {
    setSavingPrefs(true)
    try {
      await updateNotificationPrefs({
        dangerWindow,
        glp1Day3,
        postSlip,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
      })
      toast({ title: 'Saved', description: 'Interrupt preferences updated.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to update preferences.', variant: 'destructive' })
    } finally {
      setSavingPrefs(false)
    }
  }

  const hourOptions = [
    { value: '', label: 'None' },
    ...Array.from({ length: 24 }, (_, h) => ({
      value: String(h),
      label: formatHour12(h),
    })),
  ]

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-orange-500" />
        <h3 className="text-base font-semibold">Interrupt preferences</h3>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        Decide which interrupts can fire and when. Every channel is on by default; turn each off if it&rsquo;s not your moment. Easy to re-enable later.
      </p>

      <div className="space-y-3">
        <PrefToggle
          label="Danger window push"
          description="Fires when you&rsquo;re inside one of your mapped risk windows (every 15 min check)."
          enabled={dangerWindow}
          onChange={setDangerWindow}
        />
        <PrefToggle
          label="GLP-1 day-3 push"
          description="Only if your GLP-1 profile is set. Fires day-3 after injection between 5&ndash;9 PM local."
          enabled={glp1Day3}
          onChange={setGlp1Day3}
        />
        <PrefToggle
          label="Post-slip recovery push"
          description="Fires 2 hours and 24 hours after you log a slip. The window where the spiral writes itself."
          enabled={postSlip}
          onChange={setPostSlip}
        />
      </div>

      <Separator className="my-5" />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quiet hours
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          No interrupts during this window. Leave both at &ldquo;None&rdquo; for no quiet hours. End time can wrap past midnight (e.g. 10 PM &rarr; 7 AM).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">From</label>
            <select
              value={quietStart == null ? '' : String(quietStart)}
              onChange={(e) => setQuietStart(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-orange-500/40 focus:outline-none"
            >
              {hourOptions.map((o) => (
                <option key={o.value || 'none-start'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Until</label>
            <select
              value={quietEnd == null ? '' : String(quietEnd)}
              onChange={(e) => setQuietEnd(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-orange-500/40 focus:outline-none"
            >
              {hourOptions.map((o) => (
                <option key={o.value || 'none-end'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="brand" onClick={save} disabled={savingPrefs}>
          {savingPrefs ? 'Saving...' : 'Save preferences'}
        </Button>
      </div>
    </GlassCard>
  )
}

function PrefToggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string
  description: React.ReactNode
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      type="button"
      className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        enabled
          ? 'border-orange-500/30 bg-orange-500/[0.05]'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <span
        className={`mt-1 flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          enabled ? 'bg-orange-500' : 'bg-white/10'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

function formatHour12(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

/**
 * <DriveProfileCard /> — the personalized replacement library.
 *
 * Per product-roadmap v3 §"Gap 2 — Replacement Problem":
 * cue → routine → reward is biological. Generic "drink water + walk 5
 * min" advice doesn't satisfy the cortisol+craving loop. The rescue
 * AI prompts now read this profile and pick a specific
 * pre-approved replacement instead of generic advice.
 *
 * UX: user picks a drive profile (COMFORT / STIMULATION / RELIEF) then
 * curates 3–8 replacement items they actually believe in. The label is
 * a free-text 80-char string; the drive tag binds it to a need
 * profile; est_minutes helps the AI calibrate its suggestion to time
 * available.
 *
 * Honest framing in the UI: "The trick to interrupting an autopilot
 * script is having a SPECIFIC alternative your brain accepts. Build
 * yours below. The rescue flow uses this list."
 */
function DriveProfileCard({ user }: { user: User }) {
  const initialProfile = (user.driveProfile ?? null) as 'COMFORT' | 'STIMULATION' | 'RELIEF' | null
  const initialMenu = (user.replacementMenu ?? []) as Array<{
    label: string
    drive: string
    est_minutes?: number
  }>

  const [driveProfile, setDriveProfile] = useState<'COMFORT' | 'STIMULATION' | 'RELIEF' | null>(initialProfile)
  const [menu, setMenu] = useState(initialMenu)
  const [newLabel, setNewLabel] = useState('')
  const [newDrive, setNewDrive] = useState<'COMFORT' | 'STIMULATION' | 'RELIEF'>(initialProfile ?? 'COMFORT')
  const [newMinutes, setNewMinutes] = useState(5)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await updateDriveProfile({ driveProfile, replacementMenu: menu })
      toast({ title: 'Saved', description: 'Your replacement menu is wired into rescue.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save replacement menu.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function addItem() {
    const clean = newLabel.trim()
    if (!clean) return
    if (menu.length >= 8) {
      toast({ title: 'Maximum 8 items', description: 'Pick your top 8. More dilutes the AI signal.' })
      return
    }
    setMenu([...menu, { label: clean.slice(0, 80), drive: newDrive, est_minutes: newMinutes }])
    setNewLabel('')
  }

  function removeAt(i: number) {
    setMenu(menu.filter((_, idx) => idx !== i))
  }

  const driveOptions: Array<{
    value: 'COMFORT' | 'STIMULATION' | 'RELIEF'
    label: string
    description: string
  }> = [
    { value: 'COMFORT',     label: 'Comfort-seeker',     description: 'Warmth, safety, soothing.' },
    { value: 'STIMULATION', label: 'Stimulation-seeker', description: 'Novelty, dopamine, connection.' },
    { value: 'RELIEF',      label: 'Relief-seeker',      description: 'Boredom relief, mental break.' },
  ]

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-4 w-4 text-orange-500" />
        <h3 className="text-base font-semibold">Replacement menu</h3>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        Generic "drink water + walk 5 min" doesn&rsquo;t satisfy the craving loop. Build your specific list of replacements you actually believe in. The rescue flow uses this menu &mdash; not generic advice.
      </p>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          What is your autopilot usually after?
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {driveOptions.map((o) => {
            const active = driveProfile === o.value
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => setDriveProfile(o.value)}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  active
                    ? 'border-orange-500/40 bg-orange-500/[0.06]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{o.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{o.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      <Separator className="my-5" />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your replacements ({menu.length}/8)
        </p>
        {menu.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-muted-foreground">
            Add at least 3. The rescue AI will pick the one that fits the moment.
          </p>
        ) : (
          <ul className="space-y-2">
            {menu.map((m, i) => (
              <li
                key={`${m.label}-${i}`}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              >
                <span className="flex-1 text-sm text-foreground">{m.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.drive} &middot; {m.est_minutes ?? 5}m
                </span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_90px_auto]">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder='e.g. "Make a warm drink"'
            maxLength={80}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem()
              }
            }}
          />
          <select
            value={newDrive}
            onChange={(e) => setNewDrive(e.target.value as 'COMFORT' | 'STIMULATION' | 'RELIEF')}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-orange-500/40 focus:outline-none"
          >
            <option value="COMFORT">Comfort</option>
            <option value="STIMULATION">Stimulation</option>
            <option value="RELIEF">Relief</option>
          </select>
          <Input
            type="number"
            min={1}
            max={60}
            value={newMinutes}
            onChange={(e) => setNewMinutes(parseInt(e.target.value || '5', 10) || 5)}
            className="text-center"
          />
          <Button type="button" variant="glass" onClick={addItem}>
            Add
          </Button>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="brand" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save replacement menu'}
        </Button>
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
