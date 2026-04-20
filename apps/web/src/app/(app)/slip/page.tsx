import { Metadata } from 'next'
import { requireDbUser } from '@/lib/auth'
import { SlipView } from './slip-view'

export const metadata: Metadata = { title: 'Slip recovery' }

export default async function SlipPage() {
  const user = await requireDbUser()
  return <SlipView userId={user.id} currentStreak={user.currentStreak} />
}
