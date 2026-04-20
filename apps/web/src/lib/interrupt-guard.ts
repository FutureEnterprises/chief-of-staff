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
 * Intensity tier per kind. Per COYL_system_behavior_rules.md \u00a72.2,
 * aggressive interrupts have a tighter 1/day cap even if the overall
 * daily cap hasn't been hit. A user should not get more than one
 * "Your autopilot won" kind of ping per day.
 *
 * \u2022 soft       \u2014 awareness only (entering window, first silent ping)
 * \u2022 direct     \u2014 sharper callout (known pattern, mid-tier silence)
 * \u2022 aggressive \u2014 confrontation (final silence, late-night + known slip)
 */
export type InterruptIntensity = 'soft' | 'direct' | 'aggressive'

export const INTERRUPT_INTENSITY: Record<InterruptKind, InterruptIntensity> = {
  DANGER_WINDOW: 'direct',
  POST_SLIP_2H: 'direct',
  POST_SLIP_24H: 'soft',
  SILENT_SOFT: 'soft',
  SILENT_DIRECT: 'direct',
  SILENT_FINAL: 'aggressive',
}

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
 * Spec (\u00a72.2): minimum 90 minutes between ANY two interrupts for the same
 * user. This is enforced regardless of kind \u2014 no matter what, a user
 * never gets two pings inside 90 minutes of each other.
 */
const GLOBAL_INTER_INTERRUPT_MS = 90 * 60 * 1000

/**
 * "Recent action" suppressors \u2014 if the user did ANY of these in the last
 * N minutes, don't fire an interrupt. Signal is: they're already engaged.
 * Spec (\u00a72.3): 60 minutes. We use 90 to be slightly more conservative
 * than the spec (same as the inter-interrupt gap) for code simplicity.
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
  'COMMITMENT_KEPT',       // added per spec \u00a72.3
  'FOLLOW_UP_COMPLETED',   // added per spec \u00a72.3
  'SLIP_RECOVERED',        // they just closed recovery \u2014 leave them alone
] as const

/**
 * Hard cap on total interrupt pings per user per 24h. Spec (\u00a72.2): 3.
 * Dropped from 4 to match.
 */
const DAILY_RATE_CAP = 3

/**
 * Aggressive-only cap: max 1 aggressive-tier interrupt per 24h even if
 * the overall daily cap hasn't been hit. Prevents stacking final-tier
 * pings on a single bad day.
 */
const DAILY_AGGRESSIVE_CAP = 1

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

  // 5.5 Dismissal suppression (spec \u00a72.3): if the user dismissed the
  // last 2 prompts quickly (within 10s of viewing), assume they're
  // annoyed by the pings and stay quiet for 12h. Clients emit
  // PROMPT_DISMISSED with metadataJson.dwellMs.
  const dismissalLookback = new Date(now.getTime() - 6 * 60 * 60 * 1000) // 6h
  const recentDismissals = await prisma.productivityEvent.findMany({
    where: {
      userId: input.userId,
      eventType: 'PROMPT_DISMISSED',
      createdAt: { gte: dismissalLookback },
    },
    orderBy: { createdAt: 'desc' },
    select: { metadataJson: true },
    take: 2,
  })
  if (recentDismissals.length >= 2) {
    const bothQuick = recentDismissals.every((d) => {
      const meta = d.metadataJson as { dwellMs?: number } | null
      return typeof meta?.dwellMs === 'number' && meta.dwellMs < 10_000
    })
    if (bothQuick) {
      return { allow: false, reason: 'recent_action', detail: 'dismissed-2-quickly' }
    }
  }

  // 6. Global 90-minute gap \u2014 no two interrupts (any kind) within 90 min
  const recentAny = await prisma.productivityEvent.findFirst({
    where: {
      userId: input.userId,
      eventType: 'AUTOPILOT_INTERRUPTED',
      createdAt: { gte: new Date(now.getTime() - GLOBAL_INTER_INTERRUPT_MS) },
    },
    select: { id: true },
  })
  if (recentAny) {
    return {
      allow: false,
      reason: 'cooldown',
      detail: 'global 90-min gap',
    }
  }

  // 7. Daily rate cap across ALL interrupt kinds (spec: 3/day)
  const dayCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last24h = await prisma.productivityEvent.count({
    where: {
      userId: input.userId,
      eventType: 'AUTOPILOT_INTERRUPTED',
      createdAt: { gte: dayCutoff },
    },
  })
  if (last24h >= DAILY_RATE_CAP) {
    return { allow: false, reason: 'rate_cap', detail: `${last24h} in 24h` }
  }

  // 8. Aggressive-tier cap (spec: 1/day even if overall cap not hit)
  if (INTERRUPT_INTENSITY[input.kind] === 'aggressive') {
    const aggressiveLast24h = await prisma.productivityEvent.count({
      where: {
        userId: input.userId,
        eventType: 'AUTOPILOT_INTERRUPTED',
        createdAt: { gte: dayCutoff },
        metadataJson: { path: ['intensity'], equals: 'aggressive' },
      },
    })
    if (aggressiveLast24h >= DAILY_AGGRESSIVE_CAP) {
      return {
        allow: false,
        reason: 'rate_cap',
        detail: `aggressive-tier ${aggressiveLast24h} in 24h`,
      }
    }
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
        intensity: INTERRUPT_INTENSITY[args.kind],
        channel: args.channel,
        ...(args.metadata ?? {}),
      },
    },
  })
}

// ─────────────────────── Escalation tracking ───────────────────────

/**
 * Count consecutive interrupts that weren't followed by engagement
 * within a short window. Per spec \u00a72.4, repeated ignores = signal to
 * escalate tone (No-BS \u2192 Beast) on the next fire.
 *
 * Returns the number of "ignored" interrupts in a row, starting from
 * the most recent and walking backward. Resets on any meaningful
 * engagement (rescue triggered, checkin completed, decision made,
 * callout viewed).
 */
export async function consecutiveIgnoredInterrupts(
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  // Look at the last 7 days \u2014 anything older isn't signal for "right now"
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const interrupts = await prisma.productivityEvent.findMany({
    where: {
      userId,
      eventType: 'AUTOPILOT_INTERRUPTED',
      createdAt: { gte: since },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  if (interrupts.length === 0) return 0

  const engagementWindow = 60 * 60 * 1000 // 1h
  let ignored = 0
  for (const int of interrupts) {
    const engagementAfter = await prisma.productivityEvent.findFirst({
      where: {
        userId,
        eventType: {
          in: ['RESCUE_TRIGGERED', 'CHECKIN_COMPLETED', 'DECISION_MADE', 'CALLOUT_VIEWED'] as never,
        },
        createdAt: {
          gt: int.createdAt,
          lte: new Date(int.createdAt.getTime() + engagementWindow),
        },
      },
      select: { id: true },
    })
    if (engagementAfter) break
    ignored++
  }
  return ignored
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
