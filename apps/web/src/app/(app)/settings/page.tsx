import { requireDbUser } from '@/lib/auth'
import { SettingsView } from './settings-view'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const user = await requireDbUser()
  return <SettingsView user={user} />
}
