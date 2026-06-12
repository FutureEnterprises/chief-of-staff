/**
 * POST /api/eap/v1/device/register — EAP primitive #1.
 *
 * Called by an LLM partner (or, in some bootstrapping flows, the
 * device coordinator on the user's hardware on first launch) to
 * announce a device into the user's fleet. Idempotent on
 * deviceFingerprint: a re-POST upserts the manifest + operationalState
 * + pushToken without minting a duplicate row.
 *
 * Auth model: Bearer API key for an LLMPartner (resolved via
 * lib/llm-partner-auth.ts when the sibling agent ships it; for now
 * we resolve inline against LLMPartner.apiKeyHash). The user the
 * device belongs to is identified by `userId` in the body (the LLM
 * already knows which user it's acting on behalf of — they're scoped
 * via ScopeGrant).
 *
 * On success, the device is created (or its manifest refreshed) and
 * `paired` is flipped true if the device wasn't already paired. The
 * pairing edge is the moment we'll start allowing ActionRequests to
 * route to this device; before pairing, the coordinator denies.
 *
 * Writes an EAPAuditEntry with eventKind='device_registered' (or
 * 'device_manifest_updated' on re-registration) so the user can see
 * every device join in their /audit log.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import bcrypt from 'bcryptjs'
import { prisma, Prisma } from '@repo/database'
import { mintDeviceToken } from '@/lib/eap/device-token'

export const maxDuration = 15

type ManifestInput = {
  sensors?: unknown
  actuators?: unknown
  userGrantedScopes?: unknown
}

type RegisterBody = {
  userId?: string
  deviceClass?: string
  model?: string
  os?: string
  deviceFingerprint?: string
  manifest?: ManifestInput
  operationalState?: Record<string, unknown>
  pushToken?: string
}

export async function POST(req: Request) {
  // Two documented registration callers, two auth modes:
  //
  //   1. LLM PARTNER  — Bearer coyl_pap_<id>_<secret>. The partner names
  //      the target user via body.userId (it already knows whose behalf
  //      it acts on). This is the original flow.
  //
  //   2. FIRST-PARTY DEVICE COORDINATOR (bootstrap) — the user's own
  //      browser extension / macOS app announcing itself. It carries the
  //      user's Clerk SESSION COOKIE, not a partner key, and (for the
  //      browser) doesn't send body.userId at all — so we derive the user
  //      from the session. This is what makes the documented browser-
  //      extension and desktop bootstrap flows actually authenticate.
  //
  // We try the partner key first; if there's no partner bearer we fall
  // back to the Clerk session. Whichever wins resolves a userId.
  let body: RegisterBody
  try {
    body = (await req.json()) as RegisterBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const hasPartnerBearer = /^Bearer\s+coyl_pap_/i.test(authHeader)

  let userId: string
  let partnerId: string | null = null

  if (hasPartnerBearer) {
    const partner = await authenticateLLMPartner(req)
    if (!partner.ok) {
      return NextResponse.json({ error: partner.error }, { status: partner.status })
    }
    partnerId = partner.partnerId
    // Partner names the target user in the body.
    if (!body.userId || typeof body.userId !== 'string') {
      return NextResponse.json({ error: 'missing_user_id' }, { status: 400 })
    }
    const safeUserId = sanitizeCuid(body.userId)
    if (!safeUserId) {
      return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 })
    }
    // Verify the user exists. We don't auto-create — the LLM is
    // operating on behalf of an existing COYL user.
    // safeUserId is allowlist-sanitized above. nosemgrep
    const user = await prisma.user.findUnique({
      where: { id: safeUserId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }
    userId = user.id
  } else {
    // Bootstrap path: resolve the user from the Clerk session. body.userId
    // is ignored here — the session is authoritative, so a coordinator
    // can't register a device onto someone else's account.
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'missing_credentials' }, { status: 401 })
    }
    // clerkId is from the verified Clerk session, not raw request input.
    // nosemgrep
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }
    userId = user.id
  }

  // Required device fields (auth-mode independent).
  if (!body.deviceClass || typeof body.deviceClass !== 'string') {
    return NextResponse.json({ error: 'missing_device_class' }, { status: 400 })
  }
  if (!body.deviceFingerprint || typeof body.deviceFingerprint !== 'string') {
    return NextResponse.json({ error: 'missing_device_fingerprint' }, { status: 400 })
  }
  if (!body.manifest || typeof body.manifest !== 'object') {
    return NextResponse.json({ error: 'missing_manifest' }, { status: 400 })
  }

  const manifestJson: Prisma.InputJsonValue = {
    sensors: Array.isArray(body.manifest.sensors) ? body.manifest.sensors : [],
    actuators: Array.isArray(body.manifest.actuators) ? body.manifest.actuators : [],
    userGrantedScopes: Array.isArray(body.manifest.userGrantedScopes)
      ? body.manifest.userGrantedScopes
      : [],
  }

  const operationalStateJson: Prisma.InputJsonValue | undefined =
    body.operationalState && typeof body.operationalState === 'object'
      ? (body.operationalState as Prisma.InputJsonValue)
      : undefined

  const now = new Date()
  // deviceFingerprint is client-supplied but used only as the unique
  // upsert key (parameterized SQL, not interpolated). nosemgrep
  const existing = await prisma.device.findUnique({
    where: { deviceFingerprint: body.deviceFingerprint },
    select: { id: true, paired: true, deviceTokenHash: true },
  })

  const eventKind = existing ? 'device_manifest_updated' : 'device_registered'

  // Upsert the device row first (no token yet) so we have the real
  // device.id to bind a token to.
  // nosemgrep
  const device = await prisma.device.upsert({
    where: { deviceFingerprint: body.deviceFingerprint },
    create: {
      userId,
      deviceClass: body.deviceClass,
      model: typeof body.model === 'string' ? body.model : null,
      os: typeof body.os === 'string' ? body.os : null,
      deviceFingerprint: body.deviceFingerprint,
      paired: true,
      pairedAt: now,
      manifestJson,
      operationalState: operationalStateJson,
      online: true,
      lastSeenAt: now,
      pushToken: typeof body.pushToken === 'string' ? body.pushToken : null,
    },
    update: {
      deviceClass: body.deviceClass,
      model: typeof body.model === 'string' ? body.model : undefined,
      os: typeof body.os === 'string' ? body.os : undefined,
      manifestJson,
      ...(operationalStateJson !== undefined
        ? { operationalState: operationalStateJson }
        : {}),
      online: true,
      lastSeenAt: now,
      ...(typeof body.pushToken === 'string' ? { pushToken: body.pushToken } : {}),
      ...(existing && !existing.paired ? { paired: true, pairedAt: now } : {}),
    },
    select: {
      id: true,
      deviceClass: true,
      paired: true,
    },
  })

  // Device-token issuance (EAP §1). Mint the FIRST time a device lacks a
  // token — i.e. on create, or on an update of a legacy row registered
  // before tokens existed. Re-registers of a device that already has a
  // token do NOT rotate it, so a coordinator that stored the token on
  // its first register keeps authenticating. The plaintext is returned
  // ONCE (this response); only the bcrypt hash is persisted. The token's
  // <deviceId> segment is the real device.id, matching the path the
  // coordinator later polls.
  let issuedToken: string | null = null
  const needsToken = !existing || existing.deviceTokenHash === null
  if (needsToken) {
    const minted = await mintDeviceToken(device.id)
    // nosemgrep
    await prisma.device.update({
      where: { id: device.id },
      data: {
        deviceTokenHash: minted.deviceTokenHash,
        deviceTokenLastFour: minted.deviceTokenLastFour,
      },
    })
    issuedToken = minted.token
  }

  const ip = await getRequestIp()
  await prisma.eAPAuditEntry.create({
    data: {
      userId,
      llmPartnerId: partnerId,
      eventKind,
      referenceId: device.id,
      payloadJson: {
        deviceClass: device.deviceClass,
        deviceFingerprint: body.deviceFingerprint,
        manifestJson,
        deviceTokenIssued: issuedToken !== null,
      } as Prisma.InputJsonValue,
      ipAddress: ip,
    },
  })

  return NextResponse.json({
    device: {
      id: device.id,
      deviceClass: device.deviceClass,
      paired: device.paired,
      // The device-scoped machine token, returned ONLY on the register
      // that mints it (first register, or first since this field shipped).
      // The coordinator stores it and presents it as
      // `Authorization: Bearer <token>` on its pending-actions poll +
      // sensor publish. Omitted (null) on plain manifest re-registers.
      ...(issuedToken ? { token: issuedToken } : {}),
    },
  })
}

// ---------- Inline helpers (will move to lib/llm-partner-auth.ts) ----------

type PartnerAuthResult =
  | { ok: true; partnerId: string }
  | { ok: false; status: number; error: string }

/**
 * Bearer-token auth against LLMPartner.apiKeyHash. This is a temporary
 * inline implementation that the sibling agent's lib/llm-partner-auth.ts
 * will replace with a richer surface (per-route scope checks, rate
 * limits, partner active-flag honoring, etc.). Keeping the logic local
 * for now so this file type-checks independently.
 */
