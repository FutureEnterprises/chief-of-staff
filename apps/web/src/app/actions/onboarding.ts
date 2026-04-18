'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@repo/database'
import type { ExcuseCategory, PrimaryWedge, ToneMode } from '@repo/database'
import { requireDbUser } from '@/lib/auth'
import { onboardingSchema } from '@/lib/validations'
import { createTaskFromChat } from './tasks'

// Predefined danger-window templates per picked label
const WINDOW_TEMPLATES: Record<string, Array<{ label: string; dayOfWeek: number; startHour: number; endHour: number; triggerType: string }>> = {
  'late-night': [{ label: 'Late-night drift', dayOfWeek: -1, startHour: 21, endHour: 23, triggerType: 'idle' }],
  'weekends': [
    { label: 'Friday evening leak', dayOfWeek: 5, startHour: 17, endHour: 23, triggerType: 'social' },
    { label: 'Saturday afternoon', dayOfWeek: 6, startHour: 14, endHour: 19, triggerType: 'idle' },
  ],
  'post-work': [{ label: 'Post-work decompression', dayOfWeek: -1, startHour: 17, endHour: 20, triggerType: 'post-work' }],
  'stress': [{ label: 'High-stress window', dayOfWeek: -1, startHour: 14, endHour: 18, triggerType: 'stress' }],
  'after-slip': [{ label: "'I already blew it' spiral", dayOfWeek: -1, startHour: 12, endHour: 23, triggerType: 'collapse' }],
  'social': [{ label: 'Social pressure', dayOfWeek: 5, startHour: 18, endHour: 23, triggerType: 'social' }],
  'alone': [{ label: 'Alone + no witnesses', dayOfWeek: -1, startHour: 20, endHour: 23, triggerType: 'idle' }],
}

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
  primaryWedge?: string
  dangerWindowsPicked?: string[]
  toneMode?: string
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
        ...(parsed.data.failurePattern && { failurePattern: parsed.data.failurePattern, excuseStyle: parsed.data.failurePattern as ExcuseCategory }),
        ...(parsed.data.primaryWedge && { primaryWedge: parsed.data.primaryWedge as PrimaryWedge }),
        ...(parsed.data.toneMode && { toneMode: parsed.data.toneMode as ToneMode }),
      },
    })

    // Seed danger windows from the user's picks
    if (parsed.data.dangerWindowsPicked && parsed.data.dangerWindowsPicked.length > 0) {
      const windowsToCreate = parsed.data.dangerWindowsPicked
        .flatMap((pick) => WINDOW_TEMPLATES[pick] ?? [])
        .map((w) => ({
          userId: user.id,
          label: w.label,
          dayOfWeek: w.dayOfWeek,
          startHour: w.startHour,
          endHour: w.endHour,
          triggerType: w.triggerType,
          source: 'user',
        }))
      if (windowsToCreate.length > 0) {
        await prisma.dangerWindow.createMany({ data: windowsToCreate })
      }
    }

    // Create first commitment from biggestGoal if provided
    if (parsed.data.biggestGoal && parsed.data.biggestGoal.trim()) {
      await prisma.commitment.create({
        data: {
          userId: user.id,
          rule: parsed.data.biggestGoal,
          domain: inferDomain(parsed.data.primaryWedge),
          frequency: 'DAILY',
        },
      })
    }

    // Back-compat: also create a task if firstTask is set AND different from biggestGoal
    if (parsed.data.firstTask.trim() && parsed.data.firstTask !== parsed.data.biggestGoal) {
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
  } catch (err) {
    console.warn('[onboarding] failed: %s', (err as Error).message)
    throw new Error('Failed to complete onboarding')
  }
}

function inferDomain(wedge?: string): 'FOOD' | 'EXERCISE' | 'CRAVING' | 'SPENDING' | 'FOCUS' | 'OTHER' {
  switch (wedge) {
    case 'WEIGHT_LOSS': return 'FOOD'
    case 'CRAVINGS': return 'CRAVING'
    case 'DESTRUCTIVE_BEHAVIORS': return 'CRAVING'
    case 'SPENDING': return 'SPENDING'
    case 'FOCUS': return 'FOCUS'
    default: return 'OTHER'
  }
}
