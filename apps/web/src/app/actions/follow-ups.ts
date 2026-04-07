'use server'
import { revalidatePath } from 'next/cache'
import { requireDbUser } from '@/lib/auth'
import { completeFollowUp } from '@/lib/services/follow-up.service'

export async function completeFollowUpAction(taskId: string) {
  const user = await requireDbUser()
  try {
    await completeFollowUp(taskId, user.id)
  } catch {
    throw new Error('Failed to complete follow-up')
  }
  revalidatePath('/follow-ups')
  revalidatePath('/today')
}
