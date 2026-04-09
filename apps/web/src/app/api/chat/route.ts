import { streamText, convertToModelMessages } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { SYSTEM_PROMPTS, AI_MODEL } from '@repo/ai'
import { consumeAiAssistAtomic, hasFeature } from '@/lib/services/entitlement.service'
import { checkRateLimit } from '@/lib/rate-limit'
import type { UIMessage } from 'ai'

export const maxDuration = 60

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const rl = await checkRateLimit('chat', user.id)
  if (rl.limited) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...rl.headers },
    })
  }

  // Validate body BEFORE consuming quota — malformed requests must not burn credits
  const { chatSchema } = await import('@/lib/validations')
  const parsed = chatSchema.safeParse(await req.json())
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Atomic check+consume — prevents race condition on concurrent requests
  const quota = await consumeAiAssistAtomic(user.id)
  if (!quota.consumed) {
    return new Response(
      JSON.stringify({
        error: 'ai_quota_exceeded',
        message: `You've used all ${quota.limit} AI assists this month. Upgrade to Pro for unlimited AI.`,
        used: quota.used,
        limit: quota.limit,
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { messages, mode } = parsed.data as unknown as { messages: UIMessage[]; mode?: string }

  const isAssessment = mode === 'assessment-considerate' || mode === 'assessment-nobs'

  // Gate assessment modes behind Pro plan
  if (isAssessment) {
    const canAccess = await hasFeature(user.id, 'assessments')
    if (!canAccess) {
      return new Response(
        JSON.stringify({
          error: 'feature_gated',
          feature: 'assessments',
          message: 'AI assessments are a Pro feature. Upgrade to get your performance assessment.',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Get recent tasks for context
  const [openTasks, overdueCount] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
      take: 20,
      select: { title: true, status: true, priority: true, dueAt: true, followUpRequired: true },
    }),
    prisma.task.count({
      where: {
        userId: user.id,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueAt: { lt: new Date() },
      },
    }),
  ])

  type OpenTaskSummary = { title: string; priority: string; dueAt: Date | null; followUpRequired: boolean }
  const taskContext =
    openTasks.length > 0
      ? `\n\nCurrent open tasks:\n${(openTasks as OpenTaskSummary[])
          .map(
            (t) =>
              `- [${t.priority}] ${t.title}${t.dueAt ? ` (due ${t.dueAt.toLocaleDateString()})` : ''}${t.followUpRequired ? ' [follow-up required]' : ''}`
          )
          .join('\n')}`
      : '\n\nNo open tasks currently.'

  const overdueContext = overdueCount > 0 ? `\nNote: ${overdueCount} tasks are currently overdue.` : ''

  const now = new Date()
  let systemPrompt: string

  if (isAssessment) {
    // Fetch 30-day analytics for assessment context
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [completedTasks, allRecentTasks] = await Promise.all([
      prisma.task.findMany({
        where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
        select: { title: true, priority: true, dueAt: true, completedAt: true, createdAt: true },
        orderBy: { completedAt: 'desc' },
        take: 50,
      }),
      prisma.task.findMany({
        where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
        select: { title: true, priority: true, status: true, dueAt: true, completedAt: true, snoozedUntil: true },
        take: 100,
      }),
    ])

    const completedCount = completedTasks.length
    const totalCreated = allRecentTasks.length
    const snoozedCount = allRecentTasks.filter((t) => t.snoozedUntil).length
    const onTimeCount = completedTasks.filter((t) => t.dueAt && t.completedAt && t.completedAt <= t.dueAt).length
    const lateCount = completedTasks.filter((t) => t.dueAt && t.completedAt && t.completedAt > t.dueAt).length
    const noDueDate = completedTasks.filter((t) => !t.dueAt).length

    const priorityDist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, SOMEDAY: 0 }
    for (const t of allRecentTasks) {
      if (t.priority in priorityDist) priorityDist[t.priority as keyof typeof priorityDist]++
    }

    const statusDist: Record<string, number> = {}
    for (const t of allRecentTasks) {
      statusDist[t.status] = (statusDist[t.status] ?? 0) + 1
    }

    const analyticsContext = `

--- 30-DAY PRODUCTIVITY DATA ---
Period: ${thirtyDaysAgo.toLocaleDateString()} to ${now.toLocaleDateString()}

Tasks created: ${totalCreated}
Tasks completed: ${completedCount}
Completion rate: ${totalCreated > 0 ? Math.round((completedCount / totalCreated) * 100) : 0}%
Currently overdue: ${overdueCount}
Snoozed/postponed: ${snoozedCount}

On-time completions: ${onTimeCount}
Late completions: ${lateCount}
No due date set: ${noDueDate}

Priority distribution:
- Critical: ${priorityDist.CRITICAL}
- High: ${priorityDist.HIGH}
- Medium: ${priorityDist.MEDIUM}
- Low: ${priorityDist.LOW}
- Someday: ${priorityDist.SOMEDAY}

Status breakdown:
${Object.entries(statusDist).map(([s, c]) => `- ${s}: ${c}`).join('\n')}

Recent completed tasks (last 15):
${completedTasks.slice(0, 15).map((t) => `- [${t.priority}] ${t.title}${t.dueAt ? ` (due ${t.dueAt.toLocaleDateString()}, done ${t.completedAt?.toLocaleDateString()})` : ` (done ${t.completedAt?.toLocaleDateString()})`}`).join('\n')}
--- END DATA ---`

    const promptKey = mode === 'assessment-considerate' ? 'assessmentConsiderate' : 'assessmentNoBs'
    systemPrompt = SYSTEM_PROMPTS[promptKey].replace('{DATE}', now.toLocaleDateString()) + analyticsContext
  } else if (mode === 'morning') {
    systemPrompt = SYSTEM_PROMPTS.morningInterview.replace('{DATE}', now.toLocaleDateString())
  } else if (mode === 'night') {
    systemPrompt = SYSTEM_PROMPTS.nightReview.replace('{DATE}', now.toLocaleDateString())
  } else {
    systemPrompt = SYSTEM_PROMPTS.coyl
  }

  if (!isAssessment) {
    systemPrompt += taskContext + overdueContext
  }

  // AI SDK v6: convertToModelMessages is async
  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: AI_MODEL,
    system: systemPrompt,
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse()
}
