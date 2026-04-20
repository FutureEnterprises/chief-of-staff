import { streamText, convertToModelMessages } from 'ai'
import { SYSTEM_PROMPTS, AI_MODEL_FAST } from '@repo/ai'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { checkRateLimit } from '@/lib/rate-limit'
import type { UIMessage } from 'ai'

export const maxDuration = 60

/**
 * Callout Mode — "Be brutally honest."
 *
 * User taps the button; we pull their 30-day pattern slice and hand it to
 * the calloutMode prompt. The response is designed to be screenshot-worthy:
 * short, specific, predictive, uncomfortable. One card they'll want to send
 * to a friend with "this thing just read me to filth."
 *
 * Requires auth. Rate-limited via `chat` tier (aggressive generation is fine
 * but we don't want someone spamming callouts). Streams as plain text so the
 * client parser stays simple.
 */
export async function POST(req: Request) {
  const user = await requireDbUser()

  const rl = await checkRateLimit('chat', user.id)
  if (rl.limited) {
    return Response.json({ error: 'Slow down for a sec.' }, { status: 429 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Pull the data that makes the callout land. No raw data dumps —
  // just the signals the prompt needs to be specific.
  const [excuses, recentSlips, dangerWindows, recentRescues, commitments] = await Promise.all([
    prisma.excuse.groupBy({
      by: ['category'],
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.slipRecord.findMany({
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { trigger: true, createdAt: true, recoveredAt: true },
    }),
    prisma.dangerWindow.findMany({
      where: { userId: user.id, active: true },
      select: { label: true, dayOfWeek: true, startHour: true, endHour: true, triggerType: true },
      take: 5,
    }),
    prisma.rescueSession.findMany({
      where: { userId: user.id, startedAt: { gte: thirtyDaysAgo } },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: { trigger: true, outcome: true, startedAt: true },
    }),
    prisma.commitment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        rule: true,
        active: true,
        createdAt: true,
        lastCheckedAt: true,
        keepCount: true,
        breakCount: true,
      },
    }),
  ])

  const excusesFormatted = excuses
    .sort((a, b) => b._count - a._count)
    .map((e) => `  - ${e.category}: ${e._count}x`)
    .join('\n')

  const slipsFormatted = recentSlips
    .map((s) => {
      const recovered = s.recoveredAt
        ? `recovered ${Math.round((s.recoveredAt.getTime() - s.createdAt.getTime()) / (60 * 60 * 1000))}h later`
        : 'NOT recovered'
      return `  - ${s.createdAt.toISOString().slice(0, 16)} (${recovered}) "${s.trigger ?? 'unlabeled'}"`
    })
    .join('\n')

  const windowsFormatted = dangerWindows
    .map((w) => {
      const day = w.dayOfWeek === -1 ? 'Every day' : DAY_NAMES[w.dayOfWeek] ?? '?'
      return `  - ${day} ${String(w.startHour).padStart(2, '0')}:00-${String(w.endHour).padStart(2, '0')}:00 "${w.label}" (${w.triggerType ?? 'unspecified'})`
    })
    .join('\n')

  const rescuesFormatted = recentRescues
    .map((r) => `  - ${r.startedAt.toISOString().slice(0, 10)} ${r.trigger} → ${r.outcome}`)
    .join('\n')

  const commitmentsFormatted = commitments
    .map((c) => {
      const lastChecked = c.lastCheckedAt
        ? `last checked ${c.lastCheckedAt.toISOString().slice(0, 10)}`
        : 'never checked'
      return `  - "${c.rule}" (${c.active ? 'active' : 'dropped'}, ${c.keepCount} kept / ${c.breakCount} broken, ${lastChecked})`
    })
    .join('\n')

  // The prompt already sets structure; we give it raw pattern data.
  const dataBlock = [
    `User's battlefield: ${user.primaryWedge ?? 'unspecified'}`,
    `Identity state: ${user.identityState ?? 'SLEEPWALKING'}`,
    `Self-trust score: ${user.selfTrustScore}/100`,
    `Current streak: ${user.currentStreak} days (longest: ${user.longestStreak})`,
    `Slips this month: ${user.slipsThisMonth}`,
    '',
    `TOP EXCUSES (30 days):`,
    excusesFormatted || '  - None logged',
    '',
    `DANGER WINDOWS (active):`,
    windowsFormatted || '  - None mapped',
    '',
    `RECENT SLIPS (30 days):`,
    slipsFormatted || '  - None',
    '',
    `RESCUE SESSIONS (30 days):`,
    rescuesFormatted || '  - None',
    '',
    `COMMITMENTS:`,
    commitmentsFormatted || '  - None',
  ].join('\n')

  const toneKey = `tone${(user.toneMode ?? 'NoBs')
    .split('_')
    .map((s) => s[0] + s.slice(1).toLowerCase())
    .join('')
    .replace('NoBs', 'NoBs')}`

  const tonePrompt =
    (SYSTEM_PROMPTS as Record<string, string>)[toneKey] ?? SYSTEM_PROMPTS.toneNoBs

  const systemPrompt = `${SYSTEM_PROMPTS.coyl}\n\n${SYSTEM_PROMPTS.calloutMode}\n\n${tonePrompt}\n\nDATA ABOUT THE USER:\n${dataBlock}`

  const messages: UIMessage[] = [
    {
      id: 'callout-request',
      role: 'user',
      parts: [{ type: 'text', text: 'Be brutally honest. Call out the pattern that\u2019s running me.' }],
    } as UIMessage,
  ]

  const modelMessages = await convertToModelMessages(messages)
  const result = streamText({ model: AI_MODEL_FAST, system: systemPrompt, messages: modelMessages })

  return result.toTextStreamResponse()
}

const DAY_NAMES: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}
