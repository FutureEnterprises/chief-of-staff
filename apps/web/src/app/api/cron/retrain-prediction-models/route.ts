/**
 * GET /api/cron/retrain-prediction-models
 *
 * Nightly per-user model retrainer. Runs at 03:00 UTC via vercel.json
 * cron schedule "0 3 * * *". For every CORE+ user with ≥30 paired
 * SignalCluster outcomes, trains a fresh logistic regression and
 * rotates it in as the active model.
 *
 * Why nightly: SignalCluster outcomes resolve after 30/60 min, so by
 * 03:00 UTC the previous calendar day's data is fully labeled and
 * stable. Running more often would cost compute without changing the
 * model (training is deterministic given the same data).
 *
 * Why CORE+ only: predictive interrupts are a paid-tier feature.
 * Free users get the rule-based matcher; no point spending compute
 * on models they can't use.
 *
 * Failure mode: per-user training failures are logged and counted but
 * never crash the loop. One user's malformed data shouldn't deny the
 * other 99% of users a fresh model.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import { recordHeartbeat } from '@/lib/cron-heartbeat'
import { batchProcess } from '@/lib/batch'
import { trainAndPersistModel } from '@/lib/prediction-model'

export const maxDuration = 300

const MIN_CLUSTER_COUNT = 30
const TRAINING_CONCURRENCY = 10
const ELIGIBLE_PLANS = ['CORE', 'PLUS', 'PREMIUM', 'TEAM'] as const

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  // Find all CORE+ users who already have at least MIN_CLUSTER_COUNT
  // paired SignalCluster outcomes. We filter at the DB level so we
  // don't pull thousands of users into memory just to skip them.
  //
  // Note: this counts clusters with outcomeWithin30Min IS NOT NULL —
  // unresolved clusters don't contribute to training and shouldn't
  // count toward eligibility.
  const candidates = await prisma.user.findMany({
    where: {
      planType: { in: [...ELIGIBLE_PLANS] },
    },
    select: {
      id: true,
      _count: {
        select: {
          signalClusters: {
            where: { outcomeWithin30Min: { not: null } },
          },
        },
      },
    },
  })

  const eligible = candidates.filter(
    (u) => u._count.signalClusters >= MIN_CLUSTER_COUNT,
  )

  let retrained = 0
  let skipped = 0
  let errored = 0

  const results = await batchProcess(
    eligible,
    async (user) => {
      const newModel = await trainAndPersistModel(user.id)
      return { userId: user.id, retrained: newModel !== null }
    },
    TRAINING_CONCURRENCY,
  )

  for (const r of results) {
    if (r.error) {
      errored++
      console.warn(
        '[retrain-prediction-models] training failed',
        JSON.stringify({
          userId: r.item.id,
          err: r.error instanceof Error ? r.error.message : 'unknown',
        }),
      )
      continue
    }
    if (r.result?.retrained) {
      retrained++
    } else {
      // trainAndPersistModel returned null — usually because the
      // cluster outcomes were single-class (all slips or no slips).
      skipped++
    }
  }

  await recordHeartbeat('retrain-prediction-models', {
    retrained,
    skipped,
    errored,
    candidateCount: candidates.length,
    eligibleCount: eligible.length,
  })

  return NextResponse.json({
    ok: true,
    retrained,
    skipped,
    errored,
    candidateCount: candidates.length,
    eligibleCount: eligible.length,
    timestamp: new Date().toISOString(),
  })
}
