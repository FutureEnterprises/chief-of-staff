/**
 * POST /api/eap/v1/action/request — EAP primitive #3 Action Request.
 *
 * The LLM proposes a single actuator action on a single device.
 * Coordinator stack runs in this order:
 *
 *   1. LLM-partner auth (Bearer)
 *   2. Request shape validation
 *   3. PanicState gate — if active, return decision='denied' with
 *      reason='panic_active' WITHOUT touching the rate limiter
 *   4. Device + user resolution; partner sees only paired devices
 *      belonging to the userId they claimed
 *   5. ScopeGrant check for the exact scope the LLM is asking for
 *   6. Rate-limit check (sibling-agent module; placeholder returns
 *      allowed=true for now)
 *   6.5 UAP execution-receipt redemption — when the caller presents a
 *      `rcpt_…` receipt from POST /api/uap/v1/execute, it is redeemed
 *      before anything is written or dispatched, and must match the
 *      exact effect being requested. See the gate for the scope
 *      boundary (this mediates COYL-owned executors, not effects a
 *      partner performs in its own infrastructure).
 *   7. Mint an executionToken, write the ActionRequest row, schedule
 *      willExecuteAt
 *   8. Fire-and-forget executeAction() so the request returns fast
 *      and the actuator dispatch happens in the background
 *
 * Every meaningful decision (allowed / denied / queued) and every
 * outcome (executed / failed) writes an EAPAuditEntry — the entries
 * are the source of truth for the user's /audit log.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { prisma, Prisma } from '@repo/database'
import { executeAction } from '@/lib/eap/action-executor'
import { checkActionRateLimit } from '@/lib/eap/action-rate-limit'
import { isUserCoachingPathClosed } from '@/lib/rap/store'
import {
  computeActionHash,
  consumeExecutionReceipt,
  decodeExecutionReceipt,
} from '@/lib/uap/execution-receipt'

export const maxDuration = 20

type ActionBody = {
  actionKey?: string
  userId?: string
  deviceId?: string
  actuator?: string
  params?: Record<string, unknown>
  scopeRequested?: string
  reasoning?: string
  confidence?: number
  ttlSeconds?: number
  /**
   * A single-use UAP execution receipt (`rcpt_…`) obtained from
   * POST /api/uap/v1/execute. When present it is REDEEMED here, before
   * anything fires, and the redemption must match the effect this
   * request describes — see the gate below.
   */
  executionReceipt?: string
}

/**
 * Canonical serialization of the EFFECT this route will produce. This
 * is the `action_params` half of the UAP action hash, so a partner that
 * wants a redeemable receipt must have declared the exact actuator,
 * device and params at UAP EXECUTE time:
 *
 *   POST /api/uap/v1/execute
 *     { action: { kind: <uap kind>,
 *                 params: { actuator, deviceId, params } } }
 *
 * Any divergence between what was authorized and what is being fired
 * changes the hash, and the receipt is refused with
 * `action_hash_mismatch`. That is the whole point: the receipt
 * authorizes ONE effect, not "an effect."
 */
function effectParams(body: ActionBody, deviceId: string) {
  return {
    actuator: body.actuator,
    deviceId,
    params: body.params ?? {},
  }
}

