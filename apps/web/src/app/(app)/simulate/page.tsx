import { Metadata } from 'next'
import { SimulateView } from './simulate-view'

export const metadata: Metadata = { title: 'Simulate' }

export default function SimulatePage() {
  return <SimulateView />
}
