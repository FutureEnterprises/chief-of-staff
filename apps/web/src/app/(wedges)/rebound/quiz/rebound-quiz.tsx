'use client'

/**
 * ReboundQuiz — the consumer Rebound funnel entry.
 *
 * Per the founder strategic decision to focus consumer-facing on the
 * GLP-1 anti-regain wedge: 3-question quiz that places visitors in
 * one of four rebound families (Night / Weekend / Stress / Reward
 * Rebounder). Shorter, sharper, more GLP-1-specific than /audit's
 * generic 6-archetype taxonomy.
 *
 * Visual treatment matches the cinematic system: warm-charcoal scrim
 * background on the intro, dark archetype card on the reveal, share
 * buttons in the platform-native pattern (X / Threads / copy-link).
 *
 * Telemetry: fires the same audit_funnel_events beacons as /audit
 * (started / completed / signup_started) so the admin/audit-funnel
 * dashboard can compare Rebound conversion against generic-audit
 * conversion in one view.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  STATUS_OPTIONS,
  MOMENT_OPTIONS,
  SCRIPT_OPTIONS,
  buildReboundArchetype,
  buildReboundShareUrl,
  type ReboundStatus,
  type ReboundMoment,
  type ReboundScript,
} from '@/lib/rebound-archetype'
import {
  CinematicScrim,
  CinematicEyebrow,
  CinematicBody,
} from '@/components/cinematic'

// ───────────────────── funnel telemetry ─────────────────────

const AUDIT_SESSION_COOKIE = 'coyl_audit_sid'
const AUDIT_SESSION_TTL_HOURS = 24

function getOrCreateAuditSession(): string {
  if (typeof document === 'undefined') return ''
  const existing = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${AUDIT_SESSION_COOKIE}=`))
    ?.split('=')[1]
  if (existing) return existing
  const fresh =
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)) + Date.now().toString(36)
  const maxAge = AUDIT_SESSION_TTL_HOURS * 60 * 60
  document.cookie = `${AUDIT_SESSION_COOKIE}=${fresh}; max-age=${maxAge}; path=/; SameSite=Lax`
  return fresh
}

function fireFunnelEvent(
  kind: 'started' | 'completed' | 'signup_started',
  payload: {
    sessionId: string
    archetypeFamily?: string
    archetypeSlug?: string
    source?: string
  },
): void {
  if (typeof window === 'undefined') return
  const body = JSON.stringify({ kind, ...payload, source: payload.source ?? 'rebound-quiz' })
  try {
    if ('sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/v1/audit/event', blob)
      return
    }
  } catch {
    // fall through
  }
  void fetch('/api/v1/audit/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // swallow
  })
}

// ───────────────────── component ─────────────────────

export function ReboundQuiz() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [status, setStatus] = useState<ReboundStatus | null>(null)
  const [moment, setMoment] = useState<ReboundMoment | null>(null)
  const [script, setScript] = useState<ReboundScript | null>(null)
  const sessionIdRef = useRef<string>('')
  const startedFiredRef = useRef(false)
  const completedFiredRef = useRef(false)

  useEffect(() => {
    sessionIdRef.current = getOrCreateAuditSession()
  }, [])

  useEffect(() => {
    if (step >= 1 && !startedFiredRef.current && sessionIdRef.current) {
      startedFiredRef.current = true
      fireFunnelEvent('started', { sessionId: sessionIdRef.current })
    }
  }, [step])

  useEffect(() => {
    if (
      status &&
      moment &&
      script &&
      !completedFiredRef.current &&
      sessionIdRef.current
    ) {
      completedFiredRef.current = true
      const a = buildReboundArchetype(status, moment, script)
      fireFunnelEvent('completed', {
        sessionId: sessionIdRef.current,
        archetypeFamily: a.family.name,
        archetypeSlug: a.family.slug,
      })
    }
  }, [status, moment, script])

  function reset() {
    startedFiredRef.current = false
    completedFiredRef.current = false
    setStep(0)
    setStatus(null)
    setMoment(null)
    setScript(null)
  }

  // ─── INTRO (step 0) ──────────────────────────────────────
  if (step === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CinematicScrim
          bleedToCream
          className="-mx-6 -mt-24 px-6 pt-32 pb-24 md:-mx-12 md:px-12 md:pt-40 md:pb-32"
        >
          <div className="mx-auto max-w-4xl space-y-10">
            <CinematicEyebrow label="60 seconds · 3 questions · no signup" />
            <h1 className="font-serif text-5xl font-normal leading-[0.98] tracking-[-0.03em] text-[#f8f1e4] md:text-7xl">
              What is your{' '}
              <span className="italic text-orange-300">rebound pattern?</span>
            </h1>
            <p className="max-w-2xl font-serif text-2xl font-normal italic leading-[1.35] text-[#f8f1e4] md:text-3xl">
              The shot quiets hunger. We diagnose the pattern underneath
              so the weight you lost stays off.
            </p>
            <CinematicBody>
              Four rebound families. Each one is a specific moment, a
              specific script, and a specific risk window. The quiz takes
              60 seconds and you get a shareable result card on the other
              side.
            </CinematicBody>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-base font-bold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] transition-transform hover:-translate-y-0.5"
            >
              Start the quiz
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M1 7h12m0 0L8 2m5 5L8 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </CinematicScrim>
      </motion.div>
    )
  }

  // ─── Q1: STATUS ──────────────────────────────────────────
  if (step === 1 && !status) {
    return (
      <StepWrap
        index={1}
        title="Where are you in your GLP-1 journey?"
        subtitle="Ozempic, Wegovy, Zepbound, semaglutide, tirzepatide — same wedge."
      >
        <div className="grid grid-cols-1 gap-3">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setStatus(opt.id)
                setStep(2)
              }}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <p className="text-lg font-semibold text-gray-900 group-hover:text-orange-700">
                {opt.label}
              </p>
              <p className="mt-1 text-sm text-gray-600">{opt.copy}</p>
            </button>
          ))}
        </div>
      </StepWrap>
    )
  }

  // ─── Q2: MOMENT (the family-mapping question) ────────────
  if (step === 2 && !moment) {
    return (
      <StepWrap
        index={2}
        title="When does the script come back hardest?"
        subtitle="The hour the shot stopped doing the work for you."
      >
        <div className="grid grid-cols-1 gap-3">
          {MOMENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setMoment(opt.id)
                setStep(3)
              }}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <p className="text-lg font-semibold text-gray-900 group-hover:text-orange-700">
                {opt.label}
              </p>
            </button>
          ))}
        </div>
      </StepWrap>
    )
  }

  // ─── Q3: SCRIPT ──────────────────────────────────────────
  if (step === 3 && !script) {
    return (
      <StepWrap
        index={3}
        title="What do you tell yourself right before?"
        subtitle="The sentence in your head the moment you’re about to fold."
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SCRIPT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setScript(opt.id)}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <p className="text-lg font-semibold italic text-orange-700">{opt.quote}</p>
            </button>
          ))}
        </div>
      </StepWrap>
    )
  }

  // ─── RESULT ──────────────────────────────────────────────
  if (status && moment && script) {
    const archetype = buildReboundArchetype(status, moment, script)
    return <ReboundResult archetype={archetype} onReset={reset} />
  }

  return null
}

// ───────────────────── result reveal ─────────────────────

function ReboundResult({
  archetype,
  onReset,
}: {
  archetype: ReturnType<typeof buildReboundArchetype>
  onReset: () => void
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="result"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* The archetype card — cinematic dark surface so the moment of
            recognition lands with the same emotional weight as /audit's
            result card. */}
        <div className="relative isolate mb-8 overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0f0e0c] p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55),0_10px_30px_-10px_rgba(255,102,0,0.25)] md:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage: `
                radial-gradient(50% 60% at 18% 32%, rgba(255, 138, 76, 0.22) 0%, transparent 70%),
                radial-gradient(45% 55% at 82% 80%, rgba(255, 102, 0, 0.18) 0%, transparent 70%)
              `,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
            }}
          />

          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-400">
            You’re
          </p>
          <p className="mt-4 flex flex-wrap items-baseline gap-4">
            <span
              aria-hidden
              className="inline-flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30 md:h-16 md:w-16"
            >
              <archetype.family.Icon className="h-8 w-8 md:h-9 md:w-9" strokeWidth={1.8} />
            </span>
            <span className="font-serif text-[clamp(2.4rem,6vw,4.2rem)] italic font-normal leading-[0.98] tracking-[-0.025em] text-[#f8f1e4]">
              {archetype.family.name}.
            </span>
          </p>
          <p className="mt-6 max-w-xl text-base leading-[1.6] text-[#d9d1c2] md:text-lg">
            {archetype.family.essence}
          </p>
          <p className="mt-5 font-serif text-xl italic leading-snug text-orange-300 md:text-2xl">
            {archetype.family.signature}
          </p>
          <p className="mt-3 text-sm leading-[1.6] text-[#a59a87]">
            {archetype.family.prevalenceCopy}
          </p>
          <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#a59a87]">
              Your highest-risk window
            </p>
            <p className="mt-2 text-base font-semibold text-[#f5efe6]">
              {archetype.family.riskWindow}
            </p>
          </div>

          <ReboundShareButtons family={archetype.family.slug} familyName={archetype.family.name} signature={archetype.family.signature} />
        </div>

        {/* Your three interrupts */}
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-orange-500" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
            Your three interrupts
          </span>
        </div>
        <h2 className="mb-6 max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          The script COYL would catch — for you, specifically.
        </h2>
        <p className="mb-10 max-w-2xl text-base leading-[1.7] text-gray-700">
          Not daily reminders. Three precision sentences fired at the
          3-second window between impulse and action.
        </p>

        <div className="mb-12 space-y-3">
          {archetype.family.interrupts.map((text, i) => (
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

        {/* Lock-it-in CTA */}
        <div className="mb-10 rounded-3xl border border-orange-300 bg-gradient-to-br from-orange-50 via-white to-white p-6 md:p-8">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The next step
          </p>
          <h3 className="mt-4 font-serif text-2xl font-normal italic tracking-[-0.01em] text-gray-900 md:text-3xl">
            Lock in tonight&rsquo;s interrupt.
          </h3>
          <p className="mt-4 max-w-xl text-base leading-[1.7] text-gray-700">
            COYL Rebound fires the three interrupts above at your
            highest-risk window — every night, every weekend, every
            stress event, every reward moment. $29/mo or $199/year as a
            commitment to yourself.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-up?ref=rebound-quiz-result"
              onClick={() =>
                fireFunnelEvent('signup_started', {
                  sessionId: getOrCreateAuditSession(),
                  archetypeFamily: archetype.family.name,
                  archetypeSlug: archetype.family.slug,
                  source: 'rebound-quiz-result',
                })
              }
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] transition-transform hover:-translate-y-0.5"
            >
              Start Rebound — $29/mo
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/rebound"
              className="text-sm font-semibold text-orange-700 underline-offset-4 hover:underline"
            >
              Back to the Rebound overview
            </Link>
            <button
              onClick={onReset}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Run it again
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ───────────────────── share buttons ─────────────────────

function ReboundShareButtons({
  family,
  familyName,
  signature,
}: {
  family: string
  familyName: string
  signature: string
}) {
  const [copied, setCopied] = useState(false)
  const shareUrl = buildReboundShareUrl(family as Parameters<typeof buildReboundShareUrl>[0])
  const shareText = `I’m ${familyName}. ${signature} — the script COYL Rebound catches when the GLP-1 gets quiet.\n\nFind your rebound pattern:`
  const shareTextWithUrl = `${shareText} ${shareUrl}`

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `COYL Rebound · I'm ${familyName}`,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // user cancelled → fall through to clipboard
      }
    }
    await handleCopy()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareTextWithUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  const twitterUrl =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` +
    `&url=${encodeURIComponent(shareUrl)}`
  const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(shareTextWithUrl)}`

  return (
    <div className="mt-7 flex flex-wrap items-center gap-2">
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.35)] transition-transform hover:-translate-y-0.5"
      >
        Share my rebound type
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M1 6h10m0 0L7 2m4 4L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#e7dccb] transition-colors hover:border-orange-300 hover:text-orange-300"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Post on X
      </a>
      <a
        href={threadsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#e7dccb] transition-colors hover:border-orange-300 hover:text-orange-300"
      >
        Threads
      </a>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#e7dccb] transition-colors hover:border-orange-300 hover:text-orange-300"
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}

// ───────────────────── step wrap ─────────────────────

function StepWrap({
  index,
  title,
  subtitle,
  children,
}: {
  index: 1 | 2 | 3
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      key={`step-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pt-2"
    >
      <div className="mb-8 flex items-center gap-3">
        <span className="h-px w-10 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          Question {index} of 3 · Regain Risk Quiz
        </span>
      </div>
      <h1 className="mb-4 max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.025em] text-gray-900 md:text-5xl">
        {title}
      </h1>
      <p className="mb-10 max-w-2xl text-base leading-[1.65] text-gray-600">
        {subtitle}
      </p>
      {children}
    </motion.div>
  )
}
