/**
 * Per-user predictive model V0 — Layer 2 of the Honest Gap.
 *
 * This is what separates COYL from a smart journal. A thermometer
 * reads a state; a thermostat *predicts forward and acts*. Each user
 * gets their own logistic regression trained on their own paired
 * SignalCluster outcomes — physiological, behavioral, and contextual
 * features in, probability-of-slip-in-next-30-min out.
 *
 * Lifecycle:
 *   1. SignalCluster rows are captured continuously by Layer 1 (the
 *      passive-signal stack). Each row gets `outcomeWithin30Min`
 *      filled in retroactively once 30 minutes have elapsed.
 *   2. The nightly retrain cron calls `trainAndPersistModel(userId)`
 *      for every CORE+ user with ≥30 paired examples. New
 *      PredictionModel row is inserted with `active=true`, the
 *      previous active model is flipped to `active=false`.
 *   3. The intervention-mode router calls
 *      POST /api/v1/prediction/predict before firing an interrupt.
 *      Probability > 0.7 with high confidence → fire. Otherwise the
 *      interrupt is suppressed.
 *
 * Cold-start: users without 30 paired examples (most users in their
 * first 2-3 weeks) get null from `getActiveModel`. The router falls
 * back to the existing rule-based time-of-day matcher in that case.
 *
 * Feature vector (~40 dims, fixed layout):
 *   [0]   hrvDeltaPct (0 if null)
 *   [1]   sedentaryMins (0 if null)
 *   [2]   unlockRateDelta (0 if null)
 *   [3]   screenOnMins (0 if null)
 *   [4]   meetingDensity (0 if null)
 *   [5..11]  dayOfWeek one-hot (sun..sat)
 *   [12..35] hourOfDay one-hot (0..23)
 *   [36..39] locationKind one-hot (home, kitchen, work, unknown)
 */

import { prisma } from '@repo/database'
import type { PredictionModel, SignalCluster } from '@repo/database'
import {
  trainLogisticRegression,
  predictProbability,
} from './logistic-regression'

const FEATURE_VECTOR_SIZE = 40
const MIN_EXAMPLES_FOR_TRAINING = 30
const HIGH_CONFIDENCE_THRESHOLD = 0.7
const MEDIUM_CONFIDENCE_THRESHOLD = 0.55

const LOCATION_KINDS = ['home', 'kitchen', 'work', 'unknown'] as const

export type PredictionConfidence = 'high' | 'medium' | 'low'

export interface PredictionResult {
  probability: number
  confidence: PredictionConfidence
}

/**
 * Load the user's currently-active prediction model. Returns null if
 * the user has never had a model trained (cold start).
 */
export async function getActiveModel(
  userId: string,
): Promise<PredictionModel | null> {
  return prisma.predictionModel.findFirst({
    where: { userId, active: true },
    orderBy: { version: 'desc' },
  })
}

/**
 * Score a feature vector against a stored model. Returns probability
 * in [0, 1] plus a confidence band that the router uses to gate
 * firing.
 *
 * Confidence bands:
 *   high   — probability > 0.7 (strong signal, fire the interrupt)
 *   medium — 0.55 < probability ≤ 0.7 (borderline, log only)
 *   low    — probability ≤ 0.55 (don't interrupt)
 */
export function predict(
  model: PredictionModel,
  signalVector: number[],
): PredictionResult {
  const coefficients = extractCoefficientArray(model.coefficients)
  const probability = predictProbability(
    coefficients,
    model.intercept,
    signalVector,
  )

  let confidence: PredictionConfidence = 'low'
  if (probability > HIGH_CONFIDENCE_THRESHOLD) confidence = 'high'
  else if (probability > MEDIUM_CONFIDENCE_THRESHOLD) confidence = 'medium'

  return { probability, confidence }
}

/**
 * Convert a SignalCluster row into the fixed ~40-dim feature vector
 * the model expects. Null fields → 0 (the safest default; the model
 * learns to discount features that are usually null per-user).
 */
