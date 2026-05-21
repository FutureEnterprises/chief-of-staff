'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import type { User } from '@repo/database'
import {
  ArrowRight,
  ArrowLeft,
  Flame,
  Heart,
  BrainCircuit,
  Swords,
  Scale,
  Repeat,
  TrendingUp,
  CreditCard,
  Crosshair,
  Zap,
  Moon,
  Calendar,
  Home,
  AlertTriangle,
  Users,
  User as UserIcon,
  Wind,
  Target,
  Gauge,
  Bandage,
  Footprints,
  Search,
} from 'lucide-react'
import { completeOnboarding } from '@/app/actions/onboarding'
import { cn } from '@/lib/utils'
import { ShareMoment } from '@/components/share/share-moment'
import { CoylLogo } from '@/components/brand/logo'

/**
 * Onboarding wizard — luxury editorial overhaul (May 2026).
 *
 * Refero references applied:
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): refined editorial
 *     restraint on a warm dark canvas; serif headlines as the signature.
 *   - 067fe2b3-9411-42b9-9ea4-39338344f66d (Liron Moran): monumental serif
 *     question on a gallery-spaced screen.
 *   - c00d3961-a100-4c22-91fe-75f6e488e579 (Pipe): ONE molten orange action.
 *   - c18d1c89-bb32-4a3c-bdc8-42d3355b8905 (DNA Capital): whispered
 *     authority, restrained luxury fintech serif typography.
 *
 * Each question is a chapter line set in Instrument Serif. Mono is reserved
 * for step name + counter. Body sans for instructional copy. Canvas is the
 * warm charcoal #0e0d0b — not pure black, not Linear blue-black.
 *
 * Data contract unchanged: same payload to completeOnboarding.
 */

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
]

type LucideIcon = React.ComponentType<{ className?: string; size?: number }>

const BATTLEFIELDS: Array<{
  value: string
  label: string
  subtitle: string
  Icon: LucideIcon
}> = [
  { value: 'WEIGHT_LOSS', label: 'Weight loss', subtitle: 'Late-night kitchen, weekend rebound', Icon: Scale },
  { value: 'CRAVINGS', label: 'Cravings', subtitle: 'Food, sugar, stress-eat reflex', Icon: Flame },
  { value: 'DESTRUCTIVE_BEHAVIORS', label: 'Destructive patterns', subtitle: 'The loop you keep returning to', Icon: Repeat },
  { value: 'CONSISTENCY', label: 'Consistency', subtitle: "\u201CI'll start Monday\u201D — forever", Icon: TrendingUp },
  { value: 'SPENDING', label: 'Spending', subtitle: 'The cart. The "I deserve this." The regret.', Icon: CreditCard },
  { value: 'FOCUS', label: 'Focus', subtitle: 'Procrastination, tab-switch avoidance', Icon: Crosshair },
  { value: 'PRODUCTIVITY', label: 'Follow-through', subtitle: 'The email you didn\u2019t send', Icon: Zap },
]

const DANGER_WINDOWS: Array<{
  value: string
  label: string
  hint: string
  Icon: LucideIcon
}> = [
  { value: 'late-night', label: 'Late night', hint: '9 PM \u2013 midnight', Icon: Moon },
  { value: 'weekends', label: 'Weekends', hint: 'Fri PM \u2192 Sun', Icon: Calendar },
  { value: 'post-work', label: 'After work', hint: '5\u20138 PM decompression', Icon: Home },
  { value: 'stress', label: 'Under stress', hint: 'Deadline, conflict, overwhelm', Icon: AlertTriangle },
  { value: 'after-slip', label: 'After one slip', hint: '\u201CI already blew it\u201D spiral', Icon: Wind },
  { value: 'social', label: 'Social settings', hint: 'Peer pressure, FOMO', Icon: Users },
  { value: 'alone', label: 'When alone', hint: 'No witnesses, no rules', Icon: UserIcon },
]

