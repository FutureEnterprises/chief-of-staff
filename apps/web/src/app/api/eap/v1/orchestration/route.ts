/**
 * POST /api/eap/v1/orchestration — EAP primitive #4 Cross-Device
 * Orchestration.
 *
 * The LLM proposes a multi-step composite flow across N devices.
 * Each step is a per-device action request (same shape as primitive
 * #3) plus an `atOffsetMs` field for relative scheduling. The
 * coordinator's contract:
 *
 *   atomicity='all_or_none'  → evaluate every step against the same
 *                              gates (panic / scope / rate-limit). If
 *                              ANY step is denied, the WHOLE
 *                              orchestration is denied — no
 *                              ActionRequest rows are committed,
 *                              decision='denied'. If all pass, write
 *                              the Orchestration + N ActionRequest
 *                              rows + fire all executors. decision
 *                              ='allowed'.
 *
 *   atomicity='best_effort'  → evaluate each step independently.
 *                              Commit ActionRequests for those that
 *                              passed (each with decision='allowed'),
 *                              record denials inline in
 *                              perStepResults. Decision resolves to
 *                              'allowed' if every step passed,
 *                              'denied' if every step failed, or
 *                              'partial' if some-but-not-all passed.
 *
 * The PanicState gate is applied once at the start — if the user has
 * tripped panic, the whole orchestration is denied regardless of
 * atomicity.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { prisma, Prisma } from '@repo/database'
import { executeAction } from '@/lib/eap/action-executor'

export const maxDuration = 25

type OrchestrationStep = {
  deviceId?: string
  actuator?: string
  params?: Record<string, unknown>
  scopeRequested?: string
  reasoning?: string
  confidence?: number
  atOffsetMs?: number
}

type OrchestrationBody = {
  orchestrationKey?: string
  userId?: string
  atomicity?: string
  steps?: OrchestrationStep[]
}

type StepEvaluation =
  | { ok: true; deviceRow: DeviceRow; safeDeviceId: string }
  | { ok: false; reason: string; ungrantedScope?: string }

type DeviceRow = NonNullable<Awaited<ReturnType<typeof loadDevice>>>

export async function POST(req: Request) {
  const partner = await authenticateLLMPartner(req)
  if (!partner.ok) {
    return NextResponse.json({ error: partner.error }, { status: partner.status })
  }

  let body: OrchestrationBody
  try {
    body = (await req.json()) as OrchestrationBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.orchestrationKey || typeof body.orchestrationKey !== 'string') {
    return NextResponse.json({ error: 'missing_orchestration_key' }, { status: 400 })
  }
  if (!body.userId || typeof body.userId !== 'string') {
    return NextResponse.json({ error: 'missing_user_id' }, { status: 400 })
  }
  if (!Array.isArray(body.steps) || body.steps.length === 0) {
    return NextResponse.json({ error: 'missing_steps' }, { status: 400 })
  }
  if (body.steps.length > 32) {
    return NextResponse.json({ error: 'too_many_steps' }, { status: 400 })
  }

  const safeUserId = sanitizeCuid(body.userId)
  if (!safeUserId) {
    return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 })
  }
  const atomicity = body.atomicity === 'all_or_none' ? 'all_or_none' : 'best_effort'
  const ip = await getRequestIp()

  // 1. Panic gate up-front.
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
    // Best-effort to record the denied orchestration as a single row
    // so the user's audit log shows the attempt.
    const denied = await recordDeniedOrchestration({
      orchestrationKey: body.orchestrationKey,
      partnerId: partner.partnerId,
      userId: safeUserId,
      atomicity,
      reason: 'panic_active',
      ip,
    })
    return NextResponse.json({
      decision: 'denied',
      reason: 'panic_active',
      orchestrationId: denied?.id ?? null,
      perStepResults: body.steps.map(() => ({
        decision: 'denied',
        reason: 'panic_active',
      })),
    })
  }

  // 2. Evaluate every step against device + scope + rate-limit.
  const evaluations: StepEvaluation[] = []
  for (const step of body.steps) {
    evaluations.push(
      await evaluateStep({
        step,
        partnerId: partner.partnerId,
        userId: safeUserId,
      }),
    )
  }

  const allOk = evaluations.every((e) => e.ok)
  const anyOk = evaluations.some((e) => e.ok)

  // 3. all_or_none with any denial → reject the entire orchestration
  // without committing any ActionRequests.
  if (atomicity === 'all_or_none' && !allOk) {
    const denied = await recordDeniedOrchestration({
      orchestrationKey: body.orchestrationKey,
      partnerId: partner.partnerId,
      userId: safeUserId,
      atomicity,
      reason: 'one_or_more_steps_denied',
      ip,
    })
    return NextResponse.json({
      decision: 'denied',
      reason: 'one_or_more_steps_denied',
      orchestrationId: denied?.id ?? null,
      perStepResults: evaluations.map((e) =>
        e.ok
          ? { decision: 'would_have_allowed' }
          : { decision: 'denied', reason: e.reason, ungrantedScope: e.ungrantedScope },
      ),
    })
  }

  // 4. Otherwise — at least some steps passed. Determine the
  // orchestration-level decision.
  let decision: 'allowed' | 'denied' | 'partial'
  if (allOk) decision = 'allowed'
  else if (anyOk) decision = 'partial'
  else decision = 'denied'

  const now = new Date()

  // nosemgrep
  const orchestration = await prisma.orchestration.upsert({
    where: { orchestrationKey: body.orchestrationKey },
    create: {
      orchestrationKey: body.orchestrationKey,
      llmPartnerId: partner.partnerId,
      userId: safeUserId,
      atomicity,
      decision,
      startedAt: now,
    },
    update: { decision, startedAt: now },
    select: { id: true },
  })

  await writeAudit({
    userId: safeUserId,
    llmPartnerId: partner.partnerId,
    eventKind:
      decision === 'allowed'
        ? 'orchestration_allowed'
        : decision === 'partial'
          ? 'orchestration_partial'
          : 'orchestration_denied',
    referenceId: orchestration.id,
    payload: {
      atomicity,
      stepCount: body.steps.length,
      decision,
    },
    ip,
  })

  // 5. Materialize ActionRequest rows for every step that passed and
  // fire-and-forget the executor for each.
  const perStepResults: Array<Record<string, unknown>> = []
  for (let i = 0; i < body.steps.length; i++) {
    const step = body.steps[i]!
    const ev = evaluations[i]!
    if (!ev.ok) {
      perStepResults.push({
        decision: 'denied',
        reason: ev.reason,
        ungrantedScope: ev.ungrantedScope,
      })
      continue
    }

    // Compose a per-step actionKey derived from the orchestrationKey
    // so retries of the orchestration are idempotent end-to-end.
    const actionKey = `${body.orchestrationKey}:${i}`
    const executionToken = `et_${randomBytes(16).toString('hex')}`
    const offsetMs = typeof step.atOffsetMs === 'number' ? step.atOffsetMs : 0
    const willExecuteAt = new Date(now.getTime() + Math.max(0, offsetMs))

    // nosemgrep
    const created = await prisma.actionRequest.upsert({
      where: { actionKey },
      create: {
        actionKey,
        llmPartnerId: partner.partnerId,
        userId: safeUserId,
        deviceId: ev.safeDeviceId,
        actuator: step.actuator ?? '',
        paramsJson: (step.params ?? {}) as Prisma.InputJsonValue,
        scopeRequested: step.scopeRequested ?? '',
        reasoning: step.reasoning ?? '',
        confidence:
          typeof step.confidence === 'number' ? step.confidence : null,
        decision: 'allowed',
        decisionReason: null,
        executionToken,
        orchestrationId: orchestration.id,
      },
      update: {
        orchestrationId: orchestration.id,
        decision: 'allowed',
      },
      select: {
        id: true,
        executionToken: true,
      },
    })

    perStepResults.push({
      decision: 'allowed',
      executionToken: created.executionToken,
      willExecuteAt: willExecuteAt.toISOString(),
      actionRequestId: created.id,
    })

    void executeAction(
      {
        id: created.id,
        actionKey,
        llmPartnerId: partner.partnerId,
        userId: safeUserId,
        deviceId: ev.safeDeviceId,
        actuator: step.actuator ?? '',
        paramsJson: (step.params ?? {}) as Prisma.JsonValue,
        scopeRequested: step.scopeRequested ?? '',
        reasoning: step.reasoning ?? '',
        confidence:
          typeof step.confidence === 'number' ? step.confidence : null,
        decision: 'allowed',
        decisionReason: null,
        executionToken: created.executionToken,
        executedAt: null,
        outcome: null,
        outcomeReason: null,
        outcomeAt: null,
        userInteracted: false,
        orchestrationId: orchestration.id,
        createdAt: now,
      },
      ev.deviceRow,
    ).catch(() => {})
  }

  return NextResponse.json({
    decision,
    orchestrationId: orchestration.id,
    perStepResults,
  })
}

// ---------- Step evaluation ----------

async function evaluateStep(args: {
  step: OrchestrationStep
  partnerId: string
  userId: string
}): Promise<StepEvaluation> {
  const { step, partnerId, userId } = args

  if (!step.deviceId || typeof step.deviceId !== 'string') {
    return { ok: false, reason: 'missing_device_id' }
  }
  if (!step.actuator || typeof step.actuator !== 'string') {
    return { ok: false, reason: 'missing_actuator' }
  }
  if (!step.scopeRequested || typeof step.scopeRequested !== 'string') {
    return { ok: false, reason: 'missing_scope' }
  }
  const safeDeviceId = sanitizeCuid(step.deviceId)
  if (!safeDeviceId) return { ok: false, reason: 'invalid_device_id' }

  // Irreversible scopes never enter an orchestration auto-flow. The
  // user-confirmation gate would have to fire per step — incompatible
  // with the orchestrate-then-fire-fast surface.
  if (step.scopeRequested.endsWith(':irreversible')) {
    return { ok: false, reason: 'irreversible_not_orchestrable' }
  }

  const deviceRow = await loadDevice(safeDeviceId)
  if (!deviceRow || deviceRow.userId !== userId) {
    return { ok: false, reason: 'device_not_found' }
  }
  if (!deviceRow.paired) {
    return { ok: false, reason: 'device_not_paired' }
  }

  // nosemgrep
  const grant = await prisma.scopeGrant.findFirst({
    where: {
      userId,
      llmPartnerId: partnerId,
      scope: step.scopeRequested,
      active: true,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  })
  if (!grant) {
    return {
      ok: false,
      reason: 'scope_not_granted',
      ungrantedScope: step.scopeRequested,
    }
  }

  // Rate-limit placeholder (mirrors single-action route).
  const rl = await checkActionRateLimit({
    partnerId,
    userId,
    deviceId: safeDeviceId,
    actuator: step.actuator,
  })
  if (!rl.allowed) {
    return { ok: false, reason: rl.reason ?? 'rate_limited' }
  }

  return { ok: true, deviceRow, safeDeviceId }
}

async function loadDevice(safeDeviceId: string) {
  // nosemgrep
  return prisma.device.findUnique({
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
    },
  })
}

async function recordDeniedOrchestration(args: {
  orchestrationKey: string
  partnerId: string
  userId: string
  atomicity: string
  reason: string
  ip: string | null
}): Promise<{ id: string } | null> {
  try {
    // nosemgrep
    const row = await prisma.orchestration.upsert({
      where: { orchestrationKey: args.orchestrationKey },
      create: {
        orchestrationKey: args.orchestrationKey,
        llmPartnerId: args.partnerId,
        userId: args.userId,
        atomicity: args.atomicity,
        decision: 'denied',
      },
      update: { decision: 'denied' },
      select: { id: true },
    })
    await writeAudit({
      userId: args.userId,
      llmPartnerId: args.partnerId,
      eventKind: 'orchestration_denied',
      referenceId: row.id,
      payload: { reason: args.reason, atomicity: args.atomicity },
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
    // audit failures never block the user-facing flow
  }
}

async function checkActionRateLimit(_args: {
  partnerId: string
  userId: string
  deviceId: string
  actuator: string
}): Promise<{ allowed: boolean; reason?: string; retryAfterSec?: number }> {
  return { allowed: true }
}

// ---------- LLM partner auth (mirrored from device/register) ----------

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
