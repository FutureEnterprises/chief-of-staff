import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { z } from 'zod'
import { hasFeature } from '@/lib/services/entitlement.service'

/**
 * Mobile-reported health data ingestion.
 * The iOS/Android app reads HealthKit/Google Fit locally (with user permission)
 * and POSTs aggregated day-level metrics here.
 *
 * We never store raw health records — only aggregated signals COYL uses
 * to infer stress / danger windows.
 */

const ingestSchema = z.object({
  provider: z.enum(['apple_health', 'google_fit']),
  date: z.string().datetime(),
  metrics: z.object({
    steps: z.number().int().min(0).max(200000).optional(),
    weightKg: z.number().min(20).max(400).optional(),
    sleepHours: z.number().min(0).max(24).optional(),
    heartRateAvg: z.number().min(30).max(220).optional(),
    restingHeartRate: z.number().min(30).max(150).optional(),
    workoutMinutes: z.number().int().min(0).max(1440).optional(),
  }),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, healthIntegrations: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'healthIntegrations')
  if (!canUse) {
    return Response.json({ error: 'feature_gated', feature: 'healthIntegrations' }, { status: 402 })
  }

  const parsed = ingestSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  // Update user's integration state
  const existing = (user.healthIntegrations as Record<string, unknown> | null) ?? {}
  const merged = {
    ...existing,
    [parsed.data.provider]: {
      connected: true,
      lastSyncAt: new Date().toISOString(),
    },
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { healthIntegrations: merged as unknown as object },
  })

  // Store metrics as a ProductivityEvent for pattern analysis
  await prisma.productivityEvent.create({
    data: {
      userId: user.id,
      eventType: 'FEATURE_USED',
      eventValue: `health_${parsed.data.provider}`,
      metadataJson: {
        provider: parsed.data.provider,
        date: parsed.data.date,
        metrics: parsed.data.metrics,
      },
    },
  })

  return Response.json({ ok: true })
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { healthIntegrations: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  return Response.json({ integrations: user.healthIntegrations ?? {} })
}