const EXCUSES = [
  { value: 'DELAY', label: "I'll start tomorrow" },
  { value: 'REWARD', label: 'I deserve it' },
  { value: 'MINIMIZATION', label: "One time won't matter" },
  { value: 'COLLAPSE', label: 'I already blew it' },
  { value: 'EXHAUSTION', label: "I'm too tired" },
  { value: 'EXCEPTION', label: 'This week is weird' },
  { value: 'COMPENSATION', label: "I'll make up for it" },
  { value: 'SOCIAL_PRESSURE', label: "I couldn't say no" },
]

const TONE_MODES: Array<{
  value: string
  label: string
  desc: string
  Icon: LucideIcon
  accent: string
}> = [
  { value: 'MENTOR', label: 'Mentor', desc: 'Warm. Supportive. Encouraging.', Icon: Heart, accent: 'text-pink-400' },
  { value: 'STRATEGIST', label: 'Strategist', desc: 'Analytical. Crisp. Structured.', Icon: BrainCircuit, accent: 'text-blue-400' },
  { value: 'NO_BS', label: 'No-BS', desc: 'Direct. Calls out avoidance.', Icon: Swords, accent: 'text-orange-400' },
  { value: 'BEAST', label: 'Beast', desc: 'High-pressure. Drill sergeant.', Icon: Flame, accent: 'text-red-500' },
]

const RESCUE_PREFERENCES: Array<{
  value: string
  label: string
  desc: string
  Icon: LucideIcon
}> = [
  { value: 'call_me_out', label: 'Call me out', desc: 'Name the pattern, hard.', Icon: Target },
  { value: 'slow_me_down', label: 'Slow me down', desc: 'Buy time before I decide.', Icon: Gauge },
  { value: 'least_damaging', label: 'Least-damaging option', desc: 'If I\u2019m going to slip, minimize it.', Icon: Bandage },
  { value: 'tiny_better_move', label: 'One tiny better move', desc: 'The smallest step that still counts.', Icon: Footprints },
  { value: 'name_the_pattern', label: 'Show me the pattern', desc: 'Read me like a book.', Icon: Search },
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
  // GLP-1 companion — captured during onboarding for users on Ozempic /
  // Wegovy / Mounjaro / etc, skipped (left as empty string + null) for
  // everyone else. Wired to updateGlp1Profile in handleFinish so the
  // day-3 cron has data to fire against from day one.
  glp1Drug: string
  glp1InjectionWeekday: number | null
  rescuePreference: string
}

const WEDGE_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'late-night autopilot',
  CRAVINGS: 'craving loops',
  DESTRUCTIVE_BEHAVIORS: 'destructive patterns',
  CONSISTENCY: 'consistency drift',
  SPENDING: 'impulse spending',
  FOCUS: 'focus collapse',
  PRODUCTIVITY: 'follow-through gaps',
}

// Sentence COYL speaks back at the user during the summary reveal.
// Quote-worthy. Each is the EXACT excuse we're going to catch on day one.
const EXCUSE_QUOTES: Record<string, string> = {
  DELAY: "I\u2019ll start tomorrow.",
  REWARD: 'I deserve this.',
  MINIMIZATION: "One time won\u2019t matter.",
  COLLAPSE: 'I already blew it.',
  EXHAUSTION: "I\u2019m too tired tonight.",
  EXCEPTION: 'This week is weird.',
  COMPENSATION: "I\u2019ll make up for it.",
  SOCIAL_PRESSURE: "I couldn\u2019t say no.",
}

