import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { z } from 'zod'
import { hasFeature } from '@/lib/services/entitlement.service'

/**
 * Google Calendar busy-time ingestion.
 *
 * The client uses Google's OAuth flow (via Clerk's Google connection)
 * to get read-only calendar access, then POSTs aggregated busy-window data
 * here. COYL uses this to infer high-stress days (density > threshold)
 * and pre-emptively fire interrupts.
 *
 * We never store calendar event titles or descriptions — only time ranges.
 */

const syncSchema = z.object({
  date: z.string().datetime(),
  busyMinutes: z.number().int().min(0).max(1440),
  eventCount: z.number().int().min(0).max(100),
  meetingDensity: z.enum(['light', 'moderate', 'heavy', 'punishing']).optional(),
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

  const parsed = syncSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  // Infer density if not provided
  const density = parsed.data.meetingDensity
    ?? (parsed.data.busyMinutes > 360 ? 'punishing'
        : parsed.data.busyMinutes > 240 ? 'heavy'
        : parsed.data.busyMinutes > 120 ? 'moderate'
        : 'light')

  const existing = (user.healthIntegrations as Record<string, unknown> | null) ?? {}
  const merged = {
    ...existing,
    calendar: { connected: true, lastSyncAt: new Date().toISOString() },
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { healthIntegrations: merged as unknown as object },
  })

  await prisma.productivityEvent.create({
    data: {
      userId: user.id,
      eventType: 'FEATURE_USED',
      eventValue: 'calendar_sync',
      metadataJson: {
        date: parsed.data.date,
        busyMinutes: parsed.data.busyMinutes,
        eventCount: parsed.data.eventCount,
        density,
      },
    },
  })

  return Response.json({ ok: true, density })
}
