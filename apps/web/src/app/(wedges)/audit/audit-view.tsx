'use client'

/**
 * LUXURY EDITORIAL OVERHAUL — May 2026 (intro screen only; question /
 * result screens preserved to avoid disturbing the validated funnel).
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined serif H1, mono
 *     kicker, gallery-grade breathing on the intro spread.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): six-family preview becomes
 *     editorial entries with hairline rules, not card chrome.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): serif italic signature
 *     lines treated as remembered quotes.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  allFamilies,
  buildArchetype,
  buildInterrupts,
  buildShareUrl,
  type WedgeId,
  type WindowId,
  type ScriptId,
  type Archetype,
} from '@/lib/audit-archetype'

/**
 * Map audit WedgeId → PrimaryWedge enum (server-side).
 * Used by the /api/v1/audit/finalize handoff. The audit collects a
 * narrative wedge ('weight', 'work', etc.); the DB stores the enum
 * value ('WEIGHT_LOSS', 'PRODUCTIVITY', etc.). Keep this map in sync
 * with the PrimaryWedge enum in schema.prisma.
 */
const WEDGE_TO_PRIMARY_WEDGE: Record<WedgeId, string> = {
  weight: 'WEIGHT_LOSS',
  work: 'PRODUCTIVITY',
  destructive: 'DESTRUCTIVE_BEHAVIORS',
  consistency: 'CONSISTENCY',
  spending: 'SPENDING',
  focus: 'FOCUS',
}

/** Shape returned by POST /api/v1/audit/finalize. */
type FinalizeResponse = {
  dangerWindowsCreated: Array<{
    id: string
    label: string
    dayOfWeek: number
    startHour: number
    endHour: number
    source: 'inferred'
  }>
  suggestedCommitments: Array<{ rule: string; domain: string; rationale: string }>
  nextStep: string
}

/**
 * AuditView \u2014 the interactive quiz body for /audit.
 *
 * Three questions \u2192 mapped to a narrative result + three specific
 * interrupt moments. No backend. No signup required. Purely client-side
 * rule-based mapping so the "wow" happens in <60 seconds with zero
 * friction. The signup CTA at the end is the conversion surface.
 *
 * Playbook alignment: §4.1 tactic 1 ("Autopilot Audit onboarding"). The
 * page sits on the public wedges layout, inherits its header/footer, and
 * is indexable for long-tail search ("autopilot audit", "self-sabotage quiz").
 */

// WedgeId, WindowId, ScriptId now imported from lib/audit-archetype so
// the public share page (/a/[slug]) and this view stay in sync.

const WEDGES: { id: WedgeId; label: string; line: string }[] = [
  { id: 'weight', label: 'Food / weight', line: 'The kitchen. The fridge. The snack you said you wouldn\u2019t.' },
  { id: 'work', label: 'Work follow-through', line: 'The follow-up you said you\u2019d send. Didn\u2019t.' },
  { id: 'destructive', label: 'Destructive pattern', line: 'The loop you keep returning to. Even when you know better.' },
  { id: 'consistency', label: 'Consistency', line: '"I\u2019ll start Monday." Forever.' },
  { id: 'spending', label: 'Spending', line: 'The cart. The "I deserve this." The regret.' },
  { id: 'focus', label: 'Focus / procrastination', line: 'You know what to do. You don\u2019t do it.' },
]

const WINDOWS: { id: WindowId; label: string; hours: string }[] = [
  { id: 'morning', label: 'Morning', hours: '6 AM \u2013 noon' },
  { id: 'afternoon', label: 'Afternoon', hours: 'noon \u2013 5 PM' },
  { id: 'afterwork', label: 'After-work', hours: '5 \u2013 9 PM' },
  { id: 'latenight', label: 'Late-night', hours: '9 PM \u2013 2 AM' },
]

const SCRIPTS: { id: ScriptId; quote: string }[] = [
  { id: 'reward', quote: '"I deserve this."' },
  { id: 'delay', quote: '"I\u2019ll start tomorrow."' },
  { id: 'collapse', quote: '"I already messed up."' },
  { id: 'minimize', quote: '"One time won\u2019t matter."' },
  { id: 'exhaustion', quote: '"I\u2019m too tired tonight."' },
  { id: 'social', quote: '"I couldn\u2019t say no."' },
]