export function OnboardingWizard({ user }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)

  const [data, setData] = useState<FormData>({
    name: user.name || '',
    timezone:
      user.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'America/New_York',
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
    glp1Drug: '',
    glp1InjectionWeekday: null,
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
    { id: 'glp1', label: 'GLP-1' },
    { id: 'summary', label: 'Plan' },
  ]

  const totalSteps = steps.length
  const progress = ((step + 1) / totalSteps) * 100

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
      case 8: return true // GLP-1 step is optional — skip-friendly
      case 9: return true
      default: return true
    }
  })()

  const goNext = useCallback(() => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }, [totalSteps])

  const goBack = useCallback(() => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  function updateData(v: Partial<FormData>) {
    setData((d) => ({ ...d, ...v }))
  }

  const isLastStep = step === totalSteps - 1

  async function handleFinish() {
    setLoading(true)
    try {
      await completeOnboarding({
        name: data.name,
        timezone: data.timezone,
        morningCheckinTime: data.morningCheckinTime,
        nightCheckinTime: data.nightCheckinTime,
        emailBriefingEnabled: data.emailBriefingEnabled,
        firstTask: data.firstCommitment || data.firstTask || '',
        biggestGoal: data.firstCommitment,
        failurePattern: data.excuseStyle,
        primaryWedge: data.primaryWedge,
        dangerWindowsPicked: data.dangerWindowsPicked,
        toneMode: data.toneMode,
      } as Parameters<typeof completeOnboarding>[0])

      // GLP-1 profile is optional — only persist if the user actually
      // entered a drug name. Wrapped in its own try/catch so a GLP-1
      // save failure never blocks onboarding completion (the user is
      // already through the wizard at this point).
      if (data.glp1Drug.trim()) {
        try {
          const { updateGlp1Profile } = await import('@/app/actions/settings')
          await updateGlp1Profile({
            glp1Drug: data.glp1Drug.trim(),
            glp1InjectionWeekday: data.glp1InjectionWeekday,
            glp1StartedAt: null,
            glp1EndedAt: null,
          })
        } catch (err) {
          console.warn('[onboarding] GLP-1 save failed (non-blocking)', err)
        }
      }
    } finally {
      router.push('/today')
    }
  }

  // Keyboard navigation: Enter advances (respects canProceed + isLastStep),
  // Escape goes back. Textareas and inputs get their own Enter behavior — we
  // check e.target to avoid hijacking typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.key === 'Enter' && !isTyping) {
        e.preventDefault()
        if (isLastStep) {
          if (!loading && canProceed) handleFinish()
        } else if (canProceed) {
          goNext()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (step > 0) goBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canProceed, isLastStep, loading])

  const variants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, y: dir > 0 ? 24 : -24 }),
    center: { opacity: 1, y: 0 },
    exit: (dir: 1 | -1) => ({ opacity: 0, y: dir > 0 ? -24 : 24 }),
  }

  return (
    <div className="relative min-h-screen bg-[#0e0d0b] text-[#f5f3ee] antialiased">
      {/* Restrained warm canvas wash — single orange whisper, top-right.
          Sequel/Liron Moran: gallery atmosphere, not a flashy hero. */}
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(700px at 88% 8%, rgba(255,102,0,0.08), transparent 65%), radial-gradient(500px at 8% 92%, rgba(255,102,0,0.03), transparent 70%)',
        }}
      />

      {/* Top rail — logo left, progress center, step counter right. Fixed so
          the content column can scroll without losing orientation. */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-[#0e0d0b]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <CoylLogo size="sm" theme="dark" />

          <div className="relative h-px flex-1 overflow-hidden bg-white/[0.06]">
            <motion.div
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 bg-orange-500"
            />
          </div>

          <span className="font-mono text-[11px] uppercase tracking-[0.22em] tabular-nums text-[#8a847a]">
            {String(step + 1).padStart(2, '0')}
            <span className="mx-1.5 text-[#5f5a52]">/</span>
            {String(totalSteps).padStart(2, '0')}
          </span>
        </div>
      </header>

      {/* Content column — vertically centered, full viewport minus top rail. */}
      <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 pb-32 pt-32 md:pt-36">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            {/* Eyebrow: step name, tiny, uppercase. Gallery wall label. */}
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-orange-500/70" />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
                {steps[step]?.label ?? 'Start'}
              </span>
            </div>

            {step === 0 && <OpeningFrameStep onAgree={goNext} />}
            {step === 1 && <WelcomeStep data={data} onChange={updateData} />}
            {step === 2 && <BattlefieldStep data={data} onChange={updateData} />}
            {step === 3 && <DangerWindowsStep data={data} onChange={updateData} />}
            {step === 4 && <ExcuseStyleStep data={data} onChange={updateData} />}
            {step === 5 && <ToneStep data={data} onChange={updateData} />}
            {step === 6 && <CommitmentStep data={data} onChange={updateData} />}
            {step === 7 && <RescuePreferenceStep data={data} onChange={updateData} />}
            {step === 8 && <Glp1Step data={data} onChange={updateData} />}
            {step === 9 && <SummaryStep data={data} userId={user.id} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom rail — Back (ghosted) + Continue (single orange focal CTA). */}
      <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.05] bg-[#0e0d0b]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.20em] text-[#8a847a] transition-colors hover:text-[#f5f3ee] focus-visible:outline-none focus-visible:text-[#f5f3ee]"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
                <kbd className="ml-1 hidden font-mono text-[10px] text-[#5f5a52] md:inline">
                  esc
                </kbd>
              </button>
            ) : (
              <span aria-hidden className="h-8" />
            )}
          </div>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading || !canProceed}
              className="group inline-flex items-center gap-2 border border-orange-500/50 bg-orange-500/[0.08] px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-300 shadow-[0_0_28px_-8px_rgba(255,102,0,0.45)] transition-colors hover:border-orange-500 hover:bg-orange-500/[0.14] hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Building your plan&hellip;
                </>
              ) : (
                <>
                  Build my plan
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="group inline-flex items-center gap-2 border border-orange-500/50 bg-orange-500/[0.08] px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-300 transition-colors hover:border-orange-500 hover:bg-orange-500/[0.14] hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              <kbd className="ml-1 hidden font-mono text-[10px] text-orange-400/70 md:inline">
                ↵
              </kbd>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

// ─────────────────────── Step components ───────────────────────

/**
 * Reusable tile for pick-one / pick-many screens. Handles selected state,
 * focus ring, hover, icon, label, sublabel. Min-height 72px satisfies
 * 44×44 touch-target minimum with room to spare.
 */
function SelectableTile({
  icon: Icon,
  label,
  sublabel,
  selected,
  onClick,
  multi = false,
}: {
  icon?: LucideIcon
  label: string
  sublabel?: string
  selected: boolean
  onClick: () => void
  /** Multi-select (checkbox semantics). Default is single (radio). */
  multi?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      className={cn(
        'group relative flex w-full items-start gap-4 border px-5 py-4 text-left transition-colors duration-200',
        'focus-visible:outline-none focus-visible:border-orange-500/60',
        selected
          ? 'border-orange-500/50 bg-orange-500/[0.08]'
          : 'border-white/[0.08] bg-[#0e0d0b] hover:border-white/[0.18] hover:bg-[#13110d]',
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center border transition-colors duration-200',
            selected
              ? 'border-orange-500/40 bg-orange-500/[0.10] text-orange-300'
              : 'border-white/[0.08] bg-white/[0.02] text-[#8a847a] group-hover:text-[#a39d92]',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-serif text-lg font-normal leading-tight tracking-[-0.005em]',
            selected ? 'text-[#f5f3ee]' : 'text-[#f5f3ee]/95',
          )}
        >
          {label}
        </p>
        {sublabel && (
          <p className="mt-1 font-sans text-[13px] leading-relaxed text-[#8a847a]">{sublabel}</p>
        )}
      </div>
      {selected && (
        <span
          aria-hidden
          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
        />
      )}
    </button>
  )
}

/**
 * Step 0 — the cold open. COYL guesses the user's shape before the user
 * has said a word. Lands the "this thing gets it" moment in under 5
 * seconds. If the guess is wrong, we pivot gracefully to the rest of
 * the wizard.
 */
function OpeningFrameStep({ onAgree }: { onAgree: () => void }) {
  const [guessed, setGuessed] = useState<'yes' | 'no' | null>(null)

  return (
    <div>
      <h1 className="mb-8 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        Let me guess &mdash;
        <br />
        <span className="italic text-orange-300/95">
          you&rsquo;re good for a few days, then you blow it at night.
        </span>
      </h1>

      {guessed === null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 gap-px overflow-hidden border border-white/[0.06] bg-white/[0.04] sm:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => {
              setGuessed('yes')
              setTimeout(onAgree, 900)
            }}
            className="group bg-[#13110d] px-6 py-6 text-left transition-colors hover:bg-[#181510] focus-visible:bg-[#181510] focus-visible:outline-none"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
              Yes
            </p>
            <p className="mt-2 font-serif text-2xl font-normal leading-tight tracking-[-0.01em] text-[#f5f3ee]">
              Yeah, that&rsquo;s me.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setGuessed('no')}
            className="group bg-[#0e0d0b] px-6 py-6 text-left transition-colors hover:bg-[#13110d] focus-visible:bg-[#13110d] focus-visible:outline-none"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
              No
            </p>
            <p className="mt-2 font-serif text-2xl font-normal leading-tight tracking-[-0.01em] text-[#f5f3ee]">
              Not exactly.
            </p>
          </button>
        </motion.div>
      )}

      {guessed === 'yes' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <p className="border-l-[1.5px] border-orange-500/60 pl-5 font-serif text-3xl font-normal leading-snug tracking-[-0.012em] text-orange-200/95">
            Yeah. That&rsquo;s your pattern.
          </p>
          <p className="font-sans text-lg leading-relaxed text-[#a39d92]">
            You don&rsquo;t fail randomly. You fail at the same time. Same week. Same script.
          </p>
          <p className="pt-2 font-serif text-2xl font-normal italic text-[#f5f3ee]">
            We&rsquo;re going to catch it this week.
          </p>
        </motion.div>
      )}

      {guessed === 'no' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <p className="border-l-[1.5px] border-orange-500/60 pl-5 font-serif text-3xl font-normal leading-snug tracking-[-0.012em] text-orange-200/95">
            OK. Then you tell me.
          </p>
          <p className="font-sans text-lg leading-relaxed text-[#a39d92]">
            The pattern is still there. You just named a different one. Next screens: we map yours exactly.
          </p>
        </motion.div>
      )}
    </div>
  )
}

function WelcomeStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: (v: Partial<FormData>) => void
}) {
  return (
    <div>
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        What should we call you?
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        COYL talks to you directly. This is how.
      </p>

      <div className="space-y-8">
        <div>
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
            Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your name"
            autoFocus
            className="w-full border-0 border-b border-white/[0.10] bg-transparent px-0 py-3 font-serif text-3xl font-normal tracking-[-0.012em] text-[#f5f3ee] outline-none transition-colors focus:border-orange-500/60 placeholder:italic placeholder:text-[#5f5a52]"
          />
        </div>

        <div>
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
            Timezone
          </label>
          <select
            value={data.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
            className="w-full border border-white/[0.10] bg-[#0e0d0b] px-4 py-3 font-sans text-base text-[#f5f3ee] outline-none transition-colors focus:border-orange-500/50"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz} className="bg-[#0e0d0b]">
                {tz.replace('_', ' ').replace('/', ' / ')}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function BattlefieldStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: (v: Partial<FormData>) => void
}) {
  return (
    <div>
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        Which loop is eating you?
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        Pick the one you keep losing in the most. You can add more later.
      </p>

      <div role="radiogroup" className="grid grid-cols-1 gap-2">
        {BATTLEFIELDS.map((b) => (
          <SelectableTile
            key={b.value}
            icon={b.Icon}
            label={b.label}
            sublabel={b.subtitle}
            selected={data.primaryWedge === b.value}
            onClick={() => onChange({ primaryWedge: b.value })}
          />
        ))}
      </div>
    </div>
  )
}

function DangerWindowsStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: (v: Partial<FormData>) => void
}) {
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
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        When do you lose?
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        These become your danger windows. COYL will watch them like a hawk. Pick all that apply.
      </p>

      <div role="group" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DANGER_WINDOWS.map((w) => (
          <SelectableTile
            key={w.value}
            icon={w.Icon}
            label={w.label}
            sublabel={w.hint}
            selected={data.dangerWindowsPicked.includes(w.value)}
            onClick={() => toggle(w.value)}
            multi
          />
        ))}
      </div>
    </div>
  )
}

function ExcuseStyleStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: (v: Partial<FormData>) => void
}) {
  return (
    <div>
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        Which one sounds like you?
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        Be honest. COYL will call this exact sentence out in the moment.
      </p>

      <div role="radiogroup" className="grid grid-cols-1 gap-2">
        {EXCUSES.map((e) => {
          const selected = data.excuseStyle === e.value
          return (
            <button
              key={e.value}
              type="button"
              onClick={() => onChange({ excuseStyle: e.value })}
              aria-pressed={selected}
              role="radio"
              aria-checked={selected}
              className={cn(
                'relative flex w-full items-center justify-between border px-5 py-4 text-left transition-colors duration-200',
                'focus-visible:outline-none focus-visible:border-orange-500/60',
                selected
                  ? 'border-orange-500/50 bg-orange-500/[0.08]'
                  : 'border-white/[0.08] bg-[#0e0d0b] hover:border-white/[0.18] hover:bg-[#13110d]',
              )}
            >
              <span
                className={cn(
                  'font-serif text-xl font-normal italic leading-snug tracking-[-0.005em]',
                  selected ? 'text-orange-200/95' : 'text-[#f5f3ee]',
                )}
              >
                &ldquo;{e.label}&rdquo;
              </span>
              {selected && (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ToneStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: (v: Partial<FormData>) => void
}) {
  return (
    <div>
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        How should COYL talk to you?
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        Same intelligence, different pressure. You can change this anytime.
      </p>

      <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TONE_MODES.map((t) => {
          const selected = data.toneMode === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ toneMode: t.value })}
              aria-pressed={selected}
              role="radio"
              aria-checked={selected}
              className={cn(
                'flex flex-col items-start gap-4 border p-5 text-left transition-colors duration-200',
                'focus-visible:outline-none focus-visible:border-orange-500/60',
                selected
                  ? 'border-orange-500/50 bg-orange-500/[0.08]'
                  : 'border-white/[0.08] bg-[#0e0d0b] hover:border-white/[0.18] hover:bg-[#13110d]',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center border',
                  selected
                    ? 'border-orange-500/40 bg-orange-500/[0.10]'
                    : 'border-white/[0.10] bg-white/[0.02]',
                )}
              >
                <t.Icon className={cn('h-4 w-4', selected ? 'text-orange-300' : t.accent)} />
              </div>
              <div>
                <p className="font-serif text-xl font-normal leading-tight tracking-[-0.01em] text-[#f5f3ee]">
                  {t.label}
                </p>
                <p className="mt-1 font-sans text-[13px] leading-relaxed text-[#8a847a]">{t.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CommitmentStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: (v: Partial<FormData>) => void
}) {
  return (
    <div>
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        Your first rule.
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        One specific commitment for the next 7 days. Concrete. Trackable. Yes or no.
      </p>

      <textarea
        value={data.firstCommitment}
        onChange={(e) => onChange({ firstCommitment: e.target.value })}
        placeholder="No food after 9 PM. No delivery apps Sun&ndash;Thu. Weigh in 5&times;/week."
        autoFocus
        rows={3}
        className="w-full resize-none border-0 border-b border-white/[0.10] bg-transparent px-0 py-3 font-serif text-3xl font-normal leading-snug tracking-[-0.012em] text-[#f5f3ee] outline-none transition-colors focus:border-orange-500/60 placeholder:italic placeholder:text-[#5f5a52]"
      />

      <div className="mt-8 border-l-[1.5px] border-orange-500/60 pl-5 py-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
          What happens next
        </p>
        <p className="mt-2 font-serif text-xl font-normal leading-snug text-[#f5f3ee]">
          COYL builds your rescue protocol and danger windows from your picks. You&rsquo;ll see it on your home screen.
        </p>
      </div>
    </div>
  )
}

function RescuePreferenceStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: (v: Partial<FormData>) => void
}) {
  return (
    <div>
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        When you&rsquo;re about to slip,
        <br />
        <span className="italic text-[#f5f3ee]/85">what should COYL do?</span>
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        This becomes your default rescue style. You can change it anytime.
      </p>

      <div role="radiogroup" className="grid grid-cols-1 gap-2">
        {RESCUE_PREFERENCES.map((r) => (
          <SelectableTile
            key={r.value}
            icon={r.Icon}
            label={r.label}
            sublabel={r.desc}
            selected={data.rescuePreference === r.value}
            onClick={() => onChange({ rescuePreference: r.value })}
          />
        ))}
      </div>
    </div>
  )
}

// Converts the picked danger-window keys into the phrase COYL speaks in
// first person during the summary. "late-night" → "at night", etc.
function windowPhrase(picked: string[]): string {
  const phrases: Record<string, string> = {
    'late-night': 'at night',
    'weekends': 'on weekends',
    'post-work': 'right after work',
    'stress': "when you\u2019re under pressure",
    'after-slip': 'the moment you think you already blew it',
    'social': 'around other people',
    'alone': "when no one\u2019s watching",
  }
  const first = picked[0]
  if (!first) return 'at some point'
  return phrases[first] ?? 'at the moments you picked'
}

/**
 * GLP-1 onboarding step — captures medication + injection day for users
 * on Ozempic / Wegovy / Mounjaro / etc. Entirely optional. Skipping
 * (leaving drug blank + clicking Continue) results in null fields.
 *
 * Why ask in onboarding instead of just /settings: the day-3 cron is
 * the single most differentiated feature for the GLP-1 wedge, and it
 * needs the injection weekday to fire. Users who set it up on day 1 of
 * the COYL account get the value of the cron immediately. Users who
 * skip can always come back to /settings.
 *
 * Free-text drug field instead of an enum: GLP-1 prescriptions ship
 * under multiple brands + compounded variations + new entrants every
 * quarter. An enum maintenance burden every time Lilly ships a new SKU
 * isn't worth it for a string we just feed back to the user.
 */
function Glp1Step({
  data,
  onChange,
}: {
  data: FormData
  onChange: (v: Partial<FormData>) => void
}) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        On a GLP-1?
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        Ozempic, Wegovy, Mounjaro, Zepbound, compounded? COYL fires a targeted interrupt 72 hours after each dose &mdash; the exact moment appetite suppression tapers. Skip if not on one.
      </p>

      <div className="space-y-8">
        <div>
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
            Medication (leave blank to skip)
          </label>
          <input
            type="text"
            value={data.glp1Drug}
            onChange={(e) => onChange({ glp1Drug: e.target.value })}
            placeholder="Ozempic / Wegovy / Mounjaro / Zepbound / Compounded"
            className="w-full border-0 border-b border-white/[0.10] bg-transparent px-0 py-3 font-serif text-2xl font-normal tracking-[-0.01em] text-[#f5f3ee] outline-none transition-colors focus:border-orange-500/60 placeholder:italic placeholder:text-[#5f5a52]"
          />
        </div>

        {data.glp1Drug.trim().length > 0 && (
          <div>
            <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
              Injection day (in your local timezone)
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {weekdays.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange({ glp1InjectionWeekday: idx })}
                  className={`border px-2 py-3 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                    data.glp1InjectionWeekday === idx
                      ? 'border-orange-500/60 bg-orange-500/[0.10] text-orange-300'
                      : 'border-white/[0.08] bg-[#0e0d0b] text-[#a39d92] hover:border-white/[0.18] hover:text-[#f5f3ee]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 font-sans text-[12px] text-[#8a847a]">
              Day 3 after this is when the autopilot tries to come back. That&rsquo;s when COYL fires.
            </p>
          </div>
        )}

        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f5a52]">
          Change or remove any time in /settings &middot; behavioral support, not medical advice
        </p>
      </div>
    </div>
  )
}

/**
 * Summary — the first-use holy-shit moment. Instead of a dry list of picks,
 * COYL speaks directly in a three-beat pattern: the pattern, the excuse
 * that's coming, the deal. Deterministic on the client, no AI call, no
 * latency. The point is to land, not to be clever.
 */
function SummaryStep({ data, userId }: { data: FormData; userId: string }) {
  const wedgeLabel = WEDGE_LABELS[data.primaryWedge] ?? 'your autopilot'
  const windowText = windowPhrase(data.dangerWindowsPicked)
  const excuseQuote = EXCUSE_QUOTES[data.excuseStyle] ?? 'the excuse you already know.'
  const firstName = data.name.trim().split(' ')[0] || 'there'

  const beats = [
    `${firstName}. I heard you.`,
    `Your autopilot runs ${windowText}. That\u2019s ${wedgeLabel} territory. You already knew that \u2014 you just hadn\u2019t said it out loud in a while.`,
    `When it hits this week, the sentence showing up in your head is:`,
    `\u201C${excuseQuote}\u201D`,
    `That\u2019s the one we\u2019re going to catch. I\u2019m not here to motivate you. I\u2019m here the moment that sentence shows up. Your rule: \u201C${data.firstCommitment}.\u201D Simple. Non-negotiable. One week.`,
    `Deal?`,
  ]

  return (
    <div>
      <h1 className="mb-4 font-serif text-5xl font-normal leading-[1.04] tracking-[-0.018em] text-[#f5f3ee] md:text-6xl">
        Here&rsquo;s what I see.
      </h1>
      <p className="mb-12 max-w-lg font-sans text-lg leading-relaxed text-[#a39d92]">
        Read it slowly. This is your pattern.
      </p>

      <div className="space-y-5">
        {beats.map((line, i) => {
          const isExcuseQuote = line.startsWith('\u201C') && line.endsWith('\u201D')
          const isFinal = line === 'Deal?'
          return (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'font-serif text-xl leading-relaxed',
                isExcuseQuote &&
                  'border-l-[1.5px] border-orange-500/60 pl-5 py-1 text-3xl italic text-orange-200/95 leading-snug tracking-[-0.01em]',
                isFinal && 'pt-6 text-5xl tracking-[-0.018em] text-[#f5f3ee] md:text-6xl',
                !isExcuseQuote && !isFinal && 'text-[#d6cfc1] tracking-[-0.005em]',
              )}
            >
              {line}
            </motion.p>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 + beats.length * 0.55 + 0.15, duration: 0.5 }}
        className="mt-10 flex items-center gap-3"
      >
        <ShareMoment
          userId={userId}
          moment="readme"
          shareText={`COYL just read me. "Your autopilot runs ${windowText}. This week the sentence in my head will be: ${excuseQuote}"`}
          label="Share this read"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f5a52]">
          Optional
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 + beats.length * 0.55 + 0.3, duration: 0.6 }}
        className="mt-10 grid grid-cols-2 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04]"
      >
        <div className="bg-[#0e0d0b] px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">Tone</p>
          <p className="mt-2 font-serif text-xl font-normal leading-tight text-[#f5f3ee]">
            {TONE_MODES.find((t) => t.value === data.toneMode)?.label ?? data.toneMode}
          </p>
        </div>
        <div className="bg-[#0e0d0b] px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">Rescue</p>
          <p className="mt-2 font-serif text-xl font-normal leading-tight text-[#f5f3ee]">
            {RESCUE_PREFERENCES.find((r) => r.value === data.rescuePreference)?.label ?? 'Called out'}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
