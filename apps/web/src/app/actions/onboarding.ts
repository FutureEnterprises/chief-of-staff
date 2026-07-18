'use server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { prisma } from '@repo/database'
import type { ExcuseCategory, PrimaryWedge, ToneMode } from '@repo/database'
import { requireDbUser } from '@/lib/auth'
import { onboardingSchema } from '@/lib/validations'
import { renderWelcomeEmail } from '@/lib/email/welcome-email'
import { scheduleFirstInterrupt, isValidTimezone } from '@/lib/interrupt-schedule'
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
  rescuePreference?: string
}) {
  const user = await requireDbUser()

  const parsed = onboardingSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid onboarding data')
  }

  // The schema only checks string shape. An IANA-invalid zone stored on
  // the user row makes every later Intl.DateTimeFormat({ timeZone })
  // call throw — permanently 500ing /today for this user.
  const timezone = isValidTimezone(parsed.data.timezone)
    ? parsed.data.timezone
    : (user.timezone && isValidTimezone(user.timezone) ? user.timezone : 'UTC')

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name || user.name,
        timezone,
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
        // Stash rescue preference in healthIntegrations JSON to avoid a migration
        ...(parsed.data.rescuePreference && {
          healthIntegrations: { rescuePreference: parsed.data.rescuePreference } as unknown as object,
        }),
      },
    })

    // Seed danger windows from the user's picks
    const seededWindows = (parsed.data.dangerWindowsPicked ?? []).flatMap(
      (pick) => WINDOW_TEMPLATES[pick] ?? [],
    )
    if (seededWindows.length > 0) {
      await prisma.dangerWindow.createMany({
        data: seededWindows.map((w) => ({
          userId: user.id,
          label: w.label,
          dayOfWeek: w.dayOfWeek,
          startHour: w.startHour,
          endHour: w.endHour,
          triggerType: w.triggerType,
          source: 'user',
        })),
      })
    }

    // First felt interrupt — day-one activation. The 15-min
    // danger-window-interrupt cron only fires while the user's local
    // clock is INSIDE a seeded window, so without this the first
    // interrupt lands hours (sometimes days) after onboarding. Schedule
    // a one-shot ScheduledInterrupt for the next instance of the
    // soonest seeded window — or a ~1h "first catch" when nothing lands
    // within 20h — through the same pipeline the anonymous /audit
    // funnel uses (cron/scheduled-interrupts dispatches it: web push
    // if the user has subscribed by then, else email). Wrapped so a
    // scheduling failure can never break onboarding completion.
    try {
      await scheduleFirstInterrupt({
        email: user.email,
        timezone,
        windows: seededWindows,
        primaryWedge: parsed.data.primaryWedge,
        failurePattern: parsed.data.failurePattern,
      })
    } catch (err) {
      console.warn('[onboarding] first-interrupt schedule failed: %s', (err as Error).message)
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

    // Day-1 welcome email — fire-and-forget. Confirms protection is live
    // and sets the free-tier interrupt expectation. Send guard mirrors the
    // waitlist route (api/v1/waitlist). Wrapped so a Resend failure can
    // never break onboarding completion.
    try {
      const resendKey = process.env.RESEND_API_KEY
      if (resendKey && !resendKey.startsWith('re_...')) {
        const firstName = (parsed.data.name || user.name).split(' ')[0] ?? null
        const { subject, html, text } = renderWelcomeEmail({ firstName })
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'COYL <hello@coyl.ai>',
          to: user.email,
          subject,
          html,
          text,
        })
      }
    } catch (err) {
      console.warn('[onboarding] welcome email failed: %s', (err as Error).message)
    }

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
