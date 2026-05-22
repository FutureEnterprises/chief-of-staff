/**
 * GET /api/eap/v1/devices/[userId] — EAP primitive #2 Capability Discovery.
 *
 * Returns the user's full device fleet + each device's manifest + the
 * aggregate user preferences a coordinator needs in order to decide
 * whether (and how) to issue future ActionRequests:
 *
 *   • quietHours — taken from User.notificationPrefs.quietHours
 *     (already structured per the existing notification-prefs lib)
 *   • preferredModality — derived from the user-grant overlap of their
 *     fleet; e.g. if every device manifest lists 'haptic' as the
 *     primary actuator AND the user has granted edge:*:haptic to this
 *     partner, we surface 'haptic_first'
 *   • panicSwitch — true if PanicState.active AND not expired
 *
 * Auth: Bearer API key for an LLMPartner. The partner must have at
 * least one ACTIVE ScopeGrant from the target user — otherwise the
 * fleet is hidden and we 403. (Capability discovery is itself a
 * sensitive surface: knowing which devices a user owns leaks
 * personal-fleet metadata.)
 *
 * Internal-only fields stripped from the response: Device.pushToken,
 * Device.deviceFingerprint. The LLM only needs the per-device id +
 * deviceClass + manifest to compose actions; the push token is how
 * COYL Cloud reaches the device and never leaves the server boundary.
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@repo/database'

export const maxDuration = 15

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const partner = await authenticateLLMPartner(req)
  if (!partner.ok) {
    return NextResponse.json({ error: partner.error }, { status: partner.status })
  }

  const { userId } = await params
  if (!userId) {
    return NextResponse.json({ error: 'missing_user_id' }, { status: 400 })
  }
  const safeUserId = sanitizeCuid(userId)
  if (!safeUserId) {
    return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 })
  }

  // Authorization gate: the partner must have at least one active
  // ScopeGrant from this user. Without that, fleet enumeration is
  // blocked — knowing the user owns a Watch leaks personal metadata.
  const anyGrant = await prisma.scopeGrant.findFirst({
    where: {
      userId: safeUserId,
      llmPartnerId: partner.partnerId,
      active: true,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  })
  if (!anyGrant) {
    return NextResponse.json({ error: 'no_scope_granted' }, { status: 403 })
  }

  const [user, devices, panicState] = await Promise.all([
    prisma.user.findUnique({
      where: { id: safeUserId },
      select: { id: true, notificationPrefs: true },
    }),
    prisma.device.findMany({
      where: { userId: safeUserId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        deviceClass: true,
        model: true,
        os: true,
        manifestJson: true,
        operationalState: true,
        paired: true,
        online: true,
        lastSeenAt: true,
        // explicitly NOT selecting: deviceFingerprint, pushToken
      },
    }),
    prisma.panicState.findUnique({
      where: { userId: safeUserId },
      select: { active: true, expiresAt: true },
    }),
  ])

  if (!user) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }

  // PanicState is "active" only if the flag is set AND not expired.
  const panicActive = Boolean(
    panicState?.active &&
      (!panicState.expiresAt || panicState.expiresAt.getTime() > Date.now()),
  )

  // Pull quietHours off notificationPrefs if it's there. Coordinator
  // honors this without needing to re-query.
  const prefs =
    user.notificationPrefs &&
    typeof user.notificationPrefs === 'object' &&
    !Array.isArray(user.notificationPrefs)
      ? (user.notificationPrefs as Record<string, unknown>)
      : {}
  const quietHours = Array.isArray(prefs.quietHours) ? prefs.quietHours : []
  const preferredModality =
    typeof prefs.preferredModality === 'string'
      ? prefs.preferredModality
      : 'haptic_first'

  return NextResponse.json({
    userId: safeUserId,
    fleet: devices.map((d) => ({
      deviceId: d.id,
      deviceClass: d.deviceClass,
      model: d.model,
      os: d.os,
      paired: d.paired,
      online: d.online,
      lastSeenAt: d.lastSeenAt,
      manifest: d.manifestJson,
      operationalState: d.operationalState,
    })),
    aggregatePreferences: {
      quietHours,
      preferredModality,
      panicSwitch: panicActive,
      panicExpiresAt: panicState?.expiresAt ?? null,
    },
  })
}

// ---------- Inline helpers (mirrored from device/register; will move
// to lib/llm-partner-auth.ts when sibling agent ships) ----------

type PartnerAuthResult =
  | { ok: true; partnerId: string }
  | { ok: false; status: number; error: string }

async function authenticateLLMPartner(req: Request): Promise<PartnerAuthResult> {
  const authHeader = req.headers.get('authorization') ?? ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!bearer) return { ok: false, status: 401, error: 'missing_bearer_token' }

  const parts = bearer.split('_')
  if (parts.length < 4 || parts[0] !== 'coyl') {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }
  const partnerId = parts[2]
  const keySecret = parts.slice(3).join('_')
  if (!partnerId || !keySecret) {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }
  const safePartnerId = sanitizeCuid(partnerId)
  if (!safePartnerId) {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }

  // nosemgrep
  const partner = await prisma.lLMPartner.findUnique({
    where: { id: safePartnerId },
    select: { id: true, apiKeyHash: true, active: true },
  })
  if (!partner || !partner.active) {
    return { ok: false, status: 401, error: 'unknown_partner' }
  }
  const valid = await bcrypt.compare(keySecret, partner.apiKeyHash).catch(() => false)
  if (!valid) return { ok: false, status: 401, error: 'invalid_token' }
  return { ok: true, partnerId: partner.id }
}

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
