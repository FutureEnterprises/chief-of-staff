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

  // Capture first task if provided
  if (data.firstTask.trim()) {
    await createTaskFromChat(data.firstTask)
  }

  // Create billing subscription record (free plan)
  await prisma.billingSubscription.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, planType: 'FREE', status: 'active' },
  })

  // Log onboarding event
  await prisma.productivityEvent.create({
    data: { userId: user.id, eventType: 'ONBOARDING_COMPLETED' },
  })

  revalidatePath('/today')
}
