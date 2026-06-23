import { generateText } from 'ai'
import { AI_MODEL_FAST, SYSTEM_PROMPTS } from '@repo/ai'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { classifyState, type InterruptKind, type UserState } from '@/lib/user-state'
import { guardInterrupt, recordInterrupt } from '@/lib/interrupt-guard'
import { sendWebPushForUser } from '@/lib/web-push'
import { shouldFire } from '@/lib/notification-prefs'
import { isUserCoachingPathClosed } from '@/lib/rap/store'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 250
const MIN_CONFIDENCE_TO_SEND = 0.55

type RunOptions = {
  now?: Date
  dryRun?: boolean
  generateCopy?: boolean
  limit?: number
}

type AgentOutcome = {
  processed: number
  candidates: number
  fired: number
  suppressed: number
  errored: number
  dryRun: boolean
  decisions: AgentDecision[]
}

type AgentDecision = {
  userId: string
  trigger?: ProactiveTrigger
  state?: UserState
  kind?: InterruptKind
  decision: 'candidate' | 'fired' | 'dry_run' | 'suppressed' | 'error'
  reason?: string
  detail?: string
  confidence?: number
  channels?: string[]
}

type ProactiveTrigger = 'danger_window' | 'silent_reentry'

type Candidate = {
  trigger: ProactiveTrigger
  kind: InterruptKind
  state: UserState
  idempotencyKey?: string
  deepLinkPath: string
  context: Record<string, unknown>
}

type InterventionCopy = {
  title: string
  body: string
  emailSubject: string
  emailText: string
  reason: string
  confidence: number
  source: 'llm' | 'fallback'
}

type AgentUser = Awaited<ReturnType<typeof loadCandidateUsers>>[number]

/**
 * Internal proactive agent loop.
 *
 * Cron wakes this service; the service decides whether an LLM should reach
 * the user. This is the bridge between "chatbot waits" and "consented AI
 * shows up at the moment it can help."
 */
