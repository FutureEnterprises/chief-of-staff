import { Metadata } from 'next'
import { DecideView } from './decide-view'

export const metadata: Metadata = { title: 'Decide' }

export default function DecidePage() {
  return <DecideView />
}
