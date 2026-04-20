import { prisma } from '@repo/database'
import type { UserState, InterruptKind } from './user-state'
import { isInterruptAllowed } from './user-state'

/**
 * Interrupt guard \u2014 the gate every push/email/callout passes through
 * before being delivered to the user.
 *
 * Without this, crons fire in isolation, the user gets stacked
 * notifications, and the "this thing knows me too well" product energy
 * flips into "this thing is watching me." Three layers:
 *
 *   1. STATE policy     \u2014 is this interrupt kind allowed from the
 *                        user's current state? (user-state.ts)
 *   2. COOLDOWN         \u2014 has the same interrupt fired recently?
 *   3. SUPPRESSION      \u2014 recent user action that signals "I'm fine"?
 *   4. RATE CAP         \u2014 how many pings in the last hour / day total?
 *   5. QUIET HOURS      \u2014 don't fire while the user's phone should be off.
 *
 * Every rule is checked before delivery. The decision object explains
 * exactly why a fire was suppressed for logging + future debugging.
 */

export type InterruptDecision =
  | { allow: true }
  | { allow: false; reason: SuppressReason; detail?: string }

export type SuppressReason =
  | 'state_policy'   /* interrupt not allowed in this user state */
  | 'cooldown'       /* same kind fired too recently */
  | 'rate_cap'       /* total pings in window exceeded */
  | 'recent_action'  /* user just did something that means "I'm fine" */
  | 'quiet_hours'    /* local time is in the user's sleep window */
  | 'identical'      /* idempotency: this exact interrupt already ran */

export type InterruptGuardInput = {
  userId: string
  state: UserState
  kind: InterruptKind
  /** User's IANA timezone \u2014 used for quiet-hours check. */
  timezone?: string | null
  /** Optional idempotency key (e.g. slip ID + wave label) */
  idempotencyKey?: string
}

// ─────────────────────── Cooldown / suppression config ───────────────────────

/**
 * How long we wait between firings of the same interrupt kind for one user.
 * Tuned per kind: a danger-window ping is cheap to re-fire (different window
 * each time); a silence ping is emotionally loud and should NEVER spam.
 */
const COOLDOWN_MS: Record<InterruptKind, number> = {
  DANGER_WINDOW: 2 * 60 * 60 * 1000,        // 2h
  POST_SLIP_2H: Number.POSITIVE_INFINITY,   // each slip only gets this ping once ever
  POST_SLIP_24H: Number.POSITIVE_INFINITY,  // ditto (idempotent via slip.id)
  SILENT_SOFT: 3 * 24 * 60 * 60 * 1000,     // 3 days
  SILENT_DIRECT: 3 * 24 * 60 * 60 * 1000,
  SILENT_FINAL: 7 * 24 * 60 * 60 * 1000,    // 1 week
}

/**
 * "Recent action" suppressors \u2014 if the user did ANY of these in the last
 * N minutes, don't fire an interrupt. Signal is: they're already engaged.
 */
const RECENT_ACTION_WINDOW_MS = 90 * 60 * 1000 // 90 minutes
const RECENT_ACTION_EVENTS: readonly string[] = [
  'CHECKIN_COMPLETED',
  'RESCUE_TRIGGERED',
  'RESCUE_RESOLVED',
  'DECISION_MADE',
  'CALLOUT_VIEWED',
  'TASK_COMPLETED',
  'MORNING_REVIEW',
  'NIGHT_REVIEW',
] as const

/**
 * Hard cap on total interrupt pings per user per 24-hour window.
 * Past this, we stay quiet regardless \u2014 trust preservation.
 */
const DAILY_RATE_CAP = 4

/**
 * Quiet hours: 23:00 \u2192 07:00 local time. No pings during sleep.
 * (Can be user-customized later via userSettings; this is the default.)
 */
const QUIET_HOURS_START = 23
const QUIET_HOURS_END = 7

// ─────────────────────── Guard entry point ───────────────────────

