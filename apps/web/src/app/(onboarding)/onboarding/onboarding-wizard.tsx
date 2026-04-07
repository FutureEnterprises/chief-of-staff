'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import type { User } from '@repo/database'
import { Zap, MapPin, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard } from '@/components/ui/glass-card'
import { completeOnboarding } from '@/app/actions/onboarding'
import { cn } from '@/lib/utils'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
]

const MORNING_TIMES = ['06:00', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00']
const NIGHT_TIMES = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']

interface OnboardingWizardProps {
  user: User
}

export function OnboardingWizard({ user }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)

  const [data, setData] = useState({
    name: user.name || '',
    timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    morningCheckinTime: '08:00',
    nightCheckinTime: '21:00',
    emailBriefingEnabled: true,
    firstTask: '',
  })

  const steps = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'schedule', label: 'Your Schedule' },
    { id: 'first-task', label: 'First Task' },
  ]

  function goNext() { setDirection(1); setStep((s) => s + 1) }
  function goBack() { setDirection(-1); setStep((s) => s - 1) }

  async function handleFinish() {
    setLoading(true)
    await completeOnboarding(data)
    router.push('/today')
  }

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-50" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-12 flex items-center gap-2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm shadow-glow-orange">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">COYL</span>
      </motion.div>

      {/* Step indicator */}
      <div className="relative z-10 mb-8 flex items-center gap-3">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <motion.div
              animate={{
                background: i <= step
                  ? 'linear-gradient(135deg, var(--gradient-warm-start), var(--gradient-warm-end))'
                  : 'hsl(var(--border))',
                scale: i === step ? 1.15 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="h-2 w-10 rounded-full"
            />
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <GlassCard className="overflow-hidden p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            >
              {step === 0 && <WelcomeStep data={data} onChange={(v) => setData((d) => ({ ...d, ...v }))} />}
              {step === 1 && <ScheduleStep data={data} onChange={(v) => setData((d) => ({ ...d, ...v }))} />}
              {step === 2 && <FirstTaskStep data={data} onChange={(v) => setData((d) => ({ ...d, ...v }))} />}
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Navigation */}
      <div className="relative z-10 mt-6 flex items-center gap-3">
        {step > 0 && (
          <Button variant="glass" size="sm" onClick={goBack}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button variant="brand" size="sm" onClick={goNext}>
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="brand" size="sm" onClick={handleFinish} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Setting up...
              </span>
            ) : (
              <>Start my day <Zap className="h-3.5 w-3.5" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function WelcomeStep({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-2">Welcome aboard.</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Let's set up your command center. This takes under 2 minutes.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">What should we call you?</label>
          <Input
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your name"
            className="h-10 focus-glow"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            <MapPin className="mr-1.5 inline h-3.5 w-3.5 text-orange-500" />
            Your timezone
          </label>
          <select
            value={data.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-glow"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace('_', ' ').replace('/', ' / ')}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function ScheduleStep({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="heading-2">Your daily rhythm</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We'll send your planning prompts and briefings at these times.
        </p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Morning planning session</label>
          <div className="grid grid-cols-4 gap-1.5">
            {MORNING_TIMES.map((t) => (
              <button
                key={t}
                onClick={() => onChange({ morningCheckinTime: t })}
                className={cn(
                  'rounded-xl border px-2 py-2 text-xs font-medium transition-all',
                  data.morningCheckinTime === t
                    ? 'bg-gradient-warm text-white border-transparent shadow-glow-orange'
                    : 'hover:bg-muted'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Night review session</label>
          <div className="grid grid-cols-4 gap-1.5">
            {NIGHT_TIMES.map((t) => (
              <button
                key={t}
                onClick={() => onChange({ nightCheckinTime: t })}
                className={cn(
                  'rounded-xl border px-2 py-2 text-xs font-medium transition-all',
                  data.nightCheckinTime === t
                    ? 'bg-gradient-warm text-white border-transparent shadow-glow-orange'
                    : 'hover:bg-muted'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <label className="glass flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors hover:shadow-card-hover">
          <div>
            <p className="text-sm font-medium">Daily email briefing</p>
            <p className="text-xs text-muted-foreground">Morning summary of priorities and follow-ups</p>
          </div>
          <div
            onClick={() => onChange({ emailBriefingEnabled: !data.emailBriefingEnabled })}
            className={cn(
              'relative h-6 w-11 cursor-pointer rounded-full transition-colors',
              data.emailBriefingEnabled ? 'bg-gradient-warm' : 'bg-muted'
            )}
          >
            <motion.div
              animate={{ x: data.emailBriefingEnabled ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
            />
          </div>
        </label>
      </div>
    </div>
  )
}

function FirstTaskStep({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="heading-2">Capture your first task</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Say it naturally. The AI will extract dates, follow-ups, and priority automatically.
        </p>
      </div>
      <div className="space-y-3">
        <textarea
          value={data.firstTask}
          onChange={(e) => onChange({ firstTask: e.target.value })}
          placeholder="What's the one thing you need to make sure doesn't slip through the cracks?"
          className="min-h-[100px] w-full rounded-xl border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-glow resize-none"
          autoFocus
        />
        <div className="glass rounded-xl p-3">
          <p className="text-xs font-medium text-muted-foreground">Try something like:</p>
          <ul className="mt-1.5 space-y-1">
            {[
              'Email the Acme proposal to David — follow up Thursday if no response',
              'Finish the Q2 board deck by next Friday',
              "Call Mike about the budget — he's been waiting a week",
            ].map((ex) => (
              <li key={ex}>
                <button
                  onClick={() => onChange({ firstTask: ex })}
                  className="text-left text-xs text-muted-foreground underline-offset-2 hover:text-orange-500 hover:underline transition-colors"
                >
                  &ldquo;{ex}&rdquo;
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