// buildInterrupts moved to @/lib/audit-archetype so the server-side
// /api/v1/audit/capture route and the email template can share the
// exact strings the audit result page shows.

function resultHeadline(wedge: WedgeId, window: WindowId): string {
  const wedgeShort: Record<WedgeId, string> = {
    weight: 'food',
    work: 'follow-through',
    destructive: 'the pattern',
    consistency: 'consistency',
    spending: 'spending',
    focus: 'focus',
  }
  const windowShort: Record<WindowId, string> = {
    morning: 'in the morning',
    afternoon: 'in the afternoon',
    afterwork: 'after work',
    latenight: 'late at night',
  }
  return `Your autopilot runs ${windowShort[window]} on ${wedgeShort[wedge]}.`
}

// buildArchetype lives in @/lib/audit-archetype so it can be re-used
// at the public /a/[slug] share page for SSR rendering and OG meta.

export function AuditView() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [wedge, setWedge] = useState<WedgeId | null>(null)
  const [windowChoice, setWindowChoice] = useState<WindowId | null>(null)
  const [script, setScript] = useState<ScriptId | null>(null)

  function reset() {
    setStep(0)
    setWedge(null)
    setWindowChoice(null)
    setScript(null)
  }

  // Intro screen.
  //
  // Per the strategist's May 2026 audit: this page is the viral engine, not
  // a short landing. The intro shows the six families up-front (so visitors
  // arrive with "which one am I?" priming), plus two example share-card
  // outputs that prove what they get on the other side. The Start button
  // remains the single obvious next action.
  if (step === 0) {
    const families = allFamilies()
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Autopilot audit
          </span>
        </div>
        <h1 className="mb-10 font-serif text-5xl font-normal leading-[0.98] tracking-[-0.03em] text-gray-900 md:text-7xl">
          Find your<br />
          <span className="italic text-orange-600">autopilot family.</span>
        </h1>
        <p className="mb-6 max-w-2xl font-serif text-2xl font-normal italic leading-[1.35] text-gray-900 md:text-3xl">
          Three questions. No signup. Your autopilot family on the other side.
        </p>
        <p className="mb-14 max-w-2xl text-base leading-[1.7] text-gray-600">
          The audit places you in one of six families &mdash; the named identity
          that drives your loop &mdash; and pins your specific moment: the
          exact wedge, window, and script the pattern runs on.
        </p>

        {/* Six-family preview grid. Editorial entries with hairline rules,
            not card chrome. Family name in serif, signature in serif italic. */}
        <div className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The six families
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
            {families.map((f) => {
              const Icon = f.Icon
              return (
                <div
                  key={f.slug}
                  className="border-t border-gray-200 pt-5"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                    <p className="font-serif text-lg font-normal leading-[1.1] tracking-[-0.01em] text-gray-900">
                      {f.name}
                    </p>
                  </div>
                  <p className="mt-3 text-xs leading-[1.65] text-gray-600">
                    {f.essence}
                  </p>
                  <p className="mt-3 font-serif text-sm italic leading-snug text-orange-600">
                    {f.signature}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Example outputs. Editorial preview of /a/[slug] share card. */}
        <div className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              What you get
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
            {[
              {
                familyName: 'The Deserver',
                Icon: families.find((f) => f.slug === 'the-deserver')!.Icon,
                signature: '"I deserve this."',
                prevalence: '78% of you tell yourself this',
              },
              {
                familyName: 'The Monday Resetter',
                Icon: families.find((f) => f.slug === 'the-monday-resetter')!.Icon,
                signature: '"I’ll start tomorrow."',
                prevalence: '82% of you say "tomorrow" 3× a week',
              },
            ].map((ex) => {
              const Icon = ex.Icon
              return (
                <div
                  key={ex.familyName}
                  className="relative border-t border-orange-500 pt-5"
                >
                  <span className="absolute right-0 top-5 font-mono text-[9px] font-medium uppercase tracking-[0.24em] text-gray-400">
                    Example output
                  </span>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                    You&rsquo;re
                  </p>
                  <p className="mt-3 flex items-center gap-3 font-serif text-2xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900">
                    <Icon className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                    <span>{ex.familyName}</span>
                  </p>
                  <p className="mt-4 font-serif text-base italic text-orange-600">
                    {ex.signature}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{ex.prevalence}.</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Start CTA. Single obvious next action. */}
        <div>
          <button
            onClick={() => setStep(1)}
            className="rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,102,0,0.5)] transition-all hover:bg-orange-600"
          >
            Start the audit
          </button>
          <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            60 seconds &middot; 3 questions &middot; zero email required
          </p>
        </div>
      </motion.div>
    )
  }

  // Q1: the wedge.
  if (step === 1) {
    return (
      <StepWrap stepIndex={1} title="Which loop is eating you?" subtitle="Pick the one you keep losing in the most.">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {WEDGES.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setWedge(w.id)
                setStep(2)
              }}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <p className="text-base font-bold text-gray-900 group-hover:text-orange-700">{w.label}</p>
              <p className="mt-1 text-sm text-gray-600">{w.line}</p>
            </button>
          ))}
        </div>
      </StepWrap>
    )
  }

  // Q2: the window.
  if (step === 2) {
    return (
      <StepWrap stepIndex={2} title="When does it usually fire?" subtitle="The block of time where the script most often runs.">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {WINDOWS.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setWindowChoice(w.id)
                setStep(3)
              }}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <p className="text-base font-bold text-gray-900 group-hover:text-orange-700">{w.label}</p>
              <p className="mt-1 text-sm text-gray-600">{w.hours}</p>
            </button>
          ))}
        </div>
      </StepWrap>
    )
  }

  // Q3: the script. Once chosen we move to results.
  if (step === 3 && !script) {
    return (
      <StepWrap stepIndex={3} title="What do you tell yourself right before?" subtitle="The sentence in your head the moment you&rsquo;re about to fold.">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SCRIPTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScript(s.id)}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <p className="text-lg font-semibold italic text-orange-700">{s.quote}</p>
            </button>
          ))}
        </div>
      </StepWrap>
    )
  }

  // Results.
  if (wedge && windowChoice && script) {
    const interrupts = buildInterrupts(wedge, windowChoice, script)
    const archetype = buildArchetype(wedge, windowChoice, script)
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Archetype card — two-tier: FAMILY headlines (the meme),
              SPECIFIC is the texture (the moment). Per the May 2026
              virality dispatch: people share family identity ("I'm a
              Deserver") more than they share situational labels. The
              family is the screenshot atom; the specific is the
              context that proves the result is real. */}
          <div className="mb-6 rounded-3xl border border-orange-300 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)] md:p-8">
            <p className="text-xs font-mono uppercase tracking-[0.28em] text-orange-600">
              You&rsquo;re
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-4 text-4xl font-black leading-tight text-gray-900 md:text-5xl">
              <span
                aria-hidden
                className="inline-flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-orange-100 text-orange-600 ring-1 ring-orange-200 md:h-16 md:w-16"
              >
                <archetype.family.Icon className="h-8 w-8 md:h-9 md:w-9" strokeWidth={2} />
              </span>
              <span>{archetype.family.name}</span>
            </p>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-700">
              {archetype.family.essence}
            </p>
            <p className="mt-4 font-mono text-sm italic text-orange-700">
              Signature script: {archetype.family.signature}
            </p>
            <p className="mt-3 text-sm text-gray-600">
              {archetype.family.prevalenceCopy}
            </p>
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Your specific moment
              </p>
              <p className="mt-1 flex items-center gap-2 text-base font-bold text-gray-900">
                <span
                  aria-hidden
                  className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100"
                >
                  <archetype.specific.Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span>{archetype.specific.name}</span>
              </p>
            </div>
            <ArchetypeShareButton archetype={archetype} />
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500">
              Your pattern
            </span>
          </div>
          <h2 className="mb-6 text-3xl font-black leading-[1.1] text-gray-900 md:text-5xl">
            {resultHeadline(wedge, windowChoice)}
          </h2>
          <p className="mb-10 max-w-2xl text-lg text-gray-600">
            Here are the three moments COYL would fire for you. Not daily reminders.
            Surgical interrupts in the seconds before the fold.
          </p>

          <div className="mb-10 space-y-3">
            {interrupts.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 * (i + 1), duration: 0.45 }}
                className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/5 px-5 py-4"
              >
                <p className="text-xs font-mono uppercase tracking-widest text-orange-500">
                  Interrupt {i + 1}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mb-10 rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-sm uppercase tracking-widest text-gray-500">What you just did</p>
            <p className="mt-2 text-base text-gray-700">
              In 60 seconds you did what most apps take 3 weeks of logging to do:
              identified the exact pattern that keeps running you.{' '}
              <span className="font-bold text-gray-900">COYL&rsquo;s job is to interrupt these, not nag you about them.</span>
            </p>
          </div>

          {/* Pre-built DangerWindows + suggested Commitments — the
              input-dependence fix. Calls /api/v1/audit/finalize for
              signed-in users only; anonymous visitors see nothing here
              (and the rest of the page still works). The user lands on
              /today already partially set up. */}
          <FinalizePrebuildBlock
            wedge={wedge}
            windowChoice={windowChoice}
            script={script}
            archetypeSlug={archetype.family.slug}
          />

          {/* Email-me-this-result — the no-commitment top of funnel.
              Lower-friction than ScheduleInterruptBlock (no SMS/email
              gets booked for tonight). The visitor's email lands in
              audit_leads with their archetype attached, and they get
              a single result email through Resend. Sits ABOVE the
              schedule block so visitors who aren't ready to commit
              still leave a contact. */}
          <EmailResultBlock archetype={archetype} />

          {/* First-hour interrupt scheduler — the retention engine.
              Per the May 2026 product blueprint, this replaces the
              "go to /sign-up" deferred-value path. The visitor leaves
              with a felt interrupt locked in for tonight. */}
          <ScheduleInterruptBlock archetype={archetype} onReset={reset} />
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}

