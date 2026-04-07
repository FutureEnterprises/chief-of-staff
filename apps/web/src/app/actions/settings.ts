'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@repo/database'
import { requireDbUser } from '@/lib/auth'

export async function updateUserSettings(data: {
  timezone?: string
  emailBriefingEnabled?: boolean
  emailBriefingDays?: string[]
}) {
  const user = await requireDbUser()

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.emailBriefingEnabled !== undefined && {
          emailBriefingEnabled: data.emailBriefingEnabled,
        }),
        ...(data.emailBriefingDays !== undefined && {
          emailBriefingDays: data.emailBriefingDays,
        }),
      },
    })
  } catch {
    throw new Error('Failed to update settings')
  }

  revalidatePath('/settings')
}