export async function runProactiveAgent(options: RunOptions = {}): Promise<AgentOutcome> {
  const now = options.now ?? new Date()
  const dryRun = options.dryRun ?? false
  const generateCopy = options.generateCopy ?? true
  const limit = normalizeLimit(options.limit)
  const users = await loadCandidateUsers(limit)

  const outcome: AgentOutcome = {
    processed: users.length,
    candidates: 0,
    fired: 0,
    suppressed: 0,
    errored: 0,
    dryRun,
    decisions: [],
  }

  const resendKey = process.env.RESEND_API_KEY
  const resend = resendKey ? new Resend(resendKey) : null
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  for (const user of users) {
    try {
      if (await isUserCoachingPathClosed(user.id)) {
        outcome.suppressed++
        outcome.decisions.push({
          userId: user.id,
          decision: 'suppressed',
          reason: 'rap_closed',
        })
        continue
      }

      const candidate = chooseCandidate(user, now)
      if (!candidate) continue
      outcome.candidates++

      if (
        candidate.trigger === 'danger_window' &&
        !shouldFire({
          type: 'dangerWindow',
          prefs: user.notificationPrefs,
          timezone: user.timezone,
          now,
        })
      ) {
        outcome.suppressed++
        outcome.decisions.push({
          userId: user.id,
          trigger: candidate.trigger,
          state: candidate.state,
          kind: candidate.kind,
          decision: 'suppressed',
          reason: 'notification_prefs',
        })
        continue
      }

      const guard = await guardInterrupt({
        userId: user.id,
        state: candidate.state,
        kind: candidate.kind,
        timezone: user.timezone,
        idempotencyKey: candidate.idempotencyKey,
      }, now)

      if (!guard.allow) {
        outcome.suppressed++
        outcome.decisions.push({
          userId: user.id,
          trigger: candidate.trigger,
          state: candidate.state,
          kind: candidate.kind,
          decision: 'suppressed',
          reason: guard.reason,
          detail: guard.detail,
        })
        continue
      }

      const intervention = generateCopy
        ? await generateInterventionCopy(user, candidate, now)
        : fallbackCopy(user, candidate)

      if (intervention.confidence < MIN_CONFIDENCE_TO_SEND) {
        outcome.suppressed++
        outcome.decisions.push({
          userId: user.id,
          trigger: candidate.trigger,
          state: candidate.state,
          kind: candidate.kind,
          decision: 'suppressed',
          reason: 'low_confidence',
          confidence: intervention.confidence,
        })
        continue
      }

      const channels = plannedChannels(user, Boolean(resend))

      if (dryRun) {
        outcome.decisions.push({
          userId: user.id,
          trigger: candidate.trigger,
          state: candidate.state,
          kind: candidate.kind,
          decision: 'dry_run',
          reason: intervention.reason,
          confidence: intervention.confidence,
          channels,
        })
        continue
      }

      const interrupt = await recordInterrupt({
        userId: user.id,
        kind: candidate.kind,
        idempotencyKey: candidate.idempotencyKey,
        channel: channels.join('+') || 'none',
        metadata: {
          source: 'proactive_agent',
          trigger: candidate.trigger,
          state: candidate.state,
          reason: intervention.reason,
          confidence: intervention.confidence,
          copySource: intervention.source,
          context: candidate.context,
        },
      })

      await dispatchIntervention({
        user,
        candidate,
        intervention,
        interruptId: interrupt.id,
        resend,
        fromEmail,
      })

      outcome.fired++
      outcome.decisions.push({
        userId: user.id,
        trigger: candidate.trigger,
        state: candidate.state,
        kind: candidate.kind,
        decision: 'fired',
        reason: intervention.reason,
        confidence: intervention.confidence,
        channels,
      })
    } catch (err) {
      outcome.errored++
      outcome.decisions.push({
        userId: user.id,
        decision: 'error',
        reason: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  return outcome
}

async function loadCandidateUsers(limit: number) {
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  return prisma.user.findMany({
    where: {
      onboardingCompleted: true,
      planType: { in: ['FREE', 'CORE', 'PLUS', 'PREMIUM', 'TEAM'] },
      OR: [
        { lastActiveAt: { lt: twoDaysAgo } },
        { dangerWindowRecords: { some: { active: true } } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      planType: true,
      createdAt: true,
      lastActiveAt: true,
      currentStreak: true,
      longestStreak: true,
      primaryWedge: true,
      excuseStyle: true,
      toneMode: true,
      driveProfile: true,
      replacementMenu: true,
      expoPushToken: true,
      webPushSubscription: true,
      notificationPrefs: true,
      dangerWindowRecords: {
        where: { active: true },
        select: {
          id: true,
          label: true,
          dayOfWeek: true,
          startHour: true,
          endHour: true,
          triggerType: true,
          source: true,
        },
      },
      slipRecords: {
        where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, createdAt: true, recoveredAt: true, trigger: true },
      },
    },
    orderBy: { lastActiveAt: 'asc' },
    take: limit,
  })
}

function chooseCandidate(user: AgentUser, now: Date): Candidate | null {
  const local = localClock(user.timezone, now)
  const matchingWindow = user.dangerWindowRecords.find((window) => {
    const dayMatches = window.dayOfWeek === -1 || window.dayOfWeek === local.weekday
    return dayMatches && local.hour >= window.startHour && local.hour < window.endHour
  })
  const lastSlip = user.slipRecords[0]
  const state = classifyState({
    onboardingCompleted: true,
    lastActiveAt: user.lastActiveAt,
    lastSlipAt: lastSlip?.createdAt ?? null,
    lastSlipRecoveredAt: lastSlip?.recoveredAt ?? null,
    insideDangerWindow: Boolean(matchingWindow),
    currentStreak: user.currentStreak,
  }, now)

  if (matchingWindow && state === 'FLARING') {
    return {
      trigger: 'danger_window',
      kind: 'DANGER_WINDOW',
      state,
      deepLinkPath: '/rescue?from=proactive-agent&t=DANGER_WINDOW',
      context: {
        windowId: matchingWindow.id,
        windowLabel: matchingWindow.label,
        triggerType: matchingWindow.triggerType,
        localHour: local.hour,
      },
    }
  }

  if (state === 'SILENT' || state === 'DISAPPEARED') {
    const daysSilent = Math.floor(
      (now.getTime() - user.lastActiveAt.getTime()) / (24 * 60 * 60 * 1000),
    )
    const kind: InterruptKind =
      state === 'DISAPPEARED'
        ? 'SILENT_FINAL'
        : daysSilent >= 5
          ? 'SILENT_DIRECT'
          : 'SILENT_SOFT'

    return {
      trigger: 'silent_reentry',
      kind,
      state,
      idempotencyKey: `proactive-agent:silent:${kind}:${daysSilent}`,
      deepLinkPath: '/today?from=proactive-agent',
      context: {
        daysSilent,
        primaryWedge: user.primaryWedge,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      },
    }
  }

  return null
}

async function generateInterventionCopy(
  user: AgentUser,
  candidate: Candidate,
  now: Date,
): Promise<InterventionCopy> {
  try {
    const { text } = await generateText({
      model: AI_MODEL_FAST,
      system: SYSTEM_PROMPTS.proactiveCheckin,
      prompt: JSON.stringify({
        now: now.toISOString(),
        user: {
          firstName: firstName(user.name),
          timezone: user.timezone,
          state: candidate.state,
          toneMode: user.toneMode,
          primaryWedge: user.primaryWedge,
          excuseStyle: user.excuseStyle,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          lastActiveAt: user.lastActiveAt.toISOString(),
          driveProfile: user.driveProfile,
          replacementMenu: user.replacementMenu,
        },
        candidate: {
          trigger: candidate.trigger,
          kind: candidate.kind,
          context: candidate.context,
          actionUrl: `https://coyl.ai${candidate.deepLinkPath}`,
        },
      }),
    })

    return sanitizeCopy(parseJsonObject(text), fallbackCopy(user, candidate), 'llm')
  } catch (err) {
    console.warn('[proactive-agent] llm copy failed', {
      userId: user.id,
      err: err instanceof Error ? err.message : 'unknown',
    })
    return fallbackCopy(user, candidate)
  }
}

function fallbackCopy(user: AgentUser, candidate: Candidate): InterventionCopy {
  const name = firstName(user.name)
  const actionUrl = `https://coyl.ai${candidate.deepLinkPath}`

  if (candidate.trigger === 'danger_window') {
    const label = String(candidate.context.windowLabel ?? 'your danger window')
    return {
      title: `${name}. This is the moment.`,
      body: `${label}. Open before the script runs.`,
      emailSubject: `${name}. You're in the window.`,
      emailText: [
        `${name},`,
        '',
        `${label} is open right now.`,
        'This is the moment COYL is built to catch: not later, not tomorrow, now.',
        '',
        `Open rescue: ${actionUrl}`,
        '',
        '- COYL',
      ].join('\n'),
      reason: `Matched active danger window: ${label}`,
      confidence: 0.72,
      source: 'fallback',
    }
  }

  const daysSilent = Number(candidate.context.daysSilent ?? 2)
  return {
    title: `${name}. You stopped showing up.`,
    body: `${daysSilent} days silent. One honest check-in gets you back.`,
    emailSubject: `${name}, you stopped showing up.`,
    emailText: [
      `${name},`,
      '',
      `${daysSilent} days without a check-in.`,
      'That is not a character flaw. It is a pattern. The way back is small: one honest sentence.',
      '',
      `Check in: ${actionUrl}`,
      '',
      '- COYL',
    ].join('\n'),
    reason: `User silent for ${daysSilent} days`,
    confidence: 0.68,
    source: 'fallback',
  }
}

function sanitizeCopy(
  raw: Record<string, unknown>,
  fallback: InterventionCopy,
  source: InterventionCopy['source'],
): InterventionCopy {
  const title = cleanString(raw.title, fallback.title, 52)
  const body = cleanString(raw.body, fallback.body, 120)
  const emailSubject = cleanString(raw.emailSubject, fallback.emailSubject, 70)
  const emailText = cleanString(raw.emailText, fallback.emailText, 900)
  const reason = cleanString(raw.reason, fallback.reason, 120)
  const confidence =
    typeof raw.confidence === 'number' && Number.isFinite(raw.confidence)
      ? clamp(raw.confidence, 0, 1)
      : fallback.confidence

  return { title, body, emailSubject, emailText, reason, confidence, source }
}

async function dispatchIntervention(args: {
  user: AgentUser
  candidate: Candidate
  intervention: InterventionCopy
  interruptId: string
  resend: Resend | null
  fromEmail: string
}) {
  const data = {
    type: 'proactive_agent',
    trigger: args.candidate.trigger,
    kind: args.candidate.kind,
    interruptId: args.interruptId,
    deepLinkPath: args.candidate.deepLinkPath,
  }

  if (args.user.expoPushToken) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: args.user.expoPushToken,
        sound: 'default',
        title: args.intervention.title,
        body: args.intervention.body,
        data,
        priority: 'high',
        categoryId: 'COYL_INTERRUPT',
        channelId: 'coyl-interrupts',
      }),
    }).catch((err) => {
      console.warn('[proactive-agent] expo push failed', {
        userId: args.user.id,
        err: err instanceof Error ? err.message : 'unknown',
      })
    })
  }

  await sendWebPushForUser({
    userId: args.user.id,
    subscription: args.user.webPushSubscription,
    payload: {
      title: args.intervention.title,
      body: args.intervention.body,
      data,
    },
  })

  if (args.resend) {
    await args.resend.emails.send({
      from: args.fromEmail,
      to: args.user.email,
      subject: args.intervention.emailSubject,
      text: args.intervention.emailText,
    }).catch((err) => {
      console.warn('[proactive-agent] email failed', {
        userId: args.user.id,
        err: err instanceof Error ? err.message : 'unknown',
      })
    })
  }
}

function plannedChannels(user: AgentUser, emailConfigured: boolean): string[] {
  const channels: string[] = []
  if (user.expoPushToken) channels.push('expo')
  if (user.webPushSubscription) channels.push('web')
  if (emailConfigured) channels.push('email')
  return channels
}

function localClock(timezone: string | null, now: Date): { weekday: number; hour: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone ?? 'UTC',
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now)
    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    }
    return { weekday: dayMap[weekday] ?? 1, hour }
  } catch {
    return { weekday: now.getUTCDay(), hour: now.getUTCHours() }
  }
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  const parsed = JSON.parse(withoutFence)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {}
}

function cleanString(raw: unknown, fallback: string, max: number): string {
  if (typeof raw !== 'string') return fallback.slice(0, max)
  const cleaned = raw.replace(/\s+/g, ' ').trim()
  return (cleaned || fallback).slice(0, max)
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'you'
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function normalizeLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_LIMIT
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)))
}
