import { Metadata } from 'next'
import { Suspense } from 'react'
import { AssessmentView } from './assessment-view'

export const metadata: Metadata = { title: 'Assessment' }

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <AssessmentView />
    </Suspense>
  )
}
