'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  buildArchetype,
  buildShareUrl,
  type WedgeId,
  type WindowId,
  type ScriptId,
  type Archetype,
} from '@/lib/audit-archetype'

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

/** Map the three answers to three specific interrupt moments COYL would fire. */
function buildInterrupts(wedge: WedgeId, window: WindowId, script: ScriptId): string[] {
  const scriptResponse: Record<ScriptId, string> = {
    reward: 'You don\u2019t deserve this. You\u2019re avoiding.',
    delay: 'Tomorrow is the script. Today is the break.',
    collapse: 'You didn\u2019t blow it. You\u2019re about to blow it. There\u2019s a difference.',
    minimize: 'One time is the pattern. Not the exception.',
    exhaustion: 'Tired is a signal, not a verdict. 2 minutes, then decide.',
    social: 'You said yes to them. Say no to the loop.',
  }

  const wedgeMoment: Record<WedgeId, string> = {
    weight: 'At the fridge. Before the second trip.',
    work: 'In the draft. Before you close the tab.',
    destructive: 'At the trigger. Before the 3rd click.',
    consistency: 'At the restart. Before you move the start date again.',
    spending: 'At checkout. Before you hit confirm.',
    focus: 'At the tab switch. Before the 10th open of the same app.',
  }

  const windowFollowup: Record<WindowId, string> = {
    morning: '8 AM follow-up: "Yesterday\u2019s you bet on today\u2019s you. Show up."',
    afternoon: '2 PM check: "The afternoon fold is the one you don\u2019t see coming."',
    afterwork: '7 PM interrupt: "This is the hour. The one you always lose."',
    latenight: '10 PM interrupt: "Decisions you make after 10 PM aren\u2019t decisions. They\u2019re reflexes."',
  }

  return [
    wedgeMoment[wedge],
    scriptResponse[script],
    windowFollowup[window],
  ]
}

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
  if (step === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-orange-500" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
            Autopilot audit
          </span>
        </div>
        <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
          You don&rsquo;t have<br />
          <span className="text-orange-600">a discipline problem.</span>
        </h1>
        <p className="mb-4 max-w-2xl text-lg text-gray-600">
          You have three specific moments where the same script always runs. Find them in 60 seconds.
          No signup. COYL turns them into interrupt protocols built for you.
        </p>
        <p className="mb-10 text-sm text-gray-500">3 questions &middot; ~60 seconds &middot; no email needed</p>

        <button
          onClick={() => setStep(1)}
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start the audit
        </button>
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

          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-up?ref=audit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Build my interrupt protocol
            </Link>
            <button
              onClick={reset}
              className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
            >
              Run it again
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
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
