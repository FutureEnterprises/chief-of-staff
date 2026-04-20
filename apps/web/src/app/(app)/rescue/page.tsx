import { Metadata } from 'next'
import { requireDbUser } from '@/lib/auth'
import { RescueView } from './rescue-view'

export const metadata: Metadata = { title: 'Rescue' }

export default async function RescuePage() {
  const user = await requireDbUser()
  return <RescueView userId={user.id} />
}
