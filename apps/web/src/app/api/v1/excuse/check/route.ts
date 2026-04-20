import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { classifyAndStoreExcuse } from '@/lib/services/excuse-detection.service'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30

/**
 * Real-time excuse check \u2014 used by surfaces that want to call out the
 * user's excuse in the moment (e.g. chat views, decide/rescue custom text).
 *
 * Returns the detection result PLUS how many times the user has used this
 * excuse pattern in the last 30 days, so the UI can say:
 *   "That's your 'tomorrow' excuse again \u2014 7\u00d7 this month."
 *
 * Rate-limited via the `chat` tier (excuse checks are cheap but we don't
 * want an open faucet on our AI spend).
 */
export async function POST(req: Request) {
  const user = await requireDbUser()
  const rl = await checkRateLimit('chat', user.id)
  if (rl.limited) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  let body: { text?: string; source?: string }
  try {
    body = (await req.json()) as { text?: string; source?: string }
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const text = body.text?.trim()
  if (!text || text.length < 10 || text.length > 2000) {
    return Response.json({ detected: false, category: null }, { status: 200 })
  }

  const source =
    body.source === 'DECIDE' || body.source === 'RESCUE' || body.source === 'SLIP'
      ? body.source
      : 'CHAT'

  const result = await classifyAndStoreExcuse(user.id, text, source as 'CHAT')

  if (!result || !result.detected || !result.category) {
    return Response.json({ detected: false, category: null }, { status: 200 })
  }

  // Count how many times this category has fired in the last 30 days,
  // so the UI can frame the callout with the "...again" weight the spec
  // calls for. Exclude the row we just inserted so the display count is
  // actually "before this one."
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const priorCount = await prisma.excuse.count({
    where: {
      userId: user.id,
      category: result.category,
      createdAt: { gte: thirtyDaysAgo, lt: new Date() },
    },
  })
  const times30d = Math.max(1, priorCount)

  return Response.json({
    detected: true,
    category: result.category,
    evidence: result.evidence,
    times30d,
    quote: EXCUSE_QUOTES[result.category] ?? null,
  })
}

// Canonical quote for each excuse category \u2014 the sentence the user hears
// in their head when this pattern fires. Matches the voice used elsewhere
// (onboarding summary, patterns page) for consistency.
const EXCUSE_QUOTES: Record<string, string> = {
  DELAY: "I'll start tomorrow.",
  REWARD: "I deserve this.",
  MINIMIZATION: "One time won't matter.",
  COLLAPSE: "I already blew it.",
  EXHAUSTION: "I'm too tired tonight.",
  EXCEPTION: "This week is weird.",
  COMPENSATION: "I'll make up for it.",
  SOCIAL_PRESSURE: "I couldn't say no.",
}
