'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import type { User } from '@repo/database'
import { Zap, ArrowRight, ArrowLeft, Flame, Heart, BrainCircuit, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard } from '@/components/ui/glass-card'
import { completeOnboarding } from '@/app/actions/onboarding'
import { cn } from '@/lib/utils'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
]

const BATTLEFIELDS = [
  { value: 'WEIGHT_LOSS', label: 'Weight loss', emoji: '⚖️', subtitle: 'Late-night eating, weekend collapse' },
  { value: 'CRAVINGS', label: 'Cravings', emoji: '🔥', subtitle: 'Food, sugar, stress-eating' },
  { value: 'DESTRUCTIVE_BEHAVIORS', label: 'Destructive behaviors', emoji: '🌀', subtitle: 'Patterns that keep running you' },
  { value: 'CONSISTENCY', label: 'Consistency', emoji: '📈', subtitle: 'Can\'t stick with habits' },
  { value: 'SPENDING', label: 'Spending', emoji: '💳', subtitle: 'Impulse buys, budget drift' },
  { value: 'FOCUS', label: 'Focus', emoji: '🎯', subtitle: 'Procrastination, distraction' },
  { value: 'PRODUCTIVITY', label: 'Productivity', emoji: '⚡', subtitle: 'General follow-through' },
]

const DANGER_WINDOWS = [
  { value: 'late-night', label: 'Late night', emoji: '🌙', hint: '9 PM – midnight' },
  { value: 'weekends', label: 'Weekends', emoji: '📅', hint: 'Friday PM → Sunday' },
  { value: 'post-work', label: 'After work', emoji: '🏠', hint: '5–8 PM decompression' },
  { value: 'stress', label: 'Under stress', emoji: '💢', hint: 'Deadline, conflict, overwhelm' },
  { value: 'after-slip', label: 'After one slip', emoji: '💥', hint: '"I already blew it" spiral' },
  { value: 'social', label: 'Social settings', emoji: '🍷', hint: 'Peer pressure, FOMO' },
  { value: 'alone', label: 'When alone', emoji: '🕯️', hint: 'No witnesses, no rules' },
]

const EXCUSES = [
  { value: 'DELAY', label: "I'll start tomorrow", emoji: '🐌' },
  { value: 'REWARD', label: 'I deserve it', emoji: '🎁' },
  { value: 'MINIMIZATION', label: "One time won't matter", emoji: '🤏' },
  { value: 'COLLAPSE', label: 'I already blew it', emoji: '💥' },
  { value: 'EXHAUSTION', label: "I'm too tired", emoji: '😴' },
  { value: 'EXCEPTION', label: 'This week is weird', emoji: '📌' },
  { value: 'COMPENSATION', label: "I'll make up for it", emoji: '⚖️' },
  { value: 'SOCIAL_PRESSURE', label: "I couldn't say no", emoji: '👥' },
]

const TONE_MODES = [
  { value: 'MENTOR', label: 'Mentor', desc: 'Warm, supportive, encouraging', Icon: Heart, color: 'text-pink-400' },
  { value: 'STRATEGIST', label: 'Strategist', desc: 'Analytical, crisp, structured', Icon: BrainCircuit, color: 'text-blue-400' },
  { value: 'NO_BS', label: 'No-BS', desc: 'Direct, blunt, calls out avoidance', Icon: Swords, color: 'text-orange-400' },
  { value: 'BEAST', label: 'Beast', desc: 'High-pressure, drill sergeant', Icon: Flame, color: 'text-red-500' },
]

interface OnboardingWizardProps { user: User }

type FormData = {
  name: string
  timezone: string
  morningCheckinTime: string
  nightCheckinTime: string
  emailBriefingEnabled: boolean
  firstTask: string
  primaryWedge: string
  dangerWindowsPicked: string[]
  excuseStyle: string
  toneMode: string
  firstCommitment: string
  rescuePreference: string
}

const RESCUE_PREFERENCES = [
  { value: 'call_me_out', label: 'Call me out directly', emoji: '🎯' },
  { value: 'slow_me_down', label: 'Slow me down', emoji: '⏸️' },
  { value: 'least_damaging', label: 'Least-damaging option', emoji: '🩹' },
  { value: 'tiny_better_move', label: 'One tiny better move', emoji: '👣' },
  { value: 'name_the_pattern', label: 'Tell me what pattern I\'m running', emoji: '🔍' },
]

const WEDGE_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Late-night autopilot',
  CRAVINGS: 'Craving loops',
  DESTRUCTIVE_BEHAVIORS: 'Destructive patterns',
  CONSISTENCY: 'Consistency drift',
  SPENDING: 'Impulse spending',
  FOCUS: 'Focus collapse',
  PRODUCTIVITY: 'Follow-through gaps',
}

