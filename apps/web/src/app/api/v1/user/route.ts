/**
 * Mobile API v1 — User profile, entitlement, and autopilot state.
 *
 * GET returns the current signed-in user's profile plus every derived signal
 * the mobile /today screen needs in one round-trip: self-trust score,
 * current streak, whether they're inside a learned danger window right now,
 * the next danger-window label, and how many patterns they defeated this
 * past week. All computed server-side so the mobile client stays thin.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { PLAN_LIMITS } from '@/lib/services/entitlement.service'
import { checkRateLimit } from '@/lib/rate-limit'

/** Map a wedge to a user-facing danger-window label. */
function dangerWindowLabelFor(wedge: string, startHour: number): string {
  const timeLabel =
    startHour === 0 ? '12:00 AM' : startHour < 12 ? `${startHour}:00 AM` : startHour === 12 ? '12:00 PM' : `${startHour - 12}:00 PM`
  const place: Record<string, string> = {
    WEIGHT_LOSS: 'kitchen',
    CRAVINGS: 'trigger',
    DESTRUCTIVE_BEHAVIORS: 'loop',
    CONSISTENCY: 'slip',
    SPENDING: 'cart',
    FOCUS: 'tab switch',
    PRODUCTIVITY: 'fold',
  }
  return `${timeLabel} ${place[wedge] ?? 'fold'}`
}

/**
 * Parse `user.dangerWindows` JSON and determine if `now` (in the user's local
 * timezone) falls inside any window. Returns `{ inside, nextLabel }`.
 * Shape: `{ "mon": ["21:00-23:00"], "sat": ["14:00-18:00"] }`.
 */
function evaluateDangerWindows(
  dangerWindows: unknown,
  now: Date,
  timezone: string,
  wedge: string,
): { inside: boolean; nextLabel: string | null } {
  if (!dangerWindows || typeof dangerWindows !== 'object')
    return { inside: false, nextLabel: null }

  const windows = dangerWindows as Record<string, string[] | undefined>
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  try {
    const local = new Date(
      now.toLocaleString('en-US', { timeZone: timezone || 'UTC' }),
    )
    const today = DAYS[local.getDay()]
    const todayWindows = today ? windows[today] ?? [] : []
    const hhmm = `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`

    for (const range of todayWindows) {
      const [start, end] = range.split('-')
      if (!start || !end) continue
      if (hhmm >= start && hhmm < end) {
        const hour = Number(start.split(':')[0] ?? 0)
        return { inside: true, nextLabel: dangerWindowLabelFor(wedge, hour) }
      }
    }

    // Find the next upcoming window in the next 24h for "next label"
    for (let offset = 0; offset < 7; offset++) {
      const idx = (local.getDay() + offset) % 7
      const day = DAYS[idx]
      const dayWindows = day ? windows[day] ?? [] : []
      for (const range of dayWindows) {
        const start = range.split('-')[0]
        if (!start) continue
        // Skip windows that have already passed today
        if (offset === 0 && start <= hhmm) continue
        const hour = Number(start.split(':')[0] ?? 0)
        return { inside: false, nextLabel: dangerWindowLabelFor(wedge, hour) }
      }
    }
  } catch {
    // Timezone parse can fail on weird values; fail closed.
  }

  return { inside: false, nextLabel: null }
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit before any DB query to protect against enumeration
  const rl = await checkRateLimit('auth', clerkId)
  if (rl.limited)
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      timezone: true,
      morningCheckinTime: true,
      nightCheckinTime: true,
      briefingTime: true,
      reminderIntensity: true,
      planType: true,
      aiAssistsUsed: true,
      aiAssistsResetAt: true,
      trialEndsAt: true,
      onboardingCompleted: true,
      createdAt: true,
      // Autopilot interruption fields
      currentStreak: true,
      selfTrustScore: true,
      primaryWedge: true,
      toneMode: true,
      recoveryState: true,
      slipsThisMonth: true,
      dangerWindows: true,
      billingSubscription: {
        select: { status: true, renewsAt: true, cancelledAt: true, planType: true },
      },
    },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const limits = PLAN_LIMITS[user.planType] ?? PLAN_LIMITS.FREE!

  // Derived: patterns defeated this week. Counts successful interrupts +
  // decisions made. If the ProductivityEvent model isn't populated yet this
  // returns 0, which is the correct empty-state value.
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const patternsDefeatedThisWeek = await prisma.productivityEvent
    .count({
      where: {
        userId: user.id,
        eventType: { in: ['AUTOPILOT_INTERRUPTED', 'DECISION_MADE', 'SLIP_RECOVERED'] },
        createdAt: { gte: weekAgo },
      },
    })
    .catch(() => 0)

  const { inside: insideDangerWindow, nextLabel: nextDangerWindowLabel } =
    evaluateDangerWindows(
      user.dangerWindows,
      new Date(),
      user.timezone || 'UTC',
      user.primaryWedge ?? 'PRODUCTIVITY',
    )

  // Strip the raw dangerWindows blob from the response — it's server-side
  // state, clients consume the derived insideDangerWindow/nextLabel only.
  const { dangerWindows: _dw, ...userSafe } = user
  void _dw

  return NextResponse.json({
    ...userSafe,
    insideDangerWindow,
    nextDangerWindowLabel,
    patternsDefeatedThisWeek,
    entitlements: {
      maxActiveTasks: limits.maxActiveTasks === Infinity ? null : limits.maxActiveTasks,
      aiAssistsPerMonth: limits.aiAssistsPerMonth === Infinity ? null : limits.aiAssistsPerMonth,
      followUpAutomation: limits.followUpAutomation,
      notificationEscalation: limits.notificationEscalation,
      advancedInsights: limits.advancedInsights,
      emailSummaries: limits.emailSummaries,
    },
  })
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { updateUserSchema } = await import('@/lib/validations')
  const parsed = updateUserSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: user.id }, data })
  return NextResponse.json({ success: true })
}
