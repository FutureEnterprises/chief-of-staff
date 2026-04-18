import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { generateText } from 'ai'
import { SYSTEM_PROMPTS, AI_MODEL_FAST } from '@repo/ai'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'

export const maxDuration = 300

const PAGE_SIZE = 300

/**
 * Weekly autopilot autopsy — runs Monday 10:00 UTC.
 * Per user: generates a pattern report via AI and emails it.
 * Only runs for users with recoveryEngine entitlement (CORE+).
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
  }
  const resend = new Resend(resendKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  let sent = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        emailBriefingEnabled: true,
        planType: { in: ['CORE', 'PLUS', 'PREMIUM', 'PRO', 'TEAM'] },
      },
      select: {
        id: true, email: true, name: true, primaryWedge: true,
      },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (users.length === 0) break

    await batchProcess(users, async (user) => {
      const [excuses, slips, rescues, completedCount, dangerWindows] = await Promise.all([
        prisma.excuse.groupBy({
          by: ['category'],
          where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
          _count: true,
        }),
        prisma.slipRecord.findMany({
          where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
          select: { trigger: true, createdAt: true, recoveredAt: true },
          take: 20,
        }),
        prisma.rescueSession.groupBy({
          by: ['outcome'],
          where: { userId: user.id, startedAt: { gte: sevenDaysAgo } },
          _count: true,
        }),
        prisma.task.count({
          where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: sevenDaysAgo } },
        }),
        prisma.dangerWindow.findMany({
          where: { userId: user.id, active: true },
          select: { label: true, dayOfWeek: true, startHour: true, endHour: true },
          take: 5,
        }),
      ])

      // If user has nothing to report on, skip
      if (excuses.length === 0 && slips.length === 0 && rescues.length === 0 && completedCount === 0) {
        return
      }

      const dataContext = `
USER BATTLEFIELD: ${user.primaryWedge}
WEEK: ${sevenDaysAgo.toLocaleDateString()} to ${now.toLocaleDateString()}

TOP EXCUSES:
${excuses.sort((a, b) => b._count - a._count).map((e) => `- ${e.category}: ${e._count}×`).join('\n') || '(none logged)'}

SLIPS:
${slips.map((s) => `- ${s.trigger ?? 'slip'} on ${s.createdAt.toLocaleDateString()} ${s.recoveredAt ? '(recovered)' : '(open)'}`).join('\n') || '(none)'}

RESCUES:
${rescues.map((r) => `- ${r.outcome}: ${r._count}`).join('\n') || '(none)'}

TASKS COMPLETED: ${completedCount}

DANGER WINDOWS:
${dangerWindows.map((w) => `- ${w.label} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][w.dayOfWeek] ?? 'all'}, ${w.startHour}-${w.endHour})`).join('\n') || '(none mapped)'}
`.trim()

      try {
        const { text } = await generateText({
          model: AI_MODEL_FAST,
          system: SYSTEM_PROMPTS.autopilotAutopsy
            .replace('{DATE}', now.toLocaleDateString())
            .replace('{WEDGE}', user.primaryWedge),
          prompt: dataContext,
        })

        const firstName = user.name.split(' ')[0]
        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: `${firstName}, your autopilot autopsy is in`,
          text: `${firstName},\n\nHere's what your autopilot looked like this week.\n\n${text}\n\nOpen COYL: https://coyl.ai/patterns\n\n— COYL`,
        })

        await prisma.productivityEvent.create({
          data: {
            userId: user.id,
            eventType: 'WEEKLY_REPORT_SENT',
            metadataJson: { type: 'autopilot_autopsy' },
          },
        })

        sent++
      } catch (err) {
        console.warn('[autopsy] Failed for user %s: %s', user.id, (err as Error).message)
      }
    })

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ sent, timestamp: now.toISOString() })
}