export function featureVector(cluster: SignalCluster): number[] {
  const v = new Array<number>(FEATURE_VECTOR_SIZE).fill(0)

  v[0] = cluster.hrvDeltaPct ?? 0
  v[1] = cluster.sedentaryMins ?? 0
  v[2] = cluster.unlockRateDelta ?? 0
  v[3] = cluster.screenOnMins ?? 0
  v[4] = cluster.meetingDensity ?? 0

  // dayOfWeek one-hot: indices 5..11 (Sunday=0)
  const dow = cluster.dayOfWeek
  if (typeof dow === 'number' && dow >= 0 && dow <= 6) {
    v[5 + dow] = 1
  }

  // hourOfDay one-hot: indices 12..35 (0..23)
  const hour = cluster.hourOfDay
  if (typeof hour === 'number' && hour >= 0 && hour <= 23) {
    v[12 + hour] = 1
  }

  // locationKind one-hot: indices 36..39
  const locIdx = LOCATION_KINDS.indexOf(
    (cluster.locationKind ?? 'unknown') as (typeof LOCATION_KINDS)[number],
  )
  if (locIdx >= 0) {
    v[36 + locIdx] = 1
  } else {
    // Unknown enum value → bucket as 'unknown'
    v[36 + LOCATION_KINDS.indexOf('unknown')] = 1
  }

  return v
}

/**
 * Train a fresh model for the user from all their paired
 * SignalCluster rows, persist it as the new active model, and flip
 * the previous active model to inactive. Returns the new model row,
 * or null if the user doesn't have enough paired data yet.
 *
 * Idempotent at the version level: each call creates version=N+1
 * regardless of whether the data changed. The nightly cron's caller
 * is responsible for not running this more often than needed.
 */
export async function trainAndPersistModel(
  userId: string,
): Promise<PredictionModel | null> {
  const clusters = await prisma.signalCluster.findMany({
    where: {
      userId,
      outcomeWithin30Min: { not: null },
    },
    orderBy: { capturedAt: 'asc' },
  })

  if (clusters.length < MIN_EXAMPLES_FOR_TRAINING) {
    return null
  }

  const X: number[][] = []
  const y: number[] = []
  for (const cluster of clusters) {
    X.push(featureVector(cluster))
    y.push(cluster.outcomeWithin30Min === 'slip' ? 1 : 0)
  }

  // Guard against degenerate single-class training sets: if every
  // example is a slip (or no example is), the model would predict
  // the trivial constant — better to bail than ship a useless model
  // that overrides cold-start fallback.
  const positives = y.reduce((sum, v) => sum + v, 0)
  if (positives === 0 || positives === y.length) {
    return null
  }

  const { coefficients, intercept, accuracy, precision, recall } =
    trainLogisticRegression(X, y)

  // Build the coefficients JSON in fixed-index order so future
  // featureVector() callers can score against it without a name map.
  // Stored as a plain array so Prisma's Json column accepts it cleanly.
  const coefficientsJson = coefficients

  // Rotate the active flag inside a transaction so there's never a
  // moment with two active models for the same user.
  const newModel = await prisma.$transaction(async (tx) => {
    await tx.predictionModel.updateMany({
      where: { userId, active: true },
      data: { active: false },
    })

    const latest = await tx.predictionModel.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    return tx.predictionModel.create({
      data: {
        userId,
        version: nextVersion,
        coefficients: coefficientsJson,
        intercept,
        sampleCount: clusters.length,
        accuracy,
        precision,
        recall,
        active: true,
      },
    })
  })

  return newModel
}

/**
 * Pull the coefficient array out of the Json field. Stored as a flat
 * number[] in the fixed FEATURE_VECTOR_SIZE order — if a model row
 * predates this layout (or was hand-edited), we tolerate it by
 * padding with zeros so predict() never crashes.
 */
function extractCoefficientArray(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    const out: number[] = []
    for (const v of raw) out.push(typeof v === 'number' ? v : 0)
    while (out.length < FEATURE_VECTOR_SIZE) out.push(0)
    return out
  }
  // Defensive fallback — older or malformed coefficient blobs become
  // a zero vector, which predicts the intercept-only constant.
  return new Array<number>(FEATURE_VECTOR_SIZE).fill(0)
}

export const PREDICTION_CONSTANTS = {
  FEATURE_VECTOR_SIZE,
  MIN_EXAMPLES_FOR_TRAINING,
  HIGH_CONFIDENCE_THRESHOLD,
  MEDIUM_CONFIDENCE_THRESHOLD,
}
