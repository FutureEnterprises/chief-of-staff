'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@repo/database'
import { requireDbUser } from '@/lib/auth'
import { onboardingSchema } from '@/lib/validations'
import { createTaskFromChat } from './tasks'

export async function completeOnboarding(data: {
  name: string
  timezone: string
  morningCheckinTime: string
  nightCheckinTime: string
  emailBriefingEnabled: boolean
  firstTask: string
  role?: string
  useCase?: string
  referralSource?: string
  biggestGoal?: string
  failurePattern?: string
}) {
  const user = await requireDbUser()

  const parsed = onboardingSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid onboarding data')
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name || user.name,
        timezone: parsed.data.timezone,
        morningCheckinTime: parsed.data.morningCheckinTime,
        nightCheckinTime: parsed.data.nightCheckinTime,
        emailBriefingEnabled: parsed.data.emailBriefingEnabled,
        onboardingCompleted: true,
        ...(parsed.data.role && { role: parsed.data.role }),
        ...(parsed.data.useCase && { useCase: parsed.data.useCase }),
        ...(parsed.data.referralSource && { referralSource: parsed.data.referralSource }),
        ...(parsed.data.biggestGoal && { biggestGoal: parsed.data.biggestGoal }),
        ...(parsed.data.failurePattern && { failurePattern: parsed.data.failurePattern }),
      },
    })

    if (parsed.data.firstTask.trim()) {
      await createTaskFromChat(parsed.data.firstTask)
    }

    await prisma.billingSubscription.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, planType: 'FREE', status: 'active' },
    })

    await prisma.productivityEvent.create({
      data: { userId: user.id, eventType: 'ONBOARDING_COMPLETED' },
    })

    revalidatePath('/today')
  } catch {
    throw new Error('Failed to complete onboarding')
  }
}
