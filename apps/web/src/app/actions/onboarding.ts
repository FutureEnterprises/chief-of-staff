'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@repo/database'
import { requireDbUser } from '@/lib/auth'
import { createTaskFromChat } from './tasks'

interface OnboardingData {
  name: string
  timezone: string
  morningCheckinTime: string
  nightCheckinTime: string
  emailBriefingEnabled: boolean
  firstTask: string
}

export async function completeOnboarding(data: OnboardingData) {
  const user = await requireDbUser()

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name || user.name,
        timezone: data.timezone,
        morningCheckinTime: data.morningCheckinTime,
        nightCheckinTime: data.nightCheckinTime,
        emailBriefingEnabled: data.emailBriefingEnabled,
        onboardingCompleted: true,
      },
    })

    if (data.firstTask.trim()) {
      await createTaskFromChat(data.firstTask)
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
