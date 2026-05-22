/**
 * POST /api/v1/health/ingest
 *
 * HealthKit batch ingestion endpoint. The iOS app accumulates HRV,
 * step, sedentary, sleep, unlock, and screen-on samples between
 * foreground sessions, then POSTs them here as a single batch. We
 * persist the raw samples (on `ProductivityEvent` for now — see file
 * header note) and asynchronously build a SignalCluster row off of
 * the freshly-landed signals.
 *
 * Layer 1 of the "Honest Gap" architecture — the substrate that the
 * per-user predictive model trains on.
 *
 * Raw samples are stored on ProductivityEvent with:
 *   eventType:    'FEATURE_USED'
 *   metadataJson: { type: 'health_sample', kind, valueNumeric, valueText }
 *
 * No new model is needed for raw samples until query volume justifies
 * a dedicated table. The cluster builder reads them back via the same
 * shape.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { checkRateLimit } from '@/lib/rate-limit'
import { buildSignalCluster } from '@/lib/signal-cluster'
import type { LocationInput } from '@/lib/health-signals'

export const maxDuration = 15

const ALLOWED_KINDS = new Set([
  'hrv',
  'steps',
  'sedentary',
  'sleep',
  'unlock',
  'screen_on',
])

type IngestSample = {
  kind: string
  valueNumeric: number
  valueText?: string
  capturedAt: string
}

type IngestBody = {
  samples?: IngestSample[]
  /** Optional iOS-resolved location classification for the batch's window. */
  location?: LocationInput | null
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const rl = await checkRateLimit('api', user.id)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  let body: IngestBody
  try {
    body = (await req.json()) as IngestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const samples = Array.isArray(body.samples) ? body.samples : []
  if (samples.length === 0) {
    return NextResponse.json(
      { error: 'samples array required' },
      { status: 400 },
    )
  }
  if (samples.length > 500) {
    return NextResponse.json(
      { error: 'batch too large (max 500 samples)' },
      { status: 413 },
    )
  }

  // Normalize + filter. Skip malformed rows rather than failing the
  // batch — partial ingestion is better than zero.
  const rows: Array<{
    userId: string
    eventType: 'FEATURE_USED'
    metadataJson: {
      type: 'health_sample'
      kind: string
      valueNumeric: number
      valueText: string | null
    }
    createdAt: Date
  }> = []

  for (const s of samples) {
    if (!s || typeof s !== 'object') continue
    if (!ALLOWED_KINDS.has(s.kind)) continue
    if (typeof s.valueNumeric !== 'number' || !Number.isFinite(s.valueNumeric)) continue
    const capturedAt = s.capturedAt ? new Date(s.capturedAt) : null
    if (!capturedAt || Number.isNaN(capturedAt.getTime())) continue

    rows.push({
      userId: user.id,
      eventType: 'FEATURE_USED',
      metadataJson: {
        type: 'health_sample',
        kind: s.kind,
        valueNumeric: s.valueNumeric,
        valueText: typeof s.valueText === 'string' ? s.valueText : null,
      },
      createdAt: capturedAt,
    })
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'no valid samples in batch' },
      { status: 400 },
    )
  }

  const result = await prisma.productivityEvent.createMany({ data: rows })

  // Best-effort cluster build — never block the response on it. If
  // anything in the chain fails (DB, helper, etc.) the next ingest
  // batch will get another shot.
  let clusterBuilt = false
  try {
    await buildSignalCluster(user.id, { location: body.location ?? null })
    clusterBuilt = true
  } catch (err) {
    console.error('[health/ingest] cluster build failed', err)
  }

  return NextResponse.json(
    {
      ok: true,
      samplesPersisted: result.count,
      clusterBuilt,
    },
    { headers: rl.headers },
  )
}