const EXCUSE_LABELS: Record<string, string> = {
  DELAY: '"I\'ll start tomorrow"',
  REWARD: '"I deserve this"',
  MINIMIZATION: '"One time won\'t matter"',
  COLLAPSE: '"I already blew it"',
  EXHAUSTION: '"I\'m too tired"',
  EXCEPTION: '"This week is weird"',
  COMPENSATION: '"I\'ll make up for it"',
  SOCIAL_PRESSURE: '"I couldn\'t say no"',
}

export function OnboardingWizard({ user }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)

  const [data, setData] = useState<FormData>({
    name: user.name || '',
    timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    morningCheckinTime: '08:00',
    nightCheckinTime: '21:00',
    emailBriefingEnabled: true,
    firstTask: '',
    primaryWedge: 'WEIGHT_LOSS',
    dangerWindowsPicked: [],
    excuseStyle: '',
    toneMode: 'MENTOR',
    firstCommitment: '',
    rescuePreference: 'call_me_out',
  })

  const steps = [
    { id: 'opening', label: 'Start' },
    { id: 'welcome', label: 'You' },
    { id: 'battlefield', label: 'Battlefield' },
    { id: 'windows', label: 'Windows' },
    { id: 'excuse', label: 'Excuse' },
    { id: 'tone', label: 'Tone' },
    { id: 'commitment', label: 'Rule' },
    { id: 'rescue', label: 'Rescue' },
    { id: 'summary', label: 'Plan' },
  ]

  function goNext() { setDirection(1); setStep((s) => s + 1) }
  function goBack() { setDirection(-1); setStep((s) => s - 1) }
  function updateData(v: Partial<FormData>) {
    setData((d) => ({ ...d, ...v }))
  }

  async function handleFinish() {
    setLoading(true)
    try {
      // Map form data to the onboarding action's expected shape
      await completeOnboarding({
        name: data.name,
        timezone: data.timezone,
        morningCheckinTime: data.morningCheckinTime,
        nightCheckinTime: data.nightCheckinTime,
        emailBriefingEnabled: data.emailBriefingEnabled,
        firstTask: data.firstCommitment || data.firstTask || '',
        biggestGoal: data.firstCommitment,
        failurePattern: data.excuseStyle,
        // New autopilot fields passed through metadata-style extras
        primaryWedge: data.primaryWedge,
        dangerWindowsPicked: data.dangerWindowsPicked,
        toneMode: data.toneMode,
      } as Parameters<typeof completeOnboarding>[0])
    } finally {
      router.push('/today')
    }
  }

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  }

  const canProceed = (() => {
    switch (step) {
      case 0: return true
      case 1: return data.name.trim().length > 0
      case 2: return !!data.primaryWedge
      case 3: return data.dangerWindowsPicked.length > 0
      case 4: return !!data.excuseStyle
      case 5: return !!data.toneMode
      case 6: return data.firstCommitment.trim().length > 2
      case 7: return !!data.rescuePreference
      case 8: return true
      default: return true
    }
  })()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-8 flex items-center gap-2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm shadow-glow-orange">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">COYL</span>
      </motion.div>

      {/* Step indicator */}
      <div className="relative z-10 mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <motion.div
            key={s.id}
            animate={{
              background: i <= step
                ? 'linear-gradient(135deg, var(--gradient-warm-start), var(--gradient-warm-end))'
                : 'hsl(var(--border))',
              scale: i === step ? 1.15 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="h-2 w-8 rounded-full"
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">
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
              {step === 0 && <OpeningFrameStep />}
              {step === 1 && <WelcomeStep data={data} onChange={updateData} />}
              {step === 2 && <BattlefieldStep data={data} onChange={updateData} />}
              {step === 3 && <DangerWindowsStep data={data} onChange={updateData} />}
              {step === 4 && <ExcuseStyleStep data={data} onChange={updateData} />}
              {step === 5 && <ToneStep data={data} onChange={updateData} />}
              {step === 6 && <CommitmentStep data={data} onChange={updateData} />}
              {step === 7 && <RescuePreferenceStep data={data} onChange={updateData} />}
              {step === 8 && <SummaryStep data={data} />}
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      </div>

      <div className="relative z-10 mt-6 flex items-center gap-3">
        {step > 0 && (
          <Button variant="glass" size="sm" onClick={goBack}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button variant="brand" size="sm" onClick={goNext} disabled={!canProceed}>
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="brand" size="sm" onClick={handleFinish} disabled={loading || !canProceed}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Building your plan…
              </span>
            ) : (
              <>Build my plan <Zap className="h-3.5 w-3.5" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function WelcomeStep({ data, onChange }: { data: FormData; onChange: (v: Partial<FormData>) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-2">Welcome.</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          COYL catches you in the moments you usually betray yourself. Let&apos;s map your autopilot.
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
          <label className="mb-1.5 block text-sm font-medium">Timezone</label>
          <select
            value={data.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm"
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

function BattlefieldStep({ data, onChange }: { data: FormData; onChange: (v: Partial<FormData>) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="heading-2">Pick your battlefield.</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Where does your autopilot hurt you most? You can add more later.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {BATTLEFIELDS.map((b) => (
          <button
            key={b.value}
            onClick={() => onChange({ primaryWedge: b.value })}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              data.primaryWedge === b.value
                ? 'border-orange-500 bg-orange-500/10 shadow-glow-orange'
                : 'border-border hover:bg-muted/50'
            )}
          >
            <span className="text-2xl">{b.emoji}</span>
            <div>
              <p className="text-sm font-semibold">{b.label}</p>
              <p className="text-xs text-muted-foreground">{b.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function DangerWindowsStep({ data, onChange }: { data: FormData; onChange: (v: Partial<FormData>) => void }) {
  function toggle(value: string) {
    const current = data.dangerWindowsPicked
    onChange({
      dangerWindowsPicked: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    })
  }
  return (
    <div>
      <div className="mb-6">
        <h2 className="heading-2">When do you lose control?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          These become your danger windows. COYL will watch them like a hawk. Pick as many as apply.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DANGER_WINDOWS.map((w) => {
          const picked = data.dangerWindowsPicked.includes(w.value)
          return (
            <button
              key={w.value}
              onClick={() => toggle(w.value)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                picked
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-border hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2">
                <span>{w.emoji}</span>
                <span className="text-sm font-semibold">{w.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{w.hint}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ExcuseStyleStep({ data, onChange }: { data: FormData; onChange: (v: Partial<FormData>) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="heading-2">Which excuse sounds like you?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Be honest. COYL will call this exact pattern out in the moment.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {EXCUSES.map((e) => (
          <button
            key={e.value}
            onClick={() => onChange({ excuseStyle: e.value })}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              data.excuseStyle === e.value
                ? 'border-orange-500 bg-orange-500/10 shadow-glow-orange'
                : 'border-border hover:bg-muted/50'
            )}
          >
            <span className="text-xl">{e.emoji}</span>
            <span className="text-sm font-semibold">&ldquo;{e.label}&rdquo;</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ToneStep({ data, onChange }: { data: FormData; onChange: (v: Partial<FormData>) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="heading-2">How should COYL talk to you?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Same intelligence. Different pressure. You can change this anytime.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TONE_MODES.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange({ toneMode: t.value })}
            className={cn(
              'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all',
              data.toneMode === t.value
                ? 'border-orange-500 bg-orange-500/10 shadow-glow-orange'
                : 'border-border hover:bg-muted/50'
            )}
          >
            <t.Icon className={`h-5 w-5 ${t.color}`} />
            <p className="text-sm font-bold">{t.label}</p>
            <p className="text-[11px] text-muted-foreground">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function CommitmentStep({ data, onChange }: { data: FormData; onChange: (v: Partial<FormData>) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="heading-2">Your first rule.</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          One specific commitment for the next 7 days. Concrete. Trackable. Yes/no.
        </p>
      </div>
      <textarea
        value={data.firstCommitment}
        onChange={(e) => onChange({ firstCommitment: e.target.value })}
        placeholder="e.g. No food after 9 PM. No delivery apps Sun–Thu. Weigh in 5×/week."
        className="min-h-[100px] w-full rounded-xl border bg-transparent p-3 text-sm placeholder:text-muted-foreground resize-none"
        autoFocus
      />
      <div className="mt-3 glass rounded-xl p-3">
        <p className="text-xs font-medium text-muted-foreground">
          COYL will build your first rescue protocol and danger windows from your picks. You&apos;ll see it on your home screen.
        </p>
      </div>
    </div>
  )
}

function OpeningFrameStep() {
  return (
    <div className="text-center">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="heading-2 mb-4"
      >
        You don&apos;t need more motivation.
        <br />
        You need a{' '}
        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          wake-up system
        </span>.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-sm leading-relaxed text-muted-foreground"
      >
        Most people don&apos;t fail because they don&apos;t know what to do.
        <br />
        They fail in the same moments, over and over.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-sm text-muted-foreground"
      >
        COYL helps you catch those moments before they turn into a spiral.
      </motion.p>
    </div>
  )
}

function RescuePreferenceStep({ data, onChange }: { data: FormData; onChange: (v: Partial<FormData>) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="heading-2">When you&apos;re about to slip, what should COYL do?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This becomes your default rescue style. You can change it anytime.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {RESCUE_PREFERENCES.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange({ rescuePreference: r.value })}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              data.rescuePreference === r.value
                ? 'border-orange-500 bg-orange-500/10 shadow-glow-orange'
                : 'border-border hover:bg-muted/50'
            )}
          >
            <span className="text-xl">{r.emoji}</span>
            <span className="text-sm font-semibold">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Converts the picked danger-window keys into the phrase COYL speaks in first person.
// "late-night" → "at night", "weekends" → "on weekends", etc.
// Returns something that slots into the sentence "So your autopilot runs {PHRASE}."
function windowPhrase(picked: string[]): string {
  const phrases: Record<string, string> = {
    'late-night': 'at night',
    'weekends': 'on weekends',
    'post-work': 'right after work',
    'stress': 'when you\u2019re under pressure',
    'after-slip': 'the moment you think you already blew it',
    'social': 'around other people',
    'alone': 'when no one\u2019s watching',
  }
  const first = picked[0]
  if (!first) return 'at some point'
  return phrases[first] ?? 'at the moments you picked'
}

// The exact excuse sentence we\u2019re going to catch. Quote-worthy.
const EXCUSE_QUOTES: Record<string, string> = {
  DELAY: "I\u2019ll start tomorrow.",
  REWARD: "I deserve this.",
  MINIMIZATION: "One time won\u2019t matter.",
  COLLAPSE: "I already blew it.",
  EXHAUSTION: "I\u2019m too tired tonight.",
  EXCEPTION: "This week is weird.",
  COMPENSATION: "I\u2019ll make up for it.",
  SOCIAL_PRESSURE: "I couldn\u2019t say no.",
}

/**
 * The summary step is the first-use holy-shit moment. Instead of a dry
 * list of picks, COYL speaks directly \u2014 using what the user just told us \u2014
 * in a three-beat pattern: the pattern, the excuse that\u2019s coming, the deal.
 * Deterministic on the client, no AI call, no latency. The point is to land,
 * not to be clever.
 */
function SummaryStep({ data }: { data: FormData }) {
  const wedgeLabel = WEDGE_LABELS[data.primaryWedge] ?? 'your autopilot'
  const windowText = windowPhrase(data.dangerWindowsPicked)
  const excuseQuote = EXCUSE_QUOTES[data.excuseStyle] ?? 'the excuse you already know.'
  const firstName = data.name.trim().split(' ')[0] || 'there'

  // Three beats. Each appears in sequence with a short delay so the lines
  // land one at a time, not all at once. Reads as COYL speaking, not a summary.
  const beats = [
    `${firstName}. I heard you.`,
    `Your autopilot runs ${windowText}. That\u2019s ${wedgeLabel.toLowerCase()} territory. You already knew that \u2014 you just hadn\u2019t said it out loud in a while.`,
    `When it hits this week, the sentence showing up in your head is:`,
    `"${excuseQuote}"`,
    `That\u2019s the one we\u2019re going to catch. I\u2019m not here to motivate you. I\u2019m here the moment that sentence shows up. Your rule: "${data.firstCommitment}". Simple. Non-negotiable. One week.`,
    `Deal?`,
  ]

  return (
    <div>
      <div className="mb-5">
        <p className="label-xs mb-2 text-orange-500">First read</p>
        <h2 className="heading-2">Here\u2019s what I see.</h2>
      </div>

      {/* Beats stream in one at a time. Feels like COYL speaking, not filling out a form. */}
      <div className="space-y-3">
        {beats.map((line, i) => {
          const isExcuseQuote = line.startsWith('"') && line.endsWith('"')
          const isFinal = line === 'Deal?'
          return (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.55, duration: 0.4 }}
              className={cn(
                'text-sm leading-relaxed',
                isExcuseQuote &&
                  'rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/5 px-4 py-2 text-base font-semibold italic text-orange-200',
                isFinal && 'pt-2 text-base font-bold text-white',
                !isExcuseQuote && !isFinal && 'text-foreground/90',
              )}
            >
              {line}
            </motion.p>
          )
        })}
      </div>

      {/* The quiet footer — commitments already made, no extra fluff */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 + beats.length * 0.55 + 0.2, duration: 0.6 }}
        className="mt-6 grid grid-cols-2 gap-2"
      >
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Tone</p>
          <p className="mt-0.5 text-xs font-semibold text-foreground">
            {TONE_MODES.find((t) => t.value === data.toneMode)?.label ?? data.toneMode}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Rescue style</p>
          <p className="mt-0.5 text-xs font-semibold text-foreground">
            {RESCUE_PREFERENCES.find((r) => r.value === data.rescuePreference)?.label ?? 'Called out'}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
