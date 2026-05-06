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

/**
 * GLP-1 companion profile update.
 *
 * Separate action so the GLP-1 form on /settings can save without
 * touching reminder / briefing state. Pass null on any field to clear
 * it. Specifically: pass `glp1Drug: null` to remove the entire profile,
 * or `glp1EndedAt: <date>` to mark the user as off the drug (triggers
 * the 90-day relapse-prevention protocol downstream).
 *
 * Dates arrive as ISO strings from the form, get coerced to Date
 * objects before the DB write — Prisma's TIMESTAMP(3) column needs the
 * Date type explicitly under some adapters.
 */
export async function updateGlp1Profile(data: {
  glp1Drug?: string | null
  glp1InjectionWeekday?: number | null
  glp1StartedAt?: string | null
  glp1EndedAt?: string | null
}) {
  const user = await requireDbUser()

  const parsed = updateUserSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid GLP-1 profile data')
  }

  const toUpdate: Record<string, unknown> = {}
  if ('glp1Drug' in parsed.data) toUpdate.glp1Drug = parsed.data.glp1Drug
  if ('glp1InjectionWeekday' in parsed.data)
    toUpdate.glp1InjectionWeekday = parsed.data.glp1InjectionWeekday
  if ('glp1StartedAt' in parsed.data) {
    toUpdate.glp1StartedAt = parsed.data.glp1StartedAt
      ? new Date(parsed.data.glp1StartedAt)
      : null
  }
  if ('glp1EndedAt' in parsed.data) {
    toUpdate.glp1EndedAt = parsed.data.glp1EndedAt
      ? new Date(parsed.data.glp1EndedAt)
      : null
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: toUpdate,
    })
  } catch {
    throw new Error('Failed to update GLP-1 profile')
  }

  revalidatePath('/settings')
  revalidatePath('/today')
}
