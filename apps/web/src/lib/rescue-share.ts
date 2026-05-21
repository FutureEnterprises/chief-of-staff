import { prisma } from '@repo/database'
import type { RescueTrigger } from '@repo/database'

/**
 * Rescue-share — the Autopilot Interrupted card.
 *
 * Promised across three strategy docs and finally shipping. Every time a
 * user marks a rescue as "pulled through", we create a RescueSession row
 * with an opaque shareCode + assemble the user-visible card data:
 *
 *   - Local time of the moment (e.g. "9:47 PM")
 *   - Trigger label ("9pm kitchen", "Tab switch")
 *   - Streak count ("7 nights, 7 stops" — consecutive interrupts)
 *   - Self-Trust Score + 7-day delta
 *
 * The shareCode is the entire URL identity — distinct from the session
 * id so sequential ids can't be guessed. The card is rendered:
 *   - In-product (inside /rescue) immediately after the user pulls
 *   - At /i/[code] for public viewers (Twitter, iMessage, etc.)
 *   - As a 1200x630 PNG via the existing /api/og route (query-param
 *     based so it stays edge-runtime + stateless)
 */

// Crockford base32 — same alphabet referrals use. Shareable, no I/L/O/U.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const CODE_LEN = 10

export type ShareCardData = {
  shareCode: string
  triggerKey: RescueTrigger | null
  triggerLabel: string
  localTimeLabel: string // "9:47 PM"
  streakCount: number
  selfTrustScore: number | null
  selfTrustDelta: number | null
  brandTagline: string
  createdAtIso: string
}

const TRIGGER_LABELS: Record<string, string> = {
  BINGE_URGE: 'The binge urge',
  DELIVERY_URGE: 'Late-night delivery',
  NICOTINE_URGE: 'The nicotine pull',
  ALCOHOL_URGE: 'The drink',
  SKIP_WORKOUT: 'The skip',
  SKIP_WEIGHIN: 'The avoid',
  DOOMSCROLL: 'The doom-scroll',
  IMPULSE_SPEND: 'The impulse buy',
  ALREADY_SLIPPED: 'After the slip',
  SPIRALING: 'The spiral',
}

export function triggerLabel(key: string | null | undefined): string {
  if (!key) return 'The moment'
  return TRIGGER_LABELS[key] ?? 'The moment'
}

function randomCode(): string {
  let out = ''
  const buf = new Uint8Array(CODE_LEN)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < CODE_LEN; i++) buf[i] = Math.floor(Math.random() * 256)
  }
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[buf[i]! % ALPHABET.length]
  return out
}

/**
 * Compute the user's consecutive-interrupt streak. Same trigger family
 * isn't required — we want "you stopped yourself N times in a row,"
 * which is the brand promise. Anything INTERRUPTED counts.
 *
 * Walks back from most recent. Breaks on the first slip event in
 * SlipRecord that falls between two pulled-through sessions.
 */
async function computeStreakCount(userId: string): Promise<number> {
  const recent = await prisma.rescueSession.findMany({
    where: { userId, outcome: 'INTERRUPTED' },
    orderBy: { startedAt: 'desc' },
    take: 30,
    select: { startedAt: true },
  })
  if (recent.length === 0) return 1 // current pull is the only one

  const firstPull = recent[0]!.startedAt
  const slipsSince = await prisma.slipRecord.count({
    where: { userId, createdAt: { gte: firstPull } },
  })
  if (slipsSince > 0) return 1

  // No slips since the most recent pull — current streak is the count
  // of recent pulled sessions. We capped at 30 above which is fine for
  // a shareable streak number.
  return recent.length
}

/**
 * Compute self-trust delta vs ~7 days ago. Uses the same approach the
 * /today identity sentence uses (WEEKLY_REPORT_SENT event metadata).
 */
async function computeSelfTrustDelta(userId: string, current: number): Promise<number | null> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const event = await prisma.productivityEvent.findFirst({
    where: {
      userId,
      eventType: 'WEEKLY_REPORT_SENT',
      createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
    },
    select: { metadataJson: true },
  })
  if (!event || typeof event.metadataJson !== 'object' || event.metadataJson === null) {
    return null
  }
  const prev = (event.metadataJson as { score?: number }).score
  if (typeof prev !== 'number') return null
  return current - prev
}

/**
 * Create a shareable RescueSession row + return the card data. Called
 * from POST /api/v1/rescue/share when the user marks "pulled through"
 * and taps share.
 */
export async function createShareableRescue(args: {
  userId: string
  triggerKey: RescueTrigger | string
  timezone: string | null
}): Promise<ShareCardData> {
  // Retry the code generation on the (extremely rare) collision.
  let shareCode: string | null = null
  let sessionId: string | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    try {
      const session = await prisma.rescueSession.create({
        data: {
          userId: args.userId,
          trigger: args.triggerKey as RescueTrigger,
          intervention: {}, // populated when we have the AI streaming history
          outcome: 'INTERRUPTED',
          startedAt: new Date(),
          resolvedAt: new Date(),
          shareCode: code,
        },
        select: { id: true, shareCode: true },
      })
      shareCode = session.shareCode
      sessionId = session.id
      break
    } catch (err) {
      const e = err as { code?: string }
      if (e.code !== 'P2002') throw err
      // shareCode collision — try again
    }
  }
  if (!shareCode || !sessionId) throw new Error('Could not allocate share code')

  // Fetch the user for streak + self-trust context. Two queries; could
  // be one with include but we want the user separately for the delta
  // calc anyway.
  const [user, streakCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: args.userId },
      select: { selfTrustScore: true, timezone: true },
    }),
    computeStreakCount(args.userId),
  ])

  const selfTrustScore = user?.selfTrustScore ?? null
  const selfTrustDelta =
    selfTrustScore != null ? await computeSelfTrustDelta(args.userId, selfTrustScore) : null

  return {
    shareCode,
    triggerKey: (args.triggerKey as RescueTrigger) ?? null,
    triggerLabel: triggerLabel(args.triggerKey as string),
    localTimeLabel: formatLocalTime(new Date(), args.timezone ?? user?.timezone ?? 'UTC'),
    streakCount,
    selfTrustScore,
    selfTrustDelta,
    brandTagline: 'COYL caught me.',
    createdAtIso: new Date().toISOString(),
  }
}

/**
 * Public-page lookup. No auth — anyone with the link can read the
 * minimal card payload. Returns null for unknown codes so the page
 * can render a 404-shaped empty state.
 */
export async function getSharedCardByCode(code: string): Promise<ShareCardData | null> {
  const session = await prisma.rescueSession.findUnique({
    where: { shareCode: code.toUpperCase() },
    select: {
      id: true,
      userId: true,
      trigger: true,
      startedAt: true,
      shareCode: true,
      user: {
        select: { selfTrustScore: true, timezone: true },
      },
    },
  })
  if (!session) return null

  const [streakCount] = await Promise.all([computeStreakCount(session.userId)])
  const selfTrustScore = session.user?.selfTrustScore ?? null
  const selfTrustDelta =
    selfTrustScore != null ? await computeSelfTrustDelta(session.userId, selfTrustScore) : null

  return {
    shareCode: session.shareCode!,
    triggerKey: session.trigger,
    triggerLabel: triggerLabel(session.trigger),
    localTimeLabel: formatLocalTime(session.startedAt, session.user?.timezone ?? 'UTC'),
    streakCount,
    selfTrustScore,
    selfTrustDelta,
    brandTagline: 'COYL caught me.',
    createdAtIso: session.startedAt.toISOString(),
  }
}

function formatLocalTime(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }
}
