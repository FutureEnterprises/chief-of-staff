import { Metadata } from 'next'
import { CreatorView } from './creator-view'

export const metadata: Metadata = { title: 'Creator program' }

export default function CreatorPage() {
  return <CreatorView />
}
