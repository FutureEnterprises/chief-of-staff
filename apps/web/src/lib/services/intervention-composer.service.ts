/**
 * intervention-composer.service — LLM-native intervention copy.
 *
 * Today's interrupt and check-in copy was hardcoded in the crons
 * ("{firstName}. This is the moment.") — the AI never saw the moment
 * it was interrupting. This service composes personalized copy from
 * the user's actual context (archetype signature script, the live
 * danger window, recent interrupt outcomes, their latest detected
 * excuse, the streak) and returns it to the cron.
 *
 * FALLBACK-FIRST CONTRACT (the load-bearing design rule):
 *   composeInterrupt / composeCheckin return `null` on ANY failure —
 *   missing ANTHROPIC_API_KEY, >4s timeout, parse failure, empty or
 *   unsafe output, budget exhausted. Callers keep their original
 *   hardcoded copy as the fallback constant and use it verbatim when
 *   null comes back. Composition NEVER blocks or drops a send.
 *
 * CONCURRENCY BUDGET: crons batch users, so each run creates ONE
 * ComposerBudget capping concurrent LLM calls (default 5) and total
 * calls per run (default 50). Past the cap, compose* returns null
 * instantly and the template fires — cron duration stays bounded.
 *
 * Pure prompt/parse/safety logic lives in intervention-composer.core.ts
 * (deterministically tested); this file owns the impure edges:
 * generateText, prisma context loading, and the budget.
 */

import { generateText } from 'ai'
import { AI_MODEL, SYSTEM_PROMPTS } from '@repo/ai'
import { prisma } from '@repo/database'
import {
  getFamily,
  resolveFamily,
  type ScriptId,
  type WedgeId,
} from '@/lib/audit-archetype'
import {
  buildCheckinContextBlock,
  buildCheckinPrompt,
  buildInterruptPrompt,
  parseComposedCopy,
  CHECKIN_COPY_LIMITS,
  INTERRUPT_COPY_LIMITS,
  type CheckinComposerContext,
  type CheckinMode,
  type ComposedCopy,
  type InterruptComposerContext,
  type InterruptOutcomeSignal,
} from '@/lib/services/intervention-composer.core'

export type { ComposedCopy } from '@/lib/services/intervention-composer.core'

const COMPOSE_TIMEOUT_MS = 4_000
const DEFAULT_MAX_CONCURRENT = 5
const DEFAULT_MAX_CALLS_PER_RUN = 50

/* ──────────────────── composer budget (per cron run) ──────────────────── */

export type ComposerBudget = {
  readonly maxConcurrent: number
  readonly maxCalls: number
  used: number
  inFlight: number
  waiters: Array<() => void>
}

export function createComposerBudget(options?: {
  maxConcurrent?: number
  maxCalls?: number
}): ComposerBudget {
  return {
    maxConcurrent: options?.maxConcurrent ?? DEFAULT_MAX_CONCURRENT,
    maxCalls: options?.maxCalls ?? DEFAULT_MAX_CALLS_PER_RUN,
    used: 0,
    inFlight: 0,
    waiters: [],
  }
}

/** Returns false (skip composition) once the per-run call cap is hit. */
async function acquire(budget: ComposerBudget): Promise<boolean> {
  if (budget.used >= budget.maxCalls) return false
  budget.used++
  if (budget.inFlight < budget.maxConcurrent) {
    budget.inFlight++
    return true
  }
  await new Promise<void>((resolve) => budget.waiters.push(resolve))
  budget.inFlight++
  return true
}

function release(budget: ComposerBudget): void {
  budget.inFlight--
  const next = budget.waiters.shift()
  if (next) next()
}

/* ──────────────────── archetype resolution ──────────────────── */

/**
 * PrimaryWedge/ExcuseCategory → the six-family archetype model.
 * Mirrors the (unexported) mapping in clinician-summary/summary-data.ts;
 * EXCEPTION folds into delay and COMPENSATION into minimize, so the
 * resolver always receives one of the six scripts it understands.
 */
function wedgeFromPrimaryWedge(wedge: string | null | undefined): WedgeId {
  switch (wedge) {
    case 'WEIGHT_LOSS':
      return 'weight'
    case 'DESTRUCTIVE_BEHAVIORS':
    case 'CRAVINGS':
      return 'destructive'
    case 'CONSISTENCY':
      return 'consistency'
    case 'SPENDING':
      return 'spending'
    case 'FOCUS':
      return 'focus'
    case 'PRODUCTIVITY':
    default:
      return 'work'
  }
}

