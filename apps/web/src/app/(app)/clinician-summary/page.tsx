import { Suspense } from 'react'
import type { User } from '@repo/database'
import { requireDbUser } from '@/lib/auth'
import { buildClinicianSummary } from './summary-data'
import { SummaryView } from './summary-view'
import { UpgradeState } from './upgrade-state'

export const metadata = { title: 'Clinician summary' }

/**
 * /clinician-summary — the Rebound-tier ($29/mo, internal PlanType PLUS)
 * artifact a user brings to their prescriber: a print-optimized one-pager
 * of their behavioral pattern data.
 *
 * Auth + dynamic-data shape mirrors /today exactly: an async server
 * component that calls requireDbUser() and reads per-user Prisma rows,
 * rendered under a Suspense boundary. The (app) layout already provides
 * the auth-gated Suspense shell required by Next 16 cacheComponents; the
 * inner boundary here keeps this route's own uncached reads compliant.
 */

/** Tiers that unlock the full summary. PREMIUM/TEAM are above Rebound. */
function hasReboundAccess(planType: User['planType']): boolean {
  return (
    planType === 'PLUS' ||
    planType === 'PREMIUM' ||
    planType === 'TEAM'
  )
}

export default async function ClinicianSummaryPage() {
  const user = await requireDbUser()

  if (!hasReboundAccess(user.planType)) {
    return (
      <div className="h-full">
        <UpgradeState />
      </div>
    )
  }

  return (
    <div className="h-full">
      <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading...</div>}>
        <SummaryContent user={user} />
      </Suspense>
    </div>
  )
}

async function SummaryContent({ user }: { user: User }) {
  const summary = await buildClinicianSummary(user)
  return <SummaryView summary={summary} />
}
