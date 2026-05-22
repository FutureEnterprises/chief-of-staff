/**
 * POST /api/v1/prediction/predict
 *
 * On-demand prediction endpoint. Consumed by the intervention-mode
 * router to gate firing — only when the user's personal model says
 * P(slip in next 30min) > 0.7 with high confidence do we deliver an
 * interrupt. Everything below that threshold gets logged but
 * suppressed.
 *
 * Returns shouldFire=false in all cold-start cases:
 *   - User has no SignalCluster in the last 60 min (no recent signal)
 *   - User has no active PredictionModel (hasn't crossed the 30-example
 *     paired-data threshold yet)
 *
 * The router treats shouldFire=false as "fall back to rule-based
 * matcher" — it does NOT mean "do nothing."
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import {
  featureVector,
  getActiveModel,
  predict,
} from '@/lib/prediction-model'

const RECENT_CLUSTER_WINDOW_MS = 60 * 60 * 1000 // 60 minutes

export async function POST(_req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Active model — null means cold start (no model trained yet).
  const model = await getActiveModel(user.id)
  if (!model) {
    return NextResponse.json({
      probability: null,
      confidence: 'low' as const,
      shouldFire: false,
      modelVersion: null,
      reason: 'no_active_model',
    })
  }

  // Most recent SignalCluster within the lookback window. The
  // passive-signal stack captures these continuously; if we don't
  // have one in the last 60 min, the device isn't reporting signal
  // and we shouldn't pretend to predict.
  const since = new Date(Date.now() - RECENT_CLUSTER_WINDOW_MS)
  const cluster = await prisma.signalCluster.findFirst({
    where: {
      userId: user.id,
      capturedAt: { gte: since },
    },
    orderBy: { capturedAt: 'desc' },
  })

  if (!cluster) {
    return NextResponse.json({
      probability: null,
      confidence: 'low' as const,
      shouldFire: false,
      modelVersion: model.version,
      reason: 'no_recent_signal',
    })
  }

  const vector = featureVector(cluster)
  const { probability, confidence } = predict(model, vector)

  const shouldFire = probability > 0.7 && confidence === 'high'

  return NextResponse.json({
    probability,
    confidence,
    shouldFire,
    modelVersion: model.version,
    clusterId: cluster.id,
    capturedAt: cluster.capturedAt.toISOString(),
  })
}
