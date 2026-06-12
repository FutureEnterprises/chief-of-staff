/**
 * POST /api/eap/v1/sensor/[deviceId]/publish — EAP §5 sensor stream.
 *
 * The device coordinator publishes a full sensor snapshot here every
 * 60s (macOS SensorPublisher.swift; the browser + future bridges do the
 * same). We keep ONLY the most-recent snapshot on the Device row
 * (Device.lastSensorSnapshot + lastSensorAt). Durable history /
 * fan-out to subscribed LLM partners is the SensorSubscription webhook
 * channel's job, not this endpoint's.
 *
 * Auth (machine): identical surface to the pending-actions poll —
 * see lib/eap/device-auth.ts. Accepts the EAP device token, an LLM
 * partner key with a scope grant, or the user's Clerk session cookie.
 *
 * Body — EXACTLY what SensorPublisher.swift's `SnapshotPayload` encodes:
 *   {
 *     "snapshot": {                  // map of EAP sensor name → value
 *       "screen_state":  { "displayOn": true, "asOf": "..." },
 *       "battery":       { "percent": 82, "charging": false },
 *       "foreground_app":{ "bundleId": "com.apple.Safari", "name": "Safari" },
 *       "calendar_meeting_density": 3,
 *       "typing_pace": 42
 *     },
 *     "asOf": "2026-06-12T18:00:00Z" // ISO8601 capture time
 *   }
 *
 * The browser coordinator's snapshot keys differ (tab_state, active_url,
 * …) but the envelope is the same { snapshot, asOf } map — so we accept
 * any string-keyed object as the snapshot and don't hard-code sensor
 * names. We ALSO tolerate the alternative envelope { sensors, capturedAt }
 * in case a coordinator variant uses those key names.
 *
 * Size: snapshot is clamped to ≤ 8KB (serialized) so a misbehaving or
 * hostile coordinator can't park a large blob on the hot Device row.
 *
 * Response: 200 { ok: true }.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, Prisma } from '@repo/database'
import { authenticateDeviceRequest } from '@/lib/eap/device-auth'

export const maxDuration = 10

/** Max serialized snapshot size. Tunable. */
const MAX_SNAPSHOT_BYTES = 8 * 1024 // 8KB

/**
 * Envelope schema. The canonical client shape is { snapshot, asOf };
 * we also accept { sensors, capturedAt } as aliases. The snapshot value
 * is an arbitrary string-keyed JSON object (sensor name → value) — we
 * don't constrain the per-sensor shape because it's device-class
 * specific and the LLM-side consumers treat it as opaque JSON.
 */
const jsonRecord = z.record(z.string(), z.unknown())

const publishSchema = z
  .object({
    snapshot: jsonRecord.optional(),
    sensors: jsonRecord.optional(),
    asOf: z.string().datetime({ offset: true }).optional(),
    capturedAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine((b) => b.snapshot !== undefined || b.sensors !== undefined, {
    message: 'missing_snapshot',
  })

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params
  if (!deviceId) {
    return NextResponse.json({ error: 'missing_device_id' }, { status: 400 })
  }
  const safeDeviceId = sanitizeCuid(deviceId)
  if (!safeDeviceId) {
    return NextResponse.json({ error: 'invalid_device_id' }, { status: 400 })
  }

  const authed = await authenticateDeviceRequest(req, safeDeviceId)
  if (!authed.ok) {
    return NextResponse.json({ error: authed.error }, { status: authed.status })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = publishSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Canonicalize the two accepted envelopes to a single `snapshot`.
  const snapshot = parsed.data.snapshot ?? parsed.data.sensors ?? {}
  const capturedAtStr = parsed.data.asOf ?? parsed.data.capturedAt

  // Size clamp on the serialized snapshot. Reject (don't truncate) so the
  // coordinator gets a clear signal rather than silently-lossy storage.
  const serialized = JSON.stringify(snapshot)
  if (Buffer.byteLength(serialized, 'utf8') > MAX_SNAPSHOT_BYTES) {
    return NextResponse.json({ error: 'snapshot_too_large' }, { status: 413 })
  }

  // capturedAt: trust the client's reading when present + sane, else now.
  // We never let a client-supplied timestamp drift far into the future.
  const now = new Date()
  let capturedAt = now
  if (capturedAtStr) {
    const t = new Date(capturedAtStr)
    if (!Number.isNaN(t.getTime()) && t.getTime() <= now.getTime() + 60_000) {
      capturedAt = t
    }
  }

  // Store the latest snapshot + bump liveness. The publish loop is the
  // device's heartbeat, so online/lastSeenAt ride along here too.
  // authed.device.id is server-resolved (auth narrowed it to this row).
  // nosemgrep
  await prisma.device.update({
    where: { id: authed.device.id },
    data: {
      lastSensorSnapshot: snapshot as Prisma.InputJsonValue,
      lastSensorAt: capturedAt,
      online: true,
      lastSeenAt: now,
    },
  })

  return NextResponse.json({ ok: true })
}

/**
 * Whitelist-by-construction cuid sanitizer (mirrors the EAP routes).
 */
function sanitizeCuid(input: string): string | null {
  if (!input || input.length === 0 || input.length > 64) return null
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const c = input.charAt(i)
    if (!ALPHABET.includes(c)) return null
    out += c
  }
  return out
}