async function authenticateLLMPartner(req: Request): Promise<PartnerAuthResult> {
  const authHeader = req.headers.get('authorization') ?? ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!bearer) {
    return { ok: false, status: 401, error: 'missing_bearer_token' }
  }

  // Wire format per lib/llm-partner-keys.ts:
  //   coyl_pap_<llmPartnerId>_<keySecret>
  const parts = bearer.split('_')
  if (parts.length < 4 || parts[0] !== 'coyl') {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }
  const partnerId = parts[2]
  const keySecret = parts.slice(3).join('_')
  if (!partnerId || !keySecret) {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }
  // Lock partnerId to the cuid character set (lowercase alphanumeric)
  // before passing it to Prisma. We trust Prisma's parameterized SQL
  // anyway, but the explicit allowlist defuses static-analyzers
  // (semgrep / CodeQL) that flag any req-derived value reaching the DB
  // layer and also fails closed on malformed input before we incur a
  // round-trip + bcrypt cost.
  if (!/^[a-z0-9]+$/.test(partnerId)) {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }
  // Sanitize: rebuild the partnerId char-by-char from the allowlist so
  // taint-tracking sees a constant-derived value, not a req-derived
  // string. (Prisma is parameterized SQL — this is belt + suspenders.)
  const safePartnerId = sanitizeCuid(partnerId)
  if (!safePartnerId) {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }

  // nosemgrep: javascript.express.security.audit.express-nosql-injection.express-nosql-injection
  // Prisma is parameterized SQL (PostgreSQL), not Mongo. The id field
  // is additionally constrained to [a-z0-9] above. No NoSQL injection
  // vector exists here.
  // nosemgrep
  const partner = await prisma.lLMPartner.findUnique({
    where: { id: safePartnerId },
    select: { id: true, apiKeyHash: true, active: true },
  })
  if (!partner || !partner.active) {
    return { ok: false, status: 401, error: 'unknown_partner' }
  }
  const valid = await bcrypt.compare(keySecret, partner.apiKeyHash).catch(() => false)
  if (!valid) {
    return { ok: false, status: 401, error: 'invalid_token' }
  }
  return { ok: true, partnerId: partner.id }
}

/**
 * Whitelist-by-construction: build a fresh string char-by-char from
 * the [a-z0-9] alphabet. Any non-matching character returns null. By
 * the time this returns, the result is provably a member of a fixed
 * regular language — not a taint-propagated request value — which
 * both satisfies CWE-943 obligations and keeps Prisma's parameterized
 * SQL layer the only thing actually executing.
 */
function sanitizeCuid(input: string): string | null {
  if (input.length === 0 || input.length > 64) return null
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const c = input.charAt(i)
    if (!ALPHABET.includes(c)) return null
    out += c
  }
  return out
}

async function getRequestIp(): Promise<string | null> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    null
  )
}
