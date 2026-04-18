import { Metadata } from 'next'
import { CommitmentsView } from './commitments-view'

export const metadata: Metadata = { title: 'Commitments' }

export default function CommitmentsPage() {
  return <CommitmentsView />
}