/**
 * ScheduleInterruptBlock — three-state inline section that turns the
 * audit's "Build my interrupt protocol" CTA into a captured interrupt
 * scheduled for tonight (or tomorrow). States:
 *
 *   idle       — primary CTA + "Run it again"
 *   capturing  — phone OR email + auto-detected timezone
 *   confirmed  — warm "Tonight at 9:30 PM" card + sign-up upsell
 */
function ScheduleInterruptBlock({
  archetype,
  onReset,
}: {
  archetype: Archetype
  onReset: () => void
}) {
  const [mode, setMode] = useState<'idle' | 'capturing' | 'confirmed'>('idle')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scheduledForLocal, setScheduledForLocal] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedPhone = phone.trim()
    const trimmedEmail = email.trim()
    if (!trimmedPhone && !trimmedEmail) {
      setErrorMessage('Add a phone or email so we can land the interrupt.')
      return
    }

    const timezone =
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
        : 'America/New_York'

    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/audit/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: trimmedPhone || undefined,
          email: trimmedEmail || undefined,
          archetypeFamily: archetype.family.slug,
          wedge: archetype.wedge,
          window: archetype.window,
          script: archetype.script,
          timezone,
        }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        setErrorMessage(
          typeof detail?.error === 'string'
            ? detail.error
            : 'Could not lock that in. Try again?',
        )
        setSubmitting(false)
        return
      }
      const json = (await res.json()) as { scheduledForLocal: string }
      setScheduledForLocal(json.scheduledForLocal)
      setMode('confirmed')
    } catch {
      setErrorMessage('Network hiccup. Try once more.')
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'confirmed' && scheduledForLocal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(16,185,129,0.18)] md:p-8"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700 ring-1 ring-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Locked in
          </span>
        </div>
        <p className="mt-4 text-3xl font-black leading-tight text-gray-900 md:text-4xl">
          {scheduledForLocal}.
        </p>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-700">
          We&rsquo;ll land the interrupt at the exact moment your autopilot
          usually runs. Your script tonight:
        </p>
        <p className="mt-3 font-serif text-lg italic text-orange-700">
          {archetype.family.signature}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Pause. Walk five minutes. Decide after.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/sign-up?ref=audit"
            className="text-sm font-semibold text-orange-700 underline-offset-4 hover:underline"
          >
            Want the full system? Sign up &rarr;
          </Link>
          <button
            onClick={onReset}
            className="rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-700 hover:border-orange-500/40 hover:text-orange-700"
          >
            Run it again
          </button>
        </div>
      </motion.div>
    )
  }

  if (mode === 'capturing') {
    return (
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-600">
          One last step
        </p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-gray-900 md:text-3xl">
          Where do we land the interrupt?
        </h3>
        <p className="mt-2 max-w-lg text-sm text-gray-600">
          Phone gets the surgical version. Email works too. Pick whichever
          you actually open in the moment.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Phone
            </span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(555) 867-5309"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Or email
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </label>
        </div>

        {errorMessage && (
          <p className="mt-4 text-sm font-semibold text-red-600">{errorMessage}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Locking it in…' : 'Lock in my first interrupt'}
          </button>
          <button
            type="button"
            onClick={() => setMode('idle')}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
          No spam &middot; one interrupt &middot; reply STOP to opt out
        </p>
      </motion.form>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => setMode('capturing')}
        className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
      >
        Schedule my first interrupt &rarr;
      </button>
      <button
        onClick={onReset}
        className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
      >
        Run it again
      </button>
    </div>
  )
}

/**
 * EmailResultBlock — three-state inline block that captures an email
 * and fires a one-shot result email through Resend. Sits between the
 * result reveal and ScheduleInterruptBlock. Lower commitment than
 * scheduling a real interrupt — meant for the cold viral visitor who
 * isn't ready to lock anything in tonight but will leave a contact
 * for a result delivery they can re-read tomorrow.
 *
 * States:
 *   idle  — "Email me this result" CTA + brief reassurance
 *   form  — email input + submit
 *   sent  — confirmation card with sign-up CTA
 */
function EmailResultBlock({ archetype }: { archetype: Archetype }) {
  const [mode, setMode] = useState<'idle' | 'form' | 'sent'>('idle')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    const trimmed = email.trim()
    if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setErrorMessage('That email doesn’t look right.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/audit/capture', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          archetypeFamily: archetype.family.name,
          archetypeSlug: archetype.family.slug,
          wedge: archetype.wedge,
          window: archetype.window,
          script: archetype.script,
          source: 'audit-result-page',
        }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        setErrorMessage(
          typeof detail?.error === 'string'
            ? detail.error
            : 'Could not send that. Try again?',
        )
        setSubmitting(false)
        return
      }
      setMode('sent')
    } catch {
      setErrorMessage('Network hiccup. Try once more.')
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'sent') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 md:p-8"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700 ring-1 ring-emerald-300">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          On its way
        </span>
        <p className="mt-4 text-base text-gray-700">
          Your archetype, signature script, and three interrupts are heading
          to <span className="font-semibold text-gray-900">{email}</span>. Reread
          it tonight before your danger window fires.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Ready to lock in the actual interrupt below — or{' '}
          <Link
            href="/sign-up?ref=audit-emailed"
            className="font-semibold text-orange-700 underline-offset-4 hover:underline"
          >
            sign up &rarr;
          </Link>
        </p>
      </motion.div>
    )
  }

  if (mode === 'form') {
    return (
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 md:p-8"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-600">
          No commitment
        </p>
        <h3 className="mt-2 text-xl font-bold leading-tight text-gray-900 md:text-2xl">
          Email me my result.
        </h3>
        <p className="mt-2 max-w-lg text-sm text-gray-600">
          One email with your archetype + the three interrupts. We don&rsquo;t
          email you again unless you sign up.
        </p>
        <label className="mt-5 block">
          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </label>
        {errorMessage && (
          <p className="mt-3 text-sm font-semibold text-red-600">{errorMessage}</p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send it to me'}
          </button>
          <button
            type="button"
            onClick={() => setMode('idle')}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    )
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        onClick={() => setMode('form')}
        className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:border-orange-300 hover:text-orange-700"
      >
        📩 Email me this result
      </button>
      <span className="text-xs text-gray-500">
        Or lock in tonight&rsquo;s interrupt below.
      </span>
    </div>
  )
}

function StepWrap({
  stepIndex,
  title,
  subtitle,
  children,
}: {
  stepIndex: 1 | 2 | 3
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Question {stepIndex} of 3
        </span>
      </div>
      <h2 className="mb-3 text-3xl font-black leading-[1.1] text-gray-900 md:text-5xl">{title}</h2>
      <p className="mb-10 max-w-xl text-base text-gray-600">{subtitle}</p>
      {children}
    </motion.div>
  )
}

/**
 * FinalizePrebuildBlock — calls POST /api/v1/audit/finalize on mount and
 * shows what was pre-built + one-tap activate for suggested commitments.
 *
 * Three states:
 *   loading    — quiet loading row (no big spinner; keeps the page calm)
 *   anonymous  — 401 from the endpoint means the visitor isn't signed in
 *                yet. We render nothing — the existing ScheduleInterrupt
 *                block handles anonymous-user capture downstream.
 *   ready      — the section the strategist's brief asked for: "we've
 *                already set up X windows + Y suggested commitments."
 *
 * Activation: each suggested commitment is a one-tap. We POST to the
 * existing /api/v1/commitments endpoint. Activation is per-row optimistic
 * and reverts on failure.
 */
function FinalizePrebuildBlock({
  wedge,
  windowChoice,
  script,
  archetypeSlug,
}: {
  wedge: WedgeId
  windowChoice: WindowId
  script: ScriptId
  archetypeSlug: string
}) {
  const [state, setState] = useState<'loading' | 'anonymous' | 'ready' | 'error'>('loading')
  const [data, setData] = useState<FinalizeResponse | null>(null)
  // Track which suggested commitments the user has activated. Indexed by
  // the rule string (suggestions are unique within an archetype).
  const [activated, setActivated] = useState<Record<string, 'pending' | 'done' | 'failed'>>({})
  // Guard against double-fire from React StrictMode / Fast Refresh.
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    const timezone =
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
        : 'America/New_York'

    const primaryWedge = WEDGE_TO_PRIMARY_WEDGE[wedge]

    // Synthesize a Q&A pairing so the regex extractor on the server has
    // something to chew on — the audit's structured answers don't carry
    // free text yet, but the metadata is preserved for any downstream
    // analyzer that wants to see what the user picked.
    const auditAnswers: Array<{ q: string; a: string }> = [
      { q: 'Which loop is eating you?', a: wedge },
      { q: 'When does it usually fire?', a: windowChoice },
      { q: 'What do you tell yourself right before?', a: script },
    ]

    let cancelled = false

    fetch('/api/v1/audit/finalize', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        archetypeSlug,
        primaryWedge,
        auditAnswers,
        timezone,
      }),
    })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          // Anonymous visitor — no DB user. Hide this section gracefully;
          // the schedule-interrupt block downstream still handles them.
          setState('anonymous')
          return
        }
        if (!res.ok) {
          setState('error')
          return
        }
        const json = (await res.json()) as FinalizeResponse
        setData(json)
        setState('ready')
      })
      .catch(() => {
        if (cancelled) return
        setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [wedge, windowChoice, script, archetypeSlug])

  async function activateCommitment(commitment: { rule: string; domain: string }) {
    setActivated((prev) => ({ ...prev, [commitment.rule]: 'pending' }))
    try {
      const res = await fetch('/api/v1/commitments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rule: commitment.rule,
          domain: commitment.domain,
          frequency: 'DAILY',
        }),
      })
      if (!res.ok) {
        setActivated((prev) => ({ ...prev, [commitment.rule]: 'failed' }))
        return
      }
      setActivated((prev) => ({ ...prev, [commitment.rule]: 'done' }))
    } catch {
      setActivated((prev) => ({ ...prev, [commitment.rule]: 'failed' }))
    }
  }

  // Anonymous / error: render nothing so anonymous users still see the
  // unchanged audit conclusion page.
  if (state === 'anonymous' || state === 'error') return null

  if (state === 'loading') {
    return (
      <div className="mb-10 rounded-3xl border border-gray-200 bg-white p-6">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
          Pre-building your map…
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Wiring your archetype into windows + commitments.
        </p>
      </div>
    )
  }

  if (!data) return null

  const windows = data.dangerWindowsCreated
  const suggestions = data.suggestedCommitments

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(16,185,129,0.18)] md:p-8"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-emerald-500" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
          Pre-built for you
        </span>
      </div>
      <h3 className="text-2xl font-black leading-tight text-gray-900 md:text-3xl">
        We&rsquo;ve already set up {windows.length} danger window
        {windows.length === 1 ? '' : 's'} + {suggestions.length} suggested commitment
        {suggestions.length === 1 ? '' : 's'} based on your archetype.
      </h3>
      <p className="mt-2 max-w-xl text-sm text-gray-600">
        Tap a commitment to activate it. The windows are already saved —
        you can edit them later from /today.
      </p>

      {windows.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-500">
            Danger windows · saved
          </p>
          <ul className="mt-3 space-y-2">
            {windows.map((w) => (
              <li
                key={w.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800"
              >
                <span className="font-semibold text-gray-900">{w.label}</span>
                <span className="ml-2 text-gray-500">
                  {formatWindowDayHours(w.dayOfWeek, w.startHour, w.endHour)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-500">
            Suggested commitments · tap to activate
          </p>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s) => {
              const status = activated[s.rule] ?? 'idle'
              const isPending = status === 'pending'
              const isDone = status === 'done'
              const isFailed = status === 'failed'
              return (
                <li
                  key={s.rule}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold text-gray-900">{s.rule}</p>
                  <p className="mt-1 text-xs text-gray-600">{s.rationale}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => activateCommitment(s)}
                      disabled={isPending || isDone}
                      className={
                        isDone
                          ? 'rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white'
                          : 'rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60'
                      }
                    >
                      {isDone ? 'Activated' : isPending ? 'Activating…' : 'Activate'}
                    </button>
                    {isFailed && (
                      <span className="text-xs font-semibold text-red-600">
                        Could not activate. Try again.
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
        Windows tagged &ldquo;inferred&rdquo; — edit them on /today.
      </p>
    </motion.div>
  )
}

/**
 * Small helper used by FinalizePrebuildBlock to render a window's
 * day-of-week + hour band in human form.
 */
function formatWindowDayHours(dayOfWeek: number, startHour: number, endHour: number): string {
  const dayLabel =
    dayOfWeek === -1
      ? 'Every day'
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek] ?? 'Every day'
  return `${dayLabel} · ${formatHour12(startHour)}–${formatHour12(endHour)}`
}

function formatHour12(h: number): string {
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const meridiem = h < 12 ? 'AM' : 'PM'
  return `${h12} ${meridiem}`
}

/**
 * One-tap share of the archetype result.
 *
 * Shares a PERSONALIZED URL (/a/{slug}) so the recipient lands on a
 * dedicated archetype card with social meta (OG image renders the
 * archetype name). This is the entire viral conversion loop:
 *   share → recipient sees archetype card → recipient takes audit →
 *   recipient gets their archetype → recipient shares.
 *
 * Uses native Web Share API on mobile (Twitter/iMessage/etc. sharesheet)
 * with clipboard fallback on desktop.
 */
function ArchetypeShareButton({ archetype }: { archetype: Archetype }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = buildShareUrl(archetype)
  const shareText = `I'm ${archetype.family.name}. ${archetype.family.signature} Find yours:`

  async function handleShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `COYL · I'm ${archetype.family.name}`,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-gray-800"
      >
        {copied ? 'Copied link' : 'Share my archetype'}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M1 6h10m0 0L7 2m4 4L7 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <Link
        href={shareUrl}
        className="text-xs font-semibold text-orange-700 underline-offset-4 hover:underline"
      >
        view share card →
      </Link>
    </div>
  )
}
