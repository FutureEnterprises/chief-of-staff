'use server'
import { revalidatePath } from 'next/cache'
import { requireDbUser } from '@/lib/auth'
import { completeFollowUp } from '@/lib/services/follow-up.service'

export async function completeFollowUpAction(taskId: string) {
  const user = await requireDbUser()
  await completeFollowUp(taskId, user.id)
  revalidatePath('/follow-ups')
  revalidatePath('/today')
}
