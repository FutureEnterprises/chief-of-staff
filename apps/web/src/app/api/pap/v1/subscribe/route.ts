/**
 * POST /api/pap/v1/subscribe — register an LLM partner sensor/state
 * subscription.
 *
 * Primitive #5 of the Proactive AI Protocol. Lets an LLM partner
 * subscribe to user state transitions or outcome events via webhook
 * delivery; this is how proactive AI works without polling.
 *
 * Two subscription kinds in v0.1:
 *
 *   'state_transition' — fire when the user's BCO state changes per
 *     `conditions.fromState` / `conditions.toState` / `minConfidence`.
 *     A separate cron evaluates state transitions and fans out.
 *
 *   'outcome' — fire when a PAPProposal outcome is tagged. The
 *     /api/pap/v1/outcome route already fans out inline; this row is
 *     where /outcome looks for active subscribers.
 *
 * Body:
 *   {
 *     subscriptionKey: string         // LLM-provided idempotency key
 *     userId: string                  // the user whose stream to subscribe
 *     kind: 'state_transition' | 'outcome'
 *     conditions: Record<string, unknown>
 *     webhookUrl: string
 *     webhookSecret: string
 *     rateLimitPerHour?: number
 *   }
 *
 * Idempotency:
 *   - subscriptionKey is unique per LLM partner. Re-sending with the
 *     same key UPDATES the existing row (webhookUrl/secret/conditions
 *     can be rotated without revoking the subscription).
 *
 * Auth: partner Bearer + scope = 'read_observation' (the same scope
 * that gates BCO reads — receiving an asynchronous BCO state
 * transition is functionally a read).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { authenticateLLMPartner } from '@/lib/llm-partner-auth'
import { assertScopeGrant, ScopeNotGrantedError } from '@/lib/scope-grants'

export const maxDuration = 15

type Body = {
  subscriptionKey?: string
  userId?: string
  kind?: 'state_transition' | 'outcome' | string
  conditions?: Record<string, unknown>
  webhookUrl?: string
  webhookSecret?: string
  rateLimitPerHour?: number
}

export async function POST(req: Request) {
  const authResult = await authenticateLLMPartner(req)
  if (authResult.error) return authResult.error
  const partner = authResult.partner

  let body: Body = {}
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.subscriptionKey || typeof body.subscriptionKey !== 'string') {
    return NextResponse.json({ error: 'missing_subscription_key' }, { status: 400 })
  }
  if (!body.userId || typeof body.userId !== 'string') {
    return NextResponse.json({ error: 'missing_user_id' }, { status: 400 })
  }
  const kind = body.kind
  if (kind !== 'state_transition' && kind !== 'outcome') {
    return NextResponse.json(
      { error: 'invalid_kind', allowed: ['state_transition', 'outcome'] },
      { status: 400 },
    )
  }
  if (!body.webhookUrl || typeof body.webhookUrl !== 'string') {
    return NextResponse.json({ error: 'missing_webhook_url' }, { status: 400 })
  }
  if (!body.webhookSecret || typeof body.webhookSecret !== 'string') {
    return NextResponse.json({ error: 'missing_webhook_secret' }, { status: 400 })
  }
  if (!isValidWebhookUrl(body.webhookUrl)) {
    return NextResponse.json({ error: 'invalid_webhook_url' }, { status: 400 })
  }
  if (body.webhookSecret.length < 16) {
    return NextResponse.json(
      { error: 'webhook_secret_too_short', minLength: 16 },
      { status: 400 },
    )
  }

  const subscriptionKey = body.subscriptionKey
  const userId = body.userId
  const conditions = body.conditions ?? {}
  const webhookUrl = body.webhookUrl
  const webhookSecret = body.webhookSecret
  const rateLimitPerHour =
    typeof body.rateLimitPerHour === 'number' && body.rateLimitPerHour > 0
      ? Math.min(body.rateLimitPerHour, 600)
      : 60

  // Confirm the user exists.
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!userExists) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }

  // Scope gate — same scope that protects BCO reads.
  try {
    await assertScopeGrant({
      userId,
      llmPartnerId: partner.id,
      scope: 'read_observation',
    })
  } catch (err) {
    if (err instanceof ScopeNotGrantedError) {
      return NextResponse.json(
        { error: 'scope_not_granted', scope: 'read_observation' },
        { status: 403 },
      )
    }
    throw err
  }

  // sensor column maps directly to subscription kind in v0.1 (one row
  // per kind per partner-per-user, deduped by subscriptionKey). Future
  // versions may split 'state_transition' into finer-grained sensor
  // streams (hrv_proxy, geofence, motion) — at that point this maps
  // would gain richer logic.
  const sensor = kind

  // Idempotent upsert on subscriptionKey. If a different partner has
  // already claimed the key we 409 to keep keys partner-scoped.
  const existing = await prisma.sensorSubscription.findUnique({
    where: { subscriptionKey },
    select: { id: true, llmPartnerId: true },
  })
  if (existing && existing.llmPartnerId !== partner.id) {
    return NextResponse.json(
      { error: 'subscription_key_conflict' },
      { status: 409 },
    )
  }

  const row = await prisma.sensorSubscription.upsert({
    where: { subscriptionKey },
    create: {
      subscriptionKey,
      llmPartnerId: partner.id,
      userId,
      sensor,
      filterJson: { kind, ...conditions } as object,
      webhookUrl,
      webhookSecret,
      rateLimitPerHour,
      active: true,
    },
    update: {
      sensor,
      filterJson: { kind, ...conditions } as object,
      webhookUrl,
      webhookSecret,
      rateLimitPerHour,
      active: true,
      failureCount: 0,
    },
    select: { id: true },
  })

  await writeAudit({
    userId,
    llmPartnerId: partner.id,
    referenceId: row.id,
    payload: {
      kind: 'pap_subscription_created',
      subscriptionKind: kind,
      sensor,
      webhookUrl,
      rateLimitPerHour,
      conditions,
    },
    req,
  })

  return NextResponse.json(
    { ok: true, subscriptionId: row.id },
    { status: existing ? 200 : 201 },
  )
}

// ──────────────────────── helpers ────────────────────────

/**
 * Reject obviously malformed or localhost-only webhook URLs. We
 * permit any https endpoint and (in non-prod) http for local
 * testing. Production deployments should keep http rejected.
 */
function isValidWebhookUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    if (process.env.NODE_ENV === 'production') {
      if (url.protocol !== 'https:') return false
    } else {
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    }
    if (!url.hostname) return false
    return true
  } catch {
    return false
  }
}

async function writeAudit(args: {
  userId: string
  llmPartnerId: string
  referenceId: string
  payload: Record<string, unknown>
  req: Request
}) {
  try {
    await prisma.eAPAuditEntry.create({
      data: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        eventKind: 'pap_subscription_created',
        referenceId: args.referenceId,
        payloadJson: args.payload as object,
        ipAddress: extractIp(args.req),
      },
    })
  } catch (err) {
    console.warn('[pap/subscribe] failed to write audit entry', {
      err: err instanceof Error ? err.message : 'unknown',
    })
  }
}

function extractIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')
}
