import { prisma } from '@repo/database'
import {
  decryptToken,
  fetchLibreReadings,
  getEncryptionKey,
  getLibreConfig,
} from '@/lib/integrations/libre'

/**
 * Libre webhook / manual refresh endpoint.
 * Body: { clerkId: string }
 *
 * TODO: real Libre API access requires Abbott partnership LOI — until
 * then `fetchLibreReadings` returns mock data so the downstream signal
 * pipeline still has shape-correct rows.
 */
export async function POST(req: Request) {
  if (!getLibreConfig() || !getEncryptionKey()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400 })
  }
  const { clerkId } =
    typeof body === 'object' && body !== null
      ? (body as { clerkId?: string })
      : { clerkId: undefined }
  if (!clerkId) return Response.json({ error: 'missing_clerk_id' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  const tokenEvent = await prisma.productivityEvent.findFirst({
    where: { userId: user.id, eventValue: 'integration_token_libre' },
    orderBy: { createdAt: 'desc' },
    select: { metadataJson: true },
  })
  if (!tokenEvent?.metadataJson) {
    return Response.json({ error: 'no_token' }, { status: 404 })
  }
  const meta = tokenEvent.metadataJson as { accessToken?: string }
  if (!meta.accessToken) return Response.json({ error: 'no_token' }, { status: 404 })

  let accessToken: string
  try {
    accessToken = decryptToken(meta.accessToken)
  } catch {
    return Response.json({ error: 'token_decrypt_failed' }, { status: 500 })
  }

  const readings = await fetchLibreReadings(accessToken)
  if (readings.length === 0) {
    return Response.json({ ok: true, ingested: 0 })
  }

  await prisma.productivityEvent.createMany({
    data: readings.map((r) => ({
      userId: user.id,
      eventType: 'FEATURE_USED' as const,
      eventValue: 'cgm_reading',
      metadataJson: {
        source: 'libre',
        systemTime: r.systemTime,
        displayTime: r.displayTime,
        value: r.value,
        trend: r.trend ?? null,
        trendRate: r.trendRate ?? null,
      },
    })),
  })

  void fetch(new URL('/api/v1/health/ingest', process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger: 'cgm_ingest', userId: user.id }),
  }).catch(() => {})

  return Response.json({ ok: true, ingested: readings.length })
}
