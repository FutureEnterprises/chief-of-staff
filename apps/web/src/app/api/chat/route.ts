import { streamText, convertToModelMessages } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { SYSTEM_PROMPTS, AI_MODEL } from '@repo/ai'
import { checkAiQuota, consumeAiAssist } from '@/lib/services/entitlement.service'
import type { UIMessage } from 'ai'

export const maxDuration = 60

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response('Unauthorized', { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return new Response('User not found', { status: 404 })

  const quota = await checkAiQuota(user.id)
  if (!quota.allowed) {
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

  const { messages, mode }: { messages: UIMessage[]; mode?: string } = await req.json()

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

  if (mode === 'morning') {
    systemPrompt = SYSTEM_PROMPTS.morningInterview.replace('{DATE}', now.toLocaleDateString())
  } else if (mode === 'night') {
    systemPrompt = SYSTEM_PROMPTS.nightReview.replace('{DATE}', now.toLocaleDateString())
  } else {
    systemPrompt = SYSTEM_PROMPTS.chiefOfStaff
  }

  systemPrompt += taskContext + overdueContext

  // AI SDK v6: convertToModelMessages is async
  const modelMessages = await convertToModelMessages(messages)

  // Consume one AI assist (fire-and-forget — don't block the stream)
  void consumeAiAssist(user.id)

  const result = streamText({
    model: AI_MODEL as any,
    system: systemPrompt,
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse()
}
