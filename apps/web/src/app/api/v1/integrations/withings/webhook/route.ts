import { prisma } from '@repo/database'
import {
  decryptToken,
  fetchWithingsWeights,
  getEncryptionKey,
  getWithingsConfig,
} from '@/lib/integrations/withings'

/**
 * Withings webhook receiver. Withings POSTs form-encoded notifications:
 *   userid=...&appli=...
 * appli=1 means "new weight measurement". We look up the stored token for
 * the Withings userid and pull recent /measure data.
 *
 * Withings also issues a GET pre-flight to verify the endpoint — respond 200.
 */
export async function GET() {
  return new Response('ok', { status: 200 })
}

export async function POST(req: Request) {
  if (!getWithingsConfig() || !getEncryptionKey()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  // Withings sends application/x-www-form-urlencoded.
  let form: URLSearchParams
  try {
    const raw = await req.text()
    form = new URLSearchParams(raw)
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400 })
  }

  const withingsUserId = form.get('userid')
  if (!withingsUserId) {
    return Response.json({ error: 'missing_userid' }, { status: 400 })
  }

  // Look up the most recent token row that references this Withings user id.
  // We persisted withingsUserId on the metadataJson at /callback time.
  const tokenEvent = await prisma.productivityEvent.findFirst({
    where: {
      eventValue: 'integration_token_withings',
      // Prisma JSON filter — match metadataJson.withingsUserId.
      metadataJson: { path: ['withingsUserId'], equals: withingsUserId },
    },
    orderBy: { createdAt: 'desc' },
    select: { userId: true, metadataJson: true },
  })
  if (!tokenEvent) return Response.json({ ok: true, ingested: 0 })

  const meta = tokenEvent.metadataJson as { accessToken?: string }
  if (!meta.accessToken) return Response.json({ ok: true, ingested: 0 })

  let accessToken: string
  try {
    accessToken = decryptToken(meta.accessToken)
  } catch {
    return Response.json({ error: 'token_decrypt_failed' }, { status: 500 })
  }

  const readings = await fetchWithingsWeights(accessToken)
  if (readings.length === 0) return Response.json({ ok: true, ingested: 0 })

  await prisma.productivityEvent.createMany({
    data: readings.map((r) => ({
      userId: tokenEvent.userId,
      eventType: 'FEATURE_USED' as const,
      eventValue: 'weight_reading',
      metadataJson: {
        source: r.source,
        date: r.date,
        weightKg: r.weightKg,
      },
    })),
  })

  void fetch(new URL('/api/v1/health/ingest', process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger: 'weight_ingest', userId: tokenEvent.userId }),
  }).catch(() => {})

  return Response.json({ ok: true, ingested: readings.length })
}
