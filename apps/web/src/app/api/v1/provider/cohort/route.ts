import { NextResponse } from 'next/server'
import {
  anonymizePatientName,
  getCurrentProvider,
  getProviderPatients,
} from '@/lib/provider-rbac'
import { prisma } from '@repo/database'

/**
 * GET /api/v1/provider/cohort
 *
 * Returns the provider's authorized patient list, with per-patient
 * aggregated cohort metrics. This is the back-end for /provider/cohort.
 *
 * Access control:
 *   - Clerk auth required
 *   - User.planType ∈ {PRO, TEAM} required (provider tier)
 *   - Patient list is filtered by the opt-in grant model in
 *     lib/provider-rbac.ts (v0.1 = patient pastes a magic token into
 *     a Commitment.rule field).
 *
 * HIPAA caveat: patient names are anonymized to first-name + last-
 * initial. Until a BAA-on-file flag exists (v0.2), full names are
 * never returned by this route. Raw biometric samples are not included
 * — only aggregated metrics. Patients retain full export rights via
 * the existing /settings export tooling.
 *
 * Per-patient metrics returned:
 *   - displayName       — first + last initial only
 *   - planType          — the patient's tier (informational)
 *   - lastSlipAt        — most recent SlipRecord or User.lastSlipAt
 *   - slipsThisMonth    — User.slipsThisMonth (canonical counter)
 *   - currentStreak     — User.currentStreak
 *   - selfTrustScore    — User.selfTrustScore (also surfaced via
 *                          ProductivityEvent FEATURE_USED with
 *                          eventValue='self_trust_score' history)
 *   - executionScore    — User.executionScore
 */
export async function GET() {
  const provider = await getCurrentProvider()
  if (!provider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const patients = await getProviderPatients(provider.id)

  if (patients.length === 0) {
    return NextResponse.json({
      provider: {
        id: provider.id,
        displayName: anonymizePatientName(provider.name),
      },
      patients: [],
      summary: {
        totalPatients: 0,
        slipsThisWeek: 0,
        averageSelfTrust: 0,
      },
      hipaaCaveat:
        'Aggregate clinical-grade data only. Names anonymized to first-name + last-initial. Raw biometric samples not exposed. Patient retains full export rights.',
    })
  }

  const patientIds = patients.map((p) => p.id)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Aggregate slips in the last week across the entire cohort. We
  // count SlipRecord rows for accuracy (User.slipsThisMonth is a
  // monthly rolling counter and doesn't isolate the last 7 days).
  const slipsThisWeekRows = await prisma.slipRecord.findMany({
    where: {
      userId: { in: patientIds },
      createdAt: { gte: sevenDaysAgo },
    },
    select: { userId: true },
  })
  const slipsThisWeek = slipsThisWeekRows.length

  const averageSelfTrust =
    patients.reduce((sum, p) => sum + (p.selfTrustScore ?? 0), 0) /
    patients.length

  const cohort = patients.map((p) => ({
    id: p.id,
    displayName: anonymizePatientName(p.name),
    planType: p.planType,
    lastSlipAt: p.lastSlipAt ? p.lastSlipAt.toISOString() : null,
    slipsThisMonth: p.slipsThisMonth,
    currentStreak: p.currentStreak,
    selfTrustScore: p.selfTrustScore,
    executionScore: p.executionScore,
    daysOnPlatform: Math.max(
      0,
      Math.floor((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    ),
  }))

  return NextResponse.json({
    provider: {
      id: provider.id,
      displayName: anonymizePatientName(provider.name),
    },
    patients: cohort,
    summary: {
      totalPatients: patients.length,
      slipsThisWeek,
      averageSelfTrust: Math.round(averageSelfTrust),
    },
    hipaaCaveat:
      'Aggregate clinical-grade data only. Names anonymized to first-name + last-initial. Raw biometric samples not exposed. Patient retains full export rights.',
  })
}
