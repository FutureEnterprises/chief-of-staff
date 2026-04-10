'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@repo/database'
import { requireDbUser } from '@/lib/auth'
import { updateUserSchema } from '@/lib/validations'

export async function updateUserSettings(data: {
  timezone?: string
  emailBriefingEnabled?: boolean
  emailBriefingDays?: string[]
  reminderIntensity?: 'GENTLE' | 'STANDARD' | 'RELENTLESS'
}) {
  const user = await requireDbUser()

  const parsed = updateUserSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid settings data')
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: parsed.data,
    })
  } catch {
    throw new Error('Failed to update settings')
  }

  revalidatePath('/settings')
}