export async function guardInterrupt(
  input: InterruptGuardInput,
  now: Date = new Date(),
): Promise<InterruptDecision> {
  // 1. State policy
  if (!isInterruptAllowed(input.state, input.kind)) {
    return { allow: false, reason: 'state_policy', detail: `state=${input.state}` }
  }

  // 2. Quiet hours (local to user's timezone)
  const localHour = currentLocalHour(input.timezone, now)
  if (isQuietHour(localHour)) {
    return { allow: false, reason: 'quiet_hours', detail: `local_hour=${localHour}` }
  }

  // 3. Idempotency — if caller provided a key, has this exact interrupt fired?
  if (input.idempotencyKey) {
    const existing = await prisma.productivityEvent.findFirst({
      where: {
        userId: input.userId,
        eventType: 'AUTOPILOT_INTERRUPTED',
        eventValue: input.idempotencyKey,
      },
      select: { id: true },
    })
    if (existing) return { allow: false, reason: 'identical' }
  }

  // 4. Recent-action suppression
  const recentAction = await prisma.productivityEvent.findFirst({
    where: {
      userId: input.userId,
      eventType: { in: RECENT_ACTION_EVENTS as unknown as string[] } as never,
      createdAt: { gte: new Date(now.getTime() - RECENT_ACTION_WINDOW_MS) },
    },
    select: { id: true, eventType: true },
  })
  if (recentAction) {
    return {
      allow: false,
      reason: 'recent_action',
      detail: String(recentAction.eventType),
    }
  }

  // 5. Per-kind cooldown (unless infinite = idempotency-gated already)
  const cooldown = COOLDOWN_MS[input.kind]
  if (Number.isFinite(cooldown)) {
    const recentSame = await prisma.productivityEvent.findFirst({
      where: {
        userId: input.userId,
        eventType: 'AUTOPILOT_INTERRUPTED',
        metadataJson: { path: ['kind'], equals: input.kind },
        createdAt: { gte: new Date(now.getTime() - cooldown) },
      },
      select: { id: true },
    })
    if (recentSame) {
      return { allow: false, reason: 'cooldown', detail: `kind=${input.kind}` }
    }
  }

  // 6. Daily rate cap across ALL interrupt kinds
  const last24h = await prisma.productivityEvent.count({
    where: {
      userId: input.userId,
      eventType: 'AUTOPILOT_INTERRUPTED',
      createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
  })
  if (last24h >= DAILY_RATE_CAP) {
    return { allow: false, reason: 'rate_cap', detail: `${last24h} in 24h` }
  }

  return { allow: true }
}

/**
 * Record that an interrupt was delivered. Call AFTER successful send
 * (push or email). This is what populates the cooldown/rate-cap checks
 * for future calls.
 */
export async function recordInterrupt(args: {
  userId: string
  kind: InterruptKind
  idempotencyKey?: string
  channel: 'push' | 'email' | 'push+email' | 'in-app'
  metadata?: Record<string, unknown>
}): Promise<void> {
  await prisma.productivityEvent.create({
    data: {
      userId: args.userId,
      eventType: 'AUTOPILOT_INTERRUPTED',
      eventValue: args.idempotencyKey ?? args.kind,
      metadataJson: {
        kind: args.kind,
        channel: args.channel,
        ...(args.metadata ?? {}),
      },
    },
  })
}

// ─────────────────────── Helpers ───────────────────────

function currentLocalHour(tz: string | null | undefined, now: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz ?? 'UTC',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now)
    const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '0'
    return parseInt(hourPart, 10)
  } catch {
    // Invalid timezone \u2014 fall back to UTC rather than firing at bad time.
    return now.getUTCHours()
  }
}

function isQuietHour(hour: number): boolean {
  // Window wraps past midnight: 23 \u2192 24/0 \u2192 1..6
  if (QUIET_HOURS_START > QUIET_HOURS_END) {
    return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END
  }
  return hour >= QUIET_HOURS_START && hour < QUIET_HOURS_END
}
