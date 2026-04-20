import { Metadata } from 'next'
import { SlipView } from './slip-view'

export const metadata: Metadata = { title: 'Slip recovery' }

export default function SlipPage() {
  return <SlipView />
}