function scriptFromExcuse(excuseStyle: string | null | undefined): ScriptId {
  switch (excuseStyle) {
    case 'REWARD':
      return 'reward'
    case 'DELAY':
    case 'EXCEPTION':
      return 'delay'
    case 'COLLAPSE':
      return 'collapse'
    case 'EXHAUSTION':
      return 'exhaustion'
    case 'SOCIAL_PRESSURE':
      return 'social'
    case 'MINIMIZATION':
    case 'COMPENSATION':
    default:
      return 'minimize'
  }
}

export function archetypeForUser(
  primaryWedge: string | null | undefined,
  excuseStyle: string | null | undefined,
): { name: string; signature: string } {
  const family = getFamily(
    resolveFamily(wedgeFromPrimaryWedge(primaryWedge), 'latenight', scriptFromExcuse(excuseStyle)),
  )
  return { name: family.name, signature: family.signature }
}

/* ──────────────────── context loading ──────────────────── */

/**
 * Last 3-5 interrupt outcomes + most recent detected excuse. Two
 * bounded queries; only runs for users who already passed every guard
 * AND acquired a budget slot, so cost stays proportional to sends.
 */
async function loadUserInterruptSignals(userId: string): Promise<{
  recentOutcomes: InterruptOutcomeSignal[]
  recentExcuse: { category: string; text: string } | null
}> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [interrupts, excuse] = await Promise.all([
    prisma.productivityEvent.findMany({
      where: { userId, eventType: 'AUTOPILOT_INTERRUPTED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { createdAt: true, metadataJson: true },
    }),
    prisma.excuse.findFirst({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'desc' },
      select: { category: true, text: true },
    }),
  ])

  const recentOutcomes: InterruptOutcomeSignal[] = interrupts.map((event) => {
    const meta = event.metadataJson as { kind?: string; feedback?: string } | null
    return {
      kind: typeof meta?.kind === 'string' ? meta.kind : 'UNKNOWN',
      feedback: typeof meta?.feedback === 'string' ? meta.feedback : null,
      at: event.createdAt.toISOString(),
    }
  })

  return {
    recentOutcomes,
    recentExcuse: excuse ? { category: excuse.category, text: excuse.text.slice(0, 160) } : null,
  }
}

function localTimeLabel(timezone: string | null | undefined, now: Date): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone ?? 'UTC',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now)
  } catch {
    return now.toUTCString().slice(0, 22)
  }
}

/* ──────────────────── the generate call ──────────────────── */

async function generateCopy(
  system: string,
  prompt: string,
  limits: { titleMax: number; bodyMax: number },
): Promise<ComposedCopy | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const { text } = await generateText({
      model: AI_MODEL,
      system,
      prompt,
      maxOutputTokens: 200,
      abortSignal: AbortSignal.timeout(COMPOSE_TIMEOUT_MS),
    })
    return parseComposedCopy(text, limits)
  } catch {
    // Timeout, network, provider error — all identical to the caller:
    // fall back to the template.
    return null
  }
}

/* ──────────────────── public API ──────────────────── */

export type ComposeInterruptArgs = {
  /** Null for anonymous ScheduledInterrupt rows (no account → no history). */
  userId: string | null
  firstName: string
  windowLabel: string
  timezone?: string | null
  /** Explicit archetype (scheduled-interrupt rows carry a family slug). */
  archetype?: { name: string; signature: string } | null
  /** Otherwise derived from the user's stored wedge + excuse style. */
  primaryWedge?: string | null
  excuseStyle?: string | null
  toneMode?: string | null
  currentStreak?: number
  budget: ComposerBudget
  now?: Date
}

/**
 * Compose lock-screen interrupt copy for a user inside their danger
 * window. Returns null on any failure — caller uses its hardcoded
 * fallback verbatim.
 */
