import { streamText, convertToModelMessages } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { SYSTEM_PROMPTS, AI_MODEL } from '@repo/ai'
import { consumeAiAssistAtomic, hasFeature } from '@/lib/services/entitlement.service'
import type { UIMessage } from 'ai'

export const maxDuration = 45

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, primaryWedge: true, toneMode: true, slipsThisMonth: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'recoveryEngine')
  if (!canUse) {
    return Response.json(
      { error: 'feature_gated', feature: 'recoveryEngine', message: 'Recovery Engine is a Core feature.' },
      { status: 402 }
    )
  }

  const { trigger, notes, commitmentId } = (await req.json()) as {
    trigger?: string
    notes?: string
    commitmentId?: string
  }

  // Record the slip
  const slip = await prisma.slipRecord.create({
    data: {
      userId: user.id,
      trigger: trigger ?? null,
      notes: notes ?? null,
      commitmentId: commitmentId ?? null,
    },
  })

  // Update user state
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastSlipAt: new Date(),
      slipsThisMonth: { increment: 1 },
      recoveryState: 'SLIPPED',
    },
  })

  // Fire-and-forget: notify accountability partners
  notifyPartnersOfSlip(user.id, trigger).catch(() => {})

  // If tied to a commitment, count it as broken
  if (commitmentId) {
    await prisma.commitment
      .updateMany({
        where: { id: commitmentId, userId: user.id },
        data: { breakCount: { increment: 1 }, lastCheckedAt: new Date() },
      })
      .catch(() => {})
  }

  await prisma.productivityEvent
    .create({
      data: {
        userId: user.id,
        eventType: 'SLIP_LOGGED',
        eventValue: trigger ?? null,
        metadataJson: { slipId: slip.id, notes: notes?.slice(0, 200) },
      },
    })
    .catch(() => {})

  // Consume a Charge for the AI recovery response
  const quota = await consumeAiAssistAtomic(user.id)
  if (!quota.consumed) {
    return Response.json({ error: 'ai_quota_exceeded', slipId: slip.id }, { status: 402 })
  }

  const systemPrompt =
    SYSTEM_PROMPTS.slipRecovery
      .replace('{SLIP_CONTEXT}', `${trigger ?? 'slip'}${notes ? ` — ${notes}` : ''}`)
      .replace('{WEDGE}', user.primaryWedge ?? 'PRODUCTIVITY')
      .replace('{TONE_MODE}', user.toneMode ?? 'MENTOR') +
    '\n\n' +
    (SYSTEM_PROMPTS[`tone${toneSuffix(user.toneMode)}` as keyof typeof SYSTEM_PROMPTS] ?? '')

  const baseMessages: UIMessage[] = [
    {
      id: 'slip',
      role: 'user',
      parts: [{ type: 'text', text: `I slipped: ${trigger ?? 'unspecified'}. ${notes ?? ''}` }],
    } as UIMessage,
  ]

  const modelMessages = await convertToModelMessages(baseMessages)
  const result = streamText({ model: AI_MODEL, system: systemPrompt, messages: modelMessages })
  return result.toUIMessageStreamResponse()
}

function toneSuffix(mode: string | null | undefined) {
  switch (mode) {
    case 'STRATEGIST': return 'Strategist'
    case 'NO_BS': return 'NoBs'
    case 'BEAST': return 'Beast'
    default: return 'Mentor'
  }
}

async function notifyPartnersOfSlip(userId: string, trigger?: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const partners = await prisma.accountabilityPartner.findMany({
    where: { ownerId: userId, status: 'accepted' },
    include: {
      owner: { select: { name: true } },
      peer: { select: { email: true, name: true } },
    },
  })
  if (partners.length === 0) return

  const { Resend } = await import('resend')
  const resend = new Resend(resendKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  for (const p of partners) {
    if (!p.peer?.email) continue
    try {
      await resend.emails.send({
        from: fromEmail,
        to: p.peer.email,
        subject: `${p.owner.name} slipped — just a heads up`,
        text: `${p.owner.name} just logged a slip${trigger ? ` (${trigger})` : ''}.\n\nYour job isn't to fix anything. Just be visible. A check-in text means more than you think.\n\n— COYL`,
      })
    } catch {
      // silent
    }
  }
}
