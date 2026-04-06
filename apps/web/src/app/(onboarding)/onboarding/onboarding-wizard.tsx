'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import type { User } from '@repo/database'
import { Zap, MapPin, Bell, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { MotionButton } from '@/components/ui/motion-button'
import { Input } from '@/components/ui/input'
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

  function goNext() {
    setDirection(1)
    setStep((s) => s + 1)
  }
  function goBack() {
    setDirection(-1)
    setStep((s) => s - 1)
  }

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
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-12 flex items-center gap-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <Zap className="h-4 w-4 text-background" />
        </div>
        <span className="text-sm font-semibold tracking-tight">COYL</span>
      </motion.div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <motion.div
              animate={{
                backgroundColor: i <= step ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                scale: i === step ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="h-1.5 w-8 rounded-full"
            />
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-card p-8 shadow-lg">
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
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center gap-3">
        {step > 0 && (
          <MotionButton variant="outline" size="sm" onClick={goBack}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </MotionButton>
        )}
        {step < steps.length - 1 ? (
          <MotionButton size="sm" onClick={goNext}>
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </MotionButton>
        ) : (
          <MotionButton size="sm" onClick={handleFinish} loading={loading}>
            {loading ? 'Setting up...' : 'Start my day'}
            {!loading && <Zap className="h-3.5 w-3.5" />}
          </MotionButton>
        )}
      </div>
    </div>
  )
}

function WelcomeStep({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Welcome aboard.</h1>
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
            className="h-10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            <MapPin className="mr-1.5 inline h-3.5 w-3.5" />
            Your timezone
          </label>
          <select
            value={data.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace('_', ' ').replace('/', ' · ')}</option>
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
        <h2 className="text-xl font-bold tracking-tight">Your daily rhythm</h2>
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
                  'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                  data.morningCheckinTime === t
                    ? 'border-foreground bg-foreground text-background'
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
                  'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                  data.nightCheckinTime === t
                    ? 'border-foreground bg-foreground text-background'
                    : 'hover:bg-muted'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
          <div>
            <p className="text-sm font-medium">Daily email briefing</p>
            <p className="text-xs text-muted-foreground">Morning summary of priorities, follow-ups, and overdue items</p>
          </div>
          <div
            onClick={() => onChange({ emailBriefingEnabled: !data.emailBriefingEnabled })}
            className={cn(
              'relative h-5 w-9 cursor-pointer rounded-full transition-colors',
              data.emailBriefingEnabled ? 'bg-foreground' : 'bg-muted'
            )}
          >
            <motion.div
              animate={{ x: data.emailBriefingEnabled ? 16 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 h-4 w-4 rounded-full bg-background shadow"
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
        <h2 className="text-xl font-bold tracking-tight">Capture your first task</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Say it naturally. "Follow up with Sarah on Friday" or "Launch the homepage by end of month."
        </p>
      </div>
      <div className="space-y-3">
        <textarea
          value={data.firstTask}
          onChange={(e) => onChange({ firstTask: e.target.value })}
          placeholder="What's the one thing you need to make sure doesn't slip through the cracks?"
          className="min-h-[100px] w-full rounded-lg border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          The AI will extract dates, follow-ups, and priority automatically. You can skip this.
        </p>
        <div className="rounded-lg border border-dashed p-3">
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
                  className="text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  "{ex}"
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