export async function composeInterrupt(args: ComposeInterruptArgs): Promise<ComposedCopy | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!(await acquire(args.budget))) return null
  try {
    const now = args.now ?? new Date()
    const archetype =
      args.archetype ?? archetypeForUser(args.primaryWedge ?? null, args.excuseStyle ?? null)
    const signals = args.userId
      ? await loadUserInterruptSignals(args.userId)
      : { recentOutcomes: [], recentExcuse: null }

    const ctx: InterruptComposerContext = {
      firstName: args.firstName,
      archetypeName: archetype?.name ?? null,
      archetypeSignature: archetype?.signature ?? null,
      windowLabel: args.windowLabel,
      localTimeLabel: localTimeLabel(args.timezone, now),
      toneMode: args.toneMode ?? null,
      currentStreak: args.currentStreak ?? 0,
      recentOutcomes: signals.recentOutcomes,
      recentExcuse: signals.recentExcuse,
    }

    return await generateCopy(
      SYSTEM_PROMPTS.interruptComposer,
      buildInterruptPrompt(ctx),
      INTERRUPT_COPY_LIMITS,
    )
  } catch {
    return null
  } finally {
    release(args.budget)
  }
}

/**
 * Compose the morning/night check-in email subject + hook for one
 * user. Loads its own bounded context (user row + last outcome).
 * Returns null on any failure — caller uses its hardcoded subject.
 */
export async function composeCheckin(
  userId: string,
  mode: CheckinMode,
  budget: ComposerBudget,
  now: Date = new Date(),
): Promise<ComposedCopy | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!(await acquire(budget))) return null
  try {
    const ctx = await loadCheckinComposerContext(userId, mode, now)
    if (!ctx) return null
    return await generateCopy(
      SYSTEM_PROMPTS.checkinComposer.replace('{MODE}', mode),
      buildCheckinPrompt(ctx),
      CHECKIN_COPY_LIMITS,
    )
  } catch {
    return null
  } finally {
    release(budget)
  }
}

/* ──────────────────── /api/chat context injection ──────────────────── */

/**
 * Per-user context block for the morning/night chat modes, injected
 * server-side into the static SYSTEM_PROMPTS.morningInterview /
 * nightReview. Small (<300 tokens), one query batch, and any error
 * returns null so the route degrades to the static prompt.
 */
export async function loadCheckinContext(
  userId: string,
  mode: CheckinMode,
  now: Date = new Date(),
): Promise<string | null> {
  try {
    const ctx = await loadCheckinComposerContext(userId, mode, now)
    return ctx ? buildCheckinContextBlock(ctx) : null
  } catch {
    return null
  }
}

async function loadCheckinComposerContext(
  userId: string,
  mode: CheckinMode,
  now: Date,
): Promise<CheckinComposerContext | null> {
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const [user, lastInterrupt, lastSlip] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        timezone: true,
        currentStreak: true,
        primaryWedge: true,
        excuseStyle: true,
        dangerWindowRecords: {
          where: { active: true },
          take: 4,
          select: { label: true, startHour: true, endHour: true },
        },
      },
    }),
    prisma.productivityEvent.findFirst({
      where: {
        userId,
        eventType: 'AUTOPILOT_INTERRUPTED',
        createdAt: { gte: twoDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      select: { metadataJson: true },
    }),
    prisma.slipRecord.findFirst({
      where: { userId, createdAt: { gte: twoDaysAgo } },
      orderBy: { createdAt: 'desc' },
      select: { recoveredAt: true, trigger: true },
    }),
  ])
  if (!user) return null

  const archetype = archetypeForUser(user.primaryWedge, user.excuseStyle)

  let recentOutcome: string | null = null
  if (lastSlip) {
    recentOutcome = lastSlip.recoveredAt
      ? `slipped${lastSlip.trigger ? ` (${lastSlip.trigger})` : ''} but recovered`
      : `slipped${lastSlip.trigger ? ` (${lastSlip.trigger})` : ''}, not yet recovered`
  } else if (lastInterrupt) {
    const meta = lastInterrupt.metadataJson as { feedback?: string } | null
    if (meta?.feedback === 'caught_me') recentOutcome = 'caught their last interrupt (held it)'
    else if (meta?.feedback === 'ignored') recentOutcome = 'ignored their last interrupt'
    else if (meta?.feedback === 'snoozed') recentOutcome = 'snoozed their last interrupt'
  }

  return {
    mode,
    firstName: user.name.trim().split(/\s+/)[0] || 'you',
    archetypeName: archetype.name,
    archetypeSignature: archetype.signature,
    windows: user.dangerWindowRecords,
    currentStreak: user.currentStreak,
    recentOutcome,
    localTimeLabel: localTimeLabel(user.timezone, now),
  }
}