export async function POST(req: Request) {
  const partner = await authenticateLLMPartner(req)
  if (!partner.ok) {
    return NextResponse.json({ error: partner.error }, { status: partner.status })
  }

  let body: ActionBody
  try {
    body = (await req.json()) as ActionBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Required-field validation up front. We rely on a deterministic
  // actionKey so retries from the LLM don't create duplicate
  // ActionRequest rows.
  if (!body.actionKey || typeof body.actionKey !== 'string') {
    return NextResponse.json({ error: 'missing_action_key' }, { status: 400 })
  }
  if (!body.userId || typeof body.userId !== 'string') {
    return NextResponse.json({ error: 'missing_user_id' }, { status: 400 })
  }
  if (!body.deviceId || typeof body.deviceId !== 'string') {
    return NextResponse.json({ error: 'missing_device_id' }, { status: 400 })
  }
  if (!body.actuator || typeof body.actuator !== 'string') {
    return NextResponse.json({ error: 'missing_actuator' }, { status: 400 })
  }
  if (!body.scopeRequested || typeof body.scopeRequested !== 'string') {
    return NextResponse.json({ error: 'missing_scope' }, { status: 400 })
  }
  if (!body.reasoning || typeof body.reasoning !== 'string') {
    return NextResponse.json({ error: 'missing_reasoning' }, { status: 400 })
  }

  const safeUserId = sanitizeCuid(body.userId)
  const safeDeviceId = sanitizeCuid(body.deviceId)
  if (!safeUserId || !safeDeviceId) {
    return NextResponse.json({ error: 'invalid_id_format' }, { status: 400 })
  }

  const ip = await getRequestIp()

  // 0. RAP gate — runs FIRST, ahead of every other gate. A closed
  // coaching path (CRISIS_INDICATION / LEGAL_OR_MEDICAL_EMERGENCY
  // classified by RAP within the active window) supersedes every
  // protocol layer per RAP-0.1 §2 — including EAP device actions. A
  // person in a closed coaching path must not be reachable by any
  // partner-initiated device actuation. Fail-open on a RAP store read
  // error (same posture as the PAP/UAP coordinators): a RAP outage
  // must not brick the EAP plane; the panic + scope gates still run.
  let coachingClosed = false
  try {
    coachingClosed = await isUserCoachingPathClosed(safeUserId)
  } catch {
    coachingClosed = false
  }
  if (coachingClosed) {
    const denied = await writeDeniedRequest({
      body,
      partnerId: partner.partnerId,
      userId: safeUserId,
      deviceId: safeDeviceId,
      reason: 'rap_coaching_path_closed',
      ip,
    })
    return NextResponse.json(
      {
        decision: 'denied',
        reason: 'rap_coaching_path_closed',
        actionRequestId: denied?.id ?? null,
      },
      { status: 200 },
    )
  }

  // 1. PanicState gate. If the user has tripped the panic switch and
  // it hasn't expired, every LLM-initiated action denies up front.
  // Importantly we run this BEFORE consulting any other gate so the
  // user's emergency-revoke can never be undermined by a stale grant.
  // nosemgrep
  const panic = await prisma.panicState.findUnique({
    where: { userId: safeUserId },
    select: { active: true, expiresAt: true },
  })
  const panicActive = Boolean(
    panic?.active &&
      (!panic.expiresAt || panic.expiresAt.getTime() > Date.now()),
  )
  if (panicActive) {
    const denied = await writeDeniedRequest({
      body,
      partnerId: partner.partnerId,
      userId: safeUserId,
      deviceId: safeDeviceId,
      reason: 'panic_active',
      ip,
    })
    return NextResponse.json(
      { decision: 'denied', reason: 'panic_active', actionRequestId: denied?.id ?? null },
      { status: 200 },
    )
  }

  // 2. Device must exist, belong to the claimed user, and be paired.
  // nosemgrep
  const device = await prisma.device.findUnique({
    where: { id: safeDeviceId },
    select: {
      id: true,
      userId: true,
      deviceClass: true,
      paired: true,
      pushToken: true,
      manifestJson: true,
      online: true,
      lastSeenAt: true,
      createdAt: true,
      updatedAt: true,
      model: true,
      os: true,
      deviceFingerprint: true,
      pairedAt: true,
      operationalState: true,
      // New columns (device token + last sensor snapshot) — selected so
      // the row still satisfies the full Device type executeAction wants.
      deviceTokenHash: true,
      deviceTokenLastFour: true,
      lastSensorSnapshot: true,
      lastSensorAt: true,
    },
  })
  if (!device || device.userId !== safeUserId) {
    const denied = await writeDeniedRequest({
      body,
      partnerId: partner.partnerId,
      userId: safeUserId,
      deviceId: safeDeviceId,
      reason: 'device_not_found',
      ip,
    })
    return NextResponse.json(
      { decision: 'denied', reason: 'device_not_found', actionRequestId: denied?.id ?? null },
      { status: 200 },
    )
  }
  if (!device.paired) {
    const denied = await writeDeniedRequest({
      body,
      partnerId: partner.partnerId,
      userId: safeUserId,
      deviceId: safeDeviceId,
      reason: 'device_not_paired',
      ip,
    })
    return NextResponse.json(
      { decision: 'denied', reason: 'device_not_paired', actionRequestId: denied?.id ?? null },
      { status: 200 },
    )
  }

  // 3. Scope gate. The partner must have an active, unrevoked,
  // unexpired ScopeGrant for the exact scope the action requests.
  // Irreversible scopes (':irreversible' suffix per spec) NEVER auto-
  // fire — we mark the request pending_confirmation and stop here.
  const isIrreversible = body.scopeRequested.endsWith(':irreversible')
  // nosemgrep
  const grant = await prisma.scopeGrant.findFirst({
    where: {
      userId: safeUserId,
      llmPartnerId: partner.partnerId,
      scope: body.scopeRequested,
      active: true,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  })
  if (!grant) {
    const denied = await writeDeniedRequest({
      body,
      partnerId: partner.partnerId,
      userId: safeUserId,
      deviceId: safeDeviceId,
      reason: 'scope_not_granted',
      ip,
    })
    return NextResponse.json(
      {
        decision: 'denied',
        reason: 'scope_not_granted',
        ungrantedScope: body.scopeRequested,
        actionRequestId: denied?.id ?? null,
      },
      { status: 200 },
    )
  }

  // 4. Rate-limit gate. Two sliding-window bands (the tighter one wins),
  // enforced distributed-first via Upstash with a per-process fallback —
  // the established pattern from api/v1/waitlist. A denial still records
  // an ActionRequest row + audit entry (writeDeniedRequest) exactly as
  // every other deny path here does.
  const rl = await checkActionRateLimit({
    partnerId: partner.partnerId,
    userId: safeUserId,
    deviceId: safeDeviceId,
    actuator: body.actuator,
  })
  if (!rl.allowed) {
    const denied = await writeDeniedRequest({
      body,
      partnerId: partner.partnerId,
      userId: safeUserId,
      deviceId: safeDeviceId,
      reason: rl.reason ?? 'rate_limited',
      ip,
    })
    return NextResponse.json(
      {
        decision: 'denied',
        reason: rl.reason ?? 'rate_limited',
        retryAfterSec: rl.retryAfterSec,
        actionRequestId: denied?.id ?? null,
      },
      { status: 200 },
    )
  }

  // 4.5 UAP execution receipt — the effect choke point.
  //
  // This is where a UAP decision stops being advisory for effects COYL
  // itself performs. If the caller presents a receipt, it is redeemed
  // HERE, before any row is written and before any actuator fires:
  //
  //   • the receipt must authenticate (HMAC over its claims),
  //   • it must not have expired,
  //   • it must belong to this partner,
  //   • the effect being requested must hash to the action the receipt
  //     authorized — actuator, device and params included, and
  //   • it must be unspent. Redemption is a once-only claim backed by a
  //     unique primary key, so a replayed receipt fires nothing.
  //
  // Any refusal denies the action and records the denial. Nothing runs.
  //
  // SCOPE, stated honestly: a receipt is required only when one is
  // presented. A partner that never asks UAP for a decision cannot be
  // compelled by this route to obtain one, and an effect a partner
  // performs inside its own infrastructure never passes through here at
  // all — no code we ship is in that path. What this DOES guarantee is
  // that for COYL-owned executors, a presented authorization is real,
  // matches the effect, and is spent exactly once. Requiring receipts
  // unconditionally on this route is a breaking protocol change for
  // existing EAP clients and is deliberately not made here.
  if (typeof body.executionReceipt === 'string' && body.executionReceipt.length > 0) {
    const receiptId = body.executionReceipt

    const refuse = async (reason: string, detail?: string) => {
      const denied = await writeDeniedRequest({
        body,
        partnerId: partner.partnerId,
        userId: safeUserId,
        deviceId: safeDeviceId,
        reason,
        ip,
      })
      return NextResponse.json(
        {
          decision: 'denied',
          reason,
          ...(detail ? { detail } : {}),
          actionRequestId: denied?.id ?? null,
        },
        { status: 200 },
      )
    }

    // Authenticate first so the action kind, grant and decision id used
    // to rebuild the hash come out of the MAC'd claims, not the body.
    const decoded = decodeExecutionReceipt(receiptId)
    if (!decoded.ok) return refuse(decoded.reason, decoded.detail)

    const presentedHash = computeActionHash({
      userId: safeUserId,
      grantId: decoded.claims.gid,
      actionKind: decoded.claims.ak,
      actionParams: effectParams(body, safeDeviceId),
      decisionId: decoded.claims.aud,
    })

    // Replays of an already-recorded actionKey must not re-consume: the
    // row already exists and the executor will not re-fire it (see the
    // isFreshRow guard below), so nothing new is being authorized.
    // nosemgrep
    const prior = await prisma.actionRequest.findUnique({
      where: { actionKey: body.actionKey },
      select: { id: true },
    })

    if (!prior) {
      const redeemed = await consumeExecutionReceipt({
        receiptId,
        actionHash: presentedHash,
        partnerId: partner.partnerId,
      })
      if (!redeemed.ok) {
        return refuse(redeemed.reason, redeemed.detail)
      }
      // Redeemed. Note the target user needs no separate check: userId
      // is inside the hashed tuple, so a receipt minted for a different
      // user cannot produce a matching hash here.
    }
  }

  // 5. Irreversible: stash the row in pending_confirmation. Do NOT
  // mint an executionToken; the user-side consent flow will promote
  // it to allowed + executed once the per-action confirmation lands.
  const now = new Date()
  const ttlSeconds = typeof body.ttlSeconds === 'number' ? body.ttlSeconds : 30
  const willExecuteAt = new Date(now.getTime() + 0) // immediate; ttl bounds the window

  if (isIrreversible) {
    // nosemgrep
    const pending = await prisma.actionRequest.upsert({
      where: { actionKey: body.actionKey },
      create: {
        actionKey: body.actionKey,
        llmPartnerId: partner.partnerId,
        userId: safeUserId,
        deviceId: safeDeviceId,
        actuator: body.actuator,
        paramsJson: (body.params ?? {}) as Prisma.InputJsonValue,
        scopeRequested: body.scopeRequested,
        reasoning: body.reasoning,
        confidence:
          typeof body.confidence === 'number' ? body.confidence : null,
        decision: 'pending_confirmation',
        decisionReason: 'irreversible_requires_per_action_consent',
      },
      update: {},
      select: { id: true },
    })
    await writeAudit({
      userId: safeUserId,
      llmPartnerId: partner.partnerId,
      eventKind: 'action_pending_confirmation',
      referenceId: pending.id,
      payload: {
        actuator: body.actuator,
        scope: body.scopeRequested,
        deviceId: safeDeviceId,
      },
      ip,
    })
    return NextResponse.json(
      {
        decision: 'pending_confirmation',
        reason: 'irreversible_requires_per_action_consent',
        actionRequestId: pending.id,
      },
      { status: 200 },
    )
  }

  // 6. Allowed path: mint executionToken + write the row + audit +
  // fire-and-forget the executor. We upsert on actionKey with
  // `update: {}` so a retry maps onto the SAME row — and we detect
  // that case by comparing the stored executionToken against the one
  // we just minted. A pre-existing row means this request is a REPLAY:
  // the actuator must NOT fire again (upsert idempotency protects the
  // row, but re-invoking the executor would push the user's device a
  // second/Nth time), no duplicate audit row is written, and the
  // response reflects the STORED decision — a row previously denied or
  // parked pending_confirmation must not be reported back as
  // 'allowed' with a fabricated execution.
  const executionToken = `et_${randomBytes(16).toString('hex')}`
  // nosemgrep
  const created = await prisma.actionRequest.upsert({
    where: { actionKey: body.actionKey },
    create: {
      actionKey: body.actionKey,
      llmPartnerId: partner.partnerId,
      userId: safeUserId,
      deviceId: safeDeviceId,
      actuator: body.actuator,
      paramsJson: (body.params ?? {}) as Prisma.InputJsonValue,
      scopeRequested: body.scopeRequested,
      reasoning: body.reasoning,
      confidence:
        typeof body.confidence === 'number' ? body.confidence : null,
      decision: 'allowed',
      decisionReason: null,
      executionToken,
    },
    update: {},
    select: {
      id: true,
      executionToken: true,
      decision: true,
      decisionReason: true,
      executedAt: true,
      llmPartnerId: true,
    },
  })

  const isFreshRow = created.executionToken === executionToken

  if (!isFreshRow) {
    // Replay of an existing actionKey — return the stored state
    // verbatim. No executor re-fire, no duplicate audit row.
    return NextResponse.json(
      {
        decision: created.decision,
        ...(created.decision === 'allowed'
          ? {
              executionToken: created.executionToken,
              willExecuteAt: willExecuteAt.toISOString(),
            }
          : { reason: created.decisionReason ?? undefined }),
        actionRequestId: created.id,
        idempotentReplay: true,
      },
      { status: 200 },
    )
  }

  await writeAudit({
    userId: safeUserId,
    llmPartnerId: partner.partnerId,
    eventKind: 'action_allowed',
    referenceId: created.id,
    payload: {
      actuator: body.actuator,
      scope: body.scopeRequested,
      deviceId: safeDeviceId,
      executionToken: created.executionToken,
      ttlSeconds,
    },
    ip,
  })

  // Fire-and-forget the executor. We don't await it: the LLM gets a
  // fast response and the actuator dispatch happens in the
  // background. Errors inside executeAction surface as
  // outcome='failed' on the ActionRequest row.
  void executeAction(
    {
      id: created.id,
      actionKey: body.actionKey,
      llmPartnerId: partner.partnerId,
      userId: safeUserId,
      deviceId: safeDeviceId,
      actuator: body.actuator,
      paramsJson: (body.params ?? {}) as Prisma.JsonValue,
      scopeRequested: body.scopeRequested,
      reasoning: body.reasoning,
      confidence: typeof body.confidence === 'number' ? body.confidence : null,
      decision: 'allowed',
      decisionReason: null,
      executionToken: created.executionToken,
      executedAt: null,
      outcome: null,
      outcomeReason: null,
      outcomeAt: null,
      userInteracted: false,
      orchestrationId: null,
      createdAt: now,
    },
    device,
  ).catch(() => {
    // executor handles its own failure-bookkeeping; this catch only
    // prevents unhandled-rejection warnings from killing the lambda.
  })

  return NextResponse.json(
    {
      decision: 'allowed',
      executionToken: created.executionToken,
      willExecuteAt: willExecuteAt.toISOString(),
      actionRequestId: created.id,
    },
    { status: 200 },
  )
}

// ---------- Helpers ----------

async function writeDeniedRequest(args: {
  body: ActionBody
  partnerId: string
  userId: string
  deviceId: string
  reason: string
  ip: string | null
}): Promise<{ id: string } | null> {
  if (!args.body.actionKey || !args.body.actuator || !args.body.scopeRequested) {
    return null
  }
  try {
    // nosemgrep
    const row = await prisma.actionRequest.upsert({
      where: { actionKey: args.body.actionKey },
      create: {
        actionKey: args.body.actionKey,
        llmPartnerId: args.partnerId,
        userId: args.userId,
        deviceId: args.deviceId,
        actuator: args.body.actuator,
        paramsJson: (args.body.params ?? {}) as Prisma.InputJsonValue,
        scopeRequested: args.body.scopeRequested,
        reasoning: args.body.reasoning ?? '',
        confidence:
          typeof args.body.confidence === 'number' ? args.body.confidence : null,
        decision: 'denied',
        decisionReason: args.reason,
      },
      update: {},
      select: { id: true },
    })
    await writeAudit({
      userId: args.userId,
      llmPartnerId: args.partnerId,
      eventKind: 'action_denied',
      referenceId: row.id,
      payload: {
        actuator: args.body.actuator,
        scope: args.body.scopeRequested,
        deviceId: args.deviceId,
        reason: args.reason,
      },
      ip: args.ip,
    })
    return row
  } catch {
    return null
  }
}

async function writeAudit(args: {
  userId: string
  llmPartnerId: string | null
  eventKind: string
  referenceId: string | null
  payload: Record<string, unknown>
  ip: string | null
}): Promise<void> {
  try {
    await prisma.eAPAuditEntry.create({
      data: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        eventKind: args.eventKind,
        referenceId: args.referenceId,
        payloadJson: args.payload as Prisma.InputJsonValue,
        ipAddress: args.ip,
      },
    })
  } catch {
    // never let audit failure break the user-visible path
  }
}

// Rate limiting: see @/lib/eap/action-rate-limit — SHARED with the
// orchestration route so orchestration steps consume the same budget
// single actions do (a per-route limiter is a per-route bypass).

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

async function getRequestIp(): Promise<string | null> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    null
  )
}
